import React, { useState } from 'react';
import { X, Layers, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { CleanedDeal, CleanedWorkOrder } from '../types';

interface RawDataViewerProps {
  isOpen: boolean;
  onClose: () => void;
  deals: CleanedDeal[];
  workOrders: CleanedWorkOrder[];
}

export const RawDataViewer: React.FC<RawDataViewerProps> = ({ isOpen, onClose, deals, workOrders }) => {
  const [activeTab, setActiveTab] = useState<'deals' | 'workOrders'>('deals');

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '1100px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative' }}>
        
        {/* Close */}
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={22} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
              <Layers size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Board Data Inspector (Raw vs Cleaned)</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Compare original messy Monday.com strings with normalized agent outputs</p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => setActiveTab('deals')}
              className={activeTab === 'deals' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              Sales Deals ({deals.length})
            </button>
            <button 
              onClick={() => setActiveTab('workOrders')}
              className={activeTab === 'workOrders' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              Work Orders ({workOrders.length})
            </button>
          </div>
        </div>

        {/* Table View */}
        <div style={{ overflowX: 'auto' }}>
          {activeTab === 'deals' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)' }}>
                  <th style={{ padding: '10px' }}>ID</th>
                  <th style={{ padding: '10px' }}>Deal Name</th>
                  <th style={{ padding: '10px' }}>Raw Value $\rightarrow$ Normalized</th>
                  <th style={{ padding: '10px' }}>Raw Sector $\rightarrow$ Cleaned</th>
                  <th style={{ padding: '10px' }}>Raw Date $\rightarrow$ ISO</th>
                  <th style={{ padding: '10px' }}>Stage</th>
                  <th style={{ padding: '10px' }}>Quality Flags</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((d) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{d.id}</td>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{d.name}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{d.originalValue || 'N/A'}</span>
                      {' '}$\rightarrow${' '}
                      <strong style={{ color: '#34d399' }}>${d.value.toLocaleString()}</strong>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{d.originalSector}</span> $\rightarrow$ <span className="badge badge-info">{d.sector}</span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{d.originalCloseDate}</span> $\rightarrow$ <strong>{d.expectedCloseDate || 'NULL'}</strong>
                    </td>
                    <td style={{ padding: '10px' }}>{d.stage}</td>
                    <td style={{ padding: '10px' }}>
                      {d.qualityFlags.length > 0 ? (
                        <span className="badge badge-warning">{d.qualityFlags[0]}</span>
                      ) : (
                        <span className="badge badge-success">Clean</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)' }}>
                  <th style={{ padding: '10px' }}>WO ID</th>
                  <th style={{ padding: '10px' }}>Project Name</th>
                  <th style={{ padding: '10px' }}>Parent Deal ID</th>
                  <th style={{ padding: '10px' }}>Raw Spend $\rightarrow$ Cleaned</th>
                  <th style={{ padding: '10px' }}>Budget</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px' }}>Quality Flags</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map((w) => (
                  <tr key={w.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>{w.id}</td>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{w.projectName}</td>
                    <td style={{ padding: '10px' }}>{w.dealId ? <span className="badge badge-info">{w.dealId}</span> : <span className="badge badge-danger">Unlinked</span>}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{w.originalActualSpend || 'N/A'}</span>
                      {' '}$\rightarrow${' '}
                      <strong style={{ color: w.isOverBudget ? '#fb7185' : '#34d399' }}>${w.actualSpend.toLocaleString()}</strong>
                    </td>
                    <td style={{ padding: '10px' }}>${w.budget.toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>
                      <span className={`badge ${w.isDelayed ? 'badge-danger' : w.status === 'Completed' ? 'badge-success' : 'badge-info'}`}>
                        {w.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      {w.qualityFlags.length > 0 ? (
                        <span className="badge badge-warning">{w.qualityFlags[0]}</span>
                      ) : (
                        <span className="badge badge-success">Clean</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
};
