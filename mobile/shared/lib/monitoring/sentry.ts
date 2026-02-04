/**
 * Sentry Configuration
 * Отслеживание ошибок и падений приложения
 * 
 * Бесплатный план: до 5,000 событий в месяц
 */

let sentryInitialized = false;

/**
 * Инициализация Sentry
 * Вызывается один раз при запуске приложения
 */
export async function initSentry() {
  if (sentryInitialized) {
    return;
  }

  try {
    // Динамический импорт, чтобы не блокировать запуск приложения
    // @sentry/react-native экспортирует функции напрямую
    const Sentry = await import("@sentry/react-native");
    
    // Получаем DSN из конфигурации
    const { getSentryDsn } = await import("./sentryConfig");
    const dsn = getSentryDsn();
    
    if (!dsn) {
      console.warn("[Sentry] DSN not configured. Skipping initialization.");
      return;
    }

    // Используем правильный метод инициализации
    if (Sentry.init) {
      Sentry.init({
        dsn,
        environment: __DEV__ ? "development" : "production",
        enableAutoSessionTracking: true,
        sessionTrackingIntervalMillis: 30000, // 30 секунд
        tracesSampleRate: __DEV__ ? 1.0 : 0.1, // 100% в dev, 10% в production
        beforeSend(event, hint) {
          // В dev режиме не отправляем все ошибки
          if (__DEV__) {
            console.log("[Sentry] Error captured:", event);
            // Можно вернуть null, чтобы не отправлять в dev
            // return null;
          }
          return event;
        },
      });
    } else {
      console.warn("[Sentry] init method not found in module");
      return;
    }

    sentryInitialized = true;
    console.log("[Sentry] Initialized successfully");
  } catch (error) {
    console.error("[Sentry] Failed to initialize:", error);
  }
}

/**
 * Отправить ошибку в Sentry
 */
export function captureException(error: Error, context?: {
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  user?: { id: string; email?: string };
}) {
  if (!sentryInitialized) {
    console.warn("[Sentry] Not initialized, error not captured:", error);
    return;
  }

  try {
    // Динамический импорт
    import("@sentry/react-native").then((Sentry) => {
      if (Sentry && Sentry.captureException) {
        Sentry.captureException(error, {
          tags: context?.tags,
          extra: context?.extra,
          user: context?.user,
        });
      }
    });
  } catch (err) {
    console.error("[Sentry] Failed to capture exception:", err);
  }
}

/**
 * Установить контекст пользователя
 */
export function setUser(userId: string, email?: string) {
  if (!sentryInitialized) return;

  import("@sentry/react-native").then((Sentry) => {
    if (Sentry && Sentry.setUser) {
      Sentry.setUser({
        id: userId,
        email,
      });
    }
  });
}

/**
 * Очистить контекст пользователя (при выходе)
 */
export function clearUser() {
  if (!sentryInitialized) return;

  import("@sentry/react-native").then((Sentry) => {
    if (Sentry && Sentry.setUser) {
      Sentry.setUser(null);
    }
  });
}

/**
 * Добавить breadcrumb (след действия пользователя)
 */
export function addBreadcrumb(message: string, data?: Record<string, any>) {
  if (!sentryInitialized) return;

  import("@sentry/react-native").then((Sentry) => {
    if (Sentry && Sentry.addBreadcrumb) {
      Sentry.addBreadcrumb({
        message,
        data,
        level: "info",
      });
    }
  });
}
