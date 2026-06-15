require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 3006;

app.listen(PORT, () => {
  console.log(`Billing Service ejecutándose en http://localhost:${PORT}`);
});
