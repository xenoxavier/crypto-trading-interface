// Client-side data encryption and security utilities
import { webcrypto } from 'crypto';

// Use browser's built-in crypto API
const crypto = typeof window !== 'undefined' ? window.crypto : webcrypto;

interface EncryptedData {
  encrypted: string;
  iv: string;
  salt: string;
}

class SecurityManager {
  private static instance: SecurityManager;
  private encryptionKey: CryptoKey | null = null;

  private constructor() {}

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // Generate a unique device fingerprint for key derivation
  private async generateDeviceFingerprint(): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
      navigator.hardwareConcurrency || 1
    ].join('|');

    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Derive encryption key from device fingerprint
  private async deriveKey(salt: Uint8Array): Promise<CryptoKey> {
    const fingerprint = await this.generateDeviceFingerprint();
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(fingerprint),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt sensitive data
  async encryptData(data: any): Promise<string> {
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await this.deriveKey(salt);

      const encoder = new TextEncoder();
      const encodedData = encoder.encode(JSON.stringify(data));

      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encodedData
      );

      const encryptedData: EncryptedData = {
        encrypted: Array.from(new Uint8Array(encryptedBuffer))
          .map(b => b.toString(16).padStart(2, '0')).join(''),
        iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
        salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
      };

      return btoa(JSON.stringify(encryptedData));
    } catch (error) {
      console.error('Encryption failed:', error);
      // Fallback to base64 encoding if encryption fails
      return btoa(JSON.stringify(data));
    }
  }

  // Decrypt sensitive data
  async decryptData(encryptedString: string): Promise<any> {
    try {
      const encryptedData: EncryptedData = JSON.parse(atob(encryptedString));
      
      const salt = new Uint8Array(
        encryptedData.salt.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
      );
      const iv = new Uint8Array(
        encryptedData.iv.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
      );
      const encrypted = new Uint8Array(
        encryptedData.encrypted.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
      );

      const key = await this.deriveKey(salt);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      const decryptedString = decoder.decode(decryptedBuffer);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption failed:', error);
      // Fallback to base64 decoding if decryption fails
      try {
        return JSON.parse(atob(encryptedString));
      } catch (fallbackError) {
        return null;
      }
    }
  }

  // Obfuscate API keys and sensitive strings
  obfuscateString(str: string): string {
    if (!str || str.length < 8) return str;
    
    const start = str.slice(0, 4);
    const end = str.slice(-4);
    const middle = '*'.repeat(Math.max(str.length - 8, 4));
    
    return `${start}${middle}${end}`;
  }

  // Generate secure random session ID
  generateSessionId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Secure localStorage operations
  async setSecureItem(key: string, value: any): Promise<void> {
    const encryptedValue = await this.encryptData(value);
    localStorage.setItem(`enc_${key}`, encryptedValue);
  }

  async getSecureItem(key: string): Promise<any> {
    const encryptedValue = localStorage.getItem(`enc_${key}`);
    if (!encryptedValue) return null;
    return await this.decryptData(encryptedValue);
  }

  removeSecureItem(key: string): void {
    localStorage.removeItem(`enc_${key}`);
  }

  // Clear all encrypted data
  clearAllSecureData(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('enc_')) {
        localStorage.removeItem(key);
      }
    });
  }

  // Validate data integrity
  validateDataIntegrity(data: any): boolean {
    try {
      // Basic validation checks
      if (!data || typeof data !== 'object') return false;
      
      // Add specific validation rules for portfolio data
      if (data.portfolio) {
        if (!data.portfolio.id || !Array.isArray(data.portfolio.holdings)) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  // Anti-tampering check
  checkForTampering(): boolean {
    // Check if developer tools are open (basic detection)
    const start = performance.now();
    debugger; // This will pause if dev tools are open
    const end = performance.now();
    
    return (end - start) > 100; // Dev tools likely open if significant delay
  }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance();

// Utility functions for easy use
export const encryptSensitiveData = (data: any) => securityManager.encryptData(data);
export const decryptSensitiveData = (encrypted: string) => securityManager.decryptData(encrypted);
export const obfuscateApiKey = (key: string) => securityManager.obfuscateString(key);
export const setSecureStorage = (key: string, value: any) => securityManager.setSecureItem(key, value);
export const getSecureStorage = (key: string) => securityManager.getSecureItem(key);
export const clearSecureStorage = () => securityManager.clearAllSecureData();