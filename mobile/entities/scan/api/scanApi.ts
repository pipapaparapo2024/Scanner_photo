import { apiClient } from "../../../shared/lib/api";
import { API_ENDPOINTS } from "../../../shared/config";
import type {
  ScanDoc,
  CreateScanRequest,
  CreateScanResponse,
  GetScansResponse,
} from "../model/types";

/**
 * API для работы со сканами
 */

/**
 * Получить историю сканов пользователя с пагинацией
 */
export async function getScans(limit = 20, cursor?: string | null): Promise<GetScansResponse> {
  const params = new URLSearchParams();
  params.append("limit", limit.toString());
  if (cursor) {
    params.append("cursor", cursor);
  }
  
  return apiClient.get<GetScansResponse>(`${API_ENDPOINTS.scans.list}?${params.toString()}`);
}

/**
 * Создать новый скан (сохранить распознанный текст)
 */
export async function createScan(
  data: CreateScanRequest,
): Promise<CreateScanResponse> {
  return apiClient.post<CreateScanResponse>(
    API_ENDPOINTS.scans.create,
    data,
  );
}

/**
 * Обновить комментарий к скану
 */
export async function updateScanComment(scanId: string, comment: string): Promise<void> {
  return apiClient.patch(API_ENDPOINTS.scans.updateComment(scanId), { comment });
}

/**
 * Обновить статус избранного
 */
export async function updateScanFavorite(scanId: string, isFavorite: boolean): Promise<void> {
  return apiClient.patch(API_ENDPOINTS.scans.updateFavorite(scanId), { isFavorite });
}

/**
 * Удалить скан
 */
export async function deleteScan(scanId: string): Promise<void> {
  return apiClient.delete(API_ENDPOINTS.scans.delete(scanId));
}

