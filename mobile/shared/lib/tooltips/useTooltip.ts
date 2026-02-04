import { useState, useEffect, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOOLTIPS_SHOWN_KEY = "@scanimg:tooltips_shown";

interface TooltipState {
  [tooltipId: string]: boolean;
}

/**
 * Хук для управления показом tooltip
 */
export function useTooltip(tooltipId: string, options?: { showOnce?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [wasShown, setWasShown] = useState(false);
  const targetRef = useRef<any>(null);
  const { showOnce = true } = options || {};

  // Проверяем, был ли tooltip уже показан
  useEffect(() => {
    const checkTooltipStatus = async () => {
      try {
        const data = await AsyncStorage.getItem(TOOLTIPS_SHOWN_KEY);
        if (data) {
          const tooltips: TooltipState = JSON.parse(data);
          if (tooltips[tooltipId]) {
            setWasShown(true);
            if (showOnce) {
              setVisible(false);
              return;
            }
          }
        }

        // Если tooltip еще не показывался, показываем его
        if (!wasShown) {
          // Небольшая задержка для правильного позиционирования
          setTimeout(() => {
            setVisible(true);
          }, 500);
        }
      } catch (error) {
        console.error(`[Tooltip] Failed to check status for ${tooltipId}:`, error);
      }
    };

    checkTooltipStatus();
  }, [tooltipId, showOnce, wasShown]);

  const hideTooltip = useCallback(async () => {
    setVisible(false);

    if (showOnce && !wasShown) {
      try {
        const data = await AsyncStorage.getItem(TOOLTIPS_SHOWN_KEY);
        const tooltips: TooltipState = data ? JSON.parse(data) : {};
        tooltips[tooltipId] = true;
        await AsyncStorage.setItem(TOOLTIPS_SHOWN_KEY, JSON.stringify(tooltips));
        setWasShown(true);
      } catch (error) {
        console.error(`[Tooltip] Failed to save status for ${tooltipId}:`, error);
      }
    }
  }, [tooltipId, showOnce, wasShown]);

  const showTooltip = useCallback(() => {
    setVisible(true);
  }, []);

  const resetTooltip = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(TOOLTIPS_SHOWN_KEY);
      if (data) {
        const tooltips: TooltipState = JSON.parse(data);
        delete tooltips[tooltipId];
        await AsyncStorage.setItem(TOOLTIPS_SHOWN_KEY, JSON.stringify(tooltips));
        setWasShown(false);
        setVisible(false);
      }
    } catch (error) {
      console.error(`[Tooltip] Failed to reset ${tooltipId}:`, error);
    }
  }, [tooltipId]);

  return {
    visible,
    targetRef,
    hideTooltip,
    showTooltip,
    resetTooltip,
    wasShown,
  };
}

/**
 * Сбросить все tooltips (для настроек)
 */
export async function resetAllTooltips(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TOOLTIPS_SHOWN_KEY);
  } catch (error) {
    console.error("[Tooltip] Failed to reset all tooltips:", error);
  }
}
