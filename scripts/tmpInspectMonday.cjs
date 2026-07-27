const fetch = globalThis.fetch || require('node-fetch');
const apiKey = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjY4NjY0NjUwNCwiYWFpIjoxMSwidWlkIjoxMTE1MTI3OTgsImlhZCI6IjIwMjYtMDctMjdUMDU6MDU6MzguNjg3WiIsInBlciI6Im1lOndyaXRlIiwiYWN0aWQiOjM2MjI0ODA4LCJyZ24iOiJhcHNlMiJ9.u_LJw00_PUODKMrA3JQA1NNlBRBIq53ajAImBL9cD4k';
const boardId = '5030220453';
(async () => {
  const query = `query GetBoard($boardId: [ID!]) { boards(ids: $boardId) { id name items_page(limit: 350) { items { id name column_values { id title text value } } } } }`;
  const res = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey,
      'API-Version': '2023-10'
    },
    body: JSON.stringify({ query, variables: { boardId: [boardId] } })
  });
  const data = await res.json();
  if (!data.data || !data.data.boards) {
    console.error('BAD response', JSON.stringify(data, null, 2));
    process.exit(1);
  }
  const items = data.data.boards[0].items_page.items;
  const counts = items.reduce((acc, item) => {
    const sectorCol = item.column_values.find(cv => cv.title === 'Sector');
    const sector = sectorCol?.text || sectorCol?.value || '';
    const cleaned = String(sector).trim() || 'EMPTY';
    acc[cleaned] = (acc[cleaned] || 0) + 1;
    return acc;
  }, {});
  console.log(counts);
  console.log('total', items.length);
})();
