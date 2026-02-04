import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { CheckCircle, XCircle, Info, AlertCircle, X } from "lucide-react-native";
import { useTheme } from "../../app/providers/ThemeProvider";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

/**
 * Компонент для отображения всплывающих уведомлений сверху экрана
 */
export function Toast({ message, type = "info", duration = 3000, onClose }: ToastProps) {
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Анимация появления
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Автоматическое скрытие
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  };

  const getIcon = () => {
    const iconSize = 20;
    const iconColor = theme.buttonText;
    switch (type) {
      case "success":
        return <CheckCircle size={iconSize} color={iconColor} strokeWidth={2} />;
      case "error":
        return <XCircle size={iconSize} color={iconColor} strokeWidth={2} />;
      case "warning":
        return <AlertCircle size={iconSize} color={iconColor} strokeWidth={2} />;
      default:
        return <Info size={iconSize} color={iconColor} strokeWidth={2} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return theme.success;
      case "error":
        return theme.error;
      case "warning":
        return theme.warning;
      default:
        return theme.info;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <View style={[styles.toast, { backgroundColor: getBackgroundColor() }]}>
        <View style={styles.content}>
          <Text 
            style={[styles.message, { color: theme.buttonText }]}
            accessibilityLabel={message}
          >
            {message}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={handleClose} 
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Закрыть уведомление"
          accessibilityRole="button"
        >
          <X size={18} color={theme.buttonText} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 12,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
    marginRight: 8,
  },
  message: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
});

/**
 * Хук для управления Toast уведомлениями
 */
let toastQueue: Array<{ message: string; type: ToastType; duration?: number }> = [];
let currentToast: React.ReactNode | null = null;
let toastContainer: ((toast: React.ReactNode | null) => void) | null = null;

export function showToast(message: string, type: ToastType = "info", duration?: number) {
  const toast = (
    <Toast
      message={message}
      type={type}
      duration={duration}
      onClose={() => {
        currentToast = null;
        toastContainer?.(null);
        // Показываем следующий toast из очереди
        if (toastQueue.length > 0) {
          const next = toastQueue.shift()!;
          setTimeout(() => showToast(next.message, next.type, next.duration), 300);
        }
      }}
    />
  );

  if (currentToast) {
    // Если уже есть toast, добавляем в очередь
    toastQueue.push({ message, type, duration });
  } else {
    currentToast = toast;
    toastContainer?.(toast);
  }
}

export function setToastContainer(setter: (toast: React.ReactNode | null) => void) {
  toastContainer = setter;
}
