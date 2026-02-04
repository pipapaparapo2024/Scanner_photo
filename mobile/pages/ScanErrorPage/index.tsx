import React, { useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useNavigation, CommonActions } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../app/providers/ThemeProvider";
import { Camera, ArrowLeft } from "lucide-react-native";
import type { RootStackParamList } from "../../app/router/types";
import { useTranslation } from "react-i18next";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ScanError">;

/**
 * Экран ошибки при сканировании - текст не найден или размыт
 */
export function ScanErrorPage() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handleButtonPressIn = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  }, [buttonScale]);

  const handleButtonPressOut = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [buttonScale]);

  const handleBack = () => {
    // Возвращаемся на главную страницу через reset всего стека
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      })
    );
  };

  const handleNewScan = () => {
    // Сбрасываем стек и сразу открываем камеру без показа истории
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          { name: "MainTabs" },
          { name: "CameraModal" },
        ],
      })
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Кнопка назад */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={24} color={theme.text} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Camera size={80} color={theme.text} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>
          {t("scan_error.title")}
        </Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {t("scan_error.description")}
        </Text>
      </View>

      <View style={styles.footer}>
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleNewScan}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
            accessibilityLabel={t("scan_error.button")}
            accessibilityHint="Возвращает к камере для нового сканирования"
            accessibilityRole="button"
          >
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>{t("scan_error.button")}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 10,
    left: 16,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  iconContainer: {
    marginBottom: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    width: "100%",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
  },
});

