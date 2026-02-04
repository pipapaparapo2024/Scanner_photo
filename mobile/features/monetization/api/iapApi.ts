import { apiClient } from "../../../shared/lib/api";
import { API_ENDPOINTS } from "../../../shared/config";

/**
 * API для работы с покупками (IAP)
 */

export interface IapVerifyRequest {
  productId: string;
  purchaseToken: string;
  orderId?: string;
}

export interface IapVerifyResponse {
  addedCredits: number;
  totalCredits: number;
}

/**
 * Верифицировать покупку RuStore
 */
export async function verifyIap(
  data: IapVerifyRequest,
): Promise<IapVerifyResponse> {
  return apiClient.post<IapVerifyResponse>(API_ENDPOINTS.iap.verify, data);
}

