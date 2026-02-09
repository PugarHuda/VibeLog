import { sanitizeSummary } from '../src/utils/config.js';

describe('Config Utils', () => {
  describe('sanitizeSummary', () => {
    it('should redact API keys', () => {
      const { sanitized, hadSensitiveData } = sanitizeSummary(
        'Used API key sk_test_FAKEKEY12345678901234 to call endpoint'
      );
      expect(sanitized).toContain('[REDACTED]');
      expect(sanitized).not.toContain('sk_test_');
      expect(hadSensitiveData).toBe(true);
    });

    it('should redact email addresses', () => {
      const { sanitized, hadSensitiveData } = sanitizeSummary(
        'Contacted user@example.com for review'
      );
      expect(sanitized).toContain('[REDACTED]');
      expect(sanitized).not.toContain('user@example.com');
      expect(hadSensitiveData).toBe(true);
    });

    it('should redact GitHub tokens', () => {
      const { sanitized, hadSensitiveData } = sanitizeSummary(
        'Used ghp_1234567890abcdef1234567890abcdef1234 for auth'
      );
      expect(sanitized).toContain('[REDACTED]');
      expect(hadSensitiveData).toBe(true);
    });

    it('should not modify safe text', () => {
      const { sanitized, hadSensitiveData } = sanitizeSummary('Built the login page');
      expect(sanitized).toBe('Built the login page');
      expect(hadSensitiveData).toBe(false);
    });

    it('should truncate to 200 characters', () => {
      const longText = 'A'.repeat(300);
      const { sanitized } = sanitizeSummary(longText);
      expect(sanitized.length).toBe(200);
    });
  });
});
