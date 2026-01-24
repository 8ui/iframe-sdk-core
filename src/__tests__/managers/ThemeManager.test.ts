/**
 * Unit tests for ThemeManager
 */

import { ThemeManager } from '../../managers/ThemeManager';
import type { Theme } from '../../types';

describe('ThemeManager', () => {
  let manager: ThemeManager;

  beforeEach(() => {
    manager = new ThemeManager();
  });

  describe('setTheme', () => {
    it('should set built-in light theme', () => {
      const themeName = manager.setTheme('light');
      expect(themeName).toBe('light');
      const theme = manager.getCurrentTheme();
      expect(theme).toBeTruthy();
      expect(theme?.theme).toBe('light');
    });

    it('should set built-in dark theme', () => {
      const themeName = manager.setTheme('dark');
      expect(themeName).toBe('dark');
      const theme = manager.getCurrentTheme();
      expect(theme?.theme).toBe('dark');
    });

    it('should fallback to light for unknown theme string', () => {
      const originalWarn = console.warn;
      console.warn = jest.fn();
      const themeName = manager.setTheme('unknown' as any);
      expect(themeName).toBe('light');
      expect(console.warn).toHaveBeenCalled();
      console.warn = originalWarn;
    });

    it('should accept custom theme object', () => {
      const customTheme: Theme = {
        theme: 'custom',
        colors: {
          mode: 'light',
          common: {
            black: '#000000',
            white: '#ffffff',
          },
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
          error: {
            main: '#f44336',
          },
          warning: {
            main: '#ff9800',
          },
          info: {
            main: '#2196f3',
          },
          success: {
            main: '#4caf50',
          },
          grey: {
            50: '#fafafa',
            100: '#f5f5f5',
            200: '#eeeeee',
            300: '#e0e0e0',
            400: '#bdbdbd',
            500: '#9e9e9e',
            600: '#757575',
            700: '#616161',
            800: '#424242',
            900: '#212121',
            A100: '#d5d5d5',
            A200: '#aaaaaa',
            A400: '#303030',
            A700: '#616161',
          },
          text: {
            primary: '#000000',
            secondary: '#666666',
            disabled: '#999999',
          },
          background: {
            default: '#ffffff',
            paper: '#f5f5f5',
          },
          divider: '#e0e0e0',
          action: {
            active: '#000000',
            hover: 'rgba(0, 0, 0, 0.04)',
            selected: 'rgba(0, 0, 0, 0.08)',
            disabled: 'rgba(0, 0, 0, 0.26)',
            disabledBackground: 'rgba(0, 0, 0, 0.12)',
            focus: 'rgba(0, 0, 0, 0.12)',
          },
        },
      };

      const themeName = manager.setTheme(customTheme);
      expect(themeName).toBe('custom');
      const theme = manager.getCurrentTheme();
      expect(theme).toEqual(customTheme);
    });
  });

  describe('getCurrentTheme', () => {
    it('should return null initially', () => {
      expect(manager.getCurrentTheme()).toBeNull();
    });

    it('should return current theme after setting', () => {
      manager.setTheme('dark');
      const theme = manager.getCurrentTheme();
      expect(theme).toBeTruthy();
      expect(theme?.theme).toBe('dark');
    });
  });

  describe('getModalInlineStyles', () => {
    it('should return styles with overflow hidden', () => {
      const styles = manager.getModalInlineStyles();
      expect(styles.overflow).toBe('hidden');
    });

    it('should include color from theme', () => {
      manager.setTheme('dark');
      const styles = manager.getModalInlineStyles();
      const theme = manager.getCurrentTheme();
      if (theme?.colors?.text?.primary) {
        expect(styles.color).toBe(theme.colors.text.primary);
      }
    });

    it('should include backgroundColor from theme', () => {
      manager.setTheme('light');
      const styles = manager.getModalInlineStyles();
      const theme = manager.getCurrentTheme();
      if (theme?.colors?.background?.default) {
        expect(styles.backgroundColor).toBe(theme.colors.background.default);
      }
    });
  });

  describe('reset', () => {
    it('should reset theme to null', () => {
      manager.setTheme('dark');
      manager.reset();
      expect(manager.getCurrentTheme()).toBeNull();
    });
  });

  describe('destroy', () => {
    it('should reset theme', () => {
      manager.setTheme('dark');
      manager.destroy();
      expect(manager.getCurrentTheme()).toBeNull();
    });
  });
});
