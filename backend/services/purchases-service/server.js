const app = require('./src/app');
require('dotenv').config();

const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
  console.log(`Purchases Service ejecutándose en http://localhost:${PORT}`);
});
