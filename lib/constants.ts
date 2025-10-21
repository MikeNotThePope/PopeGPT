// Security and validation constants

// File upload limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_ATTACHMENTS = 5;

// Allowed file types for uploads
export const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  // Code files
  'text/javascript',
  'text/html',
  'text/css',
  'application/json',
  'application/xml',
  'text/xml',
];

// Message limits
export const MAX_MESSAGE_LENGTH = 10000; // 10,000 characters

// API request limits
export const MAX_REQUEST_BODY_SIZE = 15 * 1024 * 1024; // 15MB (to account for base64 encoding overhead)

// Rate limiting (simple in-memory implementation)
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
export const RATE_LIMIT_MAX_REQUESTS = 20; // 20 requests per minute
