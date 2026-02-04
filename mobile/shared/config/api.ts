/**
 * Конфигурация API
 * Базовый URL бэкенда. Задаётся через переменную окружения API_BASE_URL (например, при сборке или через react-native-config).
 * Для Android эмулятора по умолчанию: 10.0.2.2:4000 (localhost хоста).
 * Для физического устройства или прода: укажите API_BASE_URL (например https://api.example.com).
 */
export const API_BASE_URL =
  typeof process !== "undefined" && process.env?.API_BASE_URL
    ? process.env.API_BASE_URL
    : "http://10.0.2.2:4000";

export const API_ENDPOINTS = {
  health: "/health",
  users: {
    me: "/api/users/me",
    register: "/api/users/register",
  },
  scans: {
    list: "/api/scans",
    create: "/api/scans",
    updateComment: (scanId: string) => `/api/scans/${scanId}/comment`,
    updateFavorite: (scanId: string) => `/api/scans/${scanId}/favorite`,
    delete: (scanId: string) => `/api/scans/${scanId}`,
  },
  iap: {
    verify: "/api/iap/verify",
  },
  ads: {
    rewardNonce: "/api/ads/reward/nonce",
    reward: "/api/ads/reward",
  },
  auth: {
    sendVerificationCode: "/api/auth/send-verification-code",
    verifyCode: "/api/auth/verify-code",
    checkEmailVerified: "/api/auth/check-email-verified",
    checkEmailExists: "/api/auth/check-email-exists",
  },
  feedback: {
    submit: "/api/feedback",
  },
} as const;

