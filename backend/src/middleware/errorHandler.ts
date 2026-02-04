import { Request, Response, NextFunction } from "express";
import { AppError, isOperationalError } from "../utils/errors";

/**
 * Глобальный middleware для обработки ошибок
 * Должен быть последним middleware в цепочке
 */
export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Логируем ошибку
  console.error("[ErrorHandler] Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Если это операционная ошибка (AppError), отправляем клиенту детали
  if (isOperationalError(err)) {
    const appError = err as AppError;
    res.status(appError.statusCode).json({
      error: appError.code,
      message: appError.message,
      ...(process.env.NODE_ENV === "development" && { stack: appError.stack }),
    });
    return;
  }

  // Для неожиданных ошибок скрываем детали в production
  const statusCode = 500;
  const message = process.env.NODE_ENV === "production" 
    ? "Внутренняя ошибка сервера" 
    : err.message;

  res.status(statusCode).json({
    error: "INTERNAL_ERROR",
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

/**
 * Обертка для async route handlers
 * Автоматически передает ошибки в next()
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
