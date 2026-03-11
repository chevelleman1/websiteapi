import crypto from 'crypto';

/**
 * Generate a secure random API key
 * @returns A 64-character hex string
 */
export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Generate and log a new key when this file is run directly
if (require.main === module) {
  console.log('Generated API Key:', generateApiKey());
}
