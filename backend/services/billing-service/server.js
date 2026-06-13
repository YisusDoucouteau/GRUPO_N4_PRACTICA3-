const app = require('./src/app');
require('dotenv').config();

const PORT = process.env.PORT || 3006;

app.listen(PORT, () => {
  console.log(`Billing Service ejecutándose en http://localhost:${PORT}`);
});
