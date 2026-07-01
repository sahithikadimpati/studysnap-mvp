const { db } = require('../db');

/**
 * Check if a user has credits and reset daily credits if 24 hours have passed.
 * Returns the updated user row.
 */
function checkAndResetCredits(userId) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return null;

  const now = new Date();
  const resetAt = user.credits_reset_at ? new Date(user.credits_reset_at) : null;

  // If never reset, or reset time was more than 24 hours ago
  if (!resetAt || (now - resetAt) >= 24 * 60 * 60 * 1000) {
    const nextReset = now.toISOString();
    db.prepare('UPDATE users SET daily_credits = 10, credits_reset_at = ? WHERE id = ?')
      .run(nextReset, userId);
    
    // Return updated user
    return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  }

  return user;
}

/**
 * Check if user has sufficient credits.
 */
function hasCredits(userId) {
  const user = checkAndResetCredits(userId);
  if (!user) return false;
  return user.daily_credits > 0;
}

/**
 * Consume 1 credit from user.
 * Returns true if successful, false otherwise.
 */
function consumeCredit(userId) {
  const user = checkAndResetCredits(userId);
  if (!user || user.daily_credits <= 0) return false;

  const result = db.prepare('UPDATE users SET daily_credits = daily_credits - 1 WHERE id = ? AND daily_credits > 0')
    .run(userId);

  return result.changes > 0;
}

module.exports = {
  checkAndResetCredits,
  hasCredits,
  consumeCredit
};
