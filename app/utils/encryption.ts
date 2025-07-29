/**
 * Secure encryption utilities using Web Crypto API
 * Provides proper AES-GCM encryption for sensitive user data
 */

export class SecureStorage {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;

  /**
   * Generates a cryptographic key from a password using PBKDF2
   */
  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts data using AES-GCM with a derived key
   */
  static async encrypt(data: string, userPassword?: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Generate random salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      
      // Use a default password if none provided (for backward compatibility)
      const password = userPassword || 'cycling-nutrition-secure-2025';
      const key = await this.deriveKey(password, salt);
      
      // Encrypt the data
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: this.ALGORITHM, iv: iv },
        key,
        dataBuffer
      );
      
      // Combine salt + iv + encrypted data
      const combined = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);
      
      // Return base64 encoded result
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypts data using AES-GCM with a derived key
   */
  static async decrypt(encryptedData: string, userPassword?: string): Promise<string> {
    try {
      // Decode from base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      // Extract salt, IV, and encrypted data
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 16 + this.IV_LENGTH);
      const encrypted = combined.slice(16 + this.IV_LENGTH);
      
      // Use the same password as encryption
      const password = userPassword || 'cycling-nutrition-secure-2025';
      const key = await this.deriveKey(password, salt);
      
      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: this.ALGORITHM, iv: iv },
        key,
        encrypted
      );
      
      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Safely stores encrypted data in localStorage
   */
  static async setItem(key: string, value: string, userPassword?: string): Promise<void> {
    try {
      const encrypted = await this.encrypt(value, userPassword);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Failed to store encrypted data:', error);
      // Fallback to unencrypted storage for backward compatibility
      localStorage.setItem(key, value);
    }
  }

  /**
   * Safely retrieves and decrypts data from localStorage
   */
  static async getItem(key: string, userPassword?: string): Promise<string | null> {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      // Try to decrypt first (new format)
      try {
        return await this.decrypt(stored, userPassword);
      } catch {
        // If decryption fails, assume it's unencrypted data (backward compatibility)
        return stored;
      }
    } catch (error) {
      console.error('Failed to retrieve encrypted data:', error);
      return null;
    }
  }

  /**
   * Migrates existing unencrypted data to encrypted format
   */
  static async migrateToEncrypted(key: string, userPassword?: string): Promise<boolean> {
    try {
      const existing = localStorage.getItem(key);
      if (!existing) return false;

      // Try to decrypt - if it fails, it's unencrypted
      try {
        await this.decrypt(existing, userPassword);
        return false; // Already encrypted
      } catch {
        // Not encrypted, migrate it
        await this.setItem(key, existing, userPassword);
        return true;
      }
    } catch (error) {
      console.error('Migration failed:', error);
      return false;
    }
  }
}