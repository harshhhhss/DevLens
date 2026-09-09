const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/authRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

/**
 * Builds the Express app without connecting to MongoDB or binding a port, so
 * tests can mount it with supertest. server.js owns startup side effects.
 */
function createApp() {
  const app = express();

  // Security headers. crossOriginResourcePolicy is relaxed because the API is
  // called from the frontend on a different origin.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

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

  return app;
}

module.exports = createApp;
