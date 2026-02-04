/**
 * Sync Worker
 * Фоновый воркер для обработки очереди синхронизации
 */

import NetInfo from "@react-native-community/netinfo";
import { getPendingTasks, updateSyncTask, removeSyncTask } from "./syncQueue";
import { MAX_RETRY_COUNT, RETRY_DELAYS, type SyncTask } from "./types";
import { generateDocument } from "../document-generator";
import { uploadFile } from "../cloud-storage/cloudStorageClient";
import { getCloudStorageSettings } from "../cloud-storage/settingsStorage";
import RNFS from "react-native-fs";
import { captureException } from "../monitoring";
import { showToast } from "../../ui/Toast";
import { i18n } from "../i18n/i18n";

export class SyncWorker {
  private isRunning = false;
  private isPaused = false;
  private processingTaskId: string | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;

  /**
   * Запустить воркер
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.isPaused = false;
    console.log("[SyncWorker] Started");

    // Начинаем обработку очереди
    this.processQueue();
  }

  /**
   * Остановить воркер
   */
  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    console.log("[SyncWorker] Stopped");
  }

  /**
   * Приостановить синхронизацию
   */
  pause(): void {
    this.isPaused = true;
    console.log("[SyncWorker] Paused");
  }

  /**
   * Возобновить синхронизацию
   */
  resume(): void {
    this.isPaused = false;
    console.log("[SyncWorker] Resumed");
    // Продолжаем обработку очереди
    this.processQueue();
  }

  /**
   * Обработать очередь задач
   */
  private async processQueue(): Promise<void> {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    // Проверяем интернет
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log("[SyncWorker] No internet connection, waiting...");
      // Повторим через 30 секунд
      this.retryTimeout = setTimeout(() => {
        this.processQueue();
      }, 30000);
      return;
    }

    // Получаем pending задачи
    const pendingTasks = await getPendingTasks();
    
    if (pendingTasks.length === 0) {
      console.log("[SyncWorker] No pending tasks");
      return;
    }

    // Берем первую задачу
    const task = pendingTasks[0];
    this.processingTaskId = task.id;

    try {
      // Обновляем статус на processing
      await updateSyncTask(task.id, { status: "processing" });

      // Обрабатываем задачу
      await this.processTask(task);

      // Удаляем задачу после успешной обработки
      await removeSyncTask(task.id);
      console.log(`[SyncWorker] Task ${task.id} completed successfully`);

      // Продолжаем обработку следующей задачи
      this.processingTaskId = null;
      setTimeout(() => {
        this.processQueue();
      }, 1000); // Небольшая задержка между задачами
    } catch (error) {
      console.error(`[SyncWorker] Task ${task.id} failed:`, error);
      
      // Увеличиваем счетчик попыток
      const newRetryCount = task.retryCount + 1;
      
      if (newRetryCount >= MAX_RETRY_COUNT) {
        // Превышен лимит попыток - помечаем как failed
        await updateSyncTask(task.id, {
          status: "failed",
          retryCount: newRetryCount,
          error: error instanceof Error ? error.message : String(error),
        });

        // Показываем тост пользователю
        showToast(
          i18n.t("sync.error_message"),
          "error"
        );

        // Удаляем задачу после показа алерта
        await removeSyncTask(task.id);
      } else {
        // Планируем повторную попытку
        const delay = RETRY_DELAYS[newRetryCount - 1] || 30000;
        
        await updateSyncTask(task.id, {
          status: "pending",
          retryCount: newRetryCount,
          error: error instanceof Error ? error.message : String(error),
        });

        // Показываем уведомление о синхронизации
        if (newRetryCount === 1) {
          showToast(
            i18n.t("sync.progress_message"),
            "info"
          );
        }

        // Планируем повтор через delay
        this.retryTimeout = setTimeout(() => {
          this.processQueue();
        }, delay);
      }

      this.processingTaskId = null;
    }
  }

  /**
   * Обработать одну задачу
   */
  private async processTask(task: SyncTask): Promise<void> {
    // Defensive check: Validate scanData structure
    if (!task.scanData || typeof task.scanData.extractedText !== 'string' || !task.scanData.scanDate) {
       throw new Error(`Invalid scan data structure for task ${task.id}`);
    }

    try {
      // Получаем настройки
      const settings = await getCloudStorageSettings();
      
      if (!settings.service) {
        throw new Error("Облачное хранилище не настроено");
      }

      // Генерируем документ
      console.log(`[SyncWorker] Generating ${task.format} document for scan ${task.scanId}`);
      const filePath = await generateDocument(task.scanData, task.format);
      
      // Сохраняем путь к файлу в задаче
      await updateSyncTask(task.id, { filePath });

      // Формируем имя файла
      const scanDate = new Date(task.scanData.scanDate);
      const dateStr = scanDate.toISOString().split("T")[0];
      const fileName = `${dateStr}_scan_${task.scanId}.${task.format}`;

      // Загружаем в облако
      console.log(`[SyncWorker] Uploading file to ${task.cloudService}`);
      await uploadFile(
        task.cloudService,
        filePath,
        fileName,
        task.folderId,
        task.folderPath
      );

      // Удаляем временный файл после успешной загрузки
      try {
        await RNFS.unlink(filePath);
      } catch (e) {
        console.warn(`[SyncWorker] Failed to delete temp file ${filePath}:`, e);
      }

      console.log(`[SyncWorker] Task ${task.id} completed successfully`);
    } catch (error) {
      // Логируем ошибку в Sentry
      captureException(error instanceof Error ? error : new Error(String(error)), {
        tags: { feature: "cloud_sync", task_id: task.id },
        extra: { scanId: task.scanId, service: task.cloudService },
      });

      throw error;
    }
  }
}

// Singleton экземпляр
let syncWorkerInstance: SyncWorker | null = null;

/**
 * Получить экземпляр SyncWorker
 */
export function getSyncWorker(): SyncWorker {
  if (!syncWorkerInstance) {
    syncWorkerInstance = new SyncWorker();
  }
  return syncWorkerInstance;
}
