const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/history
 * Fetch all study history entries for the authenticated user, newest first.
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const items = db.prepare(`
      SELECT id, user_id, input_type, input_text, summary_json, explanation_json, questions_json, created_at
      FROM study_history
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.userId);

    res.json({
      status: 200,
      items
    });
  } catch (error) {
    console.error('Fetch History Error:', error);
    res.status(500).json({
      status: 500,
      message: 'Failed to fetch study history.'
    });
  }
});

/**
 * POST /api/history
 * Save a new study history entry for the authenticated user.
 * Body: { input_text, input_type, summary_json, explanation_json, questions_json }
 */
router.post('/', authenticateToken, (req, res) => {
  try {
    const { input_text, input_type, summary_json, explanation_json, questions_json } = req.body;

    if (!input_text) {
      return res.status(400).json({
        status: 400,
        message: 'input_text is required.'
      });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO study_history (id, user_id, input_type, input_text, summary_json, explanation_json, questions_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.userId,
      input_type || 'text',
      input_text,
      summary_json || null,
      explanation_json || null,
      questions_json || null
    );

    const item = db.prepare('SELECT * FROM study_history WHERE id = ?').get(id);
    res.status(201).json({
      status: 201,
      item
    });
  } catch (error) {
    console.error('Save History Error:', error);
    res.status(500).json({
      status: 500,
      message: 'Failed to save study history.'
    });
  }
});

/**
 * DELETE /api/history/:id
 * Delete a specific history entry (only if owned by the authenticated user).
 */
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    // Verify the entry belongs to the current user
    const item = db.prepare('SELECT * FROM study_history WHERE id = ? AND user_id = ?').get(id, req.userId);
    if (!item) {
      return res.status(404).json({
        status: 404,
        message: 'History entry not found or not owned by you.'
      });
    }

    db.prepare('DELETE FROM study_history WHERE id = ?').run(id);

    res.json({
      status: 200,
      message: 'History entry deleted successfully.'
    });
  } catch (error) {
    console.error('Delete History Error:', error);
    res.status(500).json({
      status: 500,
      message: 'Failed to delete history entry.'
    });
  }
});

module.exports = router;