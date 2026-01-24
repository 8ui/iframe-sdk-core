/**
 * Theme types for iframe SDK
 */

/**
 * Theme configuration - MUI compatible
 */
export interface Theme {
  theme: 'light' | 'dark' | 'custom';
  colors?: ThemeColors;
}

/**
 * Theme color palette
 */
export interface ThemeColors {
  mode: 'light' | 'dark';
  common: {
    black: string;
    white: string;
  };
  primary: ColorPalette;
  secondary: ColorPalette;
  error: ColorPalette;
  warning: ColorPalette;
  info: ColorPalette;
  success: ColorPalette;
  grey: GreyPalette;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  background: {
    default: string;
    paper: string;
  };
  divider: string;
  action: {
    active: string;
    hover: string;
    selected: string;
    disabled: string;
    disabledBackground: string;
    focus: string;
  };
}

/**
 * Color palette for theme colors
 */
export interface ColorPalette {
  main: string;
  light?: string;
  dark?: string;
  contrastText?: string;
}

/**
 * Grey color palette
 */
export interface GreyPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  A100: string;
  A200: string;
  A400: string;
  A700: string;
}
