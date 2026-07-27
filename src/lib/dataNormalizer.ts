import { RawDeal, CleanedDeal, RawWorkOrder, CleanedWorkOrder, DataQualityReport } from '../types';

/**
 * Standardize sector naming variations
 */
export function normalizeSector(rawSector: string | undefined, fallback?: string): string {
  const raw = (rawSector || fallback || '').toString().trim();
  if (!raw) return 'Uncategorized';
  const s = raw.toLowerCase().trim();
  
  if (s.includes('energy') || s.includes('oil') || s.includes('gas') || s.includes('power') || s.includes('grid') || s.includes('renewable') || s.includes('solar') || s.includes('wind')) {
    return 'Energy';
  }
  if (s.includes('health') || s.includes('bio') || s.includes('clinical') || s.includes('medical') || s.includes('ehr') || s.includes('telehealth')) {
    return 'Healthcare';
  }
  if (s.includes('fintech') || s.includes('bank') || s.includes('financial') || s.includes('pay') || s.includes('payment')) {
    return 'Fintech';
  }
  if (s.includes('logist') || s.includes('transp') || s.includes('supply') || s.includes('wareh') || s.includes('railway') || s.includes('rail')) {
    return 'Logistics';
  }
  if (s.includes('construct') || s.includes('infrastructure') || s.includes('civil') || s.includes('building')) {
    return 'Construction';
  }
  if (s.includes('mine') || s.includes('mining')) {
    return 'Mining';
  }
  if (s.includes('security') || s.includes('surveillance')) {
    return 'Security';
  }
  if (s.includes('tender') || s.includes('proposal') || s.includes('dsp')) {
    return 'Tender';
  }

  // Preserve meaningful raw values when sector is provided in alternate form
  const candidate = raw.split(/[,\/\|]+/)[0].trim();
  return candidate.charAt(0).toUpperCase() + candidate.slice(1);
}

export function inferSectorFromFields(fields: string[]): string | undefined {
  const combined = fields.filter(Boolean).join(' ').toLowerCase();
  if (!combined) return undefined;
  if (combined.includes('mining')) return 'Mining';
  if (combined.includes('construction') || combined.includes('civil') || combined.includes('powerline')) return 'Construction';
  if (combined.includes('rail') || combined.includes('railway')) return 'Railways';
  if (combined.includes('renewable') || combined.includes('solar') || combined.includes('wind')) return 'Energy';
  if (combined.includes('security') || combined.includes('surveillance')) return 'Security';
  if (combined.includes('health') || combined.includes('clinic') || combined.includes('telehealth')) return 'Healthcare';
  if (combined.includes('bank') || combined.includes('payment') || combined.includes('fintech')) return 'Fintech';
  if (combined.includes('service') && combined.includes('spectra')) return 'Energy';
  if (combined.includes('dsp')) return 'Tender';
  if (combined.includes('power')) return 'Energy';
  if (combined.includes('minist')) return 'Mining';
  const match = combined.match(/(energy|healthcare|fintech|logistics|construction|mining|railways|security|renewables|tender)/);
  if (match) return match[1].charAt(0).toUpperCase() + match[1].slice(1);
  return undefined;
}

/**
 * Parses messy currency / numeric strings into pure numeric float values in USD
 * E.g. "$450k" -> 450000, "1,200,000 USD" -> 1200000, "$2.1M" -> 2100000
 */
export function parseCurrency(rawValue: string | number | undefined): { val: number; wasFormatted: boolean } {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return { val: 0, wasFormatted: false };
  }
  if (typeof rawValue === 'number') {
    return { val: rawValue, wasFormatted: false };
  }

  const str = String(rawValue).trim();
  if (!str || str.toUpperCase() === 'TBD' || str.toUpperCase() === 'N/A') {
    return { val: 0, wasFormatted: true };
  }

  let cleaned = str.replace(/[$,\s]/g, '').toUpperCase();
  let multiplier = 1;

  if (cleaned.endsWith('M')) {
    multiplier = 1000000;
    cleaned = cleaned.slice(0, -1);
  } else if (cleaned.endsWith('K')) {
    multiplier = 1000;
    cleaned = cleaned.slice(0, -1);
  }

  cleaned = cleaned.replace(/USD/g, '');
  const num = parseFloat(cleaned);

  if (isNaN(num)) {
    return { val: 0, wasFormatted: true };
  }

  return { val: num * multiplier, wasFormatted: str !== String(num * multiplier) };
}

/**
 * Normalizes dates across varied real-world formats (YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY)
 */
export function normalizeDate(rawDate: string | undefined): { dateStr: string | null; wasFormatted: boolean } {
  if (!rawDate) return { dateStr: null, wasFormatted: false };
  const str = rawDate.trim();
  if (!str || str.toUpperCase() === 'TBD' || str.toUpperCase() === 'N/A') {
    return { dateStr: null, wasFormatted: true };
  }

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return { dateStr: str, wasFormatted: false };
  }

  // MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [m, d, y] = str.split('/');
    const formatted = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    return { dateStr: formatted, wasFormatted: true };
  }

  // DD-MM-YYYY or MM-DD-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
    const parts = str.split('-');
    // Assuming MM-DD-YYYY
    const formatted = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    return { dateStr: formatted, wasFormatted: true };
  }

  // Fallback Date parser
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const iso = parsed.toISOString().split('T')[0];
    return { dateStr: iso, wasFormatted: true };
  }

  return { dateStr: null, wasFormatted: true };
}

/**
 * Map stage string to standardized enum
 */
export function normalizeStage(rawStage: string | undefined): CleanedDeal['stage'] {
  if (!rawStage) return 'Other';
  const s = rawStage.toLowerCase();
  if (s.includes('won')) return 'Closed Won';
  if (s.includes('lost')) return 'Closed Lost';
  if (s.includes('proposal')) return 'Proposal';
  if (s.includes('negotiat')) return 'Negotiation';
  if (s.includes('qualif') || s.includes('discover')) return 'Qualified';
  if (s.includes('review')) return 'In Review';
  return 'Other';
}

/**
 * Clean & normalize Deals raw data array
 */
export function cleanDeals(rawDeals: RawDeal[]): { cleaned: CleanedDeal[]; currencyCount: number; dateCount: number; sectorCount: number } {
  let currencyCount = 0;
  let dateCount = 0;
  let sectorCount = 0;

  const cleaned = rawDeals.map((item) => {
    const flags: string[] = [];
    
    // Parse value
    const { val: parsedVal, wasFormatted: currFormatted } = parseCurrency(item.value);
    if (currFormatted) currencyCount++;
    if (!item.value || parsedVal === 0) {
      flags.push('Missing or unparseable deal value');
    }

    // Parse date
    const { dateStr, wasFormatted: dateFormatted } = normalizeDate(item.expectedCloseDate);
    if (dateFormatted) dateCount++;
    if (!dateStr) {
      flags.push('Missing or TBD close date');
    }

    // Sector
    const inferredSector = item.sector || inferSectorFromFields([item.product || '', item.name, item.stage, item.notes || '']);
    const normSector = normalizeSector(item.sector, inferredSector);
    if (normSector !== (item.sector || '')) sectorCount++;

    // Stage & Prob
    const stage = normalizeStage(item.stage);
    const isWon = stage === 'Closed Won';
    const isLost = stage === 'Closed Lost';
    const isPipeline = !isWon && !isLost;

    let prob = typeof item.probability === 'number' ? item.probability : parseFloat(String(item.probability || '0').replace('%', ''));
    if (isNaN(prob)) prob = isWon ? 100 : isLost ? 0 : 50;

    const weightedVal = (parsedVal * prob) / 100;

    return {
      id: item.id || `D-${Math.random().toString(36).substr(2, 5)}`,
      name: item.name || 'Untitled Deal',
      company: item.company || 'Unknown Company',
      sector: normSector,
      originalSector: item.sector || '',
      value: parsedVal,
      originalValue: String(item.value ?? ''),
      stage,
      originalStage: item.stage || '',
      expectedCloseDate: dateStr,
      originalCloseDate: item.expectedCloseDate || '',
      owner: item.owner || 'Unassigned',
      probability: prob,
      isWon,
      isLost,
      isPipeline,
      weightedValue: weightedVal,
      qualityFlags: flags
    };
  });

  return { cleaned, currencyCount, dateCount, sectorCount };
}

/**
 * Clean & normalize Work Orders raw data array
 */
export function cleanWorkOrders(rawWOs: RawWorkOrder[]): { cleaned: CleanedWorkOrder[]; currencyCount: number; dateCount: number } {
  let currencyCount = 0;
  let dateCount = 0;

  const cleaned = rawWOs.map((item) => {
    const flags: string[] = [];

    // Parse budget & spend
    const { val: parsedBudget, wasFormatted: bFormatted } = parseCurrency(item.budget);
    const { val: parsedSpend, wasFormatted: sFormatted } = parseCurrency(item.actualSpend);
    if (bFormatted || sFormatted) currencyCount++;

    if (!item.actualSpend || parsedSpend === 0) {
      flags.push('Missing or TBD actual spend record');
    }

    if (!item.dealId) {
      flags.push('Unlinked work order (missing parent Deal ID)');
    }

    // Dates
    const { dateStr: startDate, wasFormatted: sDateFormatted } = normalizeDate(item.startDate);
    const { dateStr: targetComp, wasFormatted: tDateFormatted } = normalizeDate(item.targetCompletion);
    if (sDateFormatted || tDateFormatted) dateCount++;

    // Status
    let status: CleanedWorkOrder['status'] = 'Other';
    const rawSt = (item.status || '').toLowerCase();
    if (rawSt.includes('complete')) status = 'Completed';
    else if (rawSt.includes('progress')) status = 'In Progress';
    else if (rawSt.includes('delay')) status = 'Delayed';
    else if (rawSt.includes('block')) status = 'Blocked';
    else if (rawSt.includes('not start')) status = 'Not Started';

    // Milestones
    let done = 0;
    let total = 0;
    if (item.milestonesComplete && item.milestonesComplete.includes('/')) {
      const [d, t] = item.milestonesComplete.split('/');
      done = parseInt(d, 10) || 0;
      total = parseInt(t, 10) || 0;
    }

    const variance = parsedSpend - parsedBudget;

    const inferredSector = inferSectorFromFields([item.sector || '', item.projectName, item.client, item.status, item.healthStatus || '']);
    const normalizedWorkSector = normalizeSector(item.sector, inferredSector);

    return {
      id: item.id || `WO-${Math.random().toString(36).substr(2, 5)}`,
      dealId: item.dealId || null,
      projectName: item.projectName || 'Untitled Project',
      client: item.client || 'Unknown Client',
      sector: normalizedWorkSector,
      budget: parsedBudget,
      originalBudget: String(item.budget ?? ''),
      actualSpend: parsedSpend,
      originalActualSpend: String(item.actualSpend ?? ''),
      status,
      originalStatus: item.status || '',
      startDate,
      targetCompletion: targetComp,
      projectLead: item.projectLead || 'Unassigned',
      healthStatus: (item.healthStatus as any) || 'Green',
      milestonesDone: done,
      milestonesTotal: total,
      varianceSpend: variance,
      isOverBudget: variance > 0 && parsedBudget > 0,
      isDelayed: status === 'Delayed' || status === 'Blocked' || (item.healthStatus === 'Red'),
      qualityFlags: flags
    };
  });

  return { cleaned, currencyCount, dateCount };
}

/**
 * Build total Data Quality Diagnostics Report
 */
export function buildDataQualityReport(
  cleanedDeals: CleanedDeal[],
  cleanedWOs: CleanedWorkOrder[],
  normCounts: { currencyCount: number; dateCount: number; sectorCount: number }
): DataQualityReport {
  const anomalies: DataQualityReport['anomalies'] = [];

  let dealsMissingValue = 0;
  let dealsMissingCloseDate = 0;
  let workOrdersUnlinked = 0;
  let workOrdersMissingSpend = 0;

  cleanedDeals.forEach((d) => {
    if (d.value === 0) {
      dealsMissingValue++;
      anomalies.push({
        type: 'Missing',
        entity: 'Deal',
        id: d.id,
        description: `Deal '${d.name}' (${d.company}) has missing or 0 value.`,
        impact: 'Excluded from revenue pipeline total'
      });
    }
    if (!d.expectedCloseDate) {
      dealsMissingCloseDate++;
      anomalies.push({
        type: 'Format',
        entity: 'Deal',
        id: d.id,
        description: `Deal '${d.name}' expected close date was '${d.originalCloseDate}'.`,
        impact: 'Excluded from quarterly date filtering'
      });
    }
  });

  cleanedWOs.forEach((w) => {
    if (!w.dealId) {
      workOrdersUnlinked++;
      anomalies.push({
        type: 'Mismatch',
        entity: 'Work Order',
        id: w.id,
        description: `Work order '${w.projectName}' has no linked Deal ID.`,
        impact: 'Cannot calculate cross-board execution correlation'
      });
    }
    if (w.actualSpend === 0 && w.status !== 'Not Started') {
      workOrdersMissingSpend++;
      anomalies.push({
        type: 'Missing',
        entity: 'Work Order',
        id: w.id,
        description: `Work order '${w.projectName}' spend recorded as '${w.originalActualSpend}'.`,
        impact: 'Actual vs budget calculation skewed'
      });
    }
    if (w.isOverBudget) {
      anomalies.push({
        type: 'Anomaly',
        entity: 'Work Order',
        id: w.id,
        description: `Work order '${w.projectName}' over budget by $${w.varianceSpend.toLocaleString()}.`,
        impact: 'Operational margin erosion'
      });
    }
  });

  const totalRecords = cleanedDeals.length + cleanedWOs.length;
  const flawCount = dealsMissingValue + dealsMissingCloseDate + workOrdersUnlinked + workOrdersMissingSpend;
  const qualityScore = Math.max(0, Math.min(100, Math.round(((totalRecords - flawCount) / totalRecords) * 100)));

  return {
    totalDeals: cleanedDeals.length,
    totalWorkOrders: cleanedWOs.length,
    dealsMissingValue,
    dealsMissingCloseDate,
    workOrdersUnlinked,
    workOrdersMissingSpend,
    normalizedDatesCount: normCounts.dateCount,
    normalizedCurrenciesCount: normCounts.currencyCount,
    normalizedSectorsCount: normCounts.sectorCount,
    qualityScore,
    anomalies
  };
}
