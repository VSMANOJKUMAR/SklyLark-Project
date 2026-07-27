# Skylark Business Intelligence AI Agent (Monday.com Integration)

An executive-grade **Business Intelligence (BI) AI Agent** designed for founders and executives to query sales pipeline (Deals) and project delivery execution (Work Orders) across [monday.com](http://monday.com) boards.

---

## 🌟 Key Features

1. **Monday.com GraphQL API Integration (`v2`)**:
   - Dynamic schema detection & live board querying via Monday Personal Access Token.
   - Auto-discovers columns and item values without hardcoded schema constraints.
   - Includes zero-setup pre-loaded messy CSV demo dataset for instant evaluation.

2. **Real-World Messy Data Resilience Engine**:
   - Standardizes messy date formats (`YYYY-MM-DD`, `MM/DD/YYYY`, `10-10-2026`, `TBD`) into `ISO-8601`.
   - Cleans text currencies (`$450k`, `1,200,000 USD`, `275k`, `$2.1M`) into numbers.
   - Normalizes sector naming variations (`energy sector`, `Oil & Gas / Energy`, `Health-care`).
   - Audits missing/null fields and displays an overall **Data Quality Health Scorecard (0-100%)**.

3. **Conversational Founder BI Query Engine**:
   - Interprets natural language queries across Deals and Work Orders.
   - Pre-configured executive prompts ("Energy sector pipeline", "Delayed work orders", "Overall revenue & win rate").
   - Embeds visual charts and dynamic data tables directly inside chat responses.

4. **Executive Leadership Update Generator**:
   - Generates polished executive briefings summarizing revenue highlights, key wins, operational risks, and action items.
   - Exportable via 1-click Markdown copy or downloadable `.MD` briefing files.

5. **Board Data Inspector**:
   - Compare original messy Monday.com records side-by-side with cleaned agent outputs.

---

## 🏗️ Architecture Overview

```
 ┌───────────────────────────────────────────────────────────┐
 │               Conversational Chat & UI Dashboard          │
 └─────────────────────────────┬─────────────────────────────┘
                               │
 ┌─────────────────────────────▼─────────────────────────────┐
 │                BI Agent Engine & Query Interpreter        │
 └──────┬──────────────────────┬──────────────────────┬──────┘
        │                      │                      │
 ┌──────▼──────┐        ┌──────▼──────┐        ┌──────▼──────┐
 │ Monday.com  │        │ Resilience  │        │ Leadership  │
 │ API Client  │        │ & Normalizer│        │ Generator   │
 └─────────────┘        └─────────────┘        └─────────────┘
```

---

## 🛠️ Monday.com Configuration & Import Guide

Follow these steps to import the included messy sample datasets into your Monday.com workspace:

1. **Import CSV Files**:
   - Open your [Monday.com](http://monday.com) workspace.
   - Click **+ Add** $\rightarrow$ **Import Data** $\rightarrow$ **CSV File**.
   - Import `Deals.csv` as a new board named **Deals**.
   - Import `Work_Orders.csv` as a new board named **Work Orders**.

2. **Get your Personal Access Token**:
   - Click your **Profile Avatar** (bottom-left) $\rightarrow$ **Developers** $\rightarrow$ **My Access Tokens**.
   - Copy your Personal Access Token.

3. **Connect to the Agent**:
   - Click the **Connect Monday.com** button in the app header.
   - Paste your Token and click **Test Key**.
   - Select your **Deals** and **Work Orders** boards from the dropdowns.
   - Click **Sync Live Monday.com Data**!


## 🚀 Quickstart & Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open browser at http://localhost:3000
```


## Detailed Project Overview

This section documents the approach, architecture, assumptions, trade-offs, the tools used, challenges encountered, and suggested improvements.

### Approach & Implementation

- Dynamic ingestion: the app reads Monday board metadata and items using GraphQL queries, mapping column ids to human-friendly titles. It attempts to extract `text` first, then parse `value` JSON where necessary.
- Demo-first UX: If connection is not configured, the UI uses bundled CSVs so the conversational agent and dashboards remain interactive with sample data.
- Resilience layer: deterministically parses currencies, dates, sectors, and stages and returns both normalized values and quality flags.

### Architecture Summary

The system is a client-side SPA that interrogates Monday.com live (via Personal Access Token) and processes data through a normalization layer before passing to the BI engine and UI. CSV seed scripts are provided for one-off imports.

### Assumptions

- CSVs include a single header row. Column names may vary across organizations.
- Numeric data appears with separators or suffixes (k, M). Non-numeric or TBD values should be treated as zero in some calculations, but are flagged in data quality.

### Trade-offs

- Uses rules-based normalization (fast, explainable) rather than ML (more flexible but needs training data).
- Conservative import pacing to avoid rate-limiting at the cost of longer runs.

### Tools & Libraries

- Frontend: React, TypeScript, Vite
- CSV parsing: PapaParse
- Monday.com GraphQL API v2
- Node.js for seed scripts

### Challenges & Resolutions

- Extracting column text: `column_values.value` is JSON for some column types — fallback parsing was implemented.
- Empty Monday boards: auto-sync could replace useful demo state with zeros — added gating to require numeric signals.
- Rate-limiting: added exponential backoff and jitter in seed script.

### Potential Improvements

- Add a preflight column-mapping UI and preview before write operations.
- Extend `mondayClient` with cursor-based pagination for >500 items.
- Add unit tests and E2E tests for CSV ingestion and normalization.

---

## Quickstart & Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open browser at http://localhost:3000
```

---

## File Locations (quick reference)

```
Deal funnel Data.xlsx - Deal tracker.csv      # Deals CSV in repo root
Work_Order_Tracker Data.xlsx - work order tracker.csv  # Work Orders CSV in repo root
scripts/seedMondayBoards.cjs                 # CSV → Monday ingestion script
src/lib/mondayClient.ts                      # Monday GraphQL client & row mapping
src/lib/dataNormalizer.ts                    # Data normalization & quality checks
src/lib/biEngine.ts                          # Metric calculations & chat responses
src/App.tsx                                  # App entry, auto-sync logic
```

