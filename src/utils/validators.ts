/**
 * Optimized validation system for iframe SDK
 * Focus on essential validations with simplified checks
 */

import type { BaseConfig, BaseError } from '../types';
import { createConfigError } from './errorUtils';

/**
 * Simple URL validation - check protocol
 * Sufficient for basic URL validation without URL constructor overhead
 */
const isValidUrl = (url: string): boolean => {
  return Boolean(
    url && (url.startsWith('http://') || url.startsWith('https://'))
  );
};

/**
 * Main configuration validation function
 * Optimized for essential validation only
 */
export const validateConfig = (
  config: BaseConfig
): BaseError | null => {
  try {
    // Critical field validation (inline for performance)
    if (
      !config.serverUrl ||
      typeof config.serverUrl !== 'string' ||
      config.serverUrl.trim() === ''
    ) {
      return createConfigError(
        'serverUrl',
        'is required and must be a non-empty string'
      );
    }
    if (!isValidUrl(config.serverUrl)) {
      return createConfigError('serverUrl', 'must be a valid URL');
    }

    // Essential optional field validation (only fields that could break functionality)
    if (config.timeout !== undefined) {
      if (typeof config.timeout !== 'number' || config.timeout < 0) {
        return createConfigError('timeout', 'must be a positive number');
      }
    }

    if (config.debug !== undefined && typeof config.debug !== 'boolean') {
      return createConfigError('debug', 'must be a boolean');
    }

    // Quick validation for critical animation settings (prevent runtime errors)
    if (
      config.animations?.enabled !== undefined &&
      typeof config.animations.enabled !== 'boolean'
    ) {
      return createConfigError('animations.enabled', 'must be a boolean');
    }

    // Validate animations array
    if (config.animations?.animations !== undefined) {
      if (!Array.isArray(config.animations.animations)) {
        return createConfigError('animations.animations', 'must be an array');
      }

      // Validate each animation
      for (let i = 0; i < config.animations.animations.length; i++) {
        const anim = config.animations.animations[i];

        // Skip if animation is undefined or null
        if (!anim) {
          return createConfigError(
            `animations.animations[${i}]`,
            'animation cannot be undefined or null'
          );
        }

        // Validate type
        if (!anim.type || !['fade', 'scale', 'slide'].includes(anim.type)) {
          return createConfigError(
            `animations.animations[${i}].type`,
            "must be 'fade', 'scale', or 'slide'"
          );
        }

        // Validate duration if provided
        if (anim.duration !== undefined) {
          if (typeof anim.duration !== 'number' || anim.duration < 0) {
            return createConfigError(
              `animations.animations[${i}].duration`,
              'must be a positive number'
            );
          }
        }

        // Validate easing if provided
        if (anim.easing !== undefined) {
          const validEasings = [
            'ease',
            'ease-in',
            'ease-out',
            'ease-in-out',
            'linear',
          ];
          if (!validEasings.includes(anim.easing)) {
            return createConfigError(
              `animations.animations[${i}].easing`,
              `must be one of: ${validEasings.join(', ')}`
            );
          }
        }

        // Validate based on animation type
        if (anim.type === 'fade' || anim.type === 'scale') {
          // For fade and scale: from/to should be numbers, direction should not be used
          if (anim.from !== undefined && typeof anim.from !== 'number') {
            return createConfigError(
              `animations.animations[${i}].from`,
              'must be a number for fade/scale animations'
            );
          }
          if (anim.to !== undefined && typeof anim.to !== 'number') {
            return createConfigError(
              `animations.animations[${i}].to`,
              'must be a number for fade/scale animations'
            );
          }
          if (anim.direction !== undefined) {
            return createConfigError(
              `animations.animations[${i}].direction`,
              'should not be used for fade/scale animations'
            );
          }
        } else if (anim.type === 'slide') {
          // For slide: direction should be used, from/to should not be used
          if (anim.direction !== undefined) {
            const validDirections = ['left', 'right', 'top', 'bottom'];
            if (!validDirections.includes(anim.direction)) {
              return createConfigError(
                `animations.animations[${i}].direction`,
                `must be one of: ${validDirections.join(', ')}`
              );
            }
          }
          if (anim.from !== undefined || anim.to !== undefined) {
            return createConfigError(
              `animations.animations[${i}].from/to`,
              "should not be used for slide animations, use 'direction' instead"
            );
          }
        }
      }
    }

    return null;
  } catch (error) {
    return createConfigError(
      'validation',
      `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};
