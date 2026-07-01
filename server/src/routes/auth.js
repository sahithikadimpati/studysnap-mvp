const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

/**
 * POST /api/auth/signup
 * Register a new user with email, password, and name
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // 1. Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        status: 400,
        message: 'Email, password, and name are all required.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      return res.status(400).json({
        status: 400,
        message: 'Invalid email address.'
      });
    }

    // 2. Check if user already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanedEmail(trimmedEmail));
    if (existingUser) {
      return res.status(400).json({
        status: 400,
        message: 'A user with this email address already exists.'
      });
    }

    // 3. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Create new user
    const userId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, email, name, password_hash, daily_credits, credits_reset_at)
      VALUES (?, ?, ?, ?, 50, ?)
    `).run(userId, cleanedEmail(trimmedEmail), name.trim(), passwordHash, new Date().toISOString());

    // 5. Generate session JWT token
    const token = jwt.sign({ userId, email: trimmedEmail }, JWT_SECRET, { expiresIn: '24h' });

    // 6. Store session in sessions table
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours expiry
    db.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(sessionId, userId, token, expiresAt);

    // 7. Return user details and token
    const user = db.prepare('SELECT id, email, name, daily_credits, created_at FROM users WHERE id = ?').get(userId);
    res.status(201).json({
      status: 201,
      user,
      token
    });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({
      status: 500,
      message: 'Failed to create user account. Please try again.'
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate existing user with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 400,
        message: 'Email and password are required.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // 1. Fetch user by email
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanedEmail(trimmedEmail));
    if (!user || !user.password_hash) {
      return res.status(401).json({
        status: 401,
        message: 'Invalid email or password.'
      });
    }

    // 2. Compare password hashes
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        status: 401,
        message: 'Invalid email or password.'
      });
    }

    // 3. Generate session JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    // 4. Store session in sessions table
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    db.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(sessionId, user.id, token, expiresAt);

    // 5. Return user details and token
    const userResult = {
      id: user.id,
      email: user.email,
      name: user.name,
      daily_credits: user.daily_credits,
      avatar_url: user.avatar_url,
      created_at: user.created_at
    };

    res.json({
      status: 200,
      user: userResult,
      token
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      status: 500,
      message: 'Failed to sign in. Please try again.'
    });
  }
});

/**
 * POST /api/auth/google
 * Sign in/Up with Google OAuth Credential token
 */
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        status: 400,
        message: 'Google credential token is required.'
      });
    }

    // Decode Google ID token (which is a JWT token)
    const decoded = jwt.decode(credential);
    if (!decoded || !decoded.email) {
      return res.status(400).json({
        status: 400,
        message: 'Invalid Google credential token.'
      });
    }

    const { email, name, sub: google_id, picture: avatar_url } = decoded;
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Check if user already exists (by Google ID or Email)
    let user = db.prepare('SELECT * FROM users WHERE google_id = ? OR email = ?').get(google_id, cleanedEmail(trimmedEmail));

    if (!user) {
      // 2. Create new Google user
      const userId = uuidv4();
      db.prepare(`
        INSERT INTO users (id, email, name, google_id, avatar_url, daily_credits, credits_reset_at)
        VALUES (?, ?, ?, ?, ?, 50, ?)
      `).run(userId, cleanedEmail(trimmedEmail), name, google_id, avatar_url, new Date().toISOString());

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    } else if (!user.google_id) {
      // 3. Link Google account to existing email account
      db.prepare('UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?')
        .run(google_id, avatar_url || user.avatar_url, user.id);
      
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    }

    // 4. Generate session JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    // 5. Store session in sessions table
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    db.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(sessionId, user.id, token, expiresAt);

    // 6. Return user details and token
    const userResult = {
      id: user.id,
      email: user.email,
      name: user.name,
      daily_credits: user.daily_credits,
      avatar_url: user.avatar_url,
      created_at: user.created_at
    };

    res.json({
      status: 200,
      user: userResult,
      token
    });
  } catch (error) {
    console.error('Google OAuth Error:', error);
    res.status(500).json({
      status: 500,
      message: 'Failed to authenticate with Google. Please try again.'
    });
  }
});

/**
 * POST /api/auth/logout
 * Invalidate session token
 */
router.post('/logout', authenticateToken, (req, res) => {
  try {
    // Delete session from sessions table
    db.prepare('DELETE FROM sessions WHERE token = ?').run(req.token);

    res.json({
      status: 200,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({
      status: 500,
      message: 'Failed to log out. Please try again.'
    });
  }
});

/**
 * GET /api/auth/me
 * Fetch authenticated user profile
 */
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, name, google_id, avatar_url, daily_credits, created_at FROM users WHERE id = ?').get(req.userId);
    
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: 'User profile not found.'
      });
    }

    res.json({
      status: 200,
      user
    });
  } catch (error) {
    console.error('Fetch Profile Error:', error);
    res.status(500).json({
      status: 500,
      message: 'Failed to fetch user profile.'
    });
  }
});

/**
 * DELETE /api/auth/account
 * Purge user account and cascade delete all related data
 */
router.delete('/account', authenticateToken, (req, res) => {
  try {
    // Enable foreign keys explicitly in the transaction context
    db.pragma('foreign_keys = ON');

    // Run deletes inside database transaction for safety
    const deleteTransaction = db.transaction((userId) => {
      // Cascade delete is supported by schema definitions, 
      // but to be absolutely explicit, we will wipe all user references.
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM study_history WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    });

    deleteTransaction(req.userId);

    res.json({
      status: 200,
      message: 'Your account and all related data have been permanently deleted.'
    });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(500).json({
      status: 500,
      message: 'Failed to delete account. Please try again.'
    });
  }
});

// Simple email cleaner utility
function cleanedEmail(email) {
  return email.trim().toLowerCase();
}

module.exports = router;
