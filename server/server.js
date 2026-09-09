require('dotenv').config();

const { validateEnv } = require('./config/validateEnv');

// Checked before anything else so a misconfigured deploy fails immediately and
// names the missing variable, rather than dying later on an opaque driver error.
validateEnv();

const connectDB = require('./config/db');
const createApp = require('./app');

const app = createApp();

connectDB();

const PORT = process.env.PORT || 5055;

app.listen(PORT, () => {
  console.log(`DevLens API running on port ${PORT}`);
});
