import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "../../../app/providers/FirebaseProvider";
import { apiClient } from "../../../shared/lib/api";
import { getUserMe, updateUser } from "../api/userApi";
import type { UserDoc } from "./types";
import { i18n } from "../../../shared/lib/i18n/i18n";

interface UserContextType {
  user: UserDoc | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  updateLanguage: (lang: string) => Promise<void>;
}

/** Значение по умолчанию: не бросаем ошибку при монтировании вкладок после reset навигации */
const defaultUserContext: UserContextType = {
  user: null,
  loading: true,
  error: null,
  refresh: async () => {},
  updateLanguage: async () => {},
};

const UserContext = createContext<UserContextType>(defaultUserContext);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user, refreshToken } = useAuth();
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Загрузка профиля пользователя и синхронизация токена
  useEffect(() => {
    let mounted = true;
    
    // Сбрасываем состояние при смене пользователя (или выходе)
    if (!user?.uid) {
      apiClient.setAuthToken(null);
      setUserDoc(null);
      setLoading(false);
      return;
    }

    const initUser = async () => {
      // Retry logic for 404 (User not found) to handle race condition during registration
      // (Firebase Auth created -> onAuthStateChanged fires -> getUserMe called -> Firestore doc not ready yet)
      let retries = 3;
      while (retries > 0) {
        try {
          // Если мы уже загружаемся, или данные есть, не обязательно сбрасывать loading в true,
          // но для консистентности при смене юзера лучше показать загрузку.
          // Однако UserProvider монтируется один раз, так что это происходит только при смене user.uid
          if (mounted) {
             setLoading(true);
             setError(null);
          }
          
          console.log(`UserProvider: Starting to init user: ${user.uid} (attempts left: ${retries})`);
  
          // 1. Сначала получаем и устанавливаем токен
          try {
            // Force refresh to ensure valid token
            const token = await user.getIdToken(true);
            if (mounted && token) {
              apiClient.setAuthToken(token);
              console.log("UserProvider: Token synced successfully");
            }
          } catch (tokenErr) {
            console.error("Failed to sync auth token:", tokenErr);
            throw tokenErr;
          }
          
          // 2. Затем загружаем данные пользователя
          console.log("UserProvider: Calling getUserMe()...");
          const data = await getUserMe();
          
          if (mounted) {
            console.log("UserProvider: Loaded user data:", data);
            setUserDoc(data);
  
            if (data.language && data.language !== i18n.language) {
              console.log("UserProvider: Applying language from profile:", data.language);
              i18n.changeLanguage(data.language);
            }
          }
          // Success - break the loop
          break;
        } catch (err: any) {
          if (err?.status === 404) {
            console.log("UserProvider: User not found in Firestore");
            if (retries > 1) {
              console.log("UserProvider: Retrying in 1s...");
              await new Promise(r => setTimeout(r, 1000));
              retries--;
              continue;
            }
            // If out of retries
            console.log("UserProvider: User not found after retries (registration not completed)");
            if (mounted) setUserDoc(null);
          } else {
            console.error("Failed to load user:", err);
            if (mounted) {
              setError(err instanceof Error ? err : new Error("Failed to load user"));
              // Если 401, значит токен невалиден даже после refresh? Или API отклонил.
              // В этом случае логично сбросить userDoc, чтобы App перенаправил на Auth.
              if (err?.status === 401) {
                setUserDoc(null);
              }
            }
          }
          // Break on non-retriable error or final 404
          break;
        } finally {
          // Only stop loading if we are breaking the loop (success or final error)
          // If continuing, keep loading true
          if (retries <= 1 || (userDoc /* actually userDoc is not set here yet if err */)) {
             // Logic to determine if we should stop loading:
             // We stop loading at the end of the loop iteration if we are breaking.
          }
        }
      }
      
      if (mounted) {
        setLoading(false);
      }
    };

    initUser();

    return () => {
      mounted = false;
    };
  }, [user?.uid]); // Зависим только от UID

  const refresh = async () => {
    if (user) {
      try {
        const data = await getUserMe();
        setUserDoc(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to refresh user"));
      }
    }
  };

  const updateLanguage = async (lang: string) => {
    if (userDoc) {
      try {
        // Сначала меняем локально для быстрого отклика
        await i18n.changeLanguage(lang);
        
        // Затем обновляем в БД
        const updated = await updateUser({ language: lang });
        setUserDoc(updated);
      } catch (err) {
        console.error("Failed to update language:", err);
        setError(err instanceof Error ? err : new Error("Failed to update language"));
      }
    } else {
      // Если пользователь не авторизован, просто меняем локально
      await i18n.changeLanguage(lang);
    }
  };

  return (
    <UserContext.Provider value={{ user: userDoc, loading, error, refresh, updateLanguage }}>
      {children}
    </UserContext.Provider>
  );
}

/**
 * Хук для доступа к контексту пользователя.
 * Если провайдер ещё не смонтирован (например после navigation.reset), возвращается значение по умолчанию (loading: true).
 */
export function useUser(): UserContextType {
  return useContext(UserContext);
}
