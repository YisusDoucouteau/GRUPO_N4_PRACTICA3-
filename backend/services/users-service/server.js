require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 3008;

app.listen(PORT, () => {
  console.log(`Users Service ejecutándose en http://localhost:${PORT}`);
});
