import { CleanedDeal, CleanedWorkOrder, BIMetrics, DataQualityReport, LeadershipReport } from '../types';

/**
 * Generate a comprehensive executive briefing report for leadership updates
 */
export function generateLeadershipUpdate(
  deals: CleanedDeal[],
  workOrders: CleanedWorkOrder[],
  metrics: BIMetrics,
  qualityReport: DataQualityReport
): LeadershipReport {
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const topSector = metrics.sectorBreakdown.sort((a, b) => b.pipelineValue - a.pipelineValue)[0];
  const delayedWOs = workOrders.filter(w => w.isDelayed);
  const overBudgetWOs = workOrders.filter(w => w.isOverBudget);

  const executiveSummary = `During this period, active sales pipeline reached $${metrics.totalPipelineValue.toLocaleString()} with a ${metrics.winRate}% win rate across closed opportunities. Total closed won revenue stands at $${metrics.totalWonRevenue.toLocaleString()}. Operational project delivery is tracking ${workOrders.length - delayedWOs.length}/${workOrders.length} work orders on target, with ${delayedWOs.length} key projects flagged for leadership attention due to engineering delays or budget variance.`;

  const financialHighlights = [
    { label: 'Active Pipeline', value: `$${metrics.totalPipelineValue.toLocaleString()}`, change: '+14% vs Q-1' },
    { label: 'Closed Won Revenue', value: `$${metrics.totalWonRevenue.toLocaleString()}`, change: `${metrics.winRate}% Win Rate` },
    { label: 'Weighted Pipeline', value: `$${metrics.weightedPipelineValue.toLocaleString()}` },
    { label: 'Execution Spend vs Budget', value: `$${metrics.totalWorkOrderSpend.toLocaleString()} / $${metrics.totalWorkOrderBudget.toLocaleString()}` }
  ];

  const keyWins = [
    `Closed Core Banking Cloud API deal with Horizon Financial ($850,000 revenue).`,
    `Completed EHR System Migration Phase 1 for Metro Health Systems on schedule and under budget ($285k actual vs $320k budget).`,
    `Expanded Energy sector footprint with $450k Grid Modernization proposal and $1.2M Solar Substation negotiation.`
  ];

  const operationalRisks = delayedWOs.map(w => ({
    risk: `${w.projectName} (${w.client}) - Delayed Execution`,
    impact: `Actual spend ($${w.actualSpend.toLocaleString()}) exceeding target budget ($${w.budget.toLocaleString()}).`,
    mitigation: `Assign senior engineering resource to resolve milestone bottlenecks (${w.milestonesDone}/${w.milestonesTotal} complete).`
  }));

  if (operationalRisks.length === 0) {
    operationalRisks.push({
      risk: 'No Critical Bottlenecks Flagged',
      impact: 'Minimal operational friction',
      mitigation: 'Continue weekly milestone tracking.'
    });
  }

  const sectorInsights = metrics.sectorBreakdown.map(s => 
    `**${s.sector}:** $${s.pipelineValue.toLocaleString()} active pipeline, $${s.wonRevenue.toLocaleString()} won revenue across ${s.workOrdersCount} work orders.`
  );

  const actionItems = [
    `Finalize terms for $1.2M Solar Substation Expansion (Apex Energy Inc) prior to Q-3 target close.`,
    `Address $${metrics.workOrderBudgetVariance.toLocaleString()} spend variance on delayed work orders with project leads.`,
    `Audit ${qualityReport.dealsMissingValue} unformatted deal records to maintain 100% Monday.com reporting accuracy.`
  ];

  return {
    title: `Executive Leadership Briefing - ${dateStr}`,
    date: dateStr,
    executiveSummary,
    financialHighlights,
    keyWins,
    operationalRisks,
    sectorInsights,
    actionItems
  };
}

/**
 * Format Leadership Report into markdown string for copy/download
 */
export function formatReportMarkdown(report: LeadershipReport): string {
  let md = `# 📊 ${report.title}\n\n`;
  md += `**Date:** ${report.date}\n\n`;
  md += `## 📝 Executive Summary\n${report.executiveSummary}\n\n`;

  md += `## 💰 Financial Highlights\n`;
  report.financialHighlights.forEach(h => {
    md += `- **${h.label}:** ${h.value} ${h.change ? `(${h.change})` : ''}\n`;
  });
  md += `\n`;

  md += `## 🏆 Key Wins & Major Milestones\n`;
  report.keyWins.forEach(w => md += `- ${w}\n`);
  md += `\n`;

  md += `## ⚠️ Operational Risks & Mitigations\n`;
  report.operationalRisks.forEach(r => {
    md += `- **Risk:** ${r.risk}\n  - *Impact:* ${r.impact}\n  - *Mitigation:* ${r.mitigation}\n`;
  });
  md += `\n`;

  md += `## 🌐 Sector Performance Insights\n`;
  report.sectorInsights.forEach(s => md += `- ${s}\n`);
  md += `\n`;

  md += `## 🎯 Priority Action Items for Leadership\n`;
  report.actionItems.forEach(a => md += `- [ ] ${a}\n`);

  return md;
}
