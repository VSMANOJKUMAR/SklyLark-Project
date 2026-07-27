const fs = require('fs');
const apiKey = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjY4NjY0NjUwNCwiYWFpIjoxMSwidWlkIjoxMTE1MTI3OTgsImlhZCI6IjIwMjYtMDctMjdUMDU6MDU6MzguNjg3WiIsInBlciI6Im1lOndyaXRlIiwiYWN0aWQiOjM2MjI0ODA4LCJyZ24iOiJhcHNlMiJ9.u_LJw00_PUODKMrA3JQA1NNlBRBIq53ajAImBL9cD4k';
const query = `query GetBoard($boardId: [ID!]) { boards(ids: $boardId) { id name items_page(limit: 350) { items { id name column_values { id title text } } } } }`;
(async () => {
  const res = await fetch('https://api.monday.com/v2',{method:'POST',headers:{'Content-Type':'application/json','Authorization':apiKey,'API-Version':'2023-10'},body:JSON.stringify({query,variables:{boardId:['5030220453']}})});
  const data = await res.json();
  const items = data.data.boards[0].items_page.items;
  const counts = items.reduce((acc,item)=>{
    const sector = item.column_values.find(cv=>cv.title==='Sector')?.text || '';
    acc[sector||'EMPTY'] = (acc[sector||'EMPTY']||0)+1;
    return acc;
  },{});
  console.log(counts);
})();
