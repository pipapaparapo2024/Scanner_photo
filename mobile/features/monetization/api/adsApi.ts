import { apiClient } from "../../../shared/lib/api";
import { API_ENDPOINTS } from "../../../shared/config";

/**
 * API для работы с рекламой
 */

export interface RewardNonceResponse {
  token: string;
}

export interface RewardRequest {
  token: string;
}

export interface RewardResponse {
  addedCredits: number;
  totalCredits: number;
}

/**
 * Получить одноразовый токен для просмотра рекламы
 */
export async function getRewardNonce(): Promise<RewardNonceResponse> {
  return apiClient.post<RewardNonceResponse>(API_ENDPOINTS.ads.rewardNonce);
}

/**
 * Подтвердить просмотр рекламы и получить награду
 */
export async function claimReward(
  data: RewardRequest,
): Promise<RewardResponse> {
  return apiClient.post<RewardResponse>(API_ENDPOINTS.ads.reward, data);
}

