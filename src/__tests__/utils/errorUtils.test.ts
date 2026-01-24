/**
 * Unit tests for errorUtils
 */

import {
  createError,
  createConfigError,
  createValidationError,
  isBaseError,
} from '../../utils/errorUtils';
import type { BaseError } from '../../types';

describe('errorUtils', () => {
  describe('createError', () => {
    it('should create error with code and message', () => {
      const error = createError('TEST_ERROR', 'Test message');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test message');
      expect(error.timestamp).toBeTruthy();
    });

    it('should include details if provided', () => {
      const error = createError('TEST_ERROR', 'Test message', {
        field: 'test',
      });
      expect(error.details).toEqual({ field: 'test' });
    });
  });

  describe('createConfigError', () => {
    it('should create config error', () => {
      const error = createConfigError('serverUrl', 'is required');
      expect(error.code).toBe('INVALID_CONFIG');
      expect(error.message).toContain('serverUrl');
      expect(error.message).toContain('is required');
      expect(error.details?.field).toBe('serverUrl');
    });
  });

  describe('createValidationError', () => {
    it('should create validation error', () => {
      const error = createValidationError('timeout', 123, 'positive number');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toContain('timeout');
      expect(error.details?.field).toBe('timeout');
    });
  });

  describe('isBaseError', () => {
    it('should return true for BaseError', () => {
      const error: BaseError = {
        code: 'TEST',
        message: 'Test',
        timestamp: new Date().toISOString(),
      };
      expect(isBaseError(error)).toBe(true);
    });

    it('should return false for non-error object', () => {
      expect(isBaseError({})).toBe(false);
      expect(isBaseError(null)).toBe(false);
      expect(isBaseError('string')).toBe(false);
    });
  });
});
