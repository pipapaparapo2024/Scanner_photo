import { useState, useEffect, useCallback, useRef } from "react";
import { getScans, deleteScan, updateScanFavorite } from "../../../entities/scan/api/scanApi";
import { ScanCacheService } from "../../../shared/lib/cache/scanCache";
import { showToast } from "../../../shared/ui/Toast";
import type { ScanDoc } from "../../../entities/scan/model/types";
import { useAuth } from "../../../app/providers/FirebaseProvider";
import { i18n } from "../../../shared/lib/i18n/i18n";

const INITIAL_LIMIT = 20; // Начальная загрузка
const PAGE_SIZE = 20; // Размер страницы для подгрузки

/**
 * Хук для работы с историей сканов с поддержкой кэширования и пагинации
 */
export function useScanHistory() {
  const [scans, setScans] = useState<ScanDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  const { user } = useAuth();
  
  // Функция загрузки сканов
  const loadScans = useCallback(async (reset = true) => {
    // Не загружаем, если пользователь не авторизован
    if (!user) return;
    
    if (isLoadingRef.current) return;
    
    try {
      isLoadingRef.current = true;
      if (reset) {
        setLoading(true);
        cursorRef.current = null;
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      // При первой загрузке показываем кэш
      if (reset) {
        const cachedScans = await ScanCacheService.loadScans();
        if (cachedScans && cachedScans.length > 0) {
          // Фильтруем битые данные из кэша
          const validCachedScans = cachedScans.filter(s => s && s.scanId && s.scanDate);
          
          if (validCachedScans.length > 0) {
            console.log("useScanHistory: Показываем сканы из кэша");
            setScans(validCachedScans.slice(0, INITIAL_LIMIT));
            setIsFromCache(true);
            setLoading(false);
          }
        }
      }

      // Загружаем с сервера
      console.log("useScanHistory: Загрузка сканов с сервера (cursor:", cursorRef.current, "limit:", PAGE_SIZE, ")");
      const response = await getScans(PAGE_SIZE, cursorRef.current);
      
      if (!response) {
        console.error("useScanHistory: Received empty response from getScans");
        // Не выбрасываем ошибку, чтобы не сломать UI, просто логируем
        // throw new Error("Empty response from server");
        return;
      }

      const serverScans = Array.isArray(response.scans) ? response.scans : [];
      // Фильтруем битые данные с сервера
      const validServerScans = serverScans.filter(s => s && s.scanId && s.scanDate);
      const nextCursor = response.nextCursor;

      console.log("useScanHistory: Загружено с сервера:", validServerScans.length, "сканов");
      
      if (reset) {
        // Первая загрузка
        let finalScans = validServerScans;
        
        // Если есть закэшированные сканы, проверяем, нет ли там новых сканов
        const cachedScans = await ScanCacheService.loadScans();
        if (cachedScans && cachedScans.length > 0) {
          const validCachedScans = cachedScans.filter(s => s && s.scanId && s.scanDate);
          const serverIds = new Set(finalScans.map(s => s.scanId));
          const missingInServer = validCachedScans.filter(s => !serverIds.has(s.scanId));
          
          if (missingInServer.length > 0) {
            console.log(`useScanHistory: Найдено ${missingInServer.length} сканов в кэше, отсутствующих на сервере. Объединяем.`);
            finalScans = [...missingInServer, ...finalScans];
          }
        }

        // Заменяем все сканы
        setScans(finalScans);
        setIsFromCache(false);
        
        // Сохраняем объединенный результат в кэш
        if (finalScans.length > 0) {
          await ScanCacheService.saveScans(finalScans);
        }
      } else {
        // Подгрузка - добавляем к существующим
        setScans((prev) => [...prev, ...serverScans]);
      }
      
      // Проверяем, есть ли еще данные для загрузки
      if (!nextCursor || serverScans.length < PAGE_SIZE) {
        setHasMore(false);
        cursorRef.current = null;
      } else {
        cursorRef.current = nextCursor;
      }
      
      // Если массив пустой, сбрасываем ошибку
      if (serverScans.length === 0 && reset) {
        setError(null);
      }
    } catch (err: any) {
      console.error("Failed to load scans:", err);
      
      // Проверяем, это ошибка сети/подключения
      const isNetworkError = 
        err?.status === 0 || 
        err?.status === undefined ||
        err?.message?.includes('Network') || 
        err?.message?.includes('network') || 
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('Network request failed') ||
        err?.message?.includes('подключения к серверу');
      
      const isRateLimit = err?.status === 429;
      
      if ((isNetworkError || isRateLimit) && reset) {
        // Пытаемся загрузить из кэша при ошибке сети
        const cachedScans = await ScanCacheService.loadScans();
        if (cachedScans && cachedScans.length > 0) {
          setScans(cachedScans.slice(0, INITIAL_LIMIT));
          setIsFromCache(true);
          const msg = isRateLimit 
            ? i18n.t("history.rate_limit_cached") 
            : i18n.t("history.no_connection_cached");
          showToast(msg, "warning");
        } else {
          const msg = isRateLimit 
            ? i18n.t("history.rate_limit_try_later") 
            : i18n.t("history.no_connection_check_network");
          setError(msg);
        }
      } else if (err?.status === 401 || err?.status === 403) {
        setError(i18n.t("history.auth_error"));
        console.warn("Authorization error while loading scans. Ensure token is set.");
      } else if (!reset) {
        showToast(i18n.t("history.load_more_error"), "error");
      } else {
        showToast(i18n.t("history.load_history_error"), "error");
        // Не устанавливаем ошибку, если у нас уже есть данные (например, из кэша)
        // Чтобы пользователь видел хотя бы старые данные
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [user?.uid]); // Use user.uid to avoid unnecessary re-renders when user object changes but is same user

  // Remove the useEffect that auto-fetches to avoid race conditions with useFocusEffect in the page
  // The page should control when to fetch (on mount or focus)

  // Функция для подгрузки следующей страницы
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || isLoadingRef.current) return;
    await loadScans(false);
  }, [hasMore, loadingMore, loadScans]);

  const deleteScanItem = useCallback(async (scanId: string) => {
    try {
      // Optimistic update
      setScans((prev) => prev.filter((s) => s.scanId !== scanId));
      
      await deleteScan(scanId);
      
      // Update cache
      const cachedScans = await ScanCacheService.loadScans();
      if (cachedScans) {
        const updatedCache = cachedScans.filter((s) => s.scanId !== scanId);
        await ScanCacheService.saveScans(updatedCache);
      }
      
      showToast(i18n.t("history.delete_success", { defaultValue: "Скан удален" }), "success");
    } catch (err) {
      console.error("Failed to delete scan:", err);
      showToast(i18n.t("history.delete_error", { defaultValue: "Не удалось удалить скан" }), "error");
      // Reload to restore state
      loadScans(true);
    }
  }, [loadScans]);

  const toggleFavorite = useCallback(async (scan: ScanDoc) => {
    if (!user) return;
    
    const newStatus = !scan.isFavorite;
    
    // Optimistic update
    setScans(prev => prev.map(s => 
      s.scanId === scan.scanId 
        ? { ...s, isFavorite: newStatus } 
        : s
    ));
    
    try {
      await updateScanFavorite(scan.scanId, newStatus);
      
      // Update cache
      const cachedScans = await ScanCacheService.loadScans();
      if (cachedScans) {
        const updatedCache = cachedScans.map(s => 
          s.scanId === scan.scanId 
            ? { ...s, isFavorite: newStatus } 
            : s
        );
        await ScanCacheService.saveScans(updatedCache);
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      // Revert
      setScans(prev => prev.map(s => 
        s.scanId === scan.scanId 
          ? { ...s, isFavorite: !newStatus } 
          : s
      ));
      showToast(i18n.t("errors.favorite_update_failed", { defaultValue: "Не удалось обновить статус избранного" }), "error");
    }
  }, [user]);

  return {
    scans,
    loading,
    loadingMore,
    error,
    hasMore,
    isFromCache,
    refresh: () => loadScans(true),
    loadMore: () => loadScans(false),
    deleteScan: deleteScanItem,
    toggleFavorite
  };
}
