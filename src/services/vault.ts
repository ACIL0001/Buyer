import { Capacitor } from '@capacitor/core';

// Helper to get an encryption key derived from device/environment characteristics
const getEncryptionKey = async (): Promise<CryptoKey> => {
  const keyMaterial = `mazad_${navigator.userAgent}_${window.location.origin}`;
  const encoder = new TextEncoder();
  const rawKey = await crypto.subtle.digest('SHA-256', encoder.encode(keyMaterial));
  return crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
};

// Encrypt data before storage
const encrypt = async (data: string): Promise<string> => {
  if (typeof crypto === 'undefined' || !crypto.subtle) return data;
  try {
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
    
    // Combine IV and ciphertext into one base64 string
    const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode.apply(null, Array.from(combined)));
  } catch {
    return data; // Fallback
  }
};

// Decrypt data from storage
const decrypt = async (data: string): Promise<string> => {
  if (typeof crypto === 'undefined' || !crypto.subtle) return data;
  try {
    // Check if it looks like our base64 encrypted format
    if (!/^[A-Za-z0-9+/=]+$/.test(data)) return data;
    
    const key = await getEncryptionKey();
    const combined = new Uint8Array(atob(data).split('').map(c => c.charCodeAt(0)));
    
    // Ensure we have at least an IV
    if (combined.length <= 12) return data;
    
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
    return new TextDecoder().decode(decrypted);
  } catch {
    return data; // Fallback: return raw data (handles unencrypted legacy data)
  }
};

export const VaultService = {
  async setItem(key: string, value: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      window.localStorage.setItem(`secure_${key}`, value);
    } else {
      // On web, encrypt before storing in sessionStorage (more secure than local)
      const encrypted = await encrypt(value);
      window.sessionStorage.setItem(key, encrypted);
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      return window.localStorage.getItem(`secure_${key}`) || window.localStorage.getItem(key);
    } else {
      // 1. Try sessionStorage first (new encrypted method)
      const fromSession = window.sessionStorage.getItem(key);
      if (fromSession) return decrypt(fromSession);
      
      // 2. Migration: check old localStorage
      const fromLocal = window.localStorage.getItem(key) || window.localStorage.getItem(`secure_${key}`);
      if (fromLocal) {
        // Migrate to sessionStorage + encrypted
        await this.setItem(key, fromLocal);
        window.localStorage.removeItem(key);
        window.localStorage.removeItem(`secure_${key}`);
        return fromLocal;
      }
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
    window.localStorage.removeItem(`secure_${key}`);
  },

  async clear(): Promise<void> {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('auth');
      window.localStorage.removeItem('auth');
      window.localStorage.removeItem('secure_auth');
    }
  }
};
