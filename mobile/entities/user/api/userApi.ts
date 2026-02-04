import { apiClient } from "../../../shared/lib/api";
import { API_ENDPOINTS } from "../../../shared/config";
import type { UserDoc } from "../model/types";

/**
 * API для работы с пользователем
 */

export interface GetUserMeResponse extends UserDoc {}

/**
 * Получить или создать профиль пользователя
 */
export async function getUserMe(): Promise<GetUserMeResponse> {
  return apiClient.get<GetUserMeResponse>(API_ENDPOINTS.users.me);
}

/**
 * Обновить данные пользователя
 */
export async function updateUser(data: Partial<UserDoc>): Promise<UserDoc> {
  return apiClient.patch<UserDoc>(API_ENDPOINTS.users.me, data);
}

