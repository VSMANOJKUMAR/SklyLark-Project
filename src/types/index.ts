export interface RawDeal {
  id: string;
  name: string;
  company: string;
  sector: string;
  product?: string;
  value: string | number;
  stage: string;
  expectedCloseDate: string;
  owner: string;
  probability?: string | number;
  notes?: string;
  [key: string]: any;
}

export interface CleanedDeal {
  id: string;
  name: string;
  company: string;
  sector: string; // Standardized, e.g., 'Energy', 'Healthcare', 'Fintech', 'Logistics', 'Other'
  originalSector: string;
  value: number; // Cleaned numeric value in USD
  originalValue: string;
  stage: 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost' | 'In Review' | 'Other';
  originalStage: string;
  expectedCloseDate: string | null; // ISO format YYYY-MM-DD
  originalCloseDate: string;
  owner: string;
  probability: number;
  isWon: boolean;
  isLost: boolean;
  isPipeline: boolean;
  weightedValue: number;
  qualityFlags: string[];
}

export interface RawWorkOrder {
  id: string;
  dealId?: string;
  projectName: string;
  client: string;
  sector: string;
  budget: string | number;
  actualSpend: string | number;
  status: string;
  startDate: string;
  targetCompletion: string;
  projectLead: string;
  healthStatus?: string;
  milestonesComplete?: string;
  [key: string]: any;
}

export interface CleanedWorkOrder {
  id: string;
  dealId: string | null;
  projectName: string;
  client: string;
  sector: string;
  budget: number;
  originalBudget: string;
  actualSpend: number;
  originalActualSpend: string;
  status: 'Completed' | 'In Progress' | 'Delayed' | 'Blocked' | 'Not Started' | 'Other';
  originalStatus: string;
  startDate: string | null;
  targetCompletion: string | null;
  projectLead: string;
  healthStatus: 'Green' | 'Yellow' | 'Red' | 'Grey';
  milestonesDone: number;
  milestonesTotal: number;
  varianceSpend: number; // actualSpend - budget
  isOverBudget: boolean;
  isDelayed: boolean;
  qualityFlags: string[];
}

export interface DataQualityReport {
  totalDeals: number;
  totalWorkOrders: number;
  dealsMissingValue: number;
  dealsMissingCloseDate: number;
  workOrdersUnlinked: number;
  workOrdersMissingSpend: number;
  normalizedDatesCount: number;
  normalizedCurrenciesCount: number;
  normalizedSectorsCount: number;
  qualityScore: number; // 0-100%
  anomalies: {
    type: 'Missing' | 'Format' | 'Mismatch' | 'Anomaly';
    entity: 'Deal' | 'Work Order';
    id: string;
    description: string;
    impact: string;
  }[];
}

export interface BIMetrics {
  totalPipelineValue: number;
  totalWonRevenue: number;
  weightedPipelineValue: number;
  winRate: number; // percentage 0-100
  avgDealSize: number;
  
  totalWorkOrderBudget: number;
  totalWorkOrderSpend: number;
  workOrderBudgetVariance: number;
  delayedWorkOrdersCount: number;
  completedWorkOrdersCount: number;

  sectorBreakdown: {
    sector: string;
    dealCount: number;
    pipelineValue: number;
    wonRevenue: number;
    workOrdersCount: number;
    totalSpend: number;
    delayedCount: number;
  }[];

  ownerPerformance: {
    owner: string;
    totalDeals: number;
    wonDeals: number;
    pipelineValue: number;
    wonValue: number;
    winRate: number;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  dataSummary?: {
    metrics?: Partial<BIMetrics>;
    highlights?: string[];
    caveats?: string[];
    tableData?: any[];
    chartType?: 'bar' | 'pie' | 'line';
    chartData?: any[];
  };
  isLeadershipReport?: boolean;
}

export interface LeadershipReport {
  title: string;
  date: string;
  executiveSummary: string;
  financialHighlights: {
    label: string;
    value: string;
    change?: string;
  }[];
  keyWins: string[];
  operationalRisks: {
    risk: string;
    impact: string;
    mitigation: string;
  }[];
  sectorInsights: string[];
  actionItems: string[];
}

export interface MondayConfig {
  apiKey: string;
  dealsBoardId: string;
  workOrdersBoardId: string;
  isConnected: boolean;
  lastSyncedAt?: string;
  boardNames?: {
    deals?: string;
    workOrders?: string;
  };
}
