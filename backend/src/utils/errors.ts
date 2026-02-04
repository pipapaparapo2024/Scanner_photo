/**
 * Кастомные классы ошибок для более точной обработки ошибок
 */

/**
 * Базовый класс для кастомных ошибок приложения
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Операционная ошибка (ожидаемая)

    // Сохраняем правильный stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Ошибка: недостаточно кредитов для сканирования
 */
export class NoCreditsError extends AppError {
  constructor(message = "Недостаточно кредитов для сканирования") {
    super(message, 402, "NO_CREDITS");
  }
}

/**
 * Ошибка: пользователь не найден
 */
export class UserNotFoundError extends AppError {
  constructor(userId?: string) {
    const message = userId 
      ? `Пользователь с ID ${userId} не найден` 
      : "Пользователь не найден";
    super(message, 404, "USER_NOT_FOUND");
  }
}

/**
 * Ошибка: ресурс не найден
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} с ID ${id} не найден` 
      : `${resource} не найден`;
    super(message, 404, "NOT_FOUND");
  }
}

/**
 * Ошибка: нет доступа к ресурсу (не владелец)
 */
export class ForbiddenError extends AppError {
  constructor(message = "Нет доступа к этому ресурсу") {
    super(message, 403, "FORBIDDEN");
  }
}

/**
 * Ошибка валидации входных данных
 */
export class ValidationError extends AppError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, 400, "VALIDATION_ERROR");
    this.field = field;
  }
}

/**
 * Ошибка аутентификации
 */
export class AuthenticationError extends AppError {
  constructor(message = "Требуется аутентификация") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

/**
 * Ошибка: токен недействителен или истек
 */
export class InvalidTokenError extends AppError {
  constructor(message = "Недействительный или истекший токен") {
    super(message, 401, "INVALID_TOKEN");
  }
}

/**
 * Ошибка: слишком много запросов (rate limiting)
 */
export class TooManyRequestsError extends AppError {
  constructor(message = "Слишком много запросов. Попробуйте позже.") {
    super(message, 429, "TOO_MANY_REQUESTS");
  }
}

/**
 * Ошибка: конфликт данных (например, дубликат email)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

/**
 * Ошибка: внешний сервис недоступен
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error) {
    const message = `Ошибка внешнего сервиса: ${service}`;
    super(message, 503, "EXTERNAL_SERVICE_ERROR");
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

/**
 * Проверка, является ли ошибка операционной (ожидаемой)
 */
export function isOperationalError(error: unknown): error is AppError {
  return error instanceof AppError && error.isOperational;
}
