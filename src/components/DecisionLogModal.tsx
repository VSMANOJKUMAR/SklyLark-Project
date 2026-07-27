import React from 'react';
import { X, BookOpen, CheckCircle, Scale, Clock, Award } from 'lucide-react';

interface DecisionLogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DecisionLogModal: React.FC<DecisionLogProps> = ({ isOpen, onClose }) => {
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
      <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative' }}>
        
        {/* Close */}
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={22} />
        </button>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
            <BookOpen size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Decision Log (Technical Architecture & Trade-Offs)</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Required Assignment Deliverable • 2-Page Executive Document</p>
          </div>
        </div>

        {/* Document Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '0.88rem', lineHeight: 1.6 }}>
          
          {/* Section 1: Assumptions */}
          <div style={{ padding: '18px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} color="#38bdf8" /> 1. Key Assumptions Made
            </h3>
            <ul style={{ paddingLeft: '20px' }}>
              <li><strong>Dynamic Monday.com Board Schema:</strong> Assumed board structures will vary between workspaces. Instead of hardcoding column IDs, built a fuzzy mapping layer that detects titles like "Value", "Deal Name", "Budget", "Status", and "Actual Spend".</li>
              <li><strong>Real-World Messy Data Ingestion:</strong> Assumed data contains inconsistent date formats (`YYYY-MM-DD`, `MM/DD/YYYY`, `TBD`), messy currency strings (`$450k`, `1,200,000 USD`), and sector variations (`energy sector`, `Oil & Gas / Energy`). Built a zero-crash parser layer.</li>
              <li><strong>Cross-Board Linking:</strong> Assumed Work Orders optionally reference a parent `Deal ID`. Where links exist, the agent correlates sales revenue with actual delivery spend; unlinked work orders trigger a data hygiene audit flag.</li>
            </ul>
          </div>

          {/* Section 2: Trade-Offs */}
          <div style={{ padding: '18px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#c084fc', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scale size={18} color="#c084fc" /> 2. Key Architectural Trade-Offs Chosen
            </h3>
            <ul style={{ paddingLeft: '20px' }}>
              <li><strong>Client-Side Resilience & AI Query Interpreter vs Heavy Server Infrastructure:</strong> Opted for a fast, responsive client-side React BI engine with local normalization and pre-configured prompt heuristics. This allows instant zero-latency query execution and local API testing without server cold-starts.</li>
              <li><strong>Monday.com API Key Input + Pre-loaded Messy CSV Fallback:</strong> Provided both live Monday GraphQL API integration AND instant pre-loaded messy CSV demo dataset. Evaluators can test without local setup or manual board creation.</li>
              <li><strong>Strict Rules-Based Resilience vs Pure LLM Normalization:</strong> Combined deterministic regex date/currency parsing with LLM text interpretation. Deterministic parsing guarantees zero math errors on financial figures ($450k = $450,000 exactly).</li>
            </ul>
          </div>

          {/* Section 3: Interpretation of Leadership Updates */}
          <div style={{ padding: '18px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#34d399', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="#34d399" /> 3. Interpretation of "Leadership Updates"
            </h3>
            <p style={{ marginBottom: '8px' }}>
              Interpreted <em>"leadership updates"</em> as executive-level synthesis that bridges the gap between sales figures (Deals) and operational execution (Work Orders). Founders need more than raw numbers—they need:
            </p>
            <ol style={{ paddingLeft: '20px' }}>
              <li><strong>Executive Summary & Financial Pulse:</strong> Total active pipeline, closed won revenue, win rate, and execution budget variance.</li>
              <li><strong>Operational Risks & Bottlenecks:</strong> Highlighting delayed work orders, cost overruns, and specific project leads requiring support.</li>
              <li><strong>Exportable Briefings:</strong> One-click Markdown copy and downloadable `.MD` briefing documents for board meetings or investor updates.</li>
            </ol>
          </div>

          {/* Section 4: What we'd do with more time */}
          <div style={{ padding: '18px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fbbf24', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#fbbf24" /> 4. What We Would Do Differently With More Time
            </h3>
            <ul style={{ paddingLeft: '20px' }}>
              <li><strong>Bi-directional Monday.com Webhooks:</strong> Implement real-time Monday webhooks to push data updates dynamically when a status changes.</li>
              <li><strong>Automated CSV Importer into Monday Workspace:</strong> Add an automated script using Monday GraphQL mutations (`create_board`, `create_item`) to populate new Monday boards with 1 click.</li>
              <li><strong>PDF Report Renderer:</strong> Add server-side Puppeteer PDF report generation with formatted corporate branding.</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
};
