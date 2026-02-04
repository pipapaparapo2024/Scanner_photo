import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../app/providers/ThemeProvider";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface HighlightArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OnboardingOverlayProps {
  visible: boolean;
  highlightArea?: HighlightArea;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  onNext?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

/**
 * Overlay компонент для онбординга
 * Затемняет экран и подсвечивает нужный элемент
 */
export function OnboardingOverlay({
  visible,
  highlightArea,
  title,
  description,
  position = "bottom",
  onNext,
  onSkip,
  showSkip = true,
}: OnboardingOverlayProps) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  // Вычисляем позицию текста подсказки
  const getTooltipPosition = () => {
    if (!highlightArea) {
      return { top: SCREEN_HEIGHT / 2 - 100, left: 20, right: 20 };
    }

    const padding = 20;
    const tooltipHeight = 150;
    const tooltipWidth = SCREEN_WIDTH - 40;

    switch (position) {
      case "top":
        return {
          top: Math.max(20, highlightArea.y - tooltipHeight - 20),
          left: padding,
          right: padding,
        };
      case "bottom":
        return {
          top: highlightArea.y + highlightArea.height + 20,
          left: padding,
          right: padding,
        };
      case "left":
        return {
          top: highlightArea.y + highlightArea.height / 2 - tooltipHeight / 2,
          right: SCREEN_WIDTH - highlightArea.x + 20,
          width: tooltipWidth,
        };
      case "right":
        return {
          top: highlightArea.y + highlightArea.height / 2 - tooltipHeight / 2,
          left: highlightArea.x + highlightArea.width + 20,
          width: tooltipWidth,
        };
      case "center":
      default:
        return {
          top: SCREEN_HEIGHT / 2 - tooltipHeight / 2,
          left: padding,
          right: padding,
        };
    }
  };

  const tooltipStyle = getTooltipPosition();

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
      pointerEvents="box-none"
    >
      {/* Затемненный фон */}
      <View style={styles.backdrop} />

      {/* Вырез для подсвеченного элемента - используем SVG path для выреза */}
      {highlightArea && (
        <>
          {/* Верхняя часть затемнения */}
          <View
            style={[
              styles.backdropSection,
              {
                top: 0,
                left: 0,
                right: 0,
                height: Math.max(0, highlightArea.y - 10),
              },
            ]}
          />
          {/* Нижняя часть затемнения */}
          <View
            style={[
              styles.backdropSection,
              {
                top: highlightArea.y + highlightArea.height + 10,
                left: 0,
                right: 0,
                bottom: 0,
              },
            ]}
          />
          {/* Левая часть затемнения */}
          <View
            style={[
              styles.backdropSection,
              {
                top: Math.max(0, highlightArea.y - 10),
                left: 0,
                width: Math.max(0, highlightArea.x - 10),
                height: highlightArea.height + 20,
              },
            ]}
          />
          {/* Правая часть затемнения */}
          <View
            style={[
              styles.backdropSection,
              {
                top: Math.max(0, highlightArea.y - 10),
                left: highlightArea.x + highlightArea.width + 10,
                right: 0,
                height: highlightArea.height + 20,
              },
            ]}
          />
          {/* Свечение вокруг элемента */}
          <View
            style={[
              styles.glow,
              {
                left: highlightArea.x - 20,
                top: highlightArea.y - 20,
                width: highlightArea.width + 40,
                height: highlightArea.height + 40,
                borderColor: theme.primary,
                shadowColor: theme.primary,
              },
            ]}
          />
        </>
      )}

      {/* Кнопка пропустить */}
      {showSkip && onSkip && (
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={[styles.skipText, { color: theme.textSecondary }]}>Пропустить</Text>
        </TouchableOpacity>
      )}

      {/* Подсказка с текстом */}
      <Animated.View
        style={[
          styles.tooltip,
          {
            backgroundColor: theme.surface,
            ...tooltipStyle,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={[styles.tooltipTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.tooltipDescription, { color: theme.textSecondary }]}>
          {description}
        </Text>
        {onNext && (
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: theme.primary }]}
            onPress={onNext}
          >
            <Text style={styles.nextButtonText}>Понятно</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  backdropSection: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  glow: {
    position: "absolute",
    borderRadius: 16,
    borderWidth: 3,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  skipButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10000,
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "600",
  },
  tooltip: {
    position: "absolute",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  tooltipTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  tooltipDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
