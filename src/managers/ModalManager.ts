/**
 * ModalManager - DOM modal creation and management for iframe SDK
 * Handles modal styling, animations, and event delegation with iframe integration
 */

import type { BaseConfig, StylingConfig, SingleAnimation } from '../types';
import { createLogger } from '../utils/logger';

/**
 * Create logger instance for ModalManager
 */
const logger = createLogger('ModalManager');

/**
 * Options for ModalManager
 */
export interface ModalManagerOptions {
  classPrefix: string;
}

/**
 * Apply CSS styles to overlay element
 * Merges default styles with config.styling.overlay (config overrides defaults)
 */
function applyOverlayStyles<TConfig extends BaseConfig>(
  config: TConfig
): Partial<CSSStyleDeclaration> {
  // Default overlay styles
  const defaultStyles: Partial<CSSStyleDeclaration> = {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    zIndex: '10000',
    background: 'rgba(0, 0, 0, 0.5)',
  };

  // Start with default styles
  const styles = { ...defaultStyles };

  // Merge with config.styling.overlay (config overrides defaults)
  if (config.styling?.overlay) {
    Object.keys(config.styling.overlay).forEach((key) => {
      (styles as any)[key] = config.styling!.overlay![key];
    });
  }

  return styles;
}

/**
 * Apply CSS styles to modal container
 * Merges default styles with config.styling.modal (config overrides defaults)
 */
function applyModalStyles<TConfig extends BaseConfig>(
  config: TConfig
): Partial<CSSStyleDeclaration> {
  // Default modal styles (empty by default, user must provide styles)
  const defaultStyles: Partial<CSSStyleDeclaration> = {};

  // Start with default styles
  const styles = { ...defaultStyles };

  // Merge with config.styling.modal (config overrides defaults)
  if (config.styling?.modal) {
    Object.keys(config.styling.modal).forEach((key) => {
      (styles as any)[key] = config.styling!.modal![key];
    });
  }

  return styles;
}

/**
 * Optimized modal manager for creating and managing iframe modals
 * Simplified for essential functionality with reduced bundle size
 */
export class ModalManager {
  private readonly MODAL_CLASS: string;
  private readonly OVERLAY_CLASS: string;
  private readonly IFRAME_CLASS: string;

  private onCloseCallback?: () => void;
  private styleElement: HTMLStyleElement | undefined;

  constructor(options: ModalManagerOptions) {
    this.MODAL_CLASS = `${options.classPrefix}-modal`;
    this.OVERLAY_CLASS = `${options.classPrefix}-modal-overlay`;
    this.IFRAME_CLASS = `${options.classPrefix}-modal-iframe`;
  }

  /**
   * Convert camelCase style keys to kebab-case for CSS
   */
  private toKebabCase(key: string): string {
    if (key.startsWith('--')) {
      return key;
    }
    return key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
  }

  /**
   * Normalize media query key to content inside @media
   */
  private normalizeMediaQuery(query: string): string {
    const trimmed = query.trim();
    if (!trimmed) {
      return '';
    }
    return trimmed.startsWith('@media')
      ? trimmed.replace(/^@media\s+/, '')
      : trimmed;
  }

  /**
   * Build CSS block for selector and style map
   */
  private buildCssBlock(
    selector: string,
    styles?: Record<string, any>,
    forceImportant: boolean = false
  ): string | null {
    if (!styles) {
      return null;
    }

    const declarations = Object.entries(styles)
      .map(([key, value]) => {
        if (value === undefined || value === null) {
          return null;
        }
        const property = this.toKebabCase(key);
        const valueStr = String(value);
        const finalValue = forceImportant
          ? valueStr.includes('!important')
            ? valueStr
            : `${valueStr} !important`
          : valueStr;
        return `${property}: ${finalValue};`;
      })
      .filter(Boolean) as string[];

    if (declarations.length === 0) {
      return null;
    }

    return `${selector} {\n  ${declarations.join('\n  ')}\n}`;
  }

  /**
   * Build base CSS for modal and overlay styles
   */
  private buildBaseCss<TConfig extends BaseConfig>(
    config: TConfig,
    modalThemeStyles?: Record<string, string>
  ): string {
    const overlayStyles = applyOverlayStyles(config);
    const modalStyles = {
      ...(modalThemeStyles || {}),
      ...applyModalStyles(config),
    } as Record<string, any>;

    const animationsEnabled = !!config.animations?.enabled &&
      config.animations.animations.length > 0;
    const hasTransform = !!config.styling?.modal?.transform;

    if (animationsEnabled && !hasTransform) {
      delete modalStyles.transform;
    } else if (!hasTransform && !animationsEnabled) {
      modalStyles.transform = 'scale(1)';
    }

    const overlayBlock = this.buildCssBlock(`.${this.OVERLAY_CLASS}`, overlayStyles);
    const modalBlock = this.buildCssBlock(`.${this.MODAL_CLASS}`, modalStyles);

    return [overlayBlock, modalBlock].filter(Boolean).join('\n');
  }

  /**
   * Build media CSS text for modal and overlay styles
   */
  private buildMediaCss(
    media: NonNullable<StylingConfig['media']>
  ): string {
    const blocks: string[] = [];

    Object.entries(media).forEach(([query, styles]) => {
      const normalizedQuery = this.normalizeMediaQuery(query);
      if (!normalizedQuery) {
        return;
      }

      const modalBlock = this.buildCssBlock(
        `.${this.MODAL_CLASS}`,
        styles.modal,
        true
      );
      const overlayBlock = this.buildCssBlock(
        `.${this.OVERLAY_CLASS}`,
        styles.overlay,
        true
      );

      const combined = [modalBlock, overlayBlock].filter(Boolean).join('\n');
      if (!combined) {
        return;
      }

      blocks.push(`@media ${normalizedQuery} {\n${combined}\n}`);
    });

    return blocks.join('\n');
  }

  /**
   * Inject modal and media styles into document head
   */
  private applyStyles<TConfig extends BaseConfig>(
    config: TConfig,
    modalThemeStyles?: Record<string, string>
  ): void {
    this.removeStyles();

    const baseCss = this.buildBaseCss(config, modalThemeStyles);
    const mediaCss = config.styling?.media
      ? this.buildMediaCss(config.styling.media)
      : '';

    const cssText = [baseCss, mediaCss].filter(Boolean).join('\n');
    if (!cssText) {
      return;
    }

    const styleElement = document.createElement('style');
    styleElement.setAttribute(`data-${this.MODAL_CLASS}-styles`, 'true');
    styleElement.textContent = cssText;
    document.head.appendChild(styleElement);
    this.styleElement = styleElement;
  }

  /**
   * Remove previously injected modal styles
   */
  private removeStyles(): void {
    if (this.styleElement?.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }
    this.styleElement = undefined;
  }

  /**
   * Normalize animation values - set defaults for each animation type
   */
  private normalizeAnimationValues(
    animation: SingleAnimation
  ): SingleAnimation {
    const normalized = { ...animation };

    if (animation.type === 'fade') {
      normalized.from = animation.from ?? 0;
      normalized.to = animation.to ?? 1;
    } else if (animation.type === 'scale') {
      normalized.from = animation.from ?? 0.9;
      normalized.to = animation.to ?? 1;
    } else if (animation.type === 'slide') {
      normalized.direction = animation.direction ?? 'right';
    }

    return normalized;
  }

  /**
   * Convert slide direction to CSS transform value
   */
  private slideDirectionToTransform(
    direction: 'left' | 'right' | 'top' | 'bottom',
    isInitial: boolean
  ): string {
    const transforms: Record<
      'left' | 'right' | 'top' | 'bottom',
      { initial: string; final: string }
    > = {
      right: { initial: 'translateX(100%)', final: 'translateX(0)' },
      left: { initial: 'translateX(-100%)', final: 'translateX(0)' },
      bottom: { initial: 'translateY(100%)', final: 'translateY(0)' },
      top: { initial: 'translateY(-100%)', final: 'translateY(0)' },
    };

    return isInitial
      ? transforms[direction].initial
      : transforms[direction].final;
  }

  /**
   * Disable default animations and transitions
   */
  private disableDefaultAnimations(element: HTMLElement): void {
    // Remove MUI classes that might have animations
    const muiClasses = [
      'MuiDrawer-paper',
      'MuiBackdrop-root',
      'MuiModal-root',
      'MuiDialog-root',
    ];
    muiClasses.forEach((className) => {
      element.classList.remove(className);
    });

    // Disable transitions and animations
    element.style.transition = 'none';
    element.style.animation = 'none';
  }

  /**
   * Get maximum animation duration from all animations
   */
  private getMaxAnimationDuration(animations: SingleAnimation[]): number {
    return Math.max(
      ...animations.map((anim) => anim.duration ?? 300),
      300 // default minimum
    );
  }

  /**
   * Setup CSS transitions for animations
   */
  private setupAnimationTransitions(
    element: HTMLElement,
    animations: SingleAnimation[],
    property: 'opacity' | 'transform'
  ): void {
    // Collect all transitions for this property
    const transitions: string[] = [];

    animations.forEach((anim) => {
      if (
        (property === 'opacity' && anim.type === 'fade') ||
        (property === 'transform' &&
          (anim.type === 'scale' || anim.type === 'slide'))
      ) {
        const duration = anim.duration ?? 300;
        const easing = anim.easing ?? 'ease-in-out';
        transitions.push(`${property} ${duration}ms ${easing}`);
      }
    });

    if (transitions.length > 0) {
      element.style.transition = transitions.join(', ');
    }
  }

  /**
   * Apply initial animation states
   */
  private applyInitialAnimationStates(
    overlay: HTMLElement,
    modal: HTMLElement,
    animations: SingleAnimation[]
  ): void {
    const normalizedAnimations = animations.map((anim) =>
      this.normalizeAnimationValues(anim)
    );

    // Apply fade initial state to overlay
    const fadeAnimations = normalizedAnimations.filter(
      (anim) => anim.type === 'fade'
    );
    const fadeAnim = fadeAnimations[0];
    if (fadeAnim) {
      overlay.style.opacity = String(fadeAnim.from ?? 0);
    }

    // Apply transform initial states to modal
    const transformAnimations = normalizedAnimations.filter(
      (anim) => anim.type === 'scale' || anim.type === 'slide'
    );

    if (transformAnimations.length > 0) {
      const transformParts: string[] = [];

      transformAnimations.forEach((anim) => {
        if (anim.type === 'scale') {
          transformParts.push(`scale(${anim.from ?? 0.9})`);
        } else if (anim.type === 'slide' && anim.direction) {
          transformParts.push(
            this.slideDirectionToTransform(anim.direction, true)
          );
        }
      });

      if (transformParts.length > 0) {
        modal.style.transform = transformParts.join(' ');
      }
    }
  }

  /**
   * Apply final animation states (for opening)
   */
  private applyFinalAnimationStates(
    overlay: HTMLElement,
    modal: HTMLElement,
    animations: SingleAnimation[]
  ): void {
    const normalizedAnimations = animations.map((anim) =>
      this.normalizeAnimationValues(anim)
    );

    // Apply fade final state to overlay
    const fadeAnimations = normalizedAnimations.filter(
      (anim) => anim.type === 'fade'
    );
    const fadeAnim = fadeAnimations[0];
    if (fadeAnim) {
      overlay.style.opacity = String(fadeAnim.to ?? 1);
    }

    // Apply transform final states to modal
    const transformAnimations = normalizedAnimations.filter(
      (anim) => anim.type === 'scale' || anim.type === 'slide'
    );

    if (transformAnimations.length > 0) {
      const transformParts: string[] = [];

      transformAnimations.forEach((anim) => {
        if (anim.type === 'scale') {
          transformParts.push(`scale(${anim.to ?? 1})`);
        } else if (anim.type === 'slide' && anim.direction) {
          transformParts.push(
            this.slideDirectionToTransform(anim.direction, false)
          );
        }
      });

      if (transformParts.length > 0) {
        modal.style.transform = transformParts.join(' ');
      }
    }
  }

  /**
   * Apply close animation states (reverse of opening)
   */
  private applyCloseAnimationStates(
    overlay: HTMLElement,
    modal: HTMLElement,
    animations: SingleAnimation[]
  ): void {
    const normalizedAnimations = animations.map((anim) =>
      this.normalizeAnimationValues(anim)
    );

    // Apply fade initial state to overlay (reverse)
    const fadeAnimations = normalizedAnimations.filter(
      (anim) => anim.type === 'fade'
    );
    const fadeAnim = fadeAnimations[0];
    if (fadeAnim) {
      overlay.style.opacity = String(fadeAnim.from ?? 0);
    }

    // Apply transform initial states to modal (reverse)
    const transformAnimations = normalizedAnimations.filter(
      (anim) => anim.type === 'scale' || anim.type === 'slide'
    );

    if (transformAnimations.length > 0) {
      const transformParts: string[] = [];

      transformAnimations.forEach((anim) => {
        if (anim.type === 'scale') {
          transformParts.push(`scale(${anim.from ?? 0.9})`);
        } else if (anim.type === 'slide' && anim.direction) {
          transformParts.push(
            this.slideDirectionToTransform(anim.direction, true)
          );
        }
      });

      if (transformParts.length > 0) {
        modal.style.transform = transformParts.join(' ');
      }
    }
  }

  /**
   * Create complete modal structure with iframe and animations
   * Assembles overlay, modal container, and iframe with event listeners
   */
  createModal<TConfig extends BaseConfig>(
    url: string,
    config: TConfig,
    modalThemeStyles?: Record<string, string>
  ): { modal: HTMLElement; iframe: HTMLIFrameElement } {
    this.applyStyles(config, modalThemeStyles);
    const overlay = this.createOverlay(config);
    const modal = this.createModalContainer();
    const iframe = this.createIframe(url, config);

    // Assemble modal structure
    modal.appendChild(iframe);
    overlay.appendChild(modal);

    // Disable default animations
    this.disableDefaultAnimations(overlay);
    this.disableDefaultAnimations(modal);

    // Add to DOM
    document.body.appendChild(overlay);

    // Apply animations if enabled
    if (config.animations?.enabled && config.animations.animations.length > 0) {
      const animations = config.animations.animations;

      logger.debug('Applying animations', {
        enabled: config.animations.enabled,
        animationsCount: animations.length,
        animations: animations,
      });

      // Setup transitions
      const fadeAnimations = animations.filter((anim) => anim.type === 'fade');
      const transformAnimations = animations.filter(
        (anim) => anim.type === 'scale' || anim.type === 'slide'
      );

      if (fadeAnimations.length > 0) {
        this.setupAnimationTransitions(overlay, fadeAnimations, 'opacity');
      }

      if (transformAnimations.length > 0) {
        this.setupAnimationTransitions(modal, transformAnimations, 'transform');
      }

      // Apply initial states
      this.applyInitialAnimationStates(overlay, modal, animations);

      // Apply final states after a frame
      requestAnimationFrame(() => {
        this.applyFinalAnimationStates(overlay, modal, animations);
      });
    } else {
      // When animations are disabled, set final state immediately
      overlay.style.opacity = '1';
      modal.style.transform = 'scale(1)';
    }

    // Set up essential event listeners
    this.setupEventListeners(overlay, modal, config);

    return { modal: overlay, iframe };
  }

  /**
   * Set callback for modal close events
   */
  setOnCloseCallback(callback: () => void): void {
    this.onCloseCallback = callback;
  }

  /**
   * Close modal with animation and cleanup
   * Triggers close callback and handles animation timing
   */
  closeModal<TConfig extends BaseConfig>(
    modalElement: HTMLElement,
    config?: TConfig,
    skipCallback?: boolean
  ): void {
    // Notify SDK about the close event (skip if closing from SDK to avoid recursion)
    if (!skipCallback && this.onCloseCallback) {
      this.onCloseCallback();
    }

    const modal = modalElement.querySelector(
      `.${this.MODAL_CLASS}`
    ) as HTMLElement;

    // Apply close animations if enabled
    if (
      config?.animations?.enabled &&
      config.animations.animations.length > 0
    ) {
      const animations = config.animations.animations;
      this.applyCloseAnimationStates(
        modalElement,
        modal || modalElement,
        animations
      );

      // Get max duration for timeout
      const maxDuration = this.getMaxAnimationDuration(animations);
      setTimeout(() => this.removeModalFromDOM(modalElement), maxDuration);
    } else {
      // Immediate removal if no animations
      this.removeModalFromDOM(modalElement);
    }
  }

  /**
   * Create overlay element with essential styling
   */
  private createOverlay<TConfig extends BaseConfig>(config: TConfig): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = this.OVERLAY_CLASS;

    // Initial opacity will be set by applyInitialAnimationStates if animations enabled
    // Otherwise, set to visible
    if (
      !config.animations?.enabled ||
      config.animations.animations.length === 0
    ) {
      overlay.style.opacity = '1';
    }

    return overlay;
  }

  /**
   * Create modal container with simplified styling
   */
  private createModalContainer(): HTMLElement {
    const modal = document.createElement('div');
    modal.className = this.MODAL_CLASS;
    return modal;
  }

  /**
   * Create iframe element with essential configuration
   */
  private createIframe<TConfig extends BaseConfig>(
    url: string,
    config: TConfig
  ): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.className = this.IFRAME_CLASS;
    iframe.src = url;
    iframe.title = 'Iframe Widget';

    // Essential iframe styles
    Object.assign(iframe.style, {
      width: '100%',
      height: '100%',
      border: 'none',
      background: 'transparent',
    });

    // Essential iframe attributes
    iframe.setAttribute('allow', 'payment; geolocation');
    iframe.setAttribute(
      'sandbox',
      'allow-scripts allow-same-origin allow-forms allow-popups'
    );

    // Simple event handlers
    iframe.onload = () => logger.debug('Iframe loaded successfully');
    iframe.onerror = () => logger.error('Failed to load iframe');

    return iframe;
  }

  /**
   * Setup event listeners for backdrop clicks and modal interaction
   * Implements event delegation with stopPropagation for modal content
   */
  private setupEventListeners<TConfig extends BaseConfig>(
    overlay: HTMLElement,
    modal: HTMLElement,
    config: TConfig
  ): void {
    // Click outside to close
    if (config.modal?.closeOnBackdropClick) {
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
          this.closeModal(overlay, config);
        }
      });
    }

    // Prevent clicks inside modal from closing
    modal.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  }

  /**
   * Remove modal from DOM with error handling and logging
   */
  private removeModalFromDOM(modalElement: HTMLElement): void {
    try {
      this.removeStyles();
      if (modalElement && modalElement.parentNode) {
        modalElement.parentNode.removeChild(modalElement);
        logger.debug('Modal removed from DOM successfully');
      }
    } catch (error) {
      logger.error('Error removing modal from DOM', error);
    }
  }

  /**
   * Get iframe selector for this modal manager
   */
  getIframeSelector(): string {
    return `.${this.IFRAME_CLASS}`;
  }
}
