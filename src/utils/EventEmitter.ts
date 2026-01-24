/**
 * EventEmitter - Simple event emitter implementation for SDK events
 * Supports subscription to specific events or all events via "*"
 */

import { createLogger } from './logger';
import type { EventHandler, WildcardEventHandler } from '../types';

/**
 * Create logger instance for EventEmitter
 */
const logger = createLogger('EventEmitter');

/**
 * Simple EventEmitter implementation for SDK events
 */
export class EventEmitter {
  private listeners: Map<string, Set<Function>> = new Map();
  private onceListeners: Map<string, Set<Function>> = new Map();

  /**
   * Subscribe to an event
   * @param event - Event name or "*" for all events
   * @param callback - Handler function
   */
  on(event: string, callback: EventHandler | WildcardEventHandler): void {
    if (typeof callback !== 'function') {
      logger.warn('Callback must be a function', { event, callback });
      return;
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);
    logger.debug('Event listener added', {
      event,
      totalListeners: this.listeners.get(event)!.size,
    });
  }

  /**
   * Unsubscribe from an event
   * @param event - Event name or "*" for all events
   * @param callback - Handler function to remove
   */
  off(event: string, callback: EventHandler | WildcardEventHandler): void {
    if (!this.listeners.has(event)) {
      logger.debug('No listeners found for event', { event });
      return;
    }

    const listeners = this.listeners.get(event)!;
    const removed = listeners.delete(callback);

    if (removed) {
      logger.debug('Event listener removed', {
        event,
        remainingListeners: listeners.size,
      });
    } else {
      logger.debug('Listener not found for event', { event });
    }

    // Clean up empty sets
    if (listeners.size === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * Subscribe to an event once (automatically unsubscribes after first call)
   * @param event - Event name or "*" for all events
   * @param callback - Handler function
   */
  once(event: string, callback: EventHandler | WildcardEventHandler): void {
    if (typeof callback !== 'function') {
      logger.warn('Callback must be a function', { event, callback });
      return;
    }

    // Wrap callback to remove itself after first call
    const wrappedCallback = (arg1: any, arg2?: any) => {
      this.off(event, wrappedCallback);
      // If event is "*", callback receives (eventType, payload)
      // Otherwise, callback receives (payload)
      if (event === '*' && arg2 !== undefined) {
        (callback as WildcardEventHandler)(arg1, arg2);
      } else {
        (callback as EventHandler)(arg1);
      }
    };

    // Store original callback reference for cleanup
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }
    this.onceListeners.get(event)!.add(callback);

    // Add wrapped callback to regular listeners
    this.on(event, wrappedCallback);
    logger.debug('Once listener added', { event });
  }

  /**
   * Emit an event to all subscribers
   * @param event - Event name
   * @param payload - Event payload data
   */
  emit(event: string, payload?: any): void {
    logger.debug('Emitting event', {
      event,
      hasPayload: payload !== undefined,
    });

    // Call specific event listeners
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event)!;
      listeners.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          logger.error('Error in event listener', { event, error });
          // Don't throw - continue with other listeners
        }
      });
    }

    // Call wildcard listeners (for "*" subscription)
    if (this.listeners.has('*')) {
      const wildcardListeners = this.listeners.get('*')!;
      wildcardListeners.forEach((callback) => {
        try {
          // Wildcard callbacks receive (eventType, payload)
          (callback as WildcardEventHandler)(event, payload);
        } catch (error) {
          logger.error('Error in wildcard event listener', { event, error });
          // Don't throw - continue with other listeners
        }
      });
    }
  }

  /**
   * Remove all listeners for an event (or all events if no event specified)
   * @param event - Optional event name. If not provided, removes all listeners
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
      this.onceListeners.delete(event);
      logger.debug('All listeners removed for event', { event });
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
      logger.debug('All listeners removed');
    }
  }

  /**
   * Get count of listeners for an event
   * @param event - Event name
   * @returns Number of listeners
   */
  listenerCount(event: string): number {
    const count = this.listeners.get(event)?.size || 0;
    return count;
  }

  /**
   * Get all event names that have listeners
   * @returns Array of event names
   */
  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }
}
