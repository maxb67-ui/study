import CryptoJS from 'crypto-js';

// A unique key per user or a fallback salt
const SECRET_SALT = 'lumora_secure_storage_v1_salt';

export function encryptData(data: any, userId: string): string {
  try {
    const json = JSON.stringify(data);
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