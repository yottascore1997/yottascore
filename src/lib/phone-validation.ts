/**
 * Phone number validation utilities for Indian phone numbers
 */

/**
 * Validate Indian phone number
 * Accepts formats: +919876543210, 919876543210, 9876543210
 */
export function isValidIndianPhoneNumber(phoneNumber: string): boolean {
  // Remove all spaces and special characters except +
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Indian phone number regex
  // Starts with 6-9, followed by 9 digits
  const indianPhoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
  
  return indianPhoneRegex.test(cleaned);
}

/**
 * Format phone number to E.164 format (+919876543210)
 */
export function formatToE164(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Already in E.164 format
  if (cleaned.startsWith('+91')) {
    return cleaned;
  }
  
  // Has country code but no +
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  
  // Only 10 digits
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  throw new Error('Invalid phone number format');
}

/**
 * Sanitize phone number (remove all non-digits except +)
 */
export function sanitizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/[^\d+]/g, '');
}

/**
 * Check if phone number is a test number
 * Test numbers should not be allowed in production
 */
export function isTestPhoneNumber(phoneNumber: string): boolean {
  const testNumbers = [
    '+919999999999',
    '+911234567890',
    '+910000000000',
  ];
  
  const formatted = formatToE164(phoneNumber);
  return testNumbers.includes(formatted);
}

/**
 * Validate and format phone number
 * Returns formatted number or throws error
 */
export function validateAndFormatPhone(phoneNumber: string): string {
  const sanitized = sanitizePhoneNumber(phoneNumber);
  
  if (!isValidIndianPhoneNumber(sanitized)) {
    throw new Error('Invalid Indian phone number. Must be 10 digits starting with 6-9.');
  }
  
  // In production, block test numbers
  if (process.env.NODE_ENV === 'production' && isTestPhoneNumber(sanitized)) {
    throw new Error('Test phone numbers are not allowed in production.');
  }
  
  return formatToE164(sanitized);
}

