import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ScanDoc } from "../../../entities/scan/model/types";

const CACHE_KEY = "@scanimg:scans_cache";
const CACHE_TIMESTAMP_KEY = "@scanimg:scans_cache_timestamp";
const MAX_CACHED_SCANS = 50; // Максимальное количество сканов в кэше
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах

interface CacheData {
  scans: ScanDoc[];
  timestamp: number;
}

/**
 * Сервис для локального кэширования сканов
 */
export class ScanCacheService {
  /**
   * Сохранить сканы в кэш
   */
  static async saveScans(scans: ScanDoc[]): Promise<void> {
    try {
      // Сохраняем только последние N сканов
      const scansToCache = scans.slice(0, MAX_CACHED_SCANS);
      const cacheData: CacheData = {
        scans: scansToCache,
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      
      console.log(`ScanCache: Сохранено ${scansToCache.length} сканов в кэш`);
    } catch (error) {
      console.error("ScanCache: Ошибка при сохранении кэша:", error);
    }
  }

  /**
   * Загрузить сканы из кэша
   */
  static async loadScans(): Promise<ScanDoc[] | null> {
    try {
      const cacheDataStr = await AsyncStorage.getItem(CACHE_KEY);
      if (!cacheDataStr) {
        console.log("ScanCache: Кэш не найден");
        return null;
      }

      const cacheData: CacheData = JSON.parse(cacheDataStr);
      const now = Date.now();
      const cacheAge = now - cacheData.timestamp;

      // Проверяем, не устарел ли кэш
      if (cacheAge > CACHE_DURATION) {
        console.log("ScanCache: Кэш устарел, очищаем");
        await this.clearCache();
        return null;
      }

      console.log(`ScanCache: Загружено ${cacheData.scans.length} сканов из кэша (возраст: ${Math.round(cacheAge / 1000 / 60)} мин)`);
      return cacheData.scans;
    } catch (error) {
      console.error("ScanCache: Ошибка при загрузке кэша:", error);
      return null;
    }
  }

  /**
   * Добавить новый скан в кэш
   */
  static async addScan(scan: ScanDoc): Promise<void> {
    try {
      const cachedScans = await this.loadScans();
      const scans = cachedScans || [];
      
      // Удаляем дубликат, если есть
      const filteredScans = scans.filter((s) => s.scanId !== scan.scanId);
      
      // Добавляем новый скан в начало
      const updatedScans = [scan, ...filteredScans].slice(0, MAX_CACHED_SCANS);
      
      await this.saveScans(updatedScans);
      console.log("ScanCache: Новый скан добавлен в кэш");
    } catch (error) {
      console.error("ScanCache: Ошибка при добавлении скана в кэш:", error);
    }
  }

  /**
   * Удалить скан из кэша
   */
  static async removeScan(scanId: string): Promise<void> {
    try {
      const cachedScans = await this.loadScans();
      if (!cachedScans) return;

      const updatedScans = cachedScans.filter((s) => s.scanId !== scanId);
      await this.saveScans(updatedScans);
      console.log("ScanCache: Скан удален из кэша");
    } catch (error) {
      console.error("ScanCache: Ошибка при удалении скана из кэша:", error);
    }
  }

  /**
   * Очистить кэш
   */
  static async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
      console.log("ScanCache: Кэш очищен");
    } catch (error) {
      console.error("ScanCache: Ошибка при очистке кэша:", error);
    }
  }

  /**
   * Получить timestamp последней синхронизации
   */
  static async getLastSyncTimestamp(): Promise<number | null> {
    try {
      const timestampStr = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
      return timestampStr ? parseInt(timestampStr, 10) : null;
    } catch (error) {
      console.error("ScanCache: Ошибка при получении timestamp:", error);
      return null;
    }
  }

  /**
   * Проверить, нужна ли синхронизация
   */
  static async needsSync(): Promise<boolean> {
    try {
      const timestamp = await this.getLastSyncTimestamp();
      if (!timestamp) return true;

      const now = Date.now();
      const timeSinceSync = now - timestamp;
      
      // Синхронизируем, если прошло больше 5 минут
      return timeSinceSync > 5 * 60 * 1000;
    } catch (error) {
      console.error("ScanCache: Ошибка при проверке необходимости синхронизации:", error);
      return true;
    }
  }
}
