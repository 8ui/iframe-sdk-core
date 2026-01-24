/**
 * Optimized logging utility for iframe SDK
 * Production: minimal error/warn logging only
 * Debug: full featured logging with colors and formatting
 */

/**
 * Debug flag set during build time
 * Declared globally in src/globals.d.ts
 */
const DEBUG_FLAG = __DEBUG__;

/**
 * Log levels for different types of messages
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  TRACE = 'trace',
}

/**
 * Log entry interface
 */
export interface LogEntry {
  level: string;
  message: string;
  data?: any;
  timestamp: number;
}

/**
 * Optimized Logger - Conditional features based on DEBUG flag
 * Production builds include only essential error/warn logging
 * Debug builds include full featured logging with colors and formatting
 */
class Logger {
  private prefix = '[iframe SDK]';
  private runtimeDebug = false;

  // История логов (лимит 500 записей)
  private logHistory: LogEntry[] = [];
  private readonly MAX_LOG_HISTORY = 500;

  // These are only included in debug builds
  private static DEBUG_COLORS = DEBUG_FLAG
    ? {
        reset: '\x1b[0m',
        bright: '\x1b[1m',
        dim: '\x1b[2m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
      }
    : null;

  private static DEBUG_EMOJIS = DEBUG_FLAG
    ? {
        [LogLevel.DEBUG]: '🐛',
        [LogLevel.INFO]: 'ℹ️',
        [LogLevel.WARN]: '⚠️',
        [LogLevel.ERROR]: '❌',
        [LogLevel.TRACE]: '🔍',
      }
    : null;

  constructor(prefix?: string) {
    if (prefix) {
      this.prefix = prefix;
    }
    // Check for runtime debug flag
    if (typeof window !== 'undefined') {
      this.runtimeDebug = !!(window as any).IFRAME_SDK_DEBUG;
    }
  }

  /**
   * Essential error logging - always available
   */
  error(message: string, data?: any): void {
    if (DEBUG_FLAG) {
      this.debugLog(LogLevel.ERROR, message, data);
    } else {
      const msg = `${this.prefix} ERROR: ${message}`;
      if (data !== undefined) {
        console.error(msg, data);
      } else {
        console.error(msg);
      }
    }
  }

  /**
   * Essential warning logging - always available
   */
  warn(message: string, data?: any): void {
    if (DEBUG_FLAG) {
      this.debugLog(LogLevel.WARN, message, data);
    } else {
      const msg = `${this.prefix} WARN: ${message}`;
      if (data !== undefined) {
        console.warn(msg, data);
      } else {
        console.warn(msg);
      }
    }
  }

  /**
   * Debug logging - only functional in debug builds
   */
  debug(message?: string, data?: any): void {
    if (DEBUG_FLAG) {
      this.debugLog(LogLevel.DEBUG, message || '', data);
    }
    // No-op in production
  }

  /**
   * Info logging - only functional in debug builds
   */
  info(message?: string, data?: any): void {
    if (DEBUG_FLAG) {
      this.debugLog(LogLevel.INFO, message || '', data);
    }
    // No-op in production
  }

  /**
   * Trace logging - only functional in debug builds
   */
  trace(message?: string, data?: any): void {
    if (DEBUG_FLAG) {
      this.debugLog(LogLevel.TRACE, message || '', data);
    }
    // No-op in production
  }

  /**
   * Group start - only functional in debug builds
   */
  group(title?: string): void {
    if (DEBUG_FLAG && this.isDebugEnabled()) {
      const formattedTitle = this.formatMessage(LogLevel.DEBUG, title || '');
      console.group(formattedTitle);
    }
  }

  /**
   * Collapsed group start - only functional in debug builds
   */
  groupCollapsed(title?: string): void {
    if (DEBUG_FLAG && this.isDebugEnabled()) {
      const formattedTitle = this.formatMessage(LogLevel.DEBUG, title || '');
      console.groupCollapsed(formattedTitle);
    }
  }

  /**
   * Group end - only functional in debug builds
   */
  groupEnd(): void {
    if (DEBUG_FLAG && this.isDebugEnabled()) {
      console.groupEnd();
    }
  }

  /**
   * Time measurement start - only functional in debug builds
   */
  time(label?: string): void {
    if (DEBUG_FLAG && this.isDebugEnabled()) {
      console.time(`${this.prefix} ${label || ''}`);
    }
  }

  /**
   * Time measurement end - only functional in debug builds
   */
  timeEnd(label?: string): void {
    if (DEBUG_FLAG && this.isDebugEnabled()) {
      console.timeEnd(`${this.prefix} ${label || ''}`);
    }
  }

  /**
   * Table logging - only functional in debug builds
   */
  table(data?: any): void {
    if (DEBUG_FLAG && this.isDebugEnabled()) {
      console.table(data);
    }
  }

  /**
   * Runtime debug control
   */
  enableRuntimeDebug(): void {
    this.runtimeDebug = true;
    if (typeof window !== 'undefined') {
      (window as any).IFRAME_SDK_DEBUG = true;
    }
  }

  disableRuntimeDebug(): void {
    this.runtimeDebug = false;
    if (typeof window !== 'undefined') {
      (window as any).IFRAME_SDK_DEBUG = false;
    }
  }

  isDebugActive(): boolean {
    return DEBUG_FLAG || this.runtimeDebug;
  }

  createComponentLogger(componentName: string): Logger {
    const componentLogger = new Logger();
    componentLogger.prefix = `${this.prefix} [${componentName}]`;
    return componentLogger;
  }

  /**
   * Получить всю историю логов
   * @returns Копия истории логов
   */
  getLogs(): LogEntry[] {
    return [...this.logHistory];
  }

  /**
   * Очистить историю логов
   */
  clearLogs(): void {
    this.logHistory = [];
  }

  // Debug-only methods that are eliminated in production builds

  /**
   * Check if debug logging is enabled - only in debug builds
   */
  private isDebugEnabled(): boolean {
    return DEBUG_FLAG && (true || this.runtimeDebug);
  }

  /**
   * Full debug logging implementation - only in debug builds
   */
  private debugLog(level: LogLevel, message: string, data?: any): void {
    if (!DEBUG_FLAG) return; // Should be eliminated by terser

    if (!this.isDebugEnabled()) return;

    const formattedMessage = this.formatMessage(level, message);
    const consoleMethod = this.getConsoleMethod(level);

    if (data !== undefined) {
      consoleMethod(formattedMessage, data);
    } else {
      consoleMethod(formattedMessage);
    }

    // Сохранить в историю (только если debug включен)
    if (this.isDebugActive()) {
      this.addToHistory({
        level: level,
        message,
        data: data !== undefined ? data : undefined,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Добавляет запись в историю логов с автоматической очисткой старых записей
   * @param entry - Запись для добавления
   */
  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry);

    // Автоматическая очистка старых записей при превышении лимита
    if (this.logHistory.length > this.MAX_LOG_HISTORY) {
      this.logHistory.shift();
    }
  }

  /**
   * Format log message with colors and formatting - only in debug builds
   */
  private formatMessage(level: LogLevel, message: string): string {
    if (!DEBUG_FLAG || !Logger.DEBUG_COLORS || !Logger.DEBUG_EMOJIS) {
      return `${this.prefix} ${level.toUpperCase()}: ${message}`;
    }

    const parts: string[] = [];
    const colors = Logger.DEBUG_COLORS;

    // Add timestamp
    const timestamp =
      new Date().toISOString().split('T')[1]?.replace('Z', '') || '';
    parts.push(`${colors.dim}${timestamp}${colors.reset}`);

    // Add prefix with emoji
    const emoji = Logger.DEBUG_EMOJIS[level];
    const prefix = `${emoji} ${this.prefix}`;
    parts.push(`${colors.bright}${prefix}${colors.reset}`);

    // Add level indicator
    const levelColor = this.getLevelColor(level);
    const levelText = level.toUpperCase();
    parts.push(`${levelColor}${levelText}${colors.reset}`);

    // Add main message
    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Get color for log level - only in debug builds
   */
  private getLevelColor(level: LogLevel): string {
    if (!DEBUG_FLAG || !Logger.DEBUG_COLORS) return '';

    const colors = Logger.DEBUG_COLORS;
    switch (level) {
      case LogLevel.DEBUG:
        return colors.cyan;
      case LogLevel.INFO:
        return colors.blue;
      case LogLevel.WARN:
        return colors.yellow;
      case LogLevel.ERROR:
        return colors.red;
      case LogLevel.TRACE:
        return colors.magenta;
      default:
        return colors.reset;
    }
  }

  /**
   * Get appropriate console method for log level - only in debug builds
   */
  private getConsoleMethod(
    level: LogLevel
  ): (message: string, ...args: any[]) => void {
    if (!DEBUG_FLAG) return console.log.bind(console);

    switch (level) {
      case LogLevel.DEBUG:
        return console.debug.bind(console);
      case LogLevel.INFO:
        return console.info.bind(console);
      case LogLevel.WARN:
        return console.warn.bind(console);
      case LogLevel.ERROR:
        return console.error.bind(console);
      case LogLevel.TRACE:
        return console.trace.bind(console);
      default:
        return console.log.bind(console);
    }
  }
}

/**
 * Logger instance
 */
export const logger = new Logger();

/**
 * Create specialized loggers for different components
 */
export const createLogger = (componentName: string) => {
  return logger.createComponentLogger(componentName);
};
