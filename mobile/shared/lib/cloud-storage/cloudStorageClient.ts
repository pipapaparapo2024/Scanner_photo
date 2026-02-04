/**
 * Cloud Storage Client
 * Единый интерфейс для работы с облачными хранилищами
 */

import {
  getGoogleDriveFolders,
  ensureFolderExists as ensureGoogleDriveFolder,
  uploadFileToGoogleDrive,
  checkGoogleDriveAvailability,
} from "./googleDriveClient";
import {
  getYandexDiskFolders,
  ensureYandexDiskFolderExists,
  uploadFileToYandexDisk,
  checkYandexDiskAvailability,
} from "./yandexDiskClient";

export type CloudService = "google-drive" | "yandex-disk";

/**
 * Получить список папок для указанного сервиса
 */
export async function getFolders(service: CloudService): Promise<Array<{ id?: string; path?: string; name: string }>> {
  switch (service) {
    case "google-drive":
      const gdFolders = await getGoogleDriveFolders();
      return gdFolders.map((f) => ({ id: f.id, name: f.name }));
    case "yandex-disk":
      const ydFolders = await getYandexDiskFolders();
      return ydFolders.map((f) => ({ path: f.path, name: f.name }));
    default:
      throw new Error(`Неподдерживаемый сервис: ${service}`);
  }
}

/**
 * Убедиться, что папка существует (создать если нет)
 */
export async function ensureFolderExists(
  service: CloudService,
  folderName: string,
  folderId?: string,
  folderPath?: string
): Promise<void> {
  switch (service) {
    case "google-drive":
      await ensureGoogleDriveFolder(folderName);
      break;
    case "yandex-disk":
      const path = folderPath || `/ScanImg`;
      await ensureYandexDiskFolderExists(path);
      break;
    default:
      throw new Error(`Неподдерживаемый сервис: ${service}`);
  }
}

/**
 * Загрузить файл в облако
 */
export async function uploadFile(
  service: CloudService,
  filePath: string,
  fileName: string,
  folderId?: string,
  folderPath?: string
): Promise<string> {
  switch (service) {
    case "google-drive":
      return await uploadFileToGoogleDrive(filePath, fileName, folderId);
    case "yandex-disk":
      const path = folderPath || "/ScanImg";
      return await uploadFileToYandexDisk(filePath, fileName, path);
    default:
      throw new Error(`Неподдерживаемый сервис: ${service}`);
  }
}

/**
 * Проверить доступность сервиса
 */
export async function checkAvailability(service: CloudService): Promise<boolean> {
  switch (service) {
    case "google-drive":
      return await checkGoogleDriveAvailability();
    case "yandex-disk":
      return await checkYandexDiskAvailability();
    default:
      return false;
  }
}
