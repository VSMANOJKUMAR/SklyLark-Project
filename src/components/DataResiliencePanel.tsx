import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, DollarSign, Calendar, Tag, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { DataQualityReport } from '../types';

interface ResilienceProps {
  qualityReport: DataQualityReport;
  onOpenRawViewer: () => void;
}

export const DataResiliencePanel: React.FC<ResilienceProps> = ({ qualityReport, onOpenRawViewer }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
      
      {/* Summary Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          {/* Health Score Circular Badge */}
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: qualityReport.qualityScore >= 80 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
            border: `1.5px solid ${qualityReport.qualityScore >= 80 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: qualityReport.qualityScore >= 80 ? '#34d399' : '#fbbf24' }}>
              {qualityReport.qualityScore}%
            </span>
            <span style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>HEALTH</span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Data Resilience & Hygiene Engine</h3>
              <span className="badge badge-success">Active Normalization</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Automatically cleaned messy dates, text currencies, sector names & missing values across Monday.com boards
            </p>
          </div>

        </div>

        {/* Quick Normalization Counters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          
          <div style={{ textAlign: 'center', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <DollarSign size={12} color="#06b6d4" /> Currencies
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>{qualityReport.normalizedCurrenciesCount} cleaned</div>
          </div>

          <div style={{ textAlign: 'center', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} color="#a855f7" /> Dates
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#c084fc' }}>{qualityReport.normalizedDatesCount} ISO-fixed</div>
          </div>

          <div style={{ textAlign: 'center', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Tag size={12} color="#f59e0b" /> Sectors
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fbbf24' }}>{qualityReport.normalizedSectorsCount} mapped</div>
          </div>

          {/* Toggle Expand Details */}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>{isExpanded ? 'Hide Audit Log' : `Audit Log (${qualityReport.anomalies.length})`}</span>
          </button>

        </div>

      </div>

      {/* Expanded Audit Log Details */}
      {isExpanded && (
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={16} color="#fb7185" />
              Detected Data Anomalies & Handled Exceptions
            </h4>
            <button 
              onClick={onOpenRawViewer}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              <Layers size={13} />
              Compare Raw vs Cleaned Records
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
            {qualityReport.anomalies.map((item, idx) => (
              <div key={idx} style={{
                padding: '12px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid var(--border-color)',
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span className={`badge ${
                    item.type === 'Missing' ? 'badge-danger' :
                    item.type === 'Format' ? 'badge-warning' :
                    item.type === 'Mismatch' ? 'badge-info' : 'badge-warning'
                  }`}>
                    {item.type} • {item.entity} {item.id}
                  </span>
                </div>
                <p style={{ color: 'var(--text-main)', fontWeight: 500, marginBottom: '4px' }}>{item.description}</p>
                <p style={{ color: 'var(--text-subtle)', fontSize: '0.75rem', fontStyle: 'italic' }}>Impact: {item.impact}</p>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};
