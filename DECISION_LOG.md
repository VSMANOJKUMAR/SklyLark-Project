# Business Intelligence AI Agent - Decision Log & Architecture Document

**Project:** Founder Business Intelligence AI Agent  
**Integration:** Monday.com GraphQL API (`v2`)  
**Scope:** Sales Pipeline (Deals) & Project Execution (Work Orders) Cross-Board Analytics  

---

## 1. Key Assumptions Made

1. **Dynamic Monday.com Board Schemas:**
   - Real-world Monday.com boards vary significantly across teams in column titles and structural layouts.
   - **Assumption:** The agent must auto-discover board structures dynamically via GraphQL schema inspection rather than hardcoding static column IDs.
   - **Implementation:** Created a fuzzy column matching and dynamic normalization engine (`src/lib/mondayClient.ts` & `src/lib/dataNormalizer.ts`) that handles varied column headers (e.g., "Deal Value", "Revenue", "Amount", "Planned Budget").

2. **Real-World Messy Data Resilience:**
   - Raw user input contains unformatted date strings (`09/20/2026`, `2026-08-15`, `10-10-2026`, `TBD`), text currency values (`$450k`, `1,200,000 USD`, `275k`, `$2.1M`, empty fields), and inconsistent sector categories (`energy sector`, `Oil & Gas / Energy`, `Health-care`).
   - **Assumption:** Financial aggregations must never fail or throw `NaN` runtime exceptions due to bad data.
   - **Implementation:** All currencies clean deterministically into numeric USD floats; all dates map to `ISO-8601` or explicit null flags; sector variations standardize into unified business domains (`Energy`, `Healthcare`, `Fintech`, `Logistics`).

3. **Cross-Board Correlation (Sales vs Execution):**
   - **Assumption:** Founders evaluate business health by comparing promised revenue (Deals) against actual delivery costs and timeline health (Work Orders).
   - **Implementation:** Linked Work Orders to parent Deals via `Deal ID`. Where links exist, the agent correlates contract terms with actual execution spend; unlinked work orders generate data health audit caveats.

---

## 2. Architectural Trade-offs Chosen & Rationale

| Decision | Chosen Approach | Alternative Considered | Rationale & Justification |
| :--- | :--- | :--- | :--- |
| **API Integration Strategy** | Dynamic Monday GraphQL API client + Pre-loaded messy CSV demo dataset | Direct API-only without offline sample data | Allows instant zero-setup evaluation without forcing the reviewer to manually create Monday.com boards first, while keeping full live API support intact. |
| **Data Resilience Pipeline** | Deterministic Regex Parsing + LLM Intent Mapping | 100% LLM Prompt-based Data Parsing | LLMs occasionally hallucinate financial calculations or introduce rounding errors. Deterministic regex parsing guarantees 100% accuracy on financial totals (`$450k = $450,000`). |
| **User Interface Tech Stack** | Modern React + Vite + Recharts + Glassmorphism UI | Barebone CLI / Simple Plain Text Output | Executive interfaces must impress founders visually at first glance while providing interactive charts, instant query response chips, and data quality gauges. |

---

## 3. How "Leadership Updates" Was Interpreted & Implemented

### Interpretation:
Founders and C-suite executives do not want raw database rows—they require **actionable strategic context** bridging sales momentum with operational execution risks. "Leadership updates" must answer three key questions:
1. *Where are we making money?* (Active Pipeline vs Closed Revenue)
2. *Where are we losing margin or falling behind?* (Work order cost overruns and engineering delays)
3. *What immediate decisions are required?* (Action items & operational mitigations)

### Implementation:
Built an **Executive Leadership Briefing Generator** (`src/lib/leadershipGenerator.ts` & `LeadershipUpdateModal.tsx`):
- **Executive Summary:** Synthesizes pipeline health, win rates, and execution status into a concise paragraph.
- **Financial Highlights:** Key KPI callouts with period-over-period context.
- **Operational Risks & Mitigations:** Specifically isolates delayed work orders (e.g. *Solar Substation Engineering*) and over-budget projects.
- **Export Capabilities:** 1-click Markdown copy and downloadable `.MD` briefing files for board/investor updates.

---

## 4. What We Would Do Differently With More Time

1. **Real-time Monday.com Webhooks:**
   - Implement webhooks to receive push notifications whenever a deal stage or work order status changes in Monday.com.
2. **Automated Monday Board Creator:**
   - Add a 1-click script utilizing Monday GraphQL mutations (`create_board`, `create_column`, `create_item`) to automatically seed user workspaces with the sample dataset.
3. **Automated PDF Executive Report Export:**
   - Implement server-side Puppeteer PDF rendering to export polished PDF pitchbooks for board members.
