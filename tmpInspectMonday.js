const apiKey = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjY4NjY0NjUwNCwiYWFpIjoxMSwidWlkIjoxMTE1MTI3OTgsImlhZCI6IjIwMjYtMDctMjdUMDU6MDU6MzguNjg3WiIsInBlciI6Im1lOndyaXRlIiwiYWN0aWQiOjM2MjI0ODA4LCJyZ24iOiJhcHNlMiJ9.u_LJw00_PUODKMrA3JQA1NNlBRBIq53ajAImBL9cD4k';
const boardIds = ['5030220453', '5030220714'];
for (const boardId of boardIds) {
  const query = `query GetBoard($boardId: [ID!]) { boards(ids: $boardId) { id name columns { id title type } items_page(limit: 5) { items { id name column_values { id text value } } } } }`;
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
  console.log('BOARD', boardId, JSON.stringify(data, null, 2));
}
