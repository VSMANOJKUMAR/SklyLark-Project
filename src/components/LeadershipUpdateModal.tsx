import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText, ShieldAlert, Award, ArrowUpRight } from 'lucide-react';
import { LeadershipReport } from '../types';
import { formatReportMarkdown } from '../lib/leadershipGenerator';

interface LeadershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: LeadershipReport;
}

export const LeadershipUpdateModal: React.FC<LeadershipModalProps> = ({ isOpen, onClose, report }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const markdownText = formatReportMarkdown(report);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdownText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Leadership_Update_${report.date.replace(/,/g, '').replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
      <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative' }}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={22} />
        </button>

        {/* Title Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <FileText size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{report.title}</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Prepared by Skylark Business Intelligence Agent • {report.date}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleCopy} className="btn-secondary" style={{ fontSize: '0.82rem' }}>
              {copied ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
            </button>
            <button onClick={handleDownload} className="btn-primary" style={{ fontSize: '0.82rem', background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)' }}>
              <Download size={16} />
              <span>Export .MD Report</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Executive Summary */}
          <div style={{ padding: '18px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>📝 Executive Summary</h3>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-main)' }}>{report.executiveSummary}</p>
          </div>

          {/* Financial Highlights */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399', marginBottom: '12px' }}>💰 Financial Metrics Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              {report.financialHighlights.map((h, i) => (
                <div key={i} style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{h.label}</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>{h.value}</div>
                  {h.change && <div style={{ fontSize: '0.7rem', color: '#38bdf8', marginTop: '2px' }}>{h.change}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Key Wins */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fbbf24', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={18} color="#fbbf24" /> Key Wins & Milestone Accomplishments
            </h3>
            <ul style={{ paddingLeft: '20px', fontSize: '0.88rem', lineHeight: 1.6 }}>
              {report.keyWins.map((w, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{w}</li>
              ))}
            </ul>
          </div>

          {/* Operational Risks & Mitigations */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fb7185', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={18} color="#fb7185" /> Operational Risks & Actionable Mitigations
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {report.operationalRisks.map((r, i) => (
                <div key={i} style={{ padding: '14px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 700, color: '#fb7185', marginBottom: '4px' }}>⚠️ {r.risk}</div>
                  <div style={{ color: 'var(--text-main)', marginBottom: '2px' }}>Impact: {r.impact}</div>
                  <div style={{ color: '#38bdf8', fontStyle: 'italic' }}>Mitigation Plan: {r.mitigation}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Action Items */}
          <div style={{ padding: '18px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#c084fc', marginBottom: '10px' }}>🎯 Priority Leadership Action Items</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
              {report.actionItems.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" readOnly checked={false} style={{ cursor: 'pointer' }} />
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
