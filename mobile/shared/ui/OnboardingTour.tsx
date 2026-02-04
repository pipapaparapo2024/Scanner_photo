import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, LayoutChangeEvent, findNodeHandle, UIManager } from "react-native";
import { OnboardingOverlay, HighlightArea } from "./OnboardingOverlay";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_TOUR_COMPLETED_KEY = "@scanimg:onboarding_tour_completed";

export interface OnboardingStep {
  id: string;
  targetRef?: React.RefObject<View>;
  targetId?: string; // testID для поиска элемента
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  screen?: string; // На каком экране показывать
}

interface OnboardingTourProps {
  steps: OnboardingStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  enabled?: boolean;
}

/**
 * Компонент для управления интерактивным туром онбординга
 */
export function OnboardingTour({
  steps,
  onComplete,
  onSkip,
  enabled = true,
}: OnboardingTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightArea, setHighlightArea] = useState<HighlightArea | undefined>();
  const [isVisible, setIsVisible] = useState(false);
  const [targetLayout, setTargetLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Проверяем, был ли тур уже пройден
  useEffect(() => {
    if (!enabled) return;

    const checkTourStatus = async () => {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_TOUR_COMPLETED_KEY);
        if (completed === "true") {
          setIsVisible(false);
          return;
        }

        // Если тур не пройден, начинаем его
        if (steps.length > 0) {
          setIsVisible(true);
          updateHighlightArea(0);
        }
      } catch (error) {
        console.error("[OnboardingTour] Failed to check status:", error);
      }
    };

    checkTourStatus();
  }, [enabled, steps.length]);

  // Обновляем подсветку при изменении шага
  const updateHighlightArea = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= steps.length) return;

      const step = steps[stepIndex];
      if (!step) return;

      // Если есть ref, используем его
      if (step.targetRef?.current) {
        // Используем measureInWindow для получения координат относительно окна
        step.targetRef.current.measureInWindow((x, y, width, height) => {
          if (x !== undefined && y !== undefined && width > 0 && height > 0) {
            setHighlightArea({ x, y, width, height });
          } else {
            // Если координаты не получены, показываем подсказку без подсветки
            setHighlightArea(undefined);
          }
        });
      } else if (targetLayout) {
        // Используем сохраненный layout
        setHighlightArea({
          x: targetLayout.x,
          y: targetLayout.y,
          width: targetLayout.width,
          height: targetLayout.height,
        });
      } else {
        // Если нет элемента для подсветки, просто показываем подсказку по центру
        setHighlightArea(undefined);
      }
    },
    [steps, targetLayout]
  );

  useEffect(() => {
    if (isVisible && currentStepIndex < steps.length) {
      updateHighlightArea(currentStepIndex);
    }
  }, [currentStepIndex, isVisible, updateHighlightArea]);

  const handleNext = useCallback(async () => {
    const nextIndex = currentStepIndex + 1;

    if (nextIndex >= steps.length) {
      // Тур завершен
      try {
        await AsyncStorage.setItem(ONBOARDING_TOUR_COMPLETED_KEY, "true");
      } catch (error) {
        console.error("[OnboardingTour] Failed to save status:", error);
      }

      setIsVisible(false);
      onComplete?.();
    } else {
      setCurrentStepIndex(nextIndex);
    }
  }, [currentStepIndex, steps.length, onComplete]);

  const handleSkip = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_TOUR_COMPLETED_KEY, "true");
    } catch (error) {
      console.error("[OnboardingTour] Failed to save status:", error);
    }

    setIsVisible(false);
    onSkip?.();
  }, [onSkip]);

  const handleTargetLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      setTargetLayout({ x, y, width, height });

      // Обновляем подсветку после получения layout
      if (isVisible && currentStepIndex < steps.length) {
        setTimeout(() => {
          updateHighlightArea(currentStepIndex);
        }, 100);
      }
    },
    [isVisible, currentStepIndex, steps.length, updateHighlightArea]
  );

  if (!isVisible || currentStepIndex >= steps.length) {
    return null;
  }

  const currentStep = steps[currentStepIndex];
  if (!currentStep) return null;

  return (
    <>
      {/* Обертка для элемента, который нужно подсветить */}
      {currentStep.targetRef && (
        <View
          ref={currentStep.targetRef}
          onLayout={handleTargetLayout}
          collapsable={false}
          style={styles.targetWrapper}
        />
      )}

      {/* Overlay с подсказкой */}
      <OnboardingOverlay
        visible={isVisible}
        highlightArea={highlightArea}
        title={currentStep.title}
        description={currentStep.description}
        position={currentStep.position || "bottom"}
        onNext={handleNext}
        onSkip={handleSkip}
        showSkip={currentStepIndex < steps.length - 1}
      />
    </>
  );
}

/**
 * Хук для сброса статуса онбординга (для настроек)
 */
export async function resetOnboardingTour(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_TOUR_COMPLETED_KEY);
  } catch (error) {
    console.error("[OnboardingTour] Failed to reset:", error);
  }
}

const styles = StyleSheet.create({
  targetWrapper: {
    position: "absolute",
  },
});
