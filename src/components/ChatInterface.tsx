import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, FileText, CornerDownLeft } from 'lucide-react';
import { ChatMessage, CleanedDeal, CleanedWorkOrder, BIMetrics, DataQualityReport } from '../types';
import { processUserQuery } from '../lib/biEngine';

interface ChatProps {
  deals: CleanedDeal[];
  workOrders: CleanedWorkOrder[];
  metrics: BIMetrics;
  qualityReport: DataQualityReport;
  onOpenLeadershipModal: () => void;
}

export const ChatInterface: React.FC<ChatProps> = ({
  deals,
  workOrders,
  metrics,
  qualityReport,
  onOpenLeadershipModal
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'agent',
      text: `Hello Founder 👋! I am your **Monday.com Business Intelligence Agent**. I have synced and normalized your **Deals** (Sales Pipeline) and **Work Orders** (Execution) boards.\n\nAsk me any business query, or select a sample question below!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputQuery;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');

    // Process query using BI engine
    setTimeout(() => {
      if (text.toLowerCase().includes('leadership') || text.toLowerCase().includes('briefing') || text.toLowerCase().includes('update')) {
        onOpenLeadershipModal();
      }

      const agentResponse = processUserQuery(text, deals, workOrders, metrics, qualityReport);
      setMessages(prev => [...prev, agentResponse]);
    }, 400);
  };

  const PRESET_PROMPTS = [
    { label: "⚡ Energy Sector Pipeline", prompt: "How's our pipeline looking for energy sector this quarter?" },
    { label: "🚨 Delayed Work Orders", prompt: "Which work orders are delayed or over budget?" },
    { label: "💰 Overall Revenue & Win Rate", prompt: "What is our overall revenue, active pipeline, and win rate?" },
    { label: "🛡️ Data Quality Caveats", prompt: "Show data quality issues, missing fields, and handled caveats." },
    { label: "📑 Prepare Leadership Update", prompt: "Prepare data for leadership update briefing." }
  ];

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '620px', marginBottom: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
            <Bot size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Founder Conversational BI Agent</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ask questions across Deals & Work Orders in plain English</p>
          </div>
        </div>

        <button 
          onClick={onOpenLeadershipModal}
          className="btn-secondary"
          style={{ padding: '5px 12px', fontSize: '0.78rem' }}
        >
          <FileText size={14} color="#10b981" />
          <span>Generate Leadership Report</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg) => (
          <div 
            key={msg.id}
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            {msg.sender === 'agent' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #0085ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={16} color="#fff" />
              </div>
            )}

            <div style={{
              maxWidth: '80%',
              padding: '14px 18px',
              borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.sender === 'user' ? 'linear-gradient(135deg, #4338ca 0%, #3730a3 100%)' : 'rgba(15, 23, 42, 0.75)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              fontSize: '0.88rem',
              lineHeight: 1.6,
              color: 'var(--text-main)'
            }}>
              {/* Message text with basic markdown formatting */}
              <div style={{ whiteSpace: 'pre-line' }}>
                {msg.text.split('\n').map((line, i) => {
                  if (line.startsWith('### ')) return <h4 key={i} style={{ fontSize: '1rem', fontWeight: 800, marginTop: '8px', marginBottom: '6px', color: '#38bdf8' }}>{line.replace('### ', '')}</h4>;
                  if (line.startsWith('**') && line.endsWith('**')) return <p key={i} style={{ fontWeight: 700, margin: '4px 0' }}>{line.replace(/\*\*/g, '')}</p>;
                  return <p key={i} style={{ margin: '3px 0' }}>{line}</p>;
                })}
              </div>

              {/* Data Summary Highlights Pill if present */}
              {msg.dataSummary?.highlights && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  {msg.dataSummary.highlights.map((h, idx) => (
                    <span key={idx} className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                      {h}
                    </span>
                  ))}
                </div>
              )}

              {/* Table Data Embed */}
              {msg.dataSummary?.tableData && msg.dataSummary.tableData.length > 0 && (
                <div style={{ marginTop: '12px', overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', background: 'rgba(0,0,0,0.2)' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                        {Object.keys(msg.dataSummary.tableData[0]).map((k) => (
                          <th key={k} style={{ padding: '6px 10px', textAlign: 'left' }}>{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {msg.dataSummary.tableData.map((row, rIdx) => (
                        <tr key={rIdx} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                          {Object.values(row).map((v: any, cIdx) => (
                            <td key={cIdx} style={{ padding: '6px 10px' }}>{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-subtle)', marginTop: '8px', textAlign: 'right' }}>
                {msg.timestamp}
              </span>
            </div>

            {msg.sender === 'user' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={16} color="#fff" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Preset Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '8px 0', borderTop: '1px solid var(--border-color)' }}>
        {PRESET_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p.prompt)}
            className="btn-secondary"
            style={{ padding: '5px 12px', fontSize: '0.75rem', whiteSpace: 'nowrap', borderRadius: '16px' }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        <input
          type="text"
          className="glass-input"
          style={{ flex: 1 }}
          placeholder="Ask any question across Deals and Work Orders..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={() => handleSend()} className="btn-primary" style={{ padding: '10px 18px' }}>
          <Send size={16} />
        </button>
      </div>

    </div>
  );
};
