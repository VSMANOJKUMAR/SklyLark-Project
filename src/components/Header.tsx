import React from 'react';
import { Database, FileText, Sparkles, BookOpen, Layers, ShieldCheck, RefreshCw } from 'lucide-react';
import { MondayConfig, DataQualityReport } from '../types';

interface HeaderProps {
  config: MondayConfig;
  qualityReport: DataQualityReport;
  onOpenConnectModal: () => void;
  onOpenLeadershipModal: () => void;
  onOpenDecisionLogModal: () => void;
  onOpenRawDataModal: () => void;
  onResetToDemo: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  qualityReport,
  onOpenConnectModal,
  onOpenLeadershipModal,
  onOpenDecisionLogModal,
  onOpenRawDataModal,
  onResetToDemo,
  isSyncing
}) => {
  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: '16px 28px', marginBottom: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0085ff 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0, 133, 255, 0.4)'
          }}>
            <Sparkles size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #fff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                SKYLARK BI AGENT
              </h1>
              <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>monday.com engine</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Executive Business Intelligence & Messy Data Resilience Agent
            </p>
          </div>
        </div>

        {/* Status Indicators & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* Health Score Pill */}
          <div 
            onClick={onOpenRawDataModal}
            title="Click to view raw vs cleaned board data"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            <ShieldCheck size={16} color={qualityReport.qualityScore > 80 ? '#34d399' : '#fbbf24'} />
            <span>Data Health: <strong style={{ color: qualityReport.qualityScore > 80 ? '#34d399' : '#fbbf24' }}>{qualityReport.qualityScore}%</strong></span>
          </div>

          {/* Connection Status Button */}
          <button 
            onClick={onOpenConnectModal}
            className="btn-secondary"
            style={{ padding: '7px 14px', fontSize: '0.82rem' }}
          >
            <div className={config.isConnected ? 'pulse-dot' : ''} style={{ backgroundColor: config.isConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)' }} />
            <Database size={15} />
            <span>{config.isConnected ? 'Monday API Connected' : 'Connect Monday.com'}</span>
          </button>

          {/* Raw Data Inspector */}
          <button 
            onClick={onOpenRawDataModal}
            className="btn-secondary"
            style={{ padding: '7px 14px', fontSize: '0.82rem' }}
          >
            <Layers size={15} />
            <span>Board Data</span>
          </button>

          {/* Leadership Update Generator Button */}
          <button 
            onClick={onOpenLeadershipModal}
            className="btn-primary"
            style={{ padding: '7px 14px', fontSize: '0.82rem', background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)' }}
          >
            <FileText size={15} />
            <span>Leadership Briefing</span>
          </button>

          {/* Decision Log Button */}
          <button 
            onClick={onOpenDecisionLogModal}
            className="btn-secondary"
            style={{ padding: '7px 14px', fontSize: '0.82rem', borderColor: 'rgba(168, 85, 247, 0.4)', color: '#c084fc' }}
          >
            <BookOpen size={15} />
            <span>Decision Log</span>
          </button>

          {/* Refresh / Reset */}
          <button
            onClick={onResetToDemo}
            title="Reset dataset to default demo state"
            className="btn-secondary"
            style={{ padding: '7px 10px' }}
          >
            <RefreshCw size={14} className={isSyncing ? 'spin' : ''} />
          </button>

        </div>

      </div>
    </header>
  );
};
