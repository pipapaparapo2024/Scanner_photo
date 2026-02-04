import { apiClient } from "./client";
import { API_ENDPOINTS } from "../../config/api";

/**
 * API для работы с аутентификацией
 */

/**
 * Отправить код подтверждения на email
 */
export async function sendVerificationCode(email: string): Promise<void> {
  return apiClient.post(API_ENDPOINTS.auth.sendVerificationCode, { email });
}

/**
 * Проверить код подтверждения
 */
export async function verifyCode(email: string, code: string): Promise<void> {
  return apiClient.post(API_ENDPOINTS.auth.verifyCode, { email, code });
}

/**
 * Проверить, подтвержден ли email
 */
export async function checkEmailVerified(email: string): Promise<{ verified: boolean }> {
  return apiClient.get(`${API_ENDPOINTS.auth.checkEmailVerified}?email=${encodeURIComponent(email)}`);
}

/**
 * Проверить, зарегистрирован ли email
 */
export async function checkEmailExists(email: string): Promise<{ exists: boolean }> {
  return apiClient.get(`${API_ENDPOINTS.auth.checkEmailExists}?email=${encodeURIComponent(email)}`);
}

/**
 * Зарегистрировать пользователя в Firestore (коллекция users) после создания в Firebase Auth.
 * Сохраняет захешированный пароль.
 * @param idToken — Firebase ID Token; обязательно для /api/users/register (authMiddleware)
 */
export async function registerUser(
  email: string,
  password: string,
  idToken: string,
): Promise<void> {
  return apiClient.post(API_ENDPOINTS.users.register, { email, password }, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
}

