import { useState, useCallback } from "react";
import { useUser } from "../../../entities/user/model/useUser";
import { verifyIap, type IapVerifyRequest } from "../api/iapApi";

/**
 * Хук для работы с покупками RuStore Pay
 * 
 * ВАЖНО: Для работы нужен нативный модуль RuStore Pay SDK
 * Пока используем заглушку для разработки
 */
export function useIap() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refresh } = useUser();

  /**
   * Купить пакет сканов
   * @param productId - ID продукта (pack_50_scans, pack_100_scans)
   */
  const purchasePack = useCallback(
    async (productId: string) => {
      setLoading(true);
      setError(null);

      try {
        // TODO: Интегрировать с RuStore Pay SDK
        // 1. Инициировать покупку через RuStore SDK
        // 2. Получить purchaseToken и orderId
        // 3. Отправить на бэкенд для верификации

        // ВРЕМЕННО ОТКЛЮЧЕНО: Выдача токенов отключена до подключения системы оплаты
        // TODO: Раскомментировать после интеграции RuStore Pay SDK
        
        // Заглушка для разработки
        // const mockPurchaseData: IapVerifyRequest = {
        //   productId,
        //   purchaseToken: "mock_token_" + Date.now(),
        //   orderId: "mock_order_" + Date.now(),
        // };

        // В реальном приложении здесь будет:
        // const purchase = await RuStorePay.purchase(productId);
        // const verifyData = {
        //   productId: purchase.productId,
        //   purchaseToken: purchase.purchaseToken,
        //   orderId: purchase.orderId,
        // };

        // const result = await verifyIap(mockPurchaseData);

        // Обновляем баланс пользователя
        // await refresh();

        // return result;
        
        // Временное сообщение пользователю (ключ перевода, отображается в UI)
        throw new Error("PAYMENT_UNAVAILABLE");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "PAYMENT_UNAVAILABLE";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  return {
    purchasePack,
    loading,
    error,
  };
}

