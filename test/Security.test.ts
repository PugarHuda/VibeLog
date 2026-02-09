import {
  encryptPrivateKey,
  decryptPrivateKey,
  validatePrivateKey,
  maskPrivateKey,
  validatePassword,
  sanitizeInput,
  isValidAddress,
} from '../src/utils/security.js';

describe('Security Utils', () => {
  describe('Private Key Encryption', () => {
    const testKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const password = 'TestPassword123!';

    it('should encrypt and decrypt private key', () => {
      const encrypted = encryptPrivateKey(testKey, password);
      const decrypted = decryptPrivateKey(encrypted, password);
      expect(decrypted).toBe(testKey);
    });

    it('should fail with wrong password', () => {
      const encrypted = encryptPrivateKey(testKey, password);
      expect(() => {
        decryptPrivateKey(encrypted, 'WrongPassword');
      }).toThrow();
    });

    it('should produce different encrypted data each time', () => {
      const encrypted1 = encryptPrivateKey(testKey, password);
      const encrypted2 = encryptPrivateKey(testKey, password);
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
    });
  });

  describe('Private Key Validation', () => {
    it('should validate correct private key', () => {
      expect(validatePrivateKey('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef')).toBe(true);
    });

    it('should validate key with 0x prefix', () => {
      expect(validatePrivateKey('0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef')).toBe(true);
    });

    it('should reject invalid length', () => {
      expect(validatePrivateKey('0123456789abcdef')).toBe(false);
    });

    it('should reject non-hex characters', () => {
      expect(validatePrivateKey('0123456789abcdefghij0123456789abcdef0123456789abcdef0123456789ab')).toBe(false);
    });
  });

  describe('Private Key Masking', () => {
    it('should mask private key', () => {
      const key = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const masked = maskPrivateKey(key);
      expect(masked).toBe('012345...cdef');
    });

    it('should handle short keys', () => {
      expect(maskPrivateKey('short')).toBe('***');
    });
  });

  describe('Password Validation', () => {
    it('should accept strong password', () => {
      const result = validatePassword('StrongPass123!');
      expect(result.valid).toBe(true);
    });

    it('should reject short password', () => {
      const result = validatePassword('Short1!');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('8 characters');
    });

    it('should reject password without uppercase', () => {
      const result = validatePassword('lowercase123!');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('uppercase');
    });

    it('should reject password without lowercase', () => {
      const result = validatePassword('UPPERCASE123!');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('lowercase');
    });

    it('should reject password without number', () => {
      const result = validatePassword('NoNumbers!');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('number');
    });
  });

  describe('Input Sanitization', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('should remove javascript protocol', () => {
      expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
    });

    it('should remove event handlers', () => {
      expect(sanitizeInput('onclick=alert(1)')).toBe('alert(1)');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test');
    });
  });

  describe('Address Validation', () => {
    it('should validate correct address', () => {
      expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')).toBe(true);
    });

    it('should reject invalid length', () => {
      expect(isValidAddress('0x742d35Cc')).toBe(false);
    });

    it('should reject missing 0x prefix', () => {
      expect(isValidAddress('742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')).toBe(false);
    });

    it('should reject non-hex characters', () => {
      expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbG')).toBe(false);
    });
  });
});
