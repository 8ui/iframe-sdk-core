/**
 * Base message types for iframe communication
 * Shared between SDK (parent) and Widget (iframe) sides
 */

/**
 * Base message structure for all PostMessage communication
 */
export interface BaseMessage {
  source: 'iframe' | 'parent';
  type: string;
  payload?: unknown;
  timestamp: number;
}

/**
 * Message from iframe to parent
 */
export interface IframeMessage extends BaseMessage {
  source: 'iframe';
  type: string;
  payload?: unknown;
  timestamp: number;
}

/**
 * Message from parent to iframe
 */
export interface ParentMessage extends BaseMessage {
  source: 'parent';
  type: string;
  payload?: unknown;
  timestamp: number;
}

/**
 * Standard message types from parent to iframe
 */
export const ParentMessageTypes = {
  SET_THEME: 'SET_THEME',
  SET_CONFIG: 'SET_CONFIG',
  PARENT_READY: 'PARENT_READY',
} as const;

/**
 * Standard message types from iframe to parent
 */
export const WidgetMessageTypes = {
  APP_READY: 'APP_READY',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR',
  REQUEST_CLOSE: 'REQUEST_CLOSE',
} as const;

/**
 * Type for parent message type values
 */
export type ParentMessageType = typeof ParentMessageTypes[keyof typeof ParentMessageTypes];

/**
 * Type for widget message type values
 */
export type WidgetMessageType = typeof WidgetMessageTypes[keyof typeof WidgetMessageTypes];
