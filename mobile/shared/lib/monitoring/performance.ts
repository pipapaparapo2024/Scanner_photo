/**
 * Firebase Performance Monitoring
 * Отслеживание производительности приложения
 * 
 * Бесплатный план: без лимитов
 */

let perfInitialized = false;

/**
 * Инициализация Performance Monitoring
 */
export async function initPerformanceMonitoring() {
  if (perfInitialized) {
    return;
  }

  try {
    const perfModule = await import("@react-native-firebase/perf");
    const perf = perfModule.default || perfModule;
    
    if (!perf) {
      console.warn("[Performance] Module not available");
      return;
    }
    
    // Performance Monitoring включается автоматически
    // Просто проверяем, что модуль доступен
    perfInitialized = true;
    console.log("[Performance] Monitoring initialized");
  } catch (error) {
    console.warn("[Performance] Failed to initialize (non-critical):", error);
    // Не блокируем запуск приложения
  }
}

/**
 * Начать отслеживание производительности операции
 */
export async function startTrace(traceName: string) {
  if (!perfInitialized) return null;
  
  try {
    const perfModule = await import("@react-native-firebase/perf");
    const perf = perfModule.default || perfModule;
    if (perf && typeof perf === 'function') {
      const trace = await perf().startTrace(traceName);
      return trace;
    }
    return null;
  } catch (error) {
    if (__DEV__) {
      console.warn(`[Performance] Failed to start trace ${traceName}:`, error);
    }
    return null;
  }
}

/**
 * Остановить отслеживание производительности
 */
export async function stopTrace(trace: any) {
  try {
    if (trace) {
      await trace.stop();
    }
  } catch (error) {
    console.error("[Performance] Failed to stop trace:", error);
  }
}

/**
 * Отслеживание производительности с автоматическим завершением
 */
export async function tracePerformance<T>(
  traceName: string,
  operation: () => Promise<T>
): Promise<T> {
  const trace = await startTrace(traceName);
  try {
    const result = await operation();
    return result;
  } finally {
    await stopTrace(trace);
  }
}

/**
 * Добавить метрику к trace
 */
export async function addTraceMetric(trace: any, metricName: string, value: number) {
  try {
    if (trace) {
      await trace.putMetric(metricName, value);
    }
  } catch (error) {
    console.error("[Performance] Failed to add metric:", error);
  }
}

/**
 * Добавить атрибут к trace
 */
export async function addTraceAttribute(trace: any, attributeName: string, value: string) {
  try {
    if (trace) {
      await trace.putAttribute(attributeName, value);
    }
  } catch (error) {
    console.error("[Performance] Failed to add attribute:", error);
  }
}
