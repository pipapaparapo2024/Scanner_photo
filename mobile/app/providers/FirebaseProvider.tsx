import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getCurrentUser,
  getIdToken,
  onAuthStateChanged,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  getIdTokenForUser,
  type User,
} from "../../shared/lib/firebase/auth";
import { apiClient } from "../../shared/lib/api";
import type { AuthContextValue } from "../../shared/types/auth";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface FirebaseProviderProps {
  children: React.ReactNode;
}

/**
 * Провайдер для Firebase Authentication
 * Управляет состоянием аутентификации и предоставляет методы для входа/выхода
 */
export function FirebaseProvider({ children }: FirebaseProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log("[FirebaseProvider] Initializing auth listener");
    // Подписываемся на изменения состояния аутентификации
    const unsubscribe = onAuthStateChanged(async (authUser) => {
      console.log(`[FirebaseProvider] Auth state changed: ${authUser ? 'User logged in' : 'User logged out'}`);
      
      // Обновляем токен в API клиенте
      if (authUser) {
        try {
          const token = await getIdTokenForUser(authUser);
          apiClient.setAuthToken(token);
        } catch (e) {
          console.error("[FirebaseProvider] Failed to get auth token:", e);
        }
      } else {
        apiClient.setAuthToken(null);
      }

      setUser(authUser);
      setLoading(false);
      setInitialized(true);
      
      // Устанавливаем пользователя в системах мониторинга
      try {
        const { setUser: setMonitoringUser } = await import("../../shared/lib/monitoring/index");
        if (authUser) {
          await setMonitoringUser(authUser.uid, authUser.email || undefined);
        } else {
          const { clearUser } = await import("../../shared/lib/monitoring/index");
          await clearUser();
        }
      } catch (e) {
        // Игнорируем, если мониторинг не инициализирован
        console.warn("[FirebaseProvider] Monitoring not available:", e);
      }
    });

    // Проверяем текущего пользователя сразу
    const currentUser = getCurrentUser();
    if (currentUser) {
      getIdTokenForUser(currentUser).then(token => apiClient.setAuthToken(token)).catch(e => console.error(e));
    }
    setUser(currentUser);
    setLoading(false);
    setInitialized(true);
    
    // Устанавливаем пользователя в мониторинге, если он уже авторизован
    if (currentUser) {
      import("../../shared/lib/monitoring/index").then(({ setUser: setMonitoringUser }) => {
        setMonitoringUser(currentUser.uid, currentUser.email || undefined);
      }).catch(() => {
        // Игнорируем ошибки
      });
    }

    return unsubscribe;
  }, []);

  const signInAnonymously = React.useCallback(async () => {
    try {
      // Проверяем, не авторизован ли уже пользователь
      const currentUser = getCurrentUser();
      if (currentUser) {
        return; // Уже авторизован
      }
      
      await firebaseSignInAnonymously();
      // Состояние обновится автоматически через onAuthStateChanged
    } catch (error: any) {
      const errorMessage = error?.message || "Неизвестная ошибка";
      console.error("Failed to sign in anonymously:", errorMessage, error);
      
      // Не пробрасываем ошибку дальше, чтобы приложение могло работать
      // даже если Firebase недоступен (для разработки)
      if (__DEV__) {
        console.warn("Firebase anonymous sign-in failed, but continuing in dev mode");
      } else {
        throw error;
      }
    }
  }, []);

  const signOut = React.useCallback(async () => {
    try {
      // Проверяем, есть ли пользователь перед выходом
      const currentUser = getCurrentUser();
      if (!currentUser) {
        // Пользователь уже не авторизован
        setUser(null);
        return;
      }
      
      await firebaseSignOut();
      // Состояние обновится автоматически через onAuthStateChanged
    } catch (error: any) {
      // Игнорируем ошибку, если пользователь уже не авторизован
      if (error?.code === 'auth/no-current-user' || error?.code === 'auth/null-user') {
        setUser(null);
        return;
      }
      console.error("Failed to sign out:", error);
      throw error;
    }
  }, []);

  const refreshToken = React.useCallback(async (): Promise<string | null> => {
    return getIdToken(true);
  }, []);

  const signInWithEmailAndPassword = React.useCallback(async (email: string, password: string) => {
    await firebaseSignInWithEmailAndPassword(email, password);
    // Состояние обновится автоматически через onAuthStateChanged
  }, []);

  const createUserWithEmailAndPassword = React.useCallback(async (email: string, password: string) => {
    await firebaseCreateUserWithEmailAndPassword(email, password);
    // Состояние обновится автоматически через onAuthStateChanged
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    initialized,
    signInAnonymously,
    signOut,
    refreshToken,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Хук для доступа к контексту аутентификации
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within FirebaseProvider");
  }
  return context;
}

