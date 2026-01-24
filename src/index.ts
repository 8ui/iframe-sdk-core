/**
 * iframe-sdk-core - Universal SDK core for embedding iframe-based services (parent side)
 * 
 * This package provides the base infrastructure for creating SDKs that embed
 * iframe-based widgets with modal management, messaging, and theming.
 */

// Core exports
export { BaseSDK } from './core/BaseSDK';
export { createInitialState } from './core/SDKState';
export type { SDKState } from './core/SDKState';

// Manager exports
export { MessageBridge } from './managers/MessageBridge';
export type { MessageBridgeOptions } from './managers/MessageBridge';
export { ModalManager } from './managers/ModalManager';
export type { ModalManagerOptions } from './managers/ModalManager';
export { ThemeManager } from './managers/ThemeManager';

// Utility exports
export { EventEmitter } from './utils/EventEmitter';
export { logger, createLogger, LogLevel } from './utils/logger';
export type { LogEntry } from './utils/logger';
export { createError, isBaseError, createConfigError, createValidationError } from './utils/errorUtils';
export { sanitizeData, getPublicState } from './utils/sanitizer';
export { validateConfig } from './utils/validators';

// Theme exports
export { lightTheme } from './themes/light';
export { darkTheme } from './themes/dark';

// Type exports
export type * from './types';
