import { useState, useCallback } from "react";
import { useUser } from "../../../entities/user/model/useUser";
import { getRewardNonce, claimReward } from "../api/adsApi";

/**
 * Хук для работы с рекламой с наградой (Яндекс Ads)
 * 
 * ВАЖНО: Для работы нужен нативный модуль Яндекс Мобильной Рекламы
 * Пока используем заглушку для разработки
 */
export function useRewardAds() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, refresh } = useUser();

  /**
   * Показать рекламу с наградой
   * Бизнес-правило: реклама доступна только при scanCredits == 0
   */
  const showRewardedAd = useCallback(async () => {
    if (!user) {
      setError("Пользователь не авторизован");
      return;
    }

    // Проверка бизнес-правила: реклама только при нулевом балансе
    if (user.scanCredits > 0) {
      setError("Реклама доступна только при нулевом балансе токенов");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Получить одноразовый токен с бэкенда
      const { token } = await getRewardNonce();

      // 2. Показать рекламу через Яндекс Ads SDK
      // TODO: Интегрировать с Яндекс Мобильной Рекламой SDK
      // const adResult = await YandexAds.showRewardedAd();
      // if (!adResult.watched) {
      //   throw new Error("Реклама не была просмотрена");
      // }

      // Заглушка для разработки - симулируем просмотр рекламы
      console.log("Показываем рекламу (заглушка)...");
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Симуляция просмотра

      // 3. Подтвердить просмотр и получить награду
      const result = await claimReward({ token });

      // 4. Обновляем баланс пользователя
      await refresh();

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ошибка при просмотре рекламы";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, refresh]);

  const canWatchAd = user?.scanCredits === 0;

  return {
    showRewardedAd,
    loading,
    error,
    canWatchAd,
  };
}

