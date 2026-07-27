import { RawDeal, RawWorkOrder } from '../types';

const MONDAY_API_URL = 'https://api.monday.com/v2';

/**
 * Execute GraphQL query against Monday.com v2 API
 */
export async function queryMondayAPI(apiKey: string, query: string, variables: Record<string, any> = {}) {
  const response = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey,
      'API-Version': '2023-10'
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Monday API HTTP Error (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(`Monday GraphQL Error: ${json.errors[0].message}`);
  }

  return json.data;
}

/**
 * Test authentication token validity
 */
export async function testMondayConnection(apiKey: string): Promise<{ success: boolean; user?: { name: string; email: string }; error?: string }> {
  try {
    const data = await queryMondayAPI(apiKey, `query { me { name email } }`);
    return { success: true, user: data.me };
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed' };
  }
}

/**
 * Fetch all workspace boards for user selection
 */
export async function fetchUserBoards(apiKey: string): Promise<{ id: string; name: string; items_count: number }[]> {
  const query = `
    query {
      boards (limit: 50) {
        id
        name
        items_count
      }
    }
  `;
  const data = await queryMondayAPI(apiKey, query);
  return data.boards || [];
}

/**
 * Dynamically query raw items & column values from a specified Monday Board
 */
export async function fetchRawBoardItems(apiKey: string, boardId: string): Promise<Record<string, any>[]> {
  const query = `
    query GetBoardItems($boardId: [ID!]) {
      boards (ids: $boardId) {
        id
        name
        columns {
          id
          title
          type
        }
        items_page (limit: 500) {
          items {
            id
            name
            column_values {
              id
              text
              value
            }
          }
        }
      }
    }
  `;

  const data = await queryMondayAPI(apiKey, query, { boardId: [boardId] });
  const board = data.boards?.[0];
  if (!board) throw new Error(`Board ID ${boardId} not found`);

  const columnsMap: Record<string, string> = {};
  board.columns.forEach((col: any) => {
    columnsMap[col.id] = col.title;
  });

  const items = board.items_page?.items || [];
  
  const resolveColumnText = (cv: any) => {
    if (cv?.text && String(cv.text).trim()) {
      return String(cv.text).trim();
    }
    if (!cv?.value) {
      return '';
    }

    try {
      const parsed = JSON.parse(cv.value);
      if (!parsed) return '';

      if (typeof parsed === 'string') {
        return parsed.trim();
      }
      if (typeof parsed === 'object') {
        if (parsed.text && String(parsed.text).trim()) return String(parsed.text).trim();
        if (parsed.title && String(parsed.title).trim()) return String(parsed.title).trim();
        if (parsed.name && String(parsed.name).trim()) return String(parsed.name).trim();
        if (parsed.label && String(parsed.label).trim()) return String(parsed.label).trim();
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => item.name || item.text || '').filter(Boolean).join(', ').trim();
        }
      }
    } catch {
      return String(cv.value).trim();
    }

    return '';
  };

  return items.map((item: any) => {
    const row: Record<string, any> = {
      id: item.id,
      name: item.name
    };

    item.column_values.forEach((cv: any) => {
      const colTitle = columnsMap[cv.id] || cv.id;
      const valueText = resolveColumnText(cv);
      row[colTitle] = valueText;
      row[cv.id] = valueText;
    });

    return row;
  });
}

/**
 * Map raw board dynamic rows to standard RawDeal objects
 */
export function mapRowsToDeals(rows: Record<string, any>[]): RawDeal[] {
  return rows.map((r) => {
    // Fuzzy matching column names
    const getVal = (...keys: string[]) => {
      for (const k of keys) {
        for (const rowKey of Object.keys(r)) {
          if (rowKey.toLowerCase().includes(k.toLowerCase())) {
            return r[rowKey];
          }
        }
      }
      return '';
    };

    return {
      id: r.id || getVal('deal id', 'id'),
      name: r.name || getVal('deal name', 'name', 'title'),
      company: getVal('company', 'client', 'account'),
      sector: getVal('sector', 'industry', 'vertical'),
      product: getVal('product', 'product deal', 'offering', 'solution'),
      value: getVal('value', 'amount', 'deal value', 'revenue'),
      stage: getVal('stage', 'status', 'phase'),
      expectedCloseDate: getVal('close date', 'expected close', 'date'),
      owner: getVal('owner', 'assignee', 'rep', 'lead'),
      probability: getVal('probability', 'win rate', 'confidence'),
      notes: getVal('notes', 'comments', 'description')
    };
  });
}

/**
 * Map raw board dynamic rows to standard RawWorkOrder objects
 */
export function mapRowsToWorkOrders(rows: Record<string, any>[]): RawWorkOrder[] {
  return rows.map((r) => {
    const getVal = (...keys: string[]) => {
      for (const k of keys) {
        for (const rowKey of Object.keys(r)) {
          if (rowKey.toLowerCase().includes(k.toLowerCase())) {
            return r[rowKey];
          }
        }
      }
      return '';
    };

    return {
      id: r.id || getVal('wo id', 'work order id', 'id'),
      dealId: getVal('deal id', 'parent deal', 'deal'),
      projectName: r.name || getVal('project name', 'name', 'title'),
      client: getVal('client', 'company', 'account'),
      sector: getVal('sector', 'industry'),
      budget: getVal('budget', 'target budget', 'planned cost'),
      actualSpend: getVal('actual spend', 'actual cost', 'spend'),
      status: getVal('status', 'state', 'phase'),
      startDate: getVal('start date', 'start'),
      targetCompletion: getVal('target completion', 'due date', 'end date', 'target date'),
      projectLead: getVal('project lead', 'lead', 'owner', 'manager'),
      healthStatus: getVal('health', 'health status', 'risk'),
      milestonesComplete: getVal('milestone', 'progress')
    };
  });
}
