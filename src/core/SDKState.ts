/**
 * SDK State management
 */

import type { BaseConfig, Theme } from '../types';

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
    reject: (error: any) => void;
  } | null;
  iframeUrl: string | null;
  initializationTime: number | null;
  lastOpenTime: number | null;
}

/**
 * Create initial SDK state
 */
export function createInitialState<TConfig extends BaseConfig>(): SDKState<TConfig> {
  return {
    isOpen: false,
    currentTheme: null,
    config: null,
    modal: null,
    iframe: null,
    pendingPromise: null,
    iframeUrl: null,
    initializationTime: Date.now(),
    lastOpenTime: null,
  };
}
