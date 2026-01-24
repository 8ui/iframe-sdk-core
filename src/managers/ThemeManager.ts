/**
 * ThemeManager - Theme resolution and modal inline styles
 * Handles theme resolution (built-in vs custom) and provides inline styles for the modal container
 */

import type { Theme } from '../types';
import { createLogger } from '../utils/logger';
import { lightTheme } from '../themes/light';
import { darkTheme } from '../themes/dark';

/**
 * Create logger instance for ThemeManager
 */
const logger = createLogger('ThemeManager');

/**
 * Theme manager with optimized theme loading and modal inline styles
 */
export class ThemeManager {
  private currentTheme: Theme | null = null;

  /**
   * Optimized built-in themes (extracted to separate files but statically imported for now)
   */
  private static readonly BUILT_IN_THEMES: Record<string, Theme> = {
    light: lightTheme,
    dark: darkTheme,
  };

  /**
   * Set theme with resolution logic for built-in vs custom themes
   * Resolves string themes to built-in objects, preserves custom theme objects
   * @param theme - Theme name string or custom Theme object
   * @returns Resolved theme name for consistency
   */
  setTheme(theme: Theme | string): string {
    let resolvedTheme: Theme;

    if (typeof theme === 'string') {
      const foundTheme = ThemeManager.BUILT_IN_THEMES[theme];
      if (!foundTheme) {
        logger.warn(`Unknown theme: ${theme}, falling back to light theme`);
        resolvedTheme = ThemeManager.BUILT_IN_THEMES.light!;
      } else {
        resolvedTheme = foundTheme;
      }
    } else {
      // For custom theme objects, preserve the original theme name
      resolvedTheme = theme;

      logger.debug('Custom theme object received', {
        themeName: theme.theme,
        hasColors: !!theme.colors,
        colorKeys: theme.colors ? Object.keys(theme.colors) : [],
        fullTheme: theme,
      });
    }

    this.currentTheme = resolvedTheme;

    logger.debug('Theme set successfully', {
      theme: resolvedTheme.theme,
      hasColors: !!resolvedTheme.colors,
      isCustom: typeof theme === 'object',
    });

    return resolvedTheme.theme;
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): Theme | null {
    return this.currentTheme;
  }

  /**
   * Get inline styles for the modal container (color, backgroundColor, overflow)
   * from current theme colors. Used for the host modal element.
   */
  getModalInlineStyles(): Record<string, string> {
    const c = this.currentTheme?.colors;
    const s: Record<string, string> = { overflow: 'hidden' };
    if (c?.text?.primary) s.color = c.text.primary;
    if (c?.background?.default) s.backgroundColor = c.background.default;
    return s;
  }

  /**
   * Reset theme manager
   */
  reset(): void {
    this.currentTheme = null;
    logger.debug('ThemeManager reset');
  }

  /**
   * Destroy theme manager
   */
  destroy(): void {
    this.reset();
    logger.debug('ThemeManager destroyed');
  }
}
