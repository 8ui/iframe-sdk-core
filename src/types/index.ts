/**
 * Core type definitions for iframe SDK
 */

// Re-export all types
export * from './messages';
export * from './config';
export * from './events';
export * from './themes';

// Import types for re-export
import type { BaseConfig, SDKOptions } from './config';
import type { IframeMessage } from './messages';
import type { Theme } from './themes';

/**
 * Base error interface that all SDK errors must extend
 */
export interface BaseError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Internal SDK state
 */
export interface SDKState<TConfig extends BaseConfig = BaseConfig> {
  isOpen: boolean;
  currentTheme: string | Theme | null;
  config: TConfig | null;
  modal: HTMLElement | null;
  iframe: HTMLIFrameElement | null;
  pendingPromise: {
    resolve: (value: any) => void;
    reject: (error: BaseError) => void;
  } | null;
  iframeUrl: string | null;
  initializationTime: number | null;
  lastOpenTime: number | null;
}

/**
 * Public SDK state for debugging (sanitized, without internal references)
 */
export interface PublicSDKState {
  isOpen: boolean;
  currentTheme: string | Theme | null;
  iframeUrl: string | null;
  initializationTime: number | null;
  lastOpenTime: number | null;
}

/**
 * Debug API interface
 */
export interface DebugAPI {
  getHistory(): any[];
  clearHistory(): void;
  getMessages(): any[];
  clearMessages(): void;
  getStats(): any;
  resetStats(): void;
  getLogs(): any[];
  clearLogs(): void;
  export(): any;
  showPanel?(): Promise<void>;
  hidePanel?(): void;
  togglePanel?(): Promise<void>;
}
