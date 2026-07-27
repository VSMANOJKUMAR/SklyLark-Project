import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, TrendingUp, Target, AlertTriangle, Briefcase, CheckCircle } from 'lucide-react';
import { BIMetrics, CleanedDeal, CleanedWorkOrder } from '../types';

interface DashboardProps {
  metrics: BIMetrics;
  deals: CleanedDeal[];
  workOrders: CleanedWorkOrder[];
}

const SECTOR_COLORS: Record<string, string> = {
  Energy: '#0085ff',
  Healthcare: '#10b981',
  Fintech: '#a855f7',
  Logistics: '#f59e0b',
  Other: '#64748b'
};

const STAGE_COLORS = ['#38bdf8', '#fbbf24', '#c084fc', '#34d399', '#f43f5e'];

export const AnalyticsDashboard: React.FC<DashboardProps> = ({ metrics, deals, workOrders }) => {
  
  // Data for stage pie chart
  const stageMap = new Map<string, number>();
  deals.forEach(d => {
    stageMap.set(d.stage, (stageMap.get(d.stage) || 0) + d.value);
  });
  const stageChartData = Array.from(stageMap.entries()).map(([name, value]) => ({ name, value }));

  // Data for work order spend vs budget chart
  const woChartData = workOrders.map(w => ({
    name: w.projectName.length > 18 ? w.projectName.substring(0, 16) + '...' : w.projectName,
    Budget: w.budget,
    Spend: w.actualSpend,
    isDelayed: w.isDelayed
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
      
      {/* 1. Executive Metric KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        
        {/* Active Pipeline Card */}
        <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(0, 133, 255, 0.15)', color: '#0085ff' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE SALES PIPELINE</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
              ${metrics.totalPipelineValue.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#38bdf8' }}>
              Weighted: ${metrics.weightedPipelineValue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Won Revenue Card */}
        <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>CLOSED WON REVENUE</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>
              ${metrics.totalWonRevenue.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Avg Deal: ${metrics.avgDealSize.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Win Rate Card */}
        <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
            <Target size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>WIN RATE</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#c084fc' }}>
              {metrics.winRate}%
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {deals.filter(d => d.isWon).length} won / {deals.filter(d => d.isWon || d.isLost).length} closed
            </div>
          </div>
        </div>

        {/* Work Order Spend vs Budget */}
        <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Briefcase size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>EXECUTION SPEND</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: metrics.workOrderBudgetVariance > 0 ? '#fb7185' : '#34d399' }}>
              ${metrics.totalWorkOrderSpend.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Budget: ${metrics.totalWorkOrderBudget.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Delayed Work Orders */}
        <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: metrics.delayedWorkOrdersCount > 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: metrics.delayedWorkOrdersCount > 0 ? '#f43f5e' : '#10b981' }}>
            {metrics.delayedWorkOrdersCount > 0 ? <AlertTriangle size={22} /> : <CheckCircle size={22} />}
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>WORK ORDER HEALTH</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: metrics.delayedWorkOrdersCount > 0 ? '#fb7185' : '#34d399' }}>
              {metrics.delayedWorkOrdersCount} Delayed
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {metrics.completedWorkOrdersCount} completed on time
            </div>
          </div>
        </div>

      </div>

      {/* 2. Visual Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        {/* Sector Financial Performance Chart */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>
            Pipeline & Revenue by Sector ($ USD)
          </h3>
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.sectorBreakdown}>
                <XAxis dataKey="sector" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(val: any) => `$${Number(val).toLocaleString()}`}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                <Bar dataKey="pipelineValue" name="Active Pipeline" fill="#0085ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="wonRevenue" name="Closed Won" fill="#00c875" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Work Order Budget vs Actual Spend */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>
            Work Order Spend vs Target Budget
          </h3>
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={woChartData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-15} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(val: any) => `$${Number(val).toLocaleString()}`}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                <Bar dataKey="Budget" name="Target Budget" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spend" name="Actual Spend" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 3. Owner Performance Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-main)' }}>
          Sales Representative & Owner Performance Breakdown
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px' }}>Sales Owner</th>
                <th style={{ padding: '10px' }}>Total Deals</th>
                <th style={{ padding: '10px' }}>Won Deals</th>
                <th style={{ padding: '10px' }}>Active Pipeline</th>
                <th style={{ padding: '10px' }}>Closed Won Revenue</th>
                <th style={{ padding: '10px' }}>Win Rate %</th>
              </tr>
            </thead>
            <tbody>
              {metrics.ownerPerformance.map((owner, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px', fontWeight: 600, color: 'var(--text-main)' }}>{owner.owner}</td>
                  <td style={{ padding: '10px' }}>{owner.totalDeals}</td>
                  <td style={{ padding: '10px', color: '#34d399' }}>{owner.wonDeals}</td>
                  <td style={{ padding: '10px' }}>${owner.pipelineValue.toLocaleString()}</td>
                  <td style={{ padding: '10px', fontWeight: 700, color: '#38bdf8' }}>${owner.wonValue.toLocaleString()}</td>
                  <td style={{ padding: '10px' }}>
                    <span className={`badge ${owner.winRate >= 50 ? 'badge-success' : 'badge-warning'}`}>
                      {owner.winRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
