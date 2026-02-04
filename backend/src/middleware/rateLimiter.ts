import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/**
 * Rate limiter для аутентификационных эндпоинтов
 * Защита от brute-force атак
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 10, // максимум 10 запросов за 15 минут
  message: {
    error: "TOO_MANY_REQUESTS",
    message: "Слишком много запросов. Попробуйте позже через 15 минут.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Используем IP + email (если есть) для более точного ограничения
    const email = req.body?.email || "";
    return `${ipKeyGenerator(req)}-${email}`;
  },
});

/**
 * Rate limiter для отправки verification codes
 * Более строгий лимит - 3 запроса на email в час
 */
export const verificationCodeRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 3, // максимум 3 запроса в час
  message: {
    error: "TOO_MANY_REQUESTS",
    message: "Слишком много запросов на отправку кода. Попробуйте позже через час.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Ограничиваем по email
    return req.body?.email || ipKeyGenerator(req) || "unknown";
  },
});

/**
 * Общий rate limiter для API
 * Менее строгий для обычных запросов
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 100, // 100 запросов в минуту
  message: {
    error: "TOO_MANY_REQUESTS",
    message: "Слишком много запросов. Попробуйте позже.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
