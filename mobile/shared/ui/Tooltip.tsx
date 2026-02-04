import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from "react-native";
import { useTheme } from "../../app/providers/ThemeProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface TooltipProps {
  visible: boolean;
  message: string;
  position?: "top" | "bottom" | "left" | "right";
  targetRef?: React.RefObject<View>;
  targetArea?: { x: number; y: number; width: number; height: number };
  onClose?: () => void;
  showCloseButton?: boolean;
}

/**
 * Компонент Tooltip для контекстных подсказок
 * Показывается рядом с элементом
 */
export function Tooltip({
  visible,
  message,
  position = "bottom",
  targetRef,
  targetArea,
  onClose,
  showCloseButton = true,
}: TooltipProps) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [tooltipArea, setTooltipArea] = React.useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (visible) {
      // Получаем координаты целевого элемента
      if (targetRef?.current) {
        targetRef.current.measureInWindow((x, y, width, height) => {
          if (x !== undefined && y !== undefined) {
            setTooltipArea({ x, y, width, height });
          }
        });
      } else if (targetArea) {
        setTooltipArea(targetArea);
      }

      // Анимация появления
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
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
      // Анимация исчезновения
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, targetRef, targetArea]);

  if (!visible || !tooltipArea) return null;

  // Вычисляем позицию tooltip
  const getTooltipStyle = () => {
    const tooltipWidth = Math.min(SCREEN_WIDTH - 40, 280);
    const tooltipHeight = 80;
    const spacing = 12;

    switch (position) {
      case "top":
        return {
          top: tooltipArea.y - tooltipHeight - spacing,
          left: tooltipArea.x + tooltipArea.width / 2 - tooltipWidth / 2,
          width: tooltipWidth,
        };
      case "bottom":
        return {
          top: tooltipArea.y + tooltipArea.height + spacing,
          left: tooltipArea.x + tooltipArea.width / 2 - tooltipWidth / 2,
          width: tooltipWidth,
        };
      case "left":
        return {
          top: tooltipArea.y + tooltipArea.height / 2 - tooltipHeight / 2,
          right: SCREEN_WIDTH - tooltipArea.x + spacing,
          width: tooltipWidth,
        };
      case "right":
        return {
          top: tooltipArea.y + tooltipArea.height / 2 - tooltipHeight / 2,
          left: tooltipArea.x + tooltipArea.width + spacing,
          width: tooltipWidth,
        };
      default:
        return {
          top: tooltipArea.y + tooltipArea.height + spacing,
          left: tooltipArea.x + tooltipArea.width / 2 - tooltipWidth / 2,
          width: tooltipWidth,
        };
    }
  };

  const tooltipStyle = getTooltipStyle();

  return (
    <Animated.View
      style={[
        styles.container,
        tooltipStyle,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.tooltip, { backgroundColor: theme.surface }]}>
        <Text style={[styles.message, { color: theme.text }]}>{message}</Text>
        {showCloseButton && onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={[styles.closeText, { color: theme.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {/* Стрелка указывающая на элемент */}
      <View
        style={[
          styles.arrow,
          {
            backgroundColor: theme.surface,
            ...(getArrowStyle(position) as any),
          },
        ]}
      />
    </Animated.View>
  );
}

function getArrowStyle(position: "top" | "bottom" | "left" | "right") {
  switch (position) {
    case "top":
      return {
        bottom: -6,
        left: "50%",
        marginLeft: -6,
        transform: [{ rotate: "45deg" }],
      };
    case "bottom":
      return {
        top: -6,
        left: "50%",
        marginLeft: -6,
        transform: [{ rotate: "45deg" }],
      };
    case "left":
      return {
        right: -6,
        top: "50%",
        marginTop: -6,
        transform: [{ rotate: "45deg" }],
      };
    case "right":
      return {
        left: -6,
        top: "50%",
        marginTop: -6,
        transform: [{ rotate: "45deg" }],
      };
  }
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: 8,
    padding: 12,
    paddingRight: 32,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  arrow: {
    position: "absolute",
    width: 12,
    height: 12,
  },
});
