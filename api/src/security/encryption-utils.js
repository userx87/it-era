/**
 * Encryption Utilities for IT-ERA Security System
 * Provides secure encryption/decryption for sensitive data
 */

export class EncryptionManager {
  constructor(env) {
    this.env = env;
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.ivLength = 12; // 96 bits for GCM
  }

  /**
   * Generate a new encryption key
   */
  async generateKey() {
    return await crypto.subtle.generateKey(
      {
        name: this.algorithm,
        length: this.keyLength
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Import key from raw material
   */
  async importKey(keyMaterial) {
    const encoder = new TextEncoder();
    const keyData = typeof keyMaterial === 'string' 
      ? encoder.encode(keyMaterial)
      : keyMaterial;

    return await crypto.subtle.importKey(
      'raw',
      keyData.slice(0, 32), // Use first 32 bytes for AES-256
      {
        name: this.algorithm,
        length: this.keyLength
      },
      false, // not extractable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt sensitive data
   */
  async encrypt(plaintext, keyMaterial = null) {
    try {
      const encoder = new TextEncoder();
      const data = typeof plaintext === 'string' ? encoder.encode(plaintext) : plaintext;
      
      // Generate or use provided key
      const key = keyMaterial 
        ? await this.importKey(keyMaterial)
        : await this.importKey(this.env.ENCRYPTION_KEY || 'default-key-please-change-in-production');

      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
      
      // Encrypt data
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        data
      );

      // Combine IV and encrypted data
      const result = new Uint8Array(iv.length + encrypted.byteLength);
      result.set(iv, 0);
      result.set(new Uint8Array(encrypted), iv.length);

      // Return as base64
      return this.arrayBufferToBase64(result);

    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decrypt(encryptedData, keyMaterial = null) {
    try {
      // Convert from base64
      const data = this.base64ToArrayBuffer(encryptedData);
      
      // Extract IV and encrypted data
      const iv = data.slice(0, this.ivLength);
      const encrypted = data.slice(this.ivLength);

      // Import key
      const key = keyMaterial 
        ? await this.importKey(keyMaterial)
        : await this.importKey(this.env.ENCRYPTION_KEY || 'default-key-please-change-in-production');

      // Decrypt data
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        encrypted
      );

      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);

    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Hash data with salt
   */
  async hashWithSalt(data, salt = null) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Generate or use provided salt
    const saltBuffer = salt 
      ? encoder.encode(salt)
      : crypto.getRandomValues(new Uint8Array(16));

    // Combine data and salt
    const combined = new Uint8Array(dataBuffer.length + saltBuffer.length);
    combined.set(dataBuffer, 0);
    combined.set(saltBuffer, dataBuffer.length);

    // Hash the combination
    const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    
    return {
      hash: this.arrayBufferToHex(hashBuffer),
      salt: this.arrayBufferToHex(saltBuffer)
    };
  }

  /**
   * Verify hashed data
   */
  async verifyHash(data, hash, salt) {
    const result = await this.hashWithSalt(data, this.hexToString(salt));
    return result.hash === hash;
  }

  /**
   * Generate secure random string
   */
  generateSecureRandom(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Encrypt session data
   */
  async encryptSessionData(sessionData) {
    const serialized = JSON.stringify(sessionData);
    return await this.encrypt(serialized);
  }

  /**
   * Decrypt session data
   */
  async decryptSessionData(encryptedSessionData) {
    const decrypted = await this.decrypt(encryptedSessionData);
    return JSON.parse(decrypted);
  }

  /**
   * Encrypt user PII
   */
  async encryptPII(piiData, userKey = null) {
    const keyMaterial = userKey || this.generateUserSpecificKey(piiData.userId);
    const serialized = JSON.stringify(piiData);
    return await this.encrypt(serialized, keyMaterial);
  }

  /**
   * Decrypt user PII
   */
  async decryptPII(encryptedPII, userId, userKey = null) {
    const keyMaterial = userKey || this.generateUserSpecificKey(userId);
    const decrypted = await this.decrypt(encryptedPII, keyMaterial);
    return JSON.parse(decrypted);
  }

  /**
   * Generate user-specific encryption key
   */
  generateUserSpecificKey(userId) {
    const baseKey = this.env.ENCRYPTION_KEY || 'default-key';
    const userSalt = `user_${userId}_salt`;
    
    // Simple key derivation - in production, use PBKDF2 or similar
    return this.simpleKeyDerivation(baseKey, userSalt);
  }

  /**
   * Simple key derivation function
   */
  async simpleKeyDerivation(baseKey, salt) {
    const encoder = new TextEncoder();
    const baseKeyBuffer = encoder.encode(baseKey);
    const saltBuffer = encoder.encode(salt);
    
    // Import base key
    const importedKey = await crypto.subtle.importKey(
      'raw',
      baseKeyBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive key using PBKDF2
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256'
      },
      importedKey,
      {
        name: this.algorithm,
        length: this.keyLength
      },
      false,
      ['encrypt', 'decrypt']
    );

    return derivedKey;
  }

  /**
   * Utility functions
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  arrayBufferToHex(buffer) {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  hexToString(hex) {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
  }

  /**
   * Secure data wipe
   */
  async secureWipe(data) {
    if (typeof data === 'string') {
      // Overwrite string data
      return '0'.repeat(data.length);
    } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
      // Overwrite binary data
      const view = new Uint8Array(data);
      crypto.getRandomValues(view);
      view.fill(0);
    }
  }

  /**
   * Data integrity verification
   */
  async generateIntegrityHash(data) {
    const encoder = new TextEncoder();
    const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return this.arrayBufferToHex(hashBuffer);
  }

  async verifyIntegrity(data, expectedHash) {
    const actualHash = await this.generateIntegrityHash(data);
    return actualHash === expectedHash;
  }

  /**
   * Encrypt with authentication (AEAD)
   */
  async encryptWithAuth(plaintext, additionalData = '', keyMaterial = null) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);
      const authData = encoder.encode(additionalData);
      
      const key = keyMaterial 
        ? await this.importKey(keyMaterial)
        : await this.importKey(this.env.ENCRYPTION_KEY || 'default-key');

      const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
      
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv,
          additionalData: authData
        },
        key,
        data
      );

      // Combine IV and encrypted data
      const result = new Uint8Array(iv.length + encrypted.byteLength);
      result.set(iv, 0);
      result.set(new Uint8Array(encrypted), iv.length);

      return this.arrayBufferToBase64(result);

    } catch (error) {
      console.error('Authenticated encryption error:', error);
      throw new Error('Authenticated encryption failed');
    }
  }

  /**
   * Decrypt with authentication verification
   */
  async decryptWithAuth(encryptedData, additionalData = '', keyMaterial = null) {
    try {
      const encoder = new TextEncoder();
      const authData = encoder.encode(additionalData);
      const data = this.base64ToArrayBuffer(encryptedData);
      
      const iv = data.slice(0, this.ivLength);
      const encrypted = data.slice(this.ivLength);

      const key = keyMaterial 
        ? await this.importKey(keyMaterial)
        : await this.importKey(this.env.ENCRYPTION_KEY || 'default-key');

      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv,
          additionalData: authData
        },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);

    } catch (error) {
      console.error('Authenticated decryption error:', error);
      throw new Error('Authenticated decryption failed');
    }
  }
}

export default EncryptionManager;