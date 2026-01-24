/**
 * Unit tests for validators
 */

import { validateConfig } from '../../utils/validators';
import type { BaseConfig } from '../../types';

describe('validators', () => {
  describe('validateConfig', () => {
    it('should validate correct config', () => {
      const config: BaseConfig = {
        serverUrl: 'https://example.com',
      };
      expect(validateConfig(config)).toBeNull();
    });

    it('should reject missing serverUrl', () => {
      const config = {} as BaseConfig;
      const error = validateConfig(config);
      expect(error).toBeTruthy();
      expect(error?.code).toBe('INVALID_CONFIG');
      expect(error?.message).toContain('serverUrl');
    });

    it('should reject invalid URL', () => {
      const config: BaseConfig = {
        serverUrl: 'not-a-url',
      };
      const error = validateConfig(config);
      expect(error).toBeTruthy();
      expect(error?.code).toBe('INVALID_CONFIG');
    });

    it('should reject negative timeout', () => {
      const config: BaseConfig = {
        serverUrl: 'https://example.com',
        timeout: -1,
      };
      const error = validateConfig(config);
      expect(error).toBeTruthy();
      expect(error?.message).toContain('timeout');
    });

    it('should validate animations', () => {
      const config: BaseConfig = {
        serverUrl: 'https://example.com',
        animations: {
          enabled: true,
          animations: [
            {
              type: 'fade',
              duration: 300,
              easing: 'ease-in-out',
            },
          ],
        },
      };
      expect(validateConfig(config)).toBeNull();
    });

    it('should reject invalid animation type', () => {
      const config: BaseConfig = {
        serverUrl: 'https://example.com',
        animations: {
          enabled: true,
          animations: [
            {
              type: 'invalid' as any,
            },
          ],
        },
      };
      const error = validateConfig(config);
      expect(error).toBeTruthy();
      expect(error?.message).toContain('type');
    });

    it('should reject invalid slide direction', () => {
      const config: BaseConfig = {
        serverUrl: 'https://example.com',
        animations: {
          enabled: true,
          animations: [
            {
              type: 'slide',
              direction: 'invalid' as any,
            },
          ],
        },
      };
      const error = validateConfig(config);
      expect(error).toBeTruthy();
    });
  });
});
