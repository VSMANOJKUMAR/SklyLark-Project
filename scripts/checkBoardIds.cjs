const apiKey = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjY4NjY0NjUwNCwiYWFpIjoxMSwidWlkIjoxMTE1MTI3OTgsImlhZCI6IjIwMjYtMDctMjdUMDU6MDU6MzguMDAwWiIsInBlciI6Im1lOndyaXRlIiwiYWN0aWQiOjM2MjI0ODA4LCJyZ24iOiJhcHNlMiJ9.ptpJ0-46arz80QXdSZUwdimn98nv-LLpgS2kM7e0MOM';
const ids = ['5030220453', '5030220714'];
const query = `query($ids:[ID!]){ boards(ids:$ids){ id name items_count columns{ id title type } items_page(limit:5){ items { id name column_values { id text value } } } } }`;

(async () => {
  try {
    const res = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
        'API-Version': '2023-10'
      },
      body: JSON.stringify({ query, variables: { ids } })
    });

    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('ERROR', error);
  }
})();
