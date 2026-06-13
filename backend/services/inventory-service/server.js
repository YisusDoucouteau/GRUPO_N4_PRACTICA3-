const app = require('./src/app');
require('dotenv').config();

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Inventory Service ejecutándose en http://localhost:${PORT}`);
});
