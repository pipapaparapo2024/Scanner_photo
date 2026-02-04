import { useMemo } from "react";
import { OnboardingStep } from "../../ui/OnboardingTour";
import { scanButtonRef, historyTabRef, accountTabRef } from "../../../widgets/TabBar/CustomTabBar";

/**
 * Хук для создания шагов онбординга
 */
export function useOnboardingTour() {

  const steps: OnboardingStep[] = useMemo(
    () => [
      {
        id: "scan-button",
        targetRef: scanButtonRef as any,
        title: "Начните сканирование",
        description:
          "Нажмите на кнопку 'Скан' внизу экрана, чтобы сделать первое сканирование документа или текста.",
        position: "top",
        screen: "Home",
      },
      {
        id: "history-tab",
        targetRef: historyTabRef as any,
        title: "История сканов",
        description:
          "Все ваши сканы сохраняются здесь. Нажмите на вкладку 'История', чтобы посмотреть все распознанные документы.",
        position: "top",
        screen: "Home",
      },
      {
        id: "account-tab",
        targetRef: accountTabRef as any,
        title: "Ваш аккаунт",
        description:
          "Во вкладке 'Аккаунт' вы можете посмотреть баланс токенов, настройки и другую информацию.",
        position: "top",
        screen: "Home",
      },
    ],
    []
  );

  return {
    steps,
    refs: {
      scanButtonRef,
      historyTabRef,
      accountTabRef,
    }
  };
}
