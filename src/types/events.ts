/**
 * Base event types for SDK event system
 */

/**
 * Event handler function type
 */
export type EventHandler<T = any> = (payload: T) => void;

/**
 * Wildcard event handler function type (receives event type and payload)
 */
export type WildcardEventHandler = (eventType: string, payload: any) => void;
