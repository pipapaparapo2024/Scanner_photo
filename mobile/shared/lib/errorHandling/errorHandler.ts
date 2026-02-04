/**
 * Умная обработка ошибок
 * Разделяет ошибки на категории и обрабатывает их соответственно
 */

export enum ErrorCategory {
  NETWORK = "network",
  AUTH = "auth",
  VALIDATION = "validation",
  SERVER = "server",
  UNKNOWN = "unknown",
}

export interface ErrorInfo {
  category: ErrorCategory;
  message: string;
  userMessage: string;
  shouldShowToUser: boolean;
  shouldLog: boolean;
}

/**
 * Определить категорию ошибки
 */
function categorizeError(error: any): ErrorCategory {
  if (!error) return ErrorCategory.UNKNOWN;

  const errorMessage = error.message?.toLowerCase() || "";
  const errorCode = error.code?.toLowerCase() || "";
  const status = error.status || error.statusCode;

  // Сетевые ошибки
  if (
    errorMessage.includes("network") ||
    errorMessage.includes("fetch") ||
    errorMessage.includes("timeout") ||
    errorCode.includes("network") ||
    status === 0
  ) {
    return ErrorCategory.NETWORK;
  }

  // Ошибки авторизации
  if (
    errorMessage.includes("auth") ||
    errorMessage.includes("unauthorized") ||
    errorMessage.includes("forbidden") ||
    errorCode.includes("auth") ||
    status === 401 ||
    status === 403
  ) {
    return ErrorCategory.AUTH;
  }

  // Ошибки валидации
  if (
    errorMessage.includes("invalid") ||
    errorMessage.includes("validation") ||
    errorMessage.includes("required") ||
    status === 400 ||
    status === 422
  ) {
    return ErrorCategory.VALIDATION;
  }

  // Серверные ошибки
  if (status >= 500 || errorMessage.includes("server") || errorMessage.includes("internal")) {
    return ErrorCategory.SERVER;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Получить понятное сообщение для пользователя
 */
function getUserMessage(error: any, category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.NETWORK:
      return "Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.";
    
    case ErrorCategory.AUTH:
      if (error.message?.includes("invalid-credential") || error.message?.includes("wrong-password")) {
        return "Неверно введены данные. Проверьте email и пароль.";
      }
      return "Ошибка авторизации. Войдите снова.";
    
    case ErrorCategory.VALIDATION:
      // Используем оригинальное сообщение, если оно понятное
      if (error.message && error.message.length < 100) {
        return error.message;
      }
      return "Проверьте правильность введенных данных.";
    
    case ErrorCategory.SERVER:
      return "Ошибка на сервере. Попробуйте позже или обратитесь в поддержку.";
    
    default:
      return "Произошла ошибка. Попробуйте еще раз.";
  }
}

/**
 * Обработать ошибку и получить информацию о ней
 */
export function handleError(error: any, context?: string): ErrorInfo {
  const category = categorizeError(error);
  const message = error?.message || String(error) || "Unknown error";
  const userMessage = getUserMessage(error, category);
  
  // Логируем все ошибки в консоль для разработки
  if (__DEV__) {
    console.error(`[ErrorHandler] ${context || "Unknown context"}:`, {
      category,
      message,
      error,
    });
  }

  // Определяем, нужно ли показывать ошибку пользователю
  // Критические ошибки всегда показываем
  const shouldShowToUser = 
    category === ErrorCategory.NETWORK ||
    category === ErrorCategory.AUTH ||
    category === ErrorCategory.VALIDATION ||
    category === ErrorCategory.SERVER;

  return {
    category,
    message,
    userMessage,
    shouldShowToUser,
    shouldLog: true, // Всегда логируем для мониторинга
  };
}

/**
 * Обработать и залогировать ошибку для мониторинга
 * Отправляет в Sentry для отслеживания
 */
export function logError(error: any, context?: string, metadata?: Record<string, any>) {
  const errorInfo = handleError(error, context);
  
  // Отправляем в Sentry
  try {
    const { captureException } = require("../monitoring");
    const errorToCapture = error instanceof Error ? error : new Error(String(error));
    captureException(errorToCapture, {
      tags: { 
        category: errorInfo.category,
        context: context || "unknown",
      },
      extra: { 
        ...metadata,
        userMessage: errorInfo.userMessage,
      },
    });
  } catch (e) {
    // Если мониторинг не инициализирован, просто логируем
    console.warn("[ErrorLogger] Monitoring not available:", e);
  }
  
  if (errorInfo.shouldLog) {
    // Также логируем в консоль для разработки
    console.error("[ErrorLogger]", {
      category: errorInfo.category,
      message: errorInfo.message,
      context,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }
  
  return errorInfo;
}
