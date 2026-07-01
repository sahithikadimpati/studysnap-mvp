const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for PDF uploads (5MB max, stored as buffer for processing)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['application/pdf'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed.'));
    }
  }
});

/**
 * POST /api/upload/pdf
 * Accept a PDF file, extract its text content, and return it.
 * Requires authentication.
 * 
 * Body: multipart/form-data with field name "file"
 * Returns: { status, text, filename, pages }
 */
router.post('/pdf', authenticateToken, (req, res) => {
  try {
    // Use multer's single file upload middleware inline
    const uploadSingle = upload.single('file');

    uploadSingle(req, res, async (uploadErr) => {
      if (uploadErr) {
        if (uploadErr.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            status: 413,
            message: 'File too large. Maximum size is 5MB.'
          });
        }
        return res.status(400).json({
          status: 400,
          message: uploadErr.message || 'File upload failed.'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          status: 400,
          message: 'No file uploaded. Please attach a PDF file with field name "file".'
        });
      }

      // Extract text from PDF buffer
      try {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(req.file.buffer);

        // Basic validation: ensure we got some text
        const extractedText = data.text || '';
        if (!extractedText.trim()) {
          return res.status(422).json({
            status: 422,
            message: 'Could not extract any text from this PDF. The file may be scanned or image-based.'
          });
        }

        // Truncate to 5000 chars for API consumption
        const truncatedText = extractedText.substring(0, 5000);

        res.json({
          status: 200,
          filename: req.file.originalname,
          text: truncatedText,
          pages: data.numpages || 1,
          fullLength: extractedText.length
        });
      } catch (parseErr) {
        console.error('PDF Parse Error:', parseErr);
        res.status(422).json({
          status: 422,
          message: 'Failed to parse PDF. The file may be corrupted or password-protected.'
        });
      }
    });
  } catch (error) {
    console.error('PDF Upload Route Error:', error);
    res.status(500).json({
      status: 500,
      message: 'Failed to process PDF upload.'
    });
  }
});

module.exports = router;