import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FirebaseProvider, useAuth } from "./providers/FirebaseProvider";
import { ThemeProvider, useTheme } from "./providers/ThemeProvider";
import { RootNavigator } from "./router/RootNavigator";
import { SplashPage } from "../pages/SplashPage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser, UserProvider } from "../entities/user/model/useUser";
import { ErrorBoundary } from "../shared/ui/ErrorBoundary";
import { SyncQueueModal } from "../shared/ui/SyncQueueModal";
import { getSyncWorker } from "../shared/lib/sync-queue/syncWorker";
import { initAppStateHandler } from "../shared/lib/sync-queue/appStateHandler";
import { getTaskCounts } from "../shared/lib/sync-queue/syncQueue";
import { getCloudStorageSettings } from "../shared/lib/cloud-storage/settingsStorage";
import '../shared/lib/i18n/i18n';

const ONBOARDING_COMPLETED_KEY = "@scanimg:onboarding_completed";
const SYNC_MODAL_SHOWN_KEY = "@scanimg:sync_modal_shown_session";

/**
 * Внутренний компонент приложения с доступом к Auth и Theme контексту
 */
function AppContentInner() {
  const { initialized, user } = useAuth();
  const { user: userDoc, loading: userLoading, error: userError } = useUser();
  const { theme } = useTheme();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncTaskCounts, setSyncTaskCounts] = useState({ pending: 0, failed: 0 });

  // Инициализация SyncWorker и AppState handler
  useEffect(() => {
    const initSync = async () => {
      try {
        const settings = await getCloudStorageSettings();
        if (settings.autoSyncEnabled && settings.service) {
          const worker = getSyncWorker();
          await worker.start();
          
          // Инициализируем AppState handler
          const cleanup = initAppStateHandler(worker);
          
          return cleanup;
        }
      } catch (error) {
        console.error("[App] Failed to initialize sync worker:", error);
      }
    };

    if (initialized && user) {
      initSync();
    }
  }, [initialized, user]);

  // Проверка очереди синхронизации при входе в приложение
  useEffect(() => {
    const checkSyncQueue = async () => {
      if (!initialized || !user) {
        return;
      }

      try {
        const hasShownModal = await AsyncStorage.getItem(SYNC_MODAL_SHOWN_KEY);
        if (hasShownModal === "true") {
          return; // Уже показывали в этой сессии
        }

        const counts = await getTaskCounts();
        if (counts.pending > 0 || counts.failed > 0) {
          setSyncTaskCounts({ pending: counts.pending, failed: counts.failed });
          setShowSyncModal(true);
          await AsyncStorage.setItem(SYNC_MODAL_SHOWN_KEY, "true");
        }
      } catch (error) {
        console.error("[App] Failed to check sync queue:", error);
      }
    };

    if (initialized && user) {
      // Небольшая задержка, чтобы не показывать модалку сразу при запуске
      setTimeout(checkSyncQueue, 1000);
    }
  }, [initialized, user]);

  // Проверяем, показывали ли onboarding ранее
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        // Если пользователь уже авторизован, не показываем онбординг
        if (user) {
          setShowOnboarding(false);
          return;
        }
        
        const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
        const shouldShowOnboarding = completed !== "true";
        setShowOnboarding(shouldShowOnboarding);
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
        // Если пользователь авторизован, не показываем онбординг даже при ошибке
        setShowOnboarding(user ? false : true);
      }
    };
    
    if (initialized) {
      checkOnboarding();
    }
  }, [initialized, user]);

  // Показываем страницу загрузки пока:
  // - Firebase инициализируется
  // - Проверяется статус onboarding
  // - Загружаются данные пользователя (если авторизован)
  // Важно: если произошла ошибка загрузки (например, 429), но пользователь авторизован,
  // мы не должны считать это завершением загрузки, если userDoc пустой, чтобы не выбросить на Auth
  if (!initialized || showOnboarding === null || (user && userLoading)) {
    console.log(`[App] Loading state: initialized=${initialized}, showOnboarding=${showOnboarding}, user=${!!user}, userLoading=${userLoading}`);
    return <SplashPage />;
  }

  // Логика показа экранов:
  // 1. Если onboarding не завершен - показываем onboarding
  // 2. Если onboarding завершен и пользователь не авторизован - показываем авторизацию
  // 3. Если пользователь авторизован, но регистрация не завершена (userDoc === null) - показываем регистрацию
  // 4. Если пользователь авторизован и регистрация завершена (userDoc !== null) - показываем главный экран
  
  // Показываем авторизацию, если:
  // - Onboarding завершен И
  // - (Пользователь не авторизован ИЛИ регистрация не завершена)
  // - И нет критической ошибки загрузки профиля (если есть ошибка, лучше остаться на Splash или показать Error, но не Auth)
  const isUserMissing = !user || (user && !userDoc && !userError);
  const shouldShowAuth = !showOnboarding && isUserMissing;

  console.log(`[App] Rendering: showOnboarding=${showOnboarding}, shouldShowAuth=${shouldShowAuth}, user=${!!user}, userDoc=${!!userDoc}, userError=${userError}`);

  return (
    <>
      <RootNavigator showOnboarding={showOnboarding} showAuth={shouldShowAuth} />
      <SyncQueueModal
        visible={showSyncModal}
        pendingCount={syncTaskCounts.pending}
        failedCount={syncTaskCounts.failed}
        onClose={() => setShowSyncModal(false)}
        onOpenSettings={() => {
          setShowSyncModal(false);
          // Навигация будет работать через RootNavigator
          // Можно использовать navigation из useNavigation, но проще через deep link или событие
        }}
      />
    </>
  );
}

/**
 * Корневой компонент приложения
 * Подключает провайдеры и навигацию
 */
/**
 * Компонент приложения с доступом к Firebase
 */
function AppContent() {
  return (
    <FirebaseProvider>
      <UserProvider>
        <AppContentInner />
      </UserProvider>
    </FirebaseProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}


