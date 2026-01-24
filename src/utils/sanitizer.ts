/**
 * Утилиты для санитизации данных для публичного API
 * Маскирует чувствительные данные и удаляет внутренние ссылки
 */

import type { PublicSDKState, SDKState, BaseConfig } from '../types';

/**
 * Создает санитизированное публичное состояние из внутреннего состояния SDK
 * Удаляет внутренние ссылки (modal, iframe, pendingPromise) и маскирует чувствительные данные
 * @param state - Внутреннее состояние SDK
 * @returns Санитизированное публичное состояние
 */
export function getPublicState<TConfig extends BaseConfig>(
  state: SDKState<TConfig>
): PublicSDKState {
  return {
    isOpen: state.isOpen,
    currentTheme: state.currentTheme,
    iframeUrl: state.iframeUrl,
    initializationTime: state.initializationTime,
    lastOpenTime: state.lastOpenTime,
    // НЕ включаем: modal, iframe, pendingPromise, config (внутренние ссылки)
  };
}

/**
 * Рекурсивно маскирует чувствительные поля в объекте
 * @param data - Данные для санитизации
 * @param sensitiveFields - Массив имен полей для маскирования
 * @returns Санитизированные данные
 */
export function sanitizeData(
  data: any,
  sensitiveFields: string[] = []
): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, sensitiveFields));
  }

  const sanitized = { ...data };

  // Маскируем чувствительные поля
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Рекурсивно обрабатываем вложенные объекты
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key], sensitiveFields);
    }
  }

  return sanitized;
}
