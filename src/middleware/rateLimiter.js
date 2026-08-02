'use strict';
// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for public form submissions (opportunity + contribution).
 * Limit: 5 requests per IP per hour — per FRD F05 §Validation and F06 §Validation.
 * Returns 429 with X-RateLimit-* headers and Retry-After.
 */
const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour = 3600000 ms
  max: 5,
  standardHeaders: true,   // Returns X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    // Set Retry-After header in seconds (1 hour = 3600)
    res.setHeader('Retry-After', '3600');
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many submissions. Please wait before submitting again.'
      }
    });
  }
});

/**
 * Rate limiter for engagement requests (Wave 3c EngagementService).
 * Limit: 10 requests per IP per hour — per FRD F07 §Validation.
 */
const engagementLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour = 3600000 ms
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.setHeader('Retry-After', '3600');
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please wait before submitting again.'
      }
    });
  }
});

module.exports = { submissionLimiter, engagementLimiter };
