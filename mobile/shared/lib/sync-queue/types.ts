/**
 * Sync Queue Types
 * Типы для очереди синхронизации
 */

import type { CloudService } from "../cloud-storage/cloudStorageClient";
import type { ScanDoc } from "../../../entities/scan/model/types";

export type SyncTaskStatus = "pending" | "processing" | "completed" | "failed";

export interface SyncTask {
  id: string;
  scanId: string;
  scanData: ScanDoc;
  cloudService: CloudService;
  format: "pdf" | "docx";
  folderId?: string; // Для Google Drive
  folderPath?: string; // Для Яндекс.Диск
  status: SyncTaskStatus;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  error?: string;
  filePath?: string; // Путь к сгенерированному файлу
}

export const MAX_RETRY_COUNT = 3;
export const RETRY_DELAYS = [30000, 60000, 120000]; // 30s, 60s, 120s
