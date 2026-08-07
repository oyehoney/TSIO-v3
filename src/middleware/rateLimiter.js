'use strict';
const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for public form submissions (opportunity + contribution).
 * Limit: 5 requests per IP per hour — per FRD F05 §Validation and F06 §Validation.
 */
const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour in ms (3600000)
  max: 5,
  standardHeaders: true,   // Return rate limit info in X-RateLimit-* headers
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: true, // Don't count failed requests (422 validation errors, etc.) toward limit
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many submissions. Please wait before submitting again.'
      }
    });
  }
});

/**
 * Rate limiter for engagement requests.
 * Limit: 10 requests per IP per hour — per FRD F07 §Validation.
 */
const engagementLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour in ms (3600000)
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: true, // Don't count failed requests toward limit
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please wait before submitting again.'
      }
    });
  }
});

module.exports = { submissionLimiter, engagementLimiter };
