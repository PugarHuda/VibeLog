import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export interface EncryptedData {
  encrypted: string;
  salt: string;
  iv: string;
  tag: string;
}

export function encryptPrivateKey(privateKey: string, password: string): EncryptedData {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  
  const key = scryptSync(password, salt, KEY_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

export function decryptPrivateKey(encryptedData: EncryptedData, password: string): string {
  const salt = Buffer.from(encryptedData.salt, 'hex');
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const tag = Buffer.from(encryptedData.tag, 'hex');
  
  const key = scryptSync(password, salt, KEY_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export function validatePrivateKey(privateKey: string): boolean {
  // Check if it's a valid hex string of correct length
  const cleanKey = privateKey.replace(/^0x/, '');
  return /^[0-9a-fA-F]{64}$/.test(cleanKey);
}

export function maskPrivateKey(privateKey: string): string {
  if (privateKey.length < 10) return '***';
  return `${privateKey.substring(0, 6)}...${privateKey.substring(privateKey.length - 4)}`;
}

export function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const length = 16;
  let password = '';
  
  const randomValues = randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[randomValues[i] % chars.length];
  }
  
  return password;
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  return { valid: true };
}

export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  // Simple in-memory rate limiting
  // In production, use Redis or similar
  const now = Date.now();
  const windowKey = `${key}-${Math.floor(now / windowMs)}`;
  
  if (!global.rateLimitStore) {
    global.rateLimitStore = new Map();
  }
  
  const current = global.rateLimitStore.get(windowKey) || 0;
  
  if (current >= maxRequests) {
    return false;
  }
  
  global.rateLimitStore.set(windowKey, current + 1);
  
  // Cleanup old entries
  for (const [k, v] of global.rateLimitStore.entries()) {
    if (!k.startsWith(key)) continue;
    const timestamp = parseInt(k.split('-')[1]);
    if (now - timestamp * windowMs > windowMs * 2) {
      global.rateLimitStore.delete(k);
    }
  }
  
  return true;
}

declare global {
  var rateLimitStore: Map<string, number> | undefined;
}
