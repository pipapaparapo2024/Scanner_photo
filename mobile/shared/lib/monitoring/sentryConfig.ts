/**
 * Конфигурация Sentry
 * Читает DSN из различных источников
 */

/**
 * Получить Sentry DSN
 * Проверяет несколько источников в порядке приоритета
 */
export function getSentryDsn(): string {
  // 1. Из process.env (если установлен через Metro bundler)
  if (process.env.SENTRY_DSN) {
    return process.env.SENTRY_DSN;
  }
  
  // 2. Из глобальной переменной (если установлен через нативный код)
  if ((global as any).__SENTRY_DSN__) {
    return (global as any).__SENTRY_DSN__;
  }
  
  // 3. Пустая строка - Sentry не будет инициализирован
  return "";
}
