/**
 * Configuration settings for the application
 * These values can be overridden by environment variables
 */

module.exports = {
  // JWT settings
  jwt: {
    secret: process.env.JWT_SECRET || 'cyber-hunter-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  },
  
  // Email verification
  emailVerification: {
    expiresIn: process.env.EMAIL_VERIFICATION_EXPIRES_IN || 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // Password reset
  passwordReset: {
    expiresIn: process.env.PASSWORD_RESET_EXPIRES_IN || 60 * 60 * 1000, // 1 hour
  },
  
  // Email service
  email: {
    from: process.env.EMAIL_FROM || 'noreply@cyberhunter.com',
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  },
  
  // File upload
  upload: {
    maxSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  
  // Pagination
  pagination: {
    defaultLimit: process.env.DEFAULT_PAGINATION_LIMIT || 10,
    maxLimit: process.env.MAX_PAGINATION_LIMIT || 100,
  },
};