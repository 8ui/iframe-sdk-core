/**
 * Base configuration types for iframe SDK
 */

import type { Theme } from './themes';

/**
 * Animation configuration options
 */
export interface AnimationConfig {
  enabled: boolean;
  animations: SingleAnimation[];
}

/**
 * Single animation configuration
 */
export interface SingleAnimation {
  type: 'fade' | 'scale' | 'slide';
  duration?: number;
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  from?: number;
  to?: number;
  direction?: 'left' | 'right' | 'top' | 'bottom';
}

/**
 * Styling configuration options
 */
export interface StylingConfig {
  overlay?: { [key: string]: any };
  modal?: { [key: string]: any };
  media?: {
    [query: string]: {
      overlay?: { [key: string]: any };
      modal?: { [key: string]: any };
    };
  };
}

/**
 * Modal configuration options - logical settings only
 */
export interface ModalConfig {
  closeOnBackdropClick: boolean;
  closeOnEscape: boolean;
}

/**
 * Base configuration that all SDK configs must extend
 */
export interface BaseConfig {
  serverUrl: string;
  timeout?: number;
  debug?: boolean;
  animations?: AnimationConfig;
  styling?: StylingConfig;
  modal?: ModalConfig;
  theme?: Theme | string;
}

/**
 * Options for SDK initialization
 */
export interface SDKOptions {
  classPrefix: string;
  storagePrefix?: string;
  allowedSources?: string[];
}
