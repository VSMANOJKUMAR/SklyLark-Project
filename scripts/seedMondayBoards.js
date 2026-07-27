import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MONDAY_API_URL = 'https://api.monday.com/v2';

async function queryMonday(apiKey, query, variables = {}) {
  const res = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey,
      'API-Version': '2023-10'
    },
    body: JSON.stringify({ query, variables })
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors[0].message);
  }
  return json.data;
}

async function seedMondayWorkspace(apiKey) {
  console.log('🚀 Starting Monday.com Board Creation and Ingestion Pipeline...');

  // 1. Verify API Key
  try {
    const meData = await queryMonday(apiKey, `query { me { name email } }`);
    console.log(`✅ Authenticated as ${meData.me.name} (${meData.me.email})`);
  } catch (err) {
    console.error('❌ Failed to authenticate with Monday.com API Key:', err.message);
    process.exit(1);
  }

  // 2. Read CSVs
  const dealsCsvPath = path.join(__dirname, '../Deal funnel Data.xlsx - Deal tracker.csv');
  const woCsvPath = path.join(__dirname, '../Work_Order_Tracker Data.xlsx - work order tracker.csv');
  const dealsCsv = fs.readFileSync(dealsCsvPath, 'utf8');
  const woCsv = fs.readFileSync(woCsvPath, 'utf8');

  const dealsData = Papa.parse(dealsCsv, { header: true, skipEmptyLines: true }).data;
  const woLines = woCsv.split('\n').slice(1).join('\n');
  const woData = Papa.parse(woLines, { header: true, skipEmptyLines: true }).data;

  console.log(`📊 Found ${dealsData.length} Deals and ${woData.length} Work Orders to push.`);

  // 3. Create Deals Board
  console.log('\n📌 Creating Deals Board on Monday.com...');
  const createDealsBoardRes = await queryMonday(apiKey, `
    mutation {
      create_board (board_name: "Deals - Sales Pipeline", board_kind: public) {
        id
      }
    }
  `);
  const dealsBoardId = createDealsBoardRes.create_board.id;
  console.log(`✅ Deals Board Created! Board ID: ${dealsBoardId}`);

  // Create columns on Deals board
  const dealsColumns = [
    { title: "Owner Code", type: "text" },
    { title: "Client Code", type: "text" },
    { title: "Sector", type: "text" },
    { title: "Deal Value", type: "numbers" },
    { title: "Stage", type: "status" },
    { title: "Tentative Close Date", type: "date" },
    { title: "Probability", type: "text" }
  ];

  const dealsColMap = {};
  for (const col of dealsColumns) {
    try {
      const colRes = await queryMonday(apiKey, `
        mutation ($boardId: ID!, $title: String!, $type: ColumnType!) {
          create_column (board_id: $boardId, title: $title, column_type: $type) {
            id
          }
        }
      `, { boardId: dealsBoardId, title: col.title, type: col.type });
      dealsColMap[col.title] = colRes.create_column.id;
    } catch (e) {
      console.log(`Note creating column ${col.title}: ${e.message}`);
    }
  }
  console.log('✅ Deals Board columns created.');

  // Push Deals Items
  console.log('⏳ Uploading Deal items into Monday.com (in batches)...');
  let dealsSuccess = 0;
  for (let i = 0; i < dealsData.length; i++) {
    const item = dealsData[i];
    const name = item['Deal Name'] || `Deal ${i + 1}`;
    const colVals = {};

    if (dealsColMap['Owner Code'] && item['Owner code']) colVals[dealsColMap['Owner Code']] = String(item['Owner code']);
    if (dealsColMap['Client Code'] && item['Client Code']) colVals[dealsColMap['Client Code']] = String(item['Client Code']);
    if (dealsColMap['Sector'] && item['Sector/service']) colVals[dealsColMap['Sector/service']] = String(item['Sector/service']);
    
    // Clean numeric deal value
    const rawVal = (item['Masked Deal value'] || '').replace(/[^0-9.]/g, '');
    if (dealsColMap['Deal Value'] && rawVal) colVals[dealsColMap['Deal Value']] = parseFloat(rawVal);

    try {
      await queryMonday(apiKey, `
        mutation ($boardId: ID!, $name: String!, $vals: JSON) {
          create_item (board_id: $boardId, item_name: $name, column_values: $vals) {
            id
          }
        }
      `, { boardId: dealsBoardId, name, vals: JSON.stringify(colVals) });
      dealsSuccess++;
    } catch (err) {
      console.warn(`Warning item ${name}: ${err.message}`);
    }

    if ((i + 1) % 20 === 0 || i === dealsData.length - 1) {
      console.log(`  • Pushed ${i + 1}/${dealsData.length} Deals...`);
    }
  }
  console.log(`✅ Uploaded ${dealsSuccess} Deals to Monday.com.`);

  // 4. Create Work Orders Board
  console.log('\n📌 Creating Work Orders Board on Monday.com...');
  const createWOBoardRes = await queryMonday(apiKey, `
    mutation {
      create_board (board_name: "Work Orders - Execution", board_kind: public) {
        id
      }
    }
  `);
  const woBoardId = createWOBoardRes.create_board.id;
  console.log(`✅ Work Orders Board Created! Board ID: ${woBoardId}`);

  // Create columns on Work Orders board
  const woColumns = [
    { title: "Parent Deal", type: "text" },
    { title: "Customer Code", type: "text" },
    { title: "Sector", type: "text" },
    { title: "Budget Amount", type: "numbers" },
    { title: "Billed Spend", type: "numbers" },
    { title: "Execution Status", type: "status" },
    { title: "Project Lead", type: "text" }
  ];

  const woColMap = {};
  for (const col of woColumns) {
    try {
      const colRes = await queryMonday(apiKey, `
        mutation ($boardId: ID!, $title: String!, $type: ColumnType!) {
          create_column (board_id: $boardId, title: $title, column_type: $type) {
            id
          }
        }
      `, { boardId: woBoardId, title: col.title, type: col.type });
      woColMap[col.title] = colRes.create_column.id;
    } catch (e) {
      console.log(`Note creating column ${col.title}: ${e.message}`);
    }
  }
  console.log('✅ Work Orders Board columns created.');

  // Push Work Order Items
  console.log('⏳ Uploading Work Order items into Monday.com...');
  let woSuccess = 0;
  for (let i = 0; i < woData.length; i++) {
    const item = woData[i];
    const name = item['Serial #'] || `WO-${i + 1}`;
    const colVals = {};

    if (woColMap['Parent Deal'] && item['Deal name masked']) colVals[woColMap['Parent Deal']] = String(item['Deal name masked']);
    if (woColMap['Customer Code'] && item['Customer Name Code']) colVals[woColMap['Customer Code']] = String(item['Customer Name Code']);
    if (woColMap['Sector'] && item['Sector']) colVals[woColMap['Sector']] = String(item['Sector']);

    const rawBudget = (item['Amount in Rupees (Excl of GST) (Masked)'] || '').replace(/[^0-9.]/g, '');
    if (woColMap['Budget Amount'] && rawBudget) colVals[woColMap['Budget Amount']] = parseFloat(rawBudget);

    const rawSpend = (item['Billed Value in Rupees (Excl of GST.) (Masked)'] || '').replace(/[^0-9.]/g, '');
    if (woColMap['Billed Spend'] && rawSpend) colVals[woColMap['Billed Spend']] = parseFloat(rawSpend);

    try {
      await queryMonday(apiKey, `
        mutation ($boardId: ID!, $name: String!, $vals: JSON) {
          create_item (board_id: $boardId, item_name: $name, column_values: $vals) {
            id
          }
        }
      `, { boardId: woBoardId, name, vals: JSON.stringify(colVals) });
      woSuccess++;
    } catch (err) {
      console.warn(`Warning item ${name}: ${err.message}`);
    }

    if ((i + 1) % 20 === 0 || i === woData.length - 1) {
      console.log(`  • Pushed ${i + 1}/${woData.length} Work Orders...`);
    }
  }
  console.log(`✅ Uploaded ${woSuccess} Work Orders to Monday.com.`);

  console.log('\n🎉 SUCCESS! All boards, columns, and items have been pushed to Monday.com!');
  console.log(`📋 Deals Board ID: ${dealsBoardId}`);
  console.log(`📋 Work Orders Board ID: ${woBoardId}`);
}

const userApiKey = process.argv[2];
if (!userApiKey) {
  console.log('Usage: node scripts/seedMondayBoards.js <YOUR_MONDAY_API_KEY>');
} else {
  seedMondayWorkspace(userApiKey);
}
