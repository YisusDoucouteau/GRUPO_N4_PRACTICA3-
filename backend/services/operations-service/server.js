require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 3007;

app.listen(PORT, () => {
  console.log(`Operations Service ejecutándose en http://localhost:${PORT}`);
});
