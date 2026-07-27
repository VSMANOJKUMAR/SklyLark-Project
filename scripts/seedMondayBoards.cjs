const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const MONDAY_API_URL = 'https://api.monday.com/v2';
const MAX_RETRIES = 6;
const BASE_RETRY_DELAY_MS = 800;
const ITEM_DELAY_MS = 300;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeText(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function parseNumber(value) {
  const cleaned = String(value || '').replace(/,/g, '').replace(/[^0-9.-]/g, '');
  if (cleaned === '' || cleaned === '.' || cleaned === '-' || cleaned === '-.') {
    return null;
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return {};
  return fs.readFileSync(envPath, 'utf8').split(/\r?\n/).reduce((env, line) => {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)$/);
    if (!match) return env;
    env[match[1].trim()] = match[2].trim();
    return env;
  }, {});
}

function readCsvFile(relativePath) {
  const filePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing CSV file: ${relativePath}`);
  }

  let csv = fs.readFileSync(filePath, 'utf8');
  csv = csv.replace(/^\s*\r?\n/, '');
  return csv;
}

function parseCsv(csv) {
  return Papa.parse(csv, { header: true, skipEmptyLines: true }).data;
}

function inferColumnType(header, sampleValues) {
  const normalized = header.toLowerCase();
  if (/date|month|year|day|close|start|end|due|delivery|time|invoice/i.test(normalized)) {
    return 'text';
  }

  const candidateValues = sampleValues
    .map((value) => normalizeText(value))
    .filter((value) => value !== '');

  if (candidateValues.length === 0) {
    return 'text';
  }

  const numericCount = candidateValues.filter((value) => parseNumber(value) !== null).length;
  const numericRatio = numericCount / candidateValues.length;
  if (numericRatio >= 0.9) {
    return 'numbers';
  }

  if (/amount|value|budget|billed|collected|price|cost|qty|quantity|count|total|rate/i.test(normalized)) {
    return 'numbers';
  }

  return 'text';
}

async function queryMonday(apiKey, query, variables = {}) {
  const res = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey,
      'API-Version': '2023-10'
    },
    body: JSON.stringify({ query, variables })
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON response from Monday: ${text}`);
  }

  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message);
  }

  return json.data;
}

async function queryMondayWithRetry(apiKey, query, variables = {}, attempt = 1) {
  try {
    return await queryMonday(apiKey, query, variables);
  } catch (err) {
    const message = String(err.message || '').toLowerCase();
    const shouldRetry = attempt < MAX_RETRIES && /429|500|502|503|504|rate limit|temporarily blocked/i.test(message);
    if (!shouldRetry) {
      throw err;
    }

    const wait = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1) + Math.round(Math.random() * 200);
    console.warn(`⚠️ Monday API retry ${attempt}/${MAX_RETRIES} after error: ${err.message}. Waiting ${wait}ms...`);
    await delay(wait);
    return queryMondayWithRetry(apiKey, query, variables, attempt + 1);
  }
}

async function getBoardIdByName(apiKey, boardName) {
  const query = `query($query:String!){ boards(limit:50, query:$query){ id name } }`;
  const data = await queryMondayWithRetry(apiKey, query, { query: boardName });
  const board = (data.boards || []).find((b) => b.name === boardName);
  return board?.id || null;
}

async function createBoardIfMissing(apiKey, boardName) {
  const existingId = await getBoardIdByName(apiKey, boardName);
  if (existingId) {
    console.log(`   ℹ️ Reusing existing board "${boardName}" (ID: ${existingId})`);
    return existingId;
  }

  const query = `mutation($name:String!){ create_board(board_name:$name, board_kind:public){ id } }`;
  const data = await queryMondayWithRetry(apiKey, query, { name: boardName });
  return data.create_board.id;
}

async function getBoardColumns(apiKey, boardId) {
  const query = `query($boardId:[ID!]){ boards(ids:$boardId){ columns{ id title type } } }`;
  const data = await queryMondayWithRetry(apiKey, query, { boardId: [boardId] });
  const columns = data.boards?.[0]?.columns || [];
  return columns.reduce((map, col) => {
    map[col.title] = col.id;
    return map;
  }, {});
}

async function ensureBoardColumns(apiKey, boardId, expectedColumns) {
  const existing = await getBoardColumns(apiKey, boardId);
  const result = { ...existing };

  for (const col of expectedColumns) {
    if (String(col.title).toLowerCase() === 'name') {
      result[col.title] = 'name';
      continue;
    }

    if (result[col.title]) {
      continue;
    }

    try {
      const query = `mutation($boardId:ID!,$title:String!,$type:ColumnType!){ create_column(board_id:$boardId,title:$title,column_type:$type){ id } }`;
      const data = await queryMondayWithRetry(apiKey, query, { boardId, title: col.title, type: col.type });
      result[col.title] = data.create_column.id;
      process.stdout.write(`   ✅ Created column "${col.title}" → ${data.create_column.id}\n`);
    } catch (e) {
      console.warn(`   ⚠️  Column "${col.title}" skipped or already exists: ${e.message}`);
    }

    await delay(200);
  }

  return result;
}

async function getExistingItemNames(apiKey, boardId) {
  const query = `query($boardId:[ID!]){ boards(ids:$boardId){ items_page(limit:500){ items{ name } } } }`;
  const data = await queryMondayWithRetry(apiKey, query, { boardId: [boardId] });
  const items = data.boards?.[0]?.items_page?.items || [];
  return new Set(items.map((item) => normalizeText(item.name)));
}

async function createItemIfMissing(apiKey, boardId, itemName, columnValues, existingNames) {
  const normalized = normalizeText(itemName);
  if (existingNames.has(normalized)) {
    return { skipped: true };
  }

  await queryMondayWithRetry(apiKey, `
    mutation($boardId: ID!, $name: String!, $vals: JSON) {
      create_item(board_id: $boardId, item_name: $name, column_values: $vals) { id }
    }
  `, { boardId, name: itemName, vals: JSON.stringify(columnValues) });

  existingNames.add(normalized);
  return { skipped: false };
}

function determineItemName(row, fileName, rowIndex) {
  const fileKey = fileName.toLowerCase();
  if (fileKey.includes('deal tracker')) {
    const dealName = normalizeText(row['Deal Name'] || row['Deal name'] || row['DealName']);
    const client = normalizeText(row['Client Code'] || row['Client code'] || row['ClientCode']);
    if (dealName && client) {
      return `${dealName} (${client})`;
    }
    if (dealName) {
      return dealName;
    }
    if (client) {
      return `Deal ${client}`;
    }
  }

  if (fileKey.includes('work_order_tracker') || fileKey.includes('work order tracker')) {
    const serial = normalizeText(row['Serial #'] || row['Serial']);
    const dealMasked = normalizeText(row['Deal name masked'] || row['Deal Name Masked'] || row['Deal Name'] || row['Deal']);
    if (serial) return serial;
    if (dealMasked) return dealMasked;
  }

  const fallback = Object.values(row).find((value) => normalizeText(value));
  if (fallback) return normalizeText(fallback);
  return `${path.basename(fileName)} Row ${rowIndex + 1}`;
}

function buildColumnDefinitions(headers, rows) {
  return headers.map((title) => {
    const sample = rows.slice(0, 10).map((row) => row[title]);
    const type = inferColumnType(title, sample);
    return { title, type };
  });
}

function findDuplicateCsvFiles() {
  const files = fs.readdirSync(process.cwd()).filter((f) => f.toLowerCase().endsWith('.csv'));
  const lower = files.map((file) => file.toLowerCase());
  const duplicates = lower.filter((item, index) => lower.indexOf(item) !== index);
  return [...new Set(duplicates)];
}

async function seedCsvBoard(apiKey, csvPath, boardName, boardIdFromEnv) {
  const csv = readCsvFile(csvPath);
  const rows = parseCsv(csv);
  const headers = rows.length > 0 ? Object.keys(rows[0]).map((h) => normalizeText(h)).filter(Boolean) : [];
  if (headers.length === 0) {
    throw new Error(`CSV file ${csvPath} has no headers or contains only blank rows.`);
  }

  const boardId = boardIdFromEnv || await createBoardIfMissing(apiKey, boardName);
  console.log(`   ✅ Using board "${boardName}" (ID: ${boardId})`);

  const columns = buildColumnDefinitions(headers.filter((h) => h.toLowerCase() !== 'name'), rows);
  const allColumns = [{ title: 'Name', type: 'text' }, ...columns];
  const columnMap = await ensureBoardColumns(apiKey, boardId, allColumns);

  const existingNames = await getExistingItemNames(apiKey, boardId);
  let pushed = 0;
  let skipped = 0;
  let failed = 0;

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const itemName = determineItemName(row, csvPath, index);
    const columnValues = {};

    for (const header of headers) {
      const normalizedHeader = normalizeText(header);
      if (!normalizedHeader || normalizedHeader.toLowerCase() === 'name') {
        continue;
      }
      const colId = columnMap[normalizedHeader];
      if (!colId) {
        continue;
      }

      const rawValue = normalizeText(row[header]);
      if (rawValue === '') {
        continue;
      }

      const columnType = columns.find((col) => col.title === normalizedHeader)?.type || 'text';
      if (columnType === 'numbers') {
        const numeric = parseNumber(rawValue);
        if (numeric !== null) {
          columnValues[colId] = numeric;
          continue;
        }
      }

      columnValues[colId] = rawValue;
    }

    try {
      const result = await createItemIfMissing(apiKey, boardId, itemName, columnValues, existingNames);
      if (result.skipped) {
        skipped += 1;
      } else {
        pushed += 1;
      }
    } catch (err) {
      failed += 1;
      if (failed <= 10) {
        console.warn(`   ⚠️  Row ${index + 1} ("${itemName}") failed: ${err.message}`);
      }
    }

    await delay(ITEM_DELAY_MS);
    if ((index + 1) % 25 === 0 || index === rows.length - 1) {
      console.log(`   → ${index + 1}/${rows.length} rows processed (✅ ${pushed}  🔁 ${skipped}  ❌ ${failed})`);
    }
  }

  return { boardId, rowsCount: rows.length, pushed, skipped, failed };
}

async function seedMondayWorkspace(apiKey) {
  console.log('🚀 Starting Monday.com CSV ingestion pipeline...');

  const env = loadEnv();
  const duplicateCsvFiles = findDuplicateCsvFiles();
  if (duplicateCsvFiles.length > 0) {
    console.warn(`⚠️ Found duplicate CSV file names in workspace: ${duplicateCsvFiles.join(', ')}`);
  }

  try {
    const meData = await queryMondayWithRetry(apiKey, `query { me { name email } }`);
    console.log(`✅ Authenticated as ${meData.me.name} (${meData.me.email})\n`);
  } catch (err) {
    console.error('❌ Failed to authenticate with Monday.com API Key:', err.message);
    process.exit(1);
  }

  const files = [
    {
      csvPath: 'Deal funnel Data.xlsx - Deal tracker.csv',
      boardName: 'Deals - Sales Pipeline',
      boardId: env.VITE_DEALS_BOARD_ID || ''
    },
    {
      csvPath: 'Work_Order_Tracker Data.xlsx - work order tracker.csv',
      boardName: 'Work Orders - Execution',
      boardId: env.VITE_WORK_ORDERS_BOARD_ID || ''
    }
  ];

  for (const file of files) {
    console.log(`\n📌 Importing CSV file: ${file.csvPath}`);
    try {
      const result = await seedCsvBoard(apiKey, file.csvPath, file.boardName, file.boardId);
      console.log(`✅ ${file.csvPath} → board ${result.boardId}: ${result.rowsCount} rows processed, ${result.pushed} pushed, ${result.skipped} skipped, ${result.failed} failed.`);
    } catch (err) {
      console.error(`❌ Failed to import ${file.csvPath}: ${err.message}`);
    }
  }

  console.log('\n🎉 CSV ingestion complete.');
}

const env = loadEnv();
const apiKey = process.argv[2] || env.VITE_MONDAY_API_KEY;
if (!apiKey) {
  console.error('Usage: node scripts/seedMondayBoards.cjs <YOUR_MONDAY_API_KEY>');
  process.exit(1);
}

seedMondayWorkspace(apiKey);
