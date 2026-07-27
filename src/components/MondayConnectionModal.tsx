import React, { useState } from 'react';
import { X, Key, CheckCircle, AlertTriangle, RefreshCw, Database, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { MondayConfig } from '../types';
import { testMondayConnection, fetchUserBoards, fetchRawBoardItems, mapRowsToDeals, mapRowsToWorkOrders } from '../lib/mondayClient';
import { RawDeal, RawWorkOrder } from '../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MondayConfig;
  onSaveConfig: (newConfig: MondayConfig, deals: RawDeal[], workOrders: RawWorkOrder[]) => void;
  onUseDemoData: () => void;
}

export const MondayConnectionModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onUseDemoData
}) => {
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [dealsBoardId, setDealsBoardId] = useState(config.dealsBoardId || '');
  const [workOrdersBoardId, setWorkOrdersBoardId] = useState(config.workOrdersBoardId || '');
  
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [boards, setBoards] = useState<{ id: string; name: string; items_count: number }[]>([]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter a valid Monday.com Personal Access Token.' });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    const res = await testMondayConnection(apiKey.trim());
    if (res.success && res.user) {
      setTestResult({ success: true, message: `Connected successfully as ${res.user.name} (${res.user.email})!` });
      try {
        const userBoards = await fetchUserBoards(apiKey.trim());
        setBoards(userBoards);
      } catch (err: any) {
        setTestResult({ success: false, message: `Connected, but failed to list boards: ${err.message}` });
      }
    } else {
      setTestResult({ success: false, message: res.error || 'Invalid API Token or network error.' });
    }
    setIsLoading(false);
  };

  const handleSyncBoards = async () => {
    if (!apiKey.trim() || !dealsBoardId || !workOrdersBoardId) {
      setTestResult({ success: false, message: 'Please test connection and select both Deals and Work Orders boards.' });
      return;
    }

    setIsLoading(true);
    try {
      const dealsRows = await fetchRawBoardItems(apiKey.trim(), dealsBoardId);
      const woRows = await fetchRawBoardItems(apiKey.trim(), workOrdersBoardId);

      const parsedDeals = mapRowsToDeals(dealsRows);
      const parsedWOs = mapRowsToWorkOrders(woRows);

      const dealsBoardName = boards.find(b => b.id === dealsBoardId)?.name || 'Deals Board';
      const woBoardName = boards.find(b => b.id === workOrdersBoardId)?.name || 'Work Orders Board';

      onSaveConfig(
        {
          apiKey: apiKey.trim(),
          dealsBoardId,
          workOrdersBoardId,
          isConnected: true,
          lastSyncedAt: new Date().toLocaleTimeString(),
          boardNames: { deals: dealsBoardName, workOrders: woBoardName }
        },
        parsedDeals,
        parsedWOs
      );
      onClose();
    } catch (err: any) {
      setTestResult({ success: false, message: `Failed to fetch board data: ${err.message}` });
    }
    setIsLoading(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', position: 'relative' }}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(0, 133, 255, 0.15)', border: '1px solid rgba(0, 133, 255, 0.3)' }}>
            <Database size={24} color="#0085ff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Monday.com Integration Setup</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Connect via GraphQL API key or use pre-loaded messy CSV demo dataset</p>
          </div>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
              Monday.com Personal Access Token (API Key)
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Key size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="glass-input"
                  style={{ width: '100%', paddingLeft: '38px' }}
                  placeholder="eyJhbGciOiJIUzI1NiJ9..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <button onClick={handleTestConnection} className="btn-secondary" disabled={isLoading}>
                {isLoading ? <RefreshCw size={16} className="spin" /> : 'Test Key'}
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
              Find your API key in Monday.com under <strong>Avatar &gt; Developers &gt; My Access Tokens</strong>.
            </p>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div className={`glass-panel`} style={{
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: testResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
              borderColor: testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.85rem'
            }}>
              {testResult.success ? <CheckCircle size={18} color="#34d399" /> : <AlertTriangle size={18} color="#fb7185" />}
              <span style={{ color: testResult.success ? '#34d399' : '#fb7185' }}>{testResult.message}</span>
            </div>
          )}

          {/* Board Selector */}
          {boards.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>Select Board Mappings</h3>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Sales Deals Board
                </label>
                <select 
                  className="glass-input" 
                  style={{ width: '100%' }}
                  value={dealsBoardId}
                  onChange={(e) => setDealsBoardId(e.target.value)}
                >
                  <option value="">-- Select Deals Board --</option>
                  {boards.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.items_count} items)</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Work Orders Board
                </label>
                <select 
                  className="glass-input" 
                  style={{ width: '100%' }}
                  value={workOrdersBoardId}
                  onChange={(e) => setWorkOrdersBoardId(e.target.value)}
                >
                  <option value="">-- Select Work Orders Board --</option>
                  {boards.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.items_count} items)</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={handleSyncBoards} 
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '6px' }}
                disabled={isLoading}
              >
                {isLoading ? <RefreshCw size={16} className="spin" /> : <><ArrowRight size={16} /> Sync Live Monday.com Data</>}
              </button>
            </div>
          )}

          {/* Zero Setup Fallback */}
          <div style={{ marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Want instant testing without configuring a Monday.com API Key?
            </p>
            <button 
              onClick={() => { onUseDemoData(); onClose(); }}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.03)' }}
            >
              <FileSpreadsheet size={16} color="#38bdf8" />
              <span>Use Pre-loaded Messy Deals & Work Orders CSV Data</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
