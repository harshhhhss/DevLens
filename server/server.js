require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

connectDB();

// CLIENT_URL accepts a comma-separated list so the deployed frontend, Vercel
// preview deployments and local development can all be allowed at once.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header (curl, health checks, server-to-server)
      // are not subject to CORS, so let them through.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'devlens-api' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/review', reviewRoutes);

app.use(notFound);
app.use(errorHandler);

// Matches .env.example. Deliberately not 5000, which is a common default and
// collides with other local services.
const PORT = process.env.PORT || 5055;

app.listen(PORT, () => {
  console.log(`DevLens API running on port ${PORT}`);
});
