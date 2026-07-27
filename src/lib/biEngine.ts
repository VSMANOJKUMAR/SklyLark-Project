import { CleanedDeal, CleanedWorkOrder, BIMetrics, DataQualityReport, ChatMessage } from '../types';

/**
 * Calculate comprehensive cross-board business metrics
 */
export function calculateBIMetrics(deals: CleanedDeal[], workOrders: CleanedWorkOrder[]): BIMetrics {
  const wonDeals = deals.filter(d => d.isWon);
  const pipelineDeals = deals.filter(d => d.isPipeline);

  const totalWonRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const totalPipelineValue = pipelineDeals.reduce((sum, d) => sum + d.value, 0);
  const weightedPipelineValue = pipelineDeals.reduce((sum, d) => sum + d.weightedValue, 0);

  const closedDealsCount = deals.filter(d => d.isWon || d.isLost).length;
  const winRate = closedDealsCount > 0 ? Math.round((wonDeals.length / closedDealsCount) * 100) : 0;
  const avgDealSize = deals.length > 0 ? Math.round(deals.reduce((sum, d) => sum + d.value, 0) / deals.length) : 0;

  // Work orders
  const totalWorkOrderBudget = workOrders.reduce((sum, w) => sum + w.budget, 0);
  const totalWorkOrderSpend = workOrders.reduce((sum, w) => sum + w.actualSpend, 0);
  const workOrderBudgetVariance = totalWorkOrderSpend - totalWorkOrderBudget;
  const delayedWorkOrdersCount = workOrders.filter(w => w.isDelayed).length;
  const completedWorkOrdersCount = workOrders.filter(w => w.status === 'Completed').length;

  // Sector breakdown
  const sectorMap = new Map<string, {
    dealCount: number;
    pipelineValue: number;
    wonRevenue: number;
    workOrdersCount: number;
    totalSpend: number;
    delayedCount: number;
  }>();

  deals.forEach(d => {
    const sec = d.sector || 'Uncategorized';
    const existing = sectorMap.get(sec) || { dealCount: 0, pipelineValue: 0, wonRevenue: 0, workOrdersCount: 0, totalSpend: 0, delayedCount: 0 };
    existing.dealCount++;
    if (d.isPipeline) existing.pipelineValue += d.value;
    if (d.isWon) existing.wonRevenue += d.value;
    sectorMap.set(sec, existing);
  });

  workOrders.forEach(w => {
    const sec = w.sector || 'Uncategorized';
    const existing = sectorMap.get(sec) || { dealCount: 0, pipelineValue: 0, wonRevenue: 0, workOrdersCount: 0, totalSpend: 0, delayedCount: 0 };
    existing.workOrdersCount++;
    existing.totalSpend += w.actualSpend;
    if (w.isDelayed) existing.delayedCount++;
    sectorMap.set(sec, existing);
  });

  const sectorBreakdown = Array.from(sectorMap.entries()).map(([sector, stats]) => ({
    sector,
    ...stats
  }));

  // Owner performance
  const ownerMap = new Map<string, { totalDeals: number; wonDeals: number; pipelineValue: number; wonValue: number }>();

  deals.forEach(d => {
    const owner = d.owner || 'Unassigned';
    const existing = ownerMap.get(owner) || { totalDeals: 0, wonDeals: 0, pipelineValue: 0, wonValue: 0 };
    existing.totalDeals++;
    if (d.isWon) {
      existing.wonDeals++;
      existing.wonValue += d.value;
    } else if (d.isPipeline) {
      existing.pipelineValue += d.value;
    }
    ownerMap.set(owner, existing);
  });

  const ownerPerformance = Array.from(ownerMap.entries()).map(([owner, stats]) => ({
    owner,
    ...stats,
    winRate: stats.totalDeals > 0 ? Math.round((stats.wonDeals / stats.totalDeals) * 100) : 0
  }));

  return {
    totalPipelineValue,
    totalWonRevenue,
    weightedPipelineValue,
    winRate,
    avgDealSize,
    totalWorkOrderBudget,
    totalWorkOrderSpend,
    workOrderBudgetVariance,
    delayedWorkOrdersCount,
    completedWorkOrdersCount,
    sectorBreakdown,
    ownerPerformance
  };
}

/**
 * Natural language intent parser and executive answer generator
 */
export function processUserQuery(
  rawQuery: string,
  deals: CleanedDeal[],
  workOrders: CleanedWorkOrder[],
  metrics: BIMetrics,
  qualityReport: DataQualityReport
): ChatMessage {
  const query = rawQuery.toLowerCase().trim();
  const id = `msg-${Date.now()}`;
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Sector Specific Query (e.g., "energy sector", "healthcare", "fintech")
  if (query.includes('energy') || query.includes('sector') || query.includes('pipeline')) {
    let targetSector = 'Energy';
    if (query.includes('health')) targetSector = 'Healthcare';
    else if (query.includes('fintech') || query.includes('bank')) targetSector = 'Fintech';
    else if (query.includes('logist')) targetSector = 'Logistics';

    const sectorDeals = deals.filter(d => d.sector.toLowerCase() === targetSector.toLowerCase());
    const sectorWOs = workOrders.filter(w => w.sector.toLowerCase() === targetSector.toLowerCase());
    const sectorMetrics = metrics.sectorBreakdown.find(s => s.sector.toLowerCase() === targetSector.toLowerCase());

    const pipelineVal = sectorDeals.filter(d => d.isPipeline).reduce((sum, d) => sum + d.value, 0);
    const wonVal = sectorDeals.filter(d => d.isWon).reduce((sum, d) => sum + d.value, 0);
    const delayedWOs = sectorWOs.filter(w => w.isDelayed);

    let answerText = `### 📊 ${targetSector} Sector Business Intelligence Analysis\n\n`;
    answerText += `**Pipeline & Financial Health:**\n`;
    answerText += `- **Active Pipeline:** $${pipelineVal.toLocaleString()} across ${sectorDeals.filter(d => d.isPipeline).length} deals.\n`;
    answerText += `- **Closed Won Revenue:** $${wonVal.toLocaleString()} across ${sectorDeals.filter(d => d.isWon).length} deals.\n`;
    answerText += `- **Total Work Order Execution Spend:** $${(sectorMetrics?.totalSpend || 0).toLocaleString()} across ${sectorWOs.length} work orders.\n\n`;

    if (delayedWOs.length > 0) {
      answerText += `⚠️ **Operational Bottlenecks Detected:**\n`;
      delayedWOs.forEach(w => {
        answerText += `- **${w.projectName}** (${w.client}): Status is **${w.status}** (Health: ${w.healthStatus}). Actual Spend $${w.actualSpend.toLocaleString()} vs Budget $${w.budget.toLocaleString()}.\n`;
      });
    } else {
      answerText += `✅ **Execution Status:** All ${targetSector} sector work orders are currently operating smoothly on schedule.\n`;
    }

    if (qualityReport.dealsMissingValue > 0 || qualityReport.dealsMissingCloseDate > 0) {
      answerText += `\n📌 *Data Caveat:* Note that ${qualityReport.dealsMissingValue} deal(s) had missing financial figures which were normalized to zero.`;
    }

    return {
      id,
      sender: 'agent',
      text: answerText,
      timestamp,
      dataSummary: {
        highlights: [
          `${targetSector} Pipeline: $${pipelineVal.toLocaleString()}`,
          `Won Revenue: $${wonVal.toLocaleString()}`,
          `Delayed Work Orders: ${delayedWOs.length}`
        ],
        tableData: sectorDeals.map(d => ({ Name: d.name, Company: d.company, Stage: d.stage, Value: `$${d.value.toLocaleString()}`, CloseDate: d.expectedCloseDate || 'TBD' })),
        chartType: 'bar',
        chartData: [
          { name: 'Active Pipeline', value: pipelineVal },
          { name: 'Won Revenue', value: wonVal },
          { name: 'Work Order Spend', value: sectorMetrics?.totalSpend || 0 }
        ]
      }
    };
  }

  // 2. Operational / Delayed Work Orders Query
  if (query.includes('delay') || query.includes('work order') || query.includes('project') || query.includes('over budget') || query.includes('execution')) {
    const delayedWOs = workOrders.filter(w => w.isDelayed || w.isOverBudget);
    let answerText = `### 🚨 Operational Risk & Work Order Performance\n\n`;
    answerText += `Out of **${workOrders.length} total work orders**, we have **${metrics.delayedWorkOrdersCount} delayed/blocked** and **${workOrders.filter(w => w.isOverBudget).length} over budget**.\n\n`;

    delayedWOs.forEach(w => {
      answerText += `- **${w.projectName}** [Client: ${w.client} | Lead: ${w.projectLead}]\n`;
      answerText += `  • Status: **${w.status}** (Health: **${w.healthStatus}**)\n`;
      answerText += `  • Financials: Budget $${w.budget.toLocaleString()} | Actual Spend: $${w.actualSpend.toLocaleString()} (${w.varianceSpend > 0 ? `+$${w.varianceSpend.toLocaleString()} OVER` : 'On Budget'})\n`;
      answerText += `  • Milestones: ${w.milestonesDone}/${w.milestonesTotal} completed\n\n`;
    });

    return {
      id,
      sender: 'agent',
      text: answerText,
      timestamp,
      dataSummary: {
        highlights: [
          `Total Work Orders: ${workOrders.length}`,
          `Delayed/Blocked: ${metrics.delayedWorkOrdersCount}`,
          `Over Budget Variance: $${metrics.workOrderBudgetVariance.toLocaleString()}`
        ],
        tableData: delayedWOs.map(w => ({ Project: w.projectName, Client: w.client, Status: w.status, Budget: `$${w.budget.toLocaleString()}`, ActualSpend: `$${w.actualSpend.toLocaleString()}` }))
      }
    };
  }

  // 3. Overall Revenue, Pipeline, Win Rate Query
  if (query.includes('revenue') || query.includes('win rate') || query.includes('summary') || query.includes('how are we doing') || query.includes('health')) {
    let answerText = `### 📈 Executive Business Performance Overview\n\n`;
    answerText += `- 💰 **Total Closed Won Revenue:** $${metrics.totalWonRevenue.toLocaleString()}\n`;
    answerText += `- 📊 **Active Sales Pipeline:** $${metrics.totalPipelineValue.toLocaleString()} (Weighted Value: $${metrics.weightedPipelineValue.toLocaleString()})\n`;
    answerText += `- 🎯 **Win Rate:** **${metrics.winRate}%** across closed opportunities\n`;
    answerText += `- 💵 **Average Deal Size:** $${metrics.avgDealSize.toLocaleString()}\n`;
    answerText += `- ⚙️ **Project Execution:** $${metrics.totalWorkOrderSpend.toLocaleString()} spent against $${metrics.totalWorkOrderBudget.toLocaleString()} total budget.\n\n`;
    answerText += `🛡️ **Data Resilience Score:** **${qualityReport.qualityScore}%** data cleanliness score across Monday.com boards.`;

    return {
      id,
      sender: 'agent',
      text: answerText,
      timestamp,
      dataSummary: {
        metrics,
        chartType: 'pie',
        chartData: metrics.sectorBreakdown.map(s => ({ name: s.sector, value: s.pipelineValue + s.wonRevenue }))
      }
    };
  }

  // 4. Data Quality / Caveats Query
  if (query.includes('data quality') || query.includes('caveat') || query.includes('clean') || query.includes('resilience') || query.includes('missing')) {
    let answerText = `### 🛡️ Data Quality & Resilience Health Assessment\n\n`;
    answerText += `The agent automatically cleaned and normalized **${qualityReport.normalizedCurrenciesCount} currency strings**, **${qualityReport.normalizedDatesCount} dates**, and **${qualityReport.normalizedSectorsCount} sector classifications**.\n\n`;
    answerText += `**Data Quality Audit Flags (${qualityReport.qualityScore}% Overall Health):**\n`;
    qualityReport.anomalies.forEach((a, i) => {
      answerText += `${i + 1}. **[${a.entity} ${a.id}]** ${a.description} -> *Impact: ${a.impact}*\n`;
    });

    return {
      id,
      sender: 'agent',
      text: answerText,
      timestamp
    };
  }

  // Fallback General Response
  let answerText = `### 💡 Executive Intelligence Response\n\n`;
  answerText += `Based on the latest data synced from your Monday.com boards:\n\n`;
  answerText += `- **Active Sales Pipeline:** $${metrics.totalPipelineValue.toLocaleString()} (${deals.filter(d => d.isPipeline).length} deals)\n`;
  answerText += `- **Closed Won Revenue:** $${metrics.totalWonRevenue.toLocaleString()}\n`;
  answerText += `- **Execution Work Orders:** ${workOrders.length} projects (${metrics.delayedWorkOrdersCount} delayed)\n\n`;
  answerText += `You can ask me specific questions like:\n`;
  answerText += `- *"How's the energy sector pipeline doing?"*\n`;
  answerText += `- *"Which work orders are delayed or over budget?"*\n`;
  answerText += `- *"Show me sales owner performance and win rates"*`;

  return {
    id,
    sender: 'agent',
    text: answerText,
    timestamp,
    dataSummary: {
      metrics
    }
  };
}
