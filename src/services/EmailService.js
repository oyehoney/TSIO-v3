'use strict';
// src/services/EmailService.js
const nodemailer = require('nodemailer');
const { getSettingValue } = require('./SettingsRepository');
const logger = require('../utils/logger');

/**
 * Send a routing notification email to the I&R team routing address.
 *
 * CRITICAL DESIGN CONTRACTS:
 * 1. Reads engagement_routing_email from hub_settings at call time (NOT cached at startup).
 *    This allows curators to change the routing address without restarting the application.
 * 2. NON-FATAL: any SMTP or configuration error is logged and swallowed.
 *    The caller (SubmissionService) must persist the record BEFORE calling this function.
 *    Email failure NEVER affects the HTTP response for the submission.
 *
 * @param {'opportunity_submission'|'contribution_submission'|'engagement_request'} type
 * @param {Object} payload - The record data to include in the notification
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
async function sendRoutingNotification(type, payload) {
  try {
    // Read routing email at call time (not cached — must be current from DB)
    const routingEmail = await getSettingValue('engagement_routing_email');
    if (!routingEmail) {
      logger.warn('[EmailService] engagement_routing_email not configured in hub_settings');
      return { success: false, error: 'ROUTING_EMAIL_NOT_CONFIGURED' };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      } : undefined
    });

    const subject = buildSubject(type, payload);
    const text = buildBody(type, payload);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@ao.uscourts.gov',
      to: routingEmail,
      subject,
      text
    });

    return { success: true };
  } catch (err) {
    // NON-FATAL: log and return failure without rethrowing
    // Submission/request record is already persisted — this is just a notification
    logger.error('[EmailService] Routing notification failed', {
      type,
      error: err.message,
      stack: err.stack
    });
    return { success: false, error: err.message };
  }
}

/**
 * Build email subject line based on notification type.
 */
function buildSubject(type, payload) {
  switch (type) {
    case 'opportunity_submission':
      return `[TSIO Hub] New Opportunity Submission — ${payload.mission_area || 'Unknown Area'}`;
    case 'contribution_submission':
      return `[TSIO Hub] New Contribution Submission — ${payload.contributing_office || 'Unknown Office'}`;
    case 'engagement_request':
      return `[TSIO Hub] New Engagement Request — ${payload.request_type || 'Unknown Type'}`;
    default:
      return '[TSIO Hub] New Notification';
  }
}

/**
 * Build plain-text email body. No HTML — limits formatting-based extraction of PII.
 * Per TechArch §5.4 sensitive data handling.
 */
function buildBody(type, payload) {
  const timestamp = new Date().toISOString();
  let body = `TSIO Innovation Hub — Routing Notification\n`;
  body += `Type: ${type}\n`;
  body += `Timestamp: ${timestamp}\n\n`;

  if (type === 'opportunity_submission') {
    body += `Submitter: ${payload.submitter_name} (${payload.submitter_email})\n`;
    body += `Office: ${payload.submitting_office}\n`;
    body += `Mission Area: ${payload.mission_area}\n\n`;
    body += `Problem Description:\n${payload.problem_description}\n\n`;
    if (payload.urgency_context) body += `Urgency Context:\n${payload.urgency_context}\n\n`;
    if (payload.known_constraints) body += `Known Constraints:\n${payload.known_constraints}\n\n`;
    body += `Admin Interface: ${process.env.APP_BASE_URL || 'http://localhost:3000'}/admin/submissions/opportunities`;
  } else if (type === 'contribution_submission') {
    body += `Contact: ${payload.contact_name} (${payload.contact_email})\n`;
    body += `Team: ${payload.contributing_team}\n`;
    body += `Office: ${payload.contributing_office}\n`;
    body += `Self-Assessed Maturity: ${payload.self_assessed_maturity}\n\n`;
    body += `Work Description:\n${payload.work_description}\n\n`;
    body += `Problem Addressed:\n${payload.problem_addressed}\n\n`;
    body += `Outcome Summary:\n${payload.outcome_summary}\n\n`;
    body += `Artifact URLs:\n${(payload.artifact_urls || []).join('\n')}\n\n`;
    body += `Admin Interface: ${process.env.APP_BASE_URL || 'http://localhost:3000'}/admin/submissions/contributions`;
  } else if (type === 'engagement_request') {
    body += `Request Type: ${payload.request_type}\n`;
    body += `Record ID: ${payload.record_id}\n`;
    body += `Requestor: ${payload.requestor_name} (${payload.requestor_email})\n`;
    body += `Office: ${payload.requestor_office}\n\n`;
    body += `Description of Interest:\n${payload.description_of_interest}\n\n`;
    if (payload.desired_next_step) body += `Desired Next Step:\n${payload.desired_next_step}\n\n`;
  }

  return body;
}

module.exports = { sendRoutingNotification };
