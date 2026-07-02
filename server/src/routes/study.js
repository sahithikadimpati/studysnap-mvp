const express = require('express');
const router = express.Router();
const { generateStudyMaterial } = require('../services/gemini');
const { validateTextAnalysis } = require('../middleware/validate');
const { ipRateLimiter, creditRateLimiter } = require('../middleware/rateLimit');

// POST /api/generate and POST /api/study/generate
router.post('/generate', ipRateLimiter, creditRateLimiter, validateTextAnalysis, async (req, res) => {
  try {
    const { text } = req.body;
    const results = await generateStudyMaterial(text);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Study Generation Error:', error);
    const status = error.status || 500;
    res.status(status).json({ success: false, error: error.message || 'An error occurred during study material generation' });
  }
});

module.exports = router;