const express = require('express');
const router = express.Router();
const { generateStudyMaterial } = require('../services/openai');
const { validateTextAnalysis } = require('../middleware/validate');
const { ipRateLimiter, creditRateLimiter } = require('../middleware/rateLimit');

// Handles POST /api/generate and POST /api/study/generate
router.post('/generate', ipRateLimiter, creditRateLimiter, validateTextAnalysis, async (req, res) => {
  try {
    const { text } = req.body;
    const results = await generateStudyMaterial(text);
    res.json(results);
  } catch (error) {
    console.error('Study Material Generation Route Error:', error);
    const status = error.status || 500;
    res.status(status).json({
      status,
      message: error.message || 'An error occurred during study material generation'
    });
  }
});

module.exports = router;
