import { useState, useCallback } from "react";
import { useUser } from "../../../entities/user/model/useUser";
import { useAuth } from "../../../app/providers/FirebaseProvider";
import { createScan } from "../../../entities/scan/api/scanApi";
import { recognizeText } from "../lib/mlKit";
import { ScanCacheService } from "../../../shared/lib/cache/scanCache";
import { compressImage } from "../../../shared/lib/imageCompression";
import { RatingService } from "../../../shared/lib/rating/ratingService";
import { tracePerformance, logEvent, AnalyticsEvents, captureException } from "../../../shared/lib/monitoring";
import type { CreateScanResponse } from "../../../entities/scan/model/types";

/**
 * Хук для работы с камерой и сканированием
 */
export function useCameraScan() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanResult, setLastScanResult] =
    useState<CreateScanResponse | null>(null);
  const { user: authUser } = useAuth(); // Используем useAuth для проверки авторизации
  const { user, refresh } = useUser(); // Используем useUser только для получения данных пользователя

  /**
   * Обработать изображение: распознать текст и сохранить скан
   */
  const processImage = useCallback(
    async (imageUri: string) => {
      console.log("useCameraScan: processImage called with imageUri:", imageUri);
      console.log("useCameraScan: authUser:", authUser ? "exists" : "null");
      console.log("useCameraScan: userDoc:", user ? "exists" : "null");
      
      // Проверяем авторизацию через useAuth, а не через useUser
      // потому что useUser может быть еще не загружен
      if (!authUser) {
        console.error("useCameraScan: User not authorized (no authUser)");
        setError("Пользователь не авторизован");
        throw new Error("Пользователь не авторизован");
      }

      setLoading(true);
      setError(null);

      // Отслеживаем начало сканирования
      await logEvent(AnalyticsEvents.SCAN_STARTED);

      try {
        // Отслеживаем производительность всего процесса сканирования
        const result = await tracePerformance("scan_complete_process", async () => {
          // 1. Сжать изображение перед обработкой
          console.log("useCameraScan: Compressing image before processing...");
          const compressedUri = await compressImage(imageUri, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 85,
            format: "JPEG",
          });
          console.log("useCameraScan: Image compressed:", compressedUri);
          
          // 2. Распознать текст с помощью ML Kit (отслеживаем отдельно)
          console.log("useCameraScan: Starting text recognition for:", compressedUri);
          console.log("useCameraScan: Calling recognizeText...");
          
          const extractedText = await tracePerformance("scan_text_recognition", async () => {
            return await recognizeText(compressedUri);
          });
          
          console.log("useCameraScan: recognizeText completed");
          console.log("useCameraScan: Extracted text type:", typeof extractedText);
          console.log("useCameraScan: Extracted text length:", extractedText?.length || 0);
          console.log("useCameraScan: Extracted text preview:", extractedText?.substring(0, 100) || "empty");

          const trimmedText = extractedText?.trim() || "";
          console.log("useCameraScan: Trimmed text length:", trimmedText.length);
          
          if (!trimmedText || trimmedText.length === 0) {
            console.warn("useCameraScan: No text found in image");
            setError("Текст на изображении не найден или текст слишком размыт");
            setLoading(false);
            throw new Error("Текст на изображении не найден");
          }

          // 3. Сохранить скан на бэкенд
          console.log("useCameraScan: Saving scan to backend...");
          const scanResult = await createScan({ extractedText });
          console.log("useCameraScan: Scan saved, result:", scanResult);

          // 4. Сохранить скан в локальный кэш
          if (scanResult?.scan) {
            await ScanCacheService.addScan(scanResult.scan);
            console.log("useCameraScan: Scan added to cache");
          }

          // 5. Обновить баланс пользователя
          console.log("useCameraScan: Refreshing user data...");
          await refresh();
          console.log("useCameraScan: User data refreshed");

          // 6. Увеличить счетчик успешных сканов для рейтинга
          await RatingService.incrementSuccessfulScans();
          console.log("useCameraScan: Successful scans count incremented");

          // Отслеживаем успешное сканирование
          await logEvent(AnalyticsEvents.SCAN_COMPLETED, {
            scan_id: scanResult?.scan?.scanId,
            text_length: trimmedText.length,
            remaining_credits: scanResult?.remainingCredits || 0,
          });

          // Автосинхронизация с облаком (если включена)
          if (scanResult?.scan) {
            try {
              const { getCloudStorageSettings } = await import("../../../shared/lib/cloud-storage/settingsStorage");
              const { addSyncTask } = await import("../../../shared/lib/sync-queue/syncQueue");
              const settings = await getCloudStorageSettings();
              
              if (settings.autoSyncEnabled && settings.service && scanResult.scan) {
                await addSyncTask({
                  scanId: scanResult.scan.scanId,
                  scanData: scanResult.scan,
                  cloudService: settings.service,
                  format: settings.defaultFormat,
                  folderId: settings.folderId,
                  folderPath: settings.folderPath,
                });
                console.log("[useCameraScan] Scan added to sync queue");
              }
            } catch (syncError) {
              // Не блокируем основной процесс при ошибке синхронизации
              console.error("[useCameraScan] Failed to add scan to sync queue:", syncError);
            }
          }

          return scanResult;
        });

        setLastScanResult(result);
        console.log("useCameraScan: processImage completed successfully");
        return result;
      } catch (err) {
        console.error("useCameraScan: Error in processImage:", err);
        console.error("useCameraScan: Error type:", typeof err);
        console.error("useCameraScan: Error instanceof Error:", err instanceof Error);
        const errorMessage =
          err instanceof Error ? err.message : String(err);
        console.error("useCameraScan: Error message:", errorMessage);
        
        // Отслеживаем ошибку сканирования
        const error = err instanceof Error ? err : new Error(String(err));
        captureException(error, {
          tags: { feature: "scan", step: "process_image" },
          extra: { errorMessage },
        });
        
        // Логируем событие ошибки
        await logEvent(AnalyticsEvents.SCAN_FAILED, {
          error_message: errorMessage,
        });
        
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
        console.log("useCameraScan: processImage finally block - loading set to false");
      }
    },
    [authUser, refresh], // Используем authUser вместо user
  );

  /**
   * Сбросить последний результат
   */
  const reset = useCallback(() => {
    setLastScanResult(null);
    setError(null);
  }, []);

  return {
    processImage,
    loading,
    error,
    lastScanResult,
    reset,
    hasCredits: (user?.scanCredits ?? 0) > 0,
    credits: user?.scanCredits ?? 0,
  };
}

