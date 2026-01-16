/**
 * Plinko Backend Server
 *
 * Express.js API server for provably fair Plinko game.
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// =============================================================================
// Middleware
// =============================================================================

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, same-origin)
    if (!origin) {
      return callback(null, true);
    }

    // Allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // Check exact match
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow Vercel deployments
    try {
      const host = new URL(origin).hostname;
      if (host.endsWith('.vercel.app')) {
        return callback(null, true);
      }
    } catch {
      // Invalid URL, fall through to rejection
    }

    callback(new Error('CORS: Origin not allowed'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('public'));

// =============================================================================
// Routes
// =============================================================================

app.use('/api/rounds', require('./routes/rounds'));
app.use('/api/verify', require('./routes/verify'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// =============================================================================
// Error Handling
// =============================================================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// =============================================================================
// Start Server
// =============================================================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     Plinko Backend Server              ║
╠════════════════════════════════════════╣
║  Port: ${PORT}                            ║
║  Mode: ${(process.env.NODE_ENV || 'development').padEnd(28)}║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
