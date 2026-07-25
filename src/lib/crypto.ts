import CryptoJS from 'crypto-js';

/**
 * SECURITY NOTE: 
 * Encryption performed in the client bundle is intended for OBFUSCATION of data in localStorage.
 * It is not a substitute for server-side security. For data requiring true privacy, 
 * use the Supabase database which is protected by authenticated sessions and RLS.
 */

// A unique key per user or a fallback salt
const SECRET_SALT = 'lumora_secure_storage_v1_obfuscation_salt';

export function encryptData(data: any, userId: string): string {
  try {
    const json = JSON.stringify(data);
    // Combine the userId and salt to make the key unique to the authenticated user
    return CryptoJS.AES.encrypt(json, userId + SECRET_SALT).toString();
  } catch (e) {
    return '';
  }
}

export function decryptData(encrypted: string, userId: string): any | null {
  if (!encrypted) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, userId + SECRET_SALT);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (e) {
    return null;
  }
}