/**
 * Cryptographic utilities for password hashing and verification
 */

/**
 * Hash a password using Web Crypto API
 */
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    256
  );

  const hash = new Uint8Array(bits);
  const combined = new Uint8Array(salt.length + hash.length);
  combined.set(salt);
  combined.set(hash, salt.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password, hashedPassword) {
  try {
    const combined = new Uint8Array(atob(hashedPassword).split('').map(char => char.charCodeAt(0)));
    const salt = combined.slice(0, 16);
    const hash = combined.slice(16);

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      key,
      256
    );

    const newHash = new Uint8Array(bits);
    
    // Constant-time comparison
    if (hash.length !== newHash.length) return false;
    
    let result = 0;
    for (let i = 0; i < hash.length; i++) {
      result |= hash[i] ^ newHash[i];
    }
    
    return result === 0;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate API key
 */
export function generateApiKey() {
  const prefix = 'itera_';
  const token = generateSecureToken(24);
  return prefix + token;
}

/**
 * Hash API key for storage
 */
export async function hashApiKey(apiKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return btoa(String.fromCharCode(...hashArray));
}

/**
 * Verify API key against hash
 */
export async function verifyApiKey(apiKey, hashedApiKey) {
  try {
    const newHash = await hashApiKey(apiKey);
    return newHash === hashedApiKey;
  } catch (error) {
    console.error('API key verification error:', error);
    return false;
  }
}