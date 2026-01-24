/**
 * BaseSDK - Abstract base class for all iframe SDK implementations
 * Provides common functionality for modal management, messaging, and theming
 */

import type {
  BaseConfig,
  BaseError,
  SDKOptions,
  IframeMessage,
  Theme,
  SDKState,
  PublicSDKState,
  DebugAPI,
  EventHandler,
  WildcardEventHandler,
} from '../types';
import { MessageBridge } from '../managers/MessageBridge';
import { ModalManager } from '../managers/ModalManager';
import { ThemeManager } from '../managers/ThemeManager';
import { EventEmitter } from '../utils/EventEmitter';
import { validateConfig } from '../utils/validators';
import { createError } from '../utils/errorUtils';
import { getPublicState } from '../utils/sanitizer';
import { createLogger } from '../utils/logger';
import { createInitialState } from './SDKState';

/**
 * Create logger instance for BaseSDK
 */
const logger = createLogger('BaseSDK');

/**
 * Abstract base class for all SDK implementations
 * Provides common functionality that can be extended by specific SDKs
 */
export abstract class BaseSDK<
  TConfig extends BaseConfig,
  TResult,
  TError extends BaseError
> {
  protected state: SDKState<TConfig>;
  protected messageBridge: MessageBridge;
  protected modalManager: ModalManager;
  protected themeManager: ThemeManager;
  protected eventEmitter: EventEmitter;
  protected classPrefix: string;

  constructor(options: SDKOptions) {
    this.classPrefix = options.classPrefix;
    this.state = createInitialState<TConfig>();
    this.modalManager = new ModalManager({
      classPrefix: options.classPrefix,
    });
    this.messageBridge = new MessageBridge({
      iframeSelector: this.modalManager.getIframeSelector(),
    });
    this.themeManager = new ThemeManager();
    this.eventEmitter = new EventEmitter();

    // Initialize message bridge
    this.messageBridge.initialize((message) => {
      this.handleMessage(message);
    });

    logger.debug('BaseSDK initialized', { classPrefix: options.classPrefix });
  }

  /**
   * Abstract methods that must be implemented by subclasses
   */

  /**
   * Build the URL for the iframe based on configuration
   * @param config - Configuration object
   * @returns URL string for the iframe
   */
  abstract buildURL(config: TConfig): string;

  /**
   * Handle incoming messages from the iframe
   * @param message - Message from iframe
   */
  abstract handleMessage(message: IframeMessage): void;

  /**
   * Get default configuration values
   * @returns Partial configuration with defaults
   */
  abstract getDefaultConfig(): Partial<TConfig>;

  /**
   * Open the SDK modal
   * @param config - Partial configuration (merged with defaults)
   * @returns Promise that resolves with result or rejects with error
   */
  async open(config?: Partial<TConfig>): Promise<TResult | TError> {
    if (this.state.isOpen) {
      const error = createError(
        'MODAL_ALREADY_OPEN',
        'Modal is already open',
        {}
      ) as TError;
      return Promise.reject(error);
    }

    try {
      // Merge with defaults
      const defaultConfig = this.getDefaultConfig();
      const mergedConfig = {
        ...defaultConfig,
        ...config,
      } as TConfig;

      // Validate configuration
      const validationError = validateConfig(mergedConfig);
      if (validationError) {
        return Promise.reject(validationError as TError);
      }

      // Build URL
      const url = this.buildURL(mergedConfig);

      // Set theme if provided
      if (mergedConfig.theme) {
        this.setTheme(mergedConfig.theme);
      }

      // Create promise
      const promise = new Promise<TResult | TError>((resolve, reject) => {
        this.state.pendingPromise = { resolve, reject };
      });

      // Create modal
      const { modal, iframe } = this.modalManager.createModal(
        url,
        mergedConfig,
        this.themeManager.getModalInlineStyles()
      );

      // Update state
      this.state.isOpen = true;
      this.state.config = mergedConfig;
      this.state.modal = modal;
      this.state.iframe = iframe;
      this.state.iframeUrl = url;
      this.state.lastOpenTime = Date.now();

      // Set close callback
      this.modalManager.setOnCloseCallback(() => {
        this.close();
      });

      logger.debug('SDK opened', { url, config: mergedConfig });

      return promise;
    } catch (error) {
      const sdkError = createError(
        'MODAL_CREATION_FAILED',
        `Failed to create modal: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error }
      ) as TError;
      return Promise.reject(sdkError);
    }
  }

  /**
   * Close the SDK modal
   */
  close(): void {
    if (!this.state.isOpen || !this.state.modal) {
      logger.warn('Cannot close: modal is not open');
      return;
    }

    // Reject pending promise if exists
    if (this.state.pendingPromise) {
      const error = createError(
        'USER_CANCELLED',
        'Modal was closed by user',
        {}
      ) as TError;
      this.state.pendingPromise.reject(error);
      this.state.pendingPromise = null;
    }

    // Close modal
    this.modalManager.closeModal(this.state.modal, this.state.config || undefined);

    // Reset state
    this.state.isOpen = false;
    this.state.modal = null;
    this.state.iframe = null;
    this.state.iframeUrl = null;

    logger.debug('SDK closed');
  }

  /**
   * Set theme for the SDK
   * @param theme - Theme name or Theme object
   */
  setTheme(theme: Theme | string): void {
    const themeName = this.themeManager.setTheme(theme);
    this.state.currentTheme = theme;

    // If modal is open, update theme
    if (this.state.isOpen && this.state.iframe) {
      this.messageBridge.sendMessage({
        type: 'SET_THEME',
        payload: this.themeManager.getCurrentTheme(),
      });
    }

    logger.debug('Theme set', { theme: themeName });
  }

  /**
   * Configure SDK settings
   * @param settings - Configuration object
   */
  configure(settings: Partial<TConfig>): void {
    if (this.state.config) {
      this.state.config = {
        ...this.state.config,
        ...settings,
      } as TConfig;
    } else {
      this.state.config = {
        ...this.getDefaultConfig(),
        ...settings,
      } as TConfig;
    }

    logger.debug('SDK configured', { settings });
  }

  /**
   * Event API
   */

  /**
   * Subscribe to an event
   * @param event - Event name or "*" for all events
   * @param callback - Handler function
   */
  on(event: string, callback: EventHandler | WildcardEventHandler): void {
    this.eventEmitter.on(event, callback);
  }

  /**
   * Unsubscribe from an event
   * @param event - Event name
   * @param callback - Handler function to remove
   */
  off(event: string, callback: EventHandler | WildcardEventHandler): void {
    this.eventEmitter.off(event, callback);
  }

  /**
   * Subscribe to an event once
   * @param event - Event name
   * @param callback - Handler function
   */
  once(event: string, callback: EventHandler | WildcardEventHandler): void {
    this.eventEmitter.once(event, callback);
  }

  /**
   * State API (readonly getters)
   */

  /**
   * Check if SDK modal is currently open
   */
  get isOpen(): boolean {
    return this.state.isOpen;
  }

  /**
   * Get current theme
   */
  get currentTheme(): Theme | string | null {
    return this.state.currentTheme;
  }

  /**
   * Get current configuration
   */
  get config(): TConfig | null {
    return this.state.config;
  }

  /**
   * Get public state (sanitized)
   */
  get publicState(): PublicSDKState {
    return getPublicState(this.state);
  }

  /**
   * Debug API (optional, can be implemented by subclasses)
   */
  get debug(): DebugAPI | undefined {
    return undefined;
  }

  /**
   * Protected helper methods for subclasses
   */

  /**
   * Resolve the pending promise with a result
   * @param result - Result to resolve with
   */
  protected resolveOpen(result: TResult): void {
    if (this.state.pendingPromise) {
      this.state.pendingPromise.resolve(result);
      this.state.pendingPromise = null;
    }
    this.close();
  }

  /**
   * Reject the pending promise with an error
   * @param error - Error to reject with
   */
  protected rejectOpen(error: TError): void {
    if (this.state.pendingPromise) {
      this.state.pendingPromise.reject(error);
      this.state.pendingPromise = null;
    }
    this.close();
  }

  /**
   * Send message to iframe
   * @param type - Message type
   * @param payload - Message payload
   */
  protected sendToIframe(type: string, payload?: any): void {
    this.messageBridge.sendMessage({ type, payload });
  }

  /**
   * Handle app ready message (common pattern)
   */
  protected handleAppReady(): void {
    logger.debug('App ready received');
    // Send theme if set
    if (this.state.currentTheme) {
      this.sendToIframe('SET_THEME', this.themeManager.getCurrentTheme());
    }
    // Send config if needed
    if (this.state.config) {
      this.sendToIframe('SET_CONFIG', this.state.config);
    }
  }

  /**
   * Handle request close message
   */
  protected handleRequestClose(): void {
    logger.debug('Request close received from iframe');
    this.close();
  }

  /**
   * Emit event
   * @param event - Event name
   * @param payload - Event payload
   */
  protected emit(event: string, payload?: any): void {
    this.eventEmitter.emit(event, payload);
  }

  /**
   * Cleanup and destroy SDK
   */
  destroy(): void {
    if (this.state.isOpen) {
      this.close();
    }
    this.messageBridge.destroy();
    this.themeManager.destroy();
    this.eventEmitter.removeAllListeners();
    this.state = createInitialState<TConfig>();
    logger.debug('SDK destroyed');
  }
}
