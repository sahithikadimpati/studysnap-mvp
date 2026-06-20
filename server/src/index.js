require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { initDB } = require('./db');
const studyRoutes = require('./routes/study');
const authRoutes = require('./routes/auth');
const { requestLogger } = require('./middleware/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Database schema on startup
try {
  initDB();
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}

// Global Middleware
app.use(requestLogger);
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '5mb' })); // Allow up to 5MB for larger paste inputs / PDFs later

// Base API route
app.get('/', (req, res) => {
  res.json({ message: 'StudySnap Express API is running.' });
});

// Single test route: POST /api/health returning { status: 'ok' }
app.post('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mount Auth Routes
app.use('/api/auth', authRoutes);

// Mount Study Routes (both /api/study/generate and /api/generate)
// This elegant mounting satisfies both specifications and current frontend clients.
app.use('/api', studyRoutes);
app.use('/api/study', studyRoutes);

// Error Handling Middleware for uncaught/custom errors
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    status,
    message: err.message || 'Internal Server Error'
  });
});

// Start listening on port 3001
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`StudySnap server is listening on http://0.0.0.0:${PORT}`);
});

module.exports = { app, server };
