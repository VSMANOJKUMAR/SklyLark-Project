import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { DataResiliencePanel } from './components/DataResiliencePanel';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ChatInterface } from './components/ChatInterface';
import { MondayConnectionModal } from './components/MondayConnectionModal';
import { LeadershipUpdateModal } from './components/LeadershipUpdateModal';
import { DecisionLogModal } from './components/DecisionLogModal';
import { RawDataViewer } from './components/RawDataViewer';

import { SAMPLE_DEALS, SAMPLE_WORK_ORDERS } from './data/sampleDatasets';
import { cleanDeals, cleanWorkOrders, buildDataQualityReport } from './lib/dataNormalizer';
import { calculateBIMetrics } from './lib/biEngine';
import { generateLeadershipUpdate } from './lib/leadershipGenerator';
import { fetchRawBoardItems, mapRowsToDeals, mapRowsToWorkOrders } from './lib/mondayClient';
import { MondayConfig, RawDeal, RawWorkOrder } from './types';

export function App() {
  // Monday API config state
  const defaultApiKey = import.meta.env.VITE_MONDAY_API_KEY ?? '';
  const defaultDealsBoardId = import.meta.env.VITE_DEALS_BOARD_ID ?? '';
  const defaultWorkOrdersBoardId = import.meta.env.VITE_WORK_ORDERS_BOARD_ID ?? '';

  const [config, setConfig] = useState<MondayConfig>({
    apiKey: defaultApiKey,
    dealsBoardId: defaultDealsBoardId,
    workOrdersBoardId: defaultWorkOrdersBoardId,
    isConnected: false,
    boardNames: undefined
  });
  const [hasAutoSynced, setHasAutoSynced] = useState(false);

  // Raw data state
  const [rawDeals, setRawDeals] = useState<RawDeal[]>(SAMPLE_DEALS);
  const [rawWorkOrders, setRawWorkOrders] = useState<RawWorkOrder[]>(SAMPLE_WORK_ORDERS);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isLeadershipModalOpen, setIsLeadershipModalOpen] = useState(false);
  const [isDecisionLogModalOpen, setIsDecisionLogModalOpen] = useState(false);
  const [isRawDataModalOpen, setIsRawDataModalOpen] = useState(false);

  // Data Normalization & Resilience Layer
  const { cleanedDeals, cleanedWOs, qualityReport } = useMemo(() => {
    const dealsRes = cleanDeals(rawDeals);
    const woRes = cleanWorkOrders(rawWorkOrders);
    const report = buildDataQualityReport(dealsRes.cleaned, woRes.cleaned, {
      currencyCount: dealsRes.currencyCount + woRes.currencyCount,
      dateCount: dealsRes.dateCount + woRes.dateCount,
      sectorCount: dealsRes.sectorCount
    });

    return {
      cleanedDeals: dealsRes.cleaned,
      cleanedWOs: woRes.cleaned,
      qualityReport: report
    };
  }, [rawDeals, rawWorkOrders]);

  // BI Metrics Engine
  const metrics = useMemo(() => {
    return calculateBIMetrics(cleanedDeals, cleanedWOs);
  }, [cleanedDeals, cleanedWOs]);

  // Leadership Report Generator
  const leadershipReport = useMemo(() => {
    return generateLeadershipUpdate(cleanedDeals, cleanedWOs, metrics, qualityReport);
  }, [cleanedDeals, cleanedWOs, metrics, qualityReport]);

  // Handlers
  const handleSaveConfig = (newConfig: MondayConfig, fetchedDeals: RawDeal[], fetchedWOs: RawWorkOrder[]) => {
    setConfig(newConfig);
    setRawDeals(fetchedDeals);
    setRawWorkOrders(fetchedWOs);
  };

  useEffect(() => {
    if (!defaultApiKey || !defaultDealsBoardId || !defaultWorkOrdersBoardId || hasAutoSynced) {
      return;
    }

    const hasMeaningfulBoardData = (deals: RawDeal[], workOrders: RawWorkOrder[]) => {
      // Require some numeric signal (not just names) before replacing demo data.
      const MIN_DEALS_WITH_VALUE = 3; // minimum deals with positive value
      const dealsWithValue = deals.filter((d) => typeof d.value === 'number' && d.value > 0).length;
      const dealsRatio = deals.length ? dealsWithValue / deals.length : 0;
      const hasEnoughDeals = dealsWithValue >= MIN_DEALS_WITH_VALUE || dealsRatio >= 0.1; // or >=10% positive values

      const workOrdersWithSpend = workOrders.filter((w) => typeof w.actualSpend === 'number' && w.actualSpend > 0).length;
      const hasEnoughWOs = workOrdersWithSpend >= 1; // at least one work order with spend

      return hasEnoughDeals && hasEnoughWOs;
    };

    const autoSyncMondayData = async () => {
      setIsSyncing(true);
      try {
        const dealsRows = await fetchRawBoardItems(defaultApiKey, defaultDealsBoardId);
        const woRows = await fetchRawBoardItems(defaultApiKey, defaultWorkOrdersBoardId);
        const parsedDeals = mapRowsToDeals(dealsRows);
        const parsedWOs = mapRowsToWorkOrders(woRows);

        if (!hasMeaningfulBoardData(parsedDeals, parsedWOs)) {
          console.warn('Monday auto-sync returned invalid or empty board rows; keeping demo data.');
          return;
        }

        setConfig({
          apiKey: defaultApiKey,
          dealsBoardId: defaultDealsBoardId,
          workOrdersBoardId: defaultWorkOrdersBoardId,
          isConnected: true,
          lastSyncedAt: new Date().toLocaleTimeString(),
          boardNames: {
            deals: 'Deals',
            workOrders: 'Work Orders'
          }
        });
        setRawDeals(parsedDeals);
        setRawWorkOrders(parsedWOs);
      } catch (err) {
        console.warn('Monday auto-sync failed:', err);
      } finally {
        setIsSyncing(false);
        setHasAutoSynced(true);
      }
    };

    autoSyncMondayData();
  }, [defaultApiKey, defaultDealsBoardId, defaultWorkOrdersBoardId, hasAutoSynced]);

  const handleResetToDemo = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setRawDeals(SAMPLE_DEALS);
      setRawWorkOrders(SAMPLE_WORK_ORDERS);
      setConfig({ apiKey: '', dealsBoardId: '', workOrdersBoardId: '', isConnected: false });
      setIsSyncing(false);
    }, 300);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Header & Bar */}
      <Header 
        config={config}
        qualityReport={qualityReport}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        onOpenLeadershipModal={() => setIsLeadershipModalOpen(true)}
        onOpenDecisionLogModal={() => setIsDecisionLogModalOpen(true)}
        onOpenRawDataModal={() => setIsRawDataModalOpen(true)}
        onResetToDemo={handleResetToDemo}
        isSyncing={isSyncing}
      />

      {/* Main Content Area */}
      <main style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '0 24px 40px 24px', flex: 1 }}>
        
        {/* Data Resilience Hygiene Banner */}
        <DataResiliencePanel 
          qualityReport={qualityReport}
          onOpenRawViewer={() => setIsRawDataModalOpen(true)}
        />

        {/* 2-Column Grid: Executive Dashboard + Conversational AI Chat */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
          
          {/* Left Column: Conversational AI Agent */}
          <ChatInterface 
            deals={cleanedDeals}
            workOrders={cleanedWOs}
            metrics={metrics}
            qualityReport={qualityReport}
            onOpenLeadershipModal={() => setIsLeadershipModalOpen(true)}
          />

          {/* Right Column: Visual Charts & Analytics */}
          <AnalyticsDashboard 
            metrics={metrics}
            deals={cleanedDeals}
            workOrders={cleanedWOs}
          />

        </div>

      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '20px 24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
        Skylark Business Intelligence AI Agent • Integrated with Monday.com GraphQL API v2 • Built for Founders & Leadership
      </footer>

      {/* Modals */}
      <MondayConnectionModal 
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        onUseDemoData={handleResetToDemo}
      />

      <LeadershipUpdateModal 
        isOpen={isLeadershipModalOpen}
        onClose={() => setIsLeadershipModalOpen(false)}
        report={leadershipReport}
      />

      <DecisionLogModal 
        isOpen={isDecisionLogModalOpen}
        onClose={() => setIsDecisionLogModalOpen(false)}
      />

      <RawDataViewer 
        isOpen={isRawDataModalOpen}
        onClose={() => setIsRawDataModalOpen(false)}
        deals={cleanedDeals}
        workOrders={cleanedWOs}
      />

    </div>
  );
}

export default App;
