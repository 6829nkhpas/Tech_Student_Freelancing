const nodemailer = require('nodemailer');
const config = require('../config/config');

/**
 * Create a nodemailer transporter
 * @returns {Object} Nodemailer transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: config.email.service,
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465, // true for 465, false for other ports
    auth: {
      user: config.email.auth.user,
      pass: config.email.auth.pass,
    },
  });
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email
 * @param {String} options.subject - Email subject
 * @param {String} options.text - Plain text content
 * @param {String} options.html - HTML content
 * @returns {Promise} Email sending result
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: config.email.from,
      to: options.to,
      subject: options.subject,
      text: options.text || '',
      html: options.html || '',
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Email could not be sent');
  }
};

/**
 * Send a verification email
 * @param {String} email - Recipient email
 * @param {String} name - Recipient name
 * @param {String} token - Verification token
 * @returns {Promise} Email sending result
 */
const sendVerificationEmail = async (email, name, token) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Verify Your Email</h2>
      <p>Hello ${name},</p>
      <p>Thank you for registering with Cyber Hunter. Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
      </div>
      <p>If the button doesn't work, you can also click on the link below or copy and paste it into your browser:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not create an account, please ignore this email.</p>
      <p>Best regards,<br>The Cyber Hunter Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify Your Email - Cyber Hunter',
    html,
  });
};

/**
 * Send a password reset email
 * @param {String} email - Recipient email
 * @param {String} name - Recipient name
 * @param {String} token - Reset token
 * @returns {Promise} Email sending result
 */
const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Reset Your Password</h2>
      <p>Hello ${name},</p>
      <p>You are receiving this email because you (or someone else) has requested to reset your password.</p>
      <p>Please click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
      </div>
      <p>If the button doesn't work, you can also click on the link below or copy and paste it into your browser:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <p>Best regards,<br>The Cyber Hunter Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Password Reset - Cyber Hunter',
    html,
  });
};

/**
 * Send a notification email
 * @param {String} email - Recipient email
 * @param {String} name - Recipient name
 * @param {String} subject - Email subject
 * @param {String} message - Email message
 * @param {String} actionUrl - Action URL
 * @param {String} actionText - Action button text
 * @returns {Promise} Email sending result
 */
const sendNotificationEmail = async (email, name, subject, message, actionUrl, actionText) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${subject}</h2>
      <p>Hello ${name},</p>
      <p>${message}</p>
      ${actionUrl && actionText ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${actionUrl}" style="background-color: #673AB7; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">${actionText}</a>
        </div>
        <p>If the button doesn't work, you can also click on the link below or copy and paste it into your browser:</p>
        <p><a href="${actionUrl}">${actionUrl}</a></p>
      ` : ''}
      <p>Best regards,<br>The Cyber Hunter Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
};