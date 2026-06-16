const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../database.sqlite');

// Ensure parent directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign key support
db.pragma('foreign_keys = ON');

// Initialize database schema
function initDB() {
  // Users table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT,
      google_id TEXT,
      avatar_url TEXT,
      daily_credits INTEGER DEFAULT 10,
      credits_reset_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Sessions table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `).run();

  // Study history table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS study_history (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      input_type TEXT DEFAULT 'text',
      input_text TEXT,
      summary_json TEXT,
      explanation_json TEXT,
      questions_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    )
  `).run();

  console.log('Database tables initialized successfully.');
}

module.exports = {
  db,
  initDB
};
