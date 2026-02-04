/**
 * Sync Existing Scans
 * Синхронизация существующих сканов при первом подключении облака
 */

import { getScans } from "../../../entities/scan/api/scanApi";
import { addSyncTask } from "../sync-queue/syncQueue";
import { getCloudStorageSettings } from "./settingsStorage";
import { showToast } from "../../ui/Toast";
import { i18n } from "../i18n/i18n";

/**
 * Синхронизировать все существующие сканы с облаком
 */
export async function syncExistingScans(): Promise<void> {
  try {
    const settings = await getCloudStorageSettings();
    
    if (!settings.service) {
      throw new Error("Облачное хранилище не настроено");
    }

    showToast(i18n.t("cloud_sync.loading_list"), "info");

    const response = await getScans(1000);
    const scans = response.scans || [];

    if (scans.length === 0) {
      showToast(i18n.t("cloud_sync.no_scans"), "info");
      return;
    }

    showToast(i18n.t("cloud_sync.adding_queue", { count: scans.length }), "info");

    // Добавляем каждый скан в очередь синхронизации
    let addedCount = 0;
    for (const scan of scans) {
      try {
        await addSyncTask({
          scanId: scan.scanId,
          scanData: scan,
          cloudService: settings.service!,
          format: settings.defaultFormat,
          folderId: settings.folderId,
          folderPath: settings.folderPath,
        });
        addedCount++;
      } catch (error) {
        console.error(`[SyncExistingScans] Failed to add scan ${scan.scanId}:`, error);
      }
    }

    showToast(
      i18n.t("cloud_sync.added_count", { added: addedCount, total: scans.length }),
      "success"
    );
  } catch (error) {
    console.error("[SyncExistingScans] Failed to sync existing scans:", error);
    showToast(i18n.t("cloud_sync.sync_existing_error"), "error");
    throw error;
  }
}
