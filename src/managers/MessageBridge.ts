/**
 * MessageBridge - PostMessage communication handler for iframe integration
 * Manages bidirectional communication between parent window and iframe
 */

import type { IframeMessage, ParentMessage, ParentMessageType } from '../types';
import { createLogger } from '../utils/logger';

/**
 * Create logger instance for MessageBridge
 */
const logger = createLogger('MessageBridge');

/**
 * Options for MessageBridge initialization
 */
export interface MessageBridgeOptions {
  iframeSelector: string;
  allowedSources?: string[];
}

/**
 * Optimized message bridge for PostMessage communication with iframe
 * Simplified for essential functionality with reduced bundle size
 */
export class MessageBridge {
  private messageHandler: ((data: any) => void) | null = null;
  private isInitialized = false;
  private iframeSelector: string;
  private allowedSources: string[];

  constructor(options: MessageBridgeOptions) {
    this.iframeSelector = options.iframeSelector;
    this.allowedSources = options.allowedSources || ['iframe'];
  }

  /**
   * Initialize message bridge with event listener setup
   * @param handler - Message handler function for iframe communication
   * @throws Error if already initialized
   */
  initialize(handler: (data: any) => void): void {
    if (this.isInitialized) {
      logger.warn('MessageBridge already initialized');
      return;
    }

    this.messageHandler = handler;
    window.addEventListener('message', this.handleMessage);
    this.isInitialized = true;
    logger.debug('MessageBridge initialized successfully');
  }

  /**
   * Send message to iframe with DOM querying and error handling
   * @param message - Message object with type and optional payload
   * @throws Error if iframe not found or PostMessage fails
   */
  sendMessage(message: {
    type: ParentMessageType | string;
    payload?: any;
  }): void {
    const iframe = document.querySelector(
      this.iframeSelector
    ) as HTMLIFrameElement;

    if (!iframe || !iframe.contentWindow) {
      logger.error('Iframe not found or not available');
      return;
    }

    const parentMessage: ParentMessage = {
      source: 'parent',
      type: message.type,
      payload: message.payload,
      timestamp: Date.now(),
    };

    logger.debug('Sending message to iframe', parentMessage);

    try {
      iframe.contentWindow.postMessage(parentMessage, '*');
      logger.debug('Message posted successfully');
    } catch (error) {
      logger.error('Error posting message', error);
    }
  }

  /**
   * Handle incoming PostMessage events with validation and routing
   * Validates message format and source before calling registered handler
   * @param event - MessageEvent from window.addEventListener
   */
  private handleMessage = (event: MessageEvent): void => {
    try {
      logger.debug('MessageBridge received event', event.data);

      // Simple message validation
      if (!this.isValidMessage(event.data)) {
        logger.debug('Invalid message format', event.data);
        return;
      }

      // Only handle messages from allowed sources
      if (!this.allowedSources.includes(event.data.source)) {
        logger.debug('Message source not allowed', event.data.source);
        return;
      }

      // Call the registered handler
      if (this.messageHandler) {
        logger.debug('Calling message handler', event.data);
        this.messageHandler(event.data);
      } else {
        logger.error('No message handler registered');
      }
    } catch (error) {
      logger.error('Error handling message', error);
    }
  };

  /**
   * Type guard for message validation with specific property checks
   * @param data - Raw message data to validate
   * @returns True if message has required properties and types
   */
  private isValidMessage(data: any): data is IframeMessage {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.source === 'string' &&
      typeof data.type === 'string' &&
      typeof data.timestamp === 'number'
    );
  }

  /**
   * Clean up message bridge with event listener removal
   * Prevents memory leaks by removing window event listeners
   */
  destroy(): void {
    if (this.isInitialized) {
      window.removeEventListener('message', this.handleMessage);
      this.messageHandler = null;
      this.isInitialized = false;
      logger.debug('MessageBridge destroyed successfully');
    }
  }
}
