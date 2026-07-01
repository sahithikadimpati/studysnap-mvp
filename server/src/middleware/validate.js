/**
 * Input validation middleware for StudySnap.
 */
function validateTextAnalysis(req, res, next) {
  let { text } = req.body;

  // 1. Check if text is present
  if (text === undefined || text === null) {
    return res.status(400).json({
      status: 400,
      message: 'Invalid input: "text" field is required.'
    });
  }

  if (typeof text !== 'string') {
    return res.status(400).json({
      status: 400,
      message: 'Invalid input: "text" must be a string.'
    });
  }

  // 2. Trim whitespace
  text = text.trim();

  // 3. Reject empty input
  if (text.length === 0) {
    return res.status(400).json({
      status: 400,
      message: 'Invalid input: "text" cannot be empty.'
    });
  }

  // 4. Reject text > 5000 chars
  if (text.length > 5000) {
    return res.status(400).json({
      status: 400,
      message: `Invalid input: Text exceeds the maximum limit of 5000 characters (current length: ${text.length}).`
    });
  }

  // 5. Sanitize text
  // Remove null bytes
  text = text.replace(/\0/g, '');

  // Strip potentially dangerous HTML script tags as standard safety precaution
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Save the sanitized text back to request body
  req.body.text = text;

  next();
}

module.exports = {
  validateTextAnalysis
};
