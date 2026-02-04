import React, { useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { useNavigation, useRoute, CommonActions } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTheme } from "../../app/providers/ThemeProvider";
import { Copy, ArrowLeft } from "lucide-react-native";
import { ExportButton } from "../../shared/ui/ExportButton";
import type { RootStackParamList } from "../../app/router/types";
import { useTranslation } from "react-i18next";
import { showToast } from "../../shared/ui/Toast";

type Props = NativeStackScreenProps<RootStackParamList, "ScanResult">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ScanResult">;

/**
 * Экран результата сканирования с текстом и кнопкой копирования
 */
export function ScanResultPage() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<Props["route"]>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  
  // Defensive check for params
  const params = route.params || {};
  const scanId = params.scanId;
  const extractedText = params.extractedText;

  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Если параметры отсутствуют, показываем ошибку или возвращаемся назад
  if (!scanId || !extractedText) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: theme.text, fontSize: 16, marginBottom: 20 }}>
          {t("common.error_occurred")}
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          onPress={() => navigation.navigate("MainTabs", { screen: "History" })}
        >
          <ArrowLeft size={24} color={theme.text} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    );
  }

  const handleCopy = useCallback(async () => {
    // Debounce - предотвращаем множественные нажатия
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }

    copyTimeoutRef.current = setTimeout(async () => {
      try {
        await Clipboard.setString(extractedText);
        showToast(t("scan_result.copy_success"), "success");
      } catch (error) {
        showToast(t("scan_result.copy_error"), "error");
      }
    }, 300);
  }, [extractedText, t]);

  const goToHistory = useCallback(() => {
    // Используем navigate вместо reset для более безопасной навигации
    // Это предотвращает размонтирование всего стека и возможные сбои
    navigation.navigate("MainTabs", { screen: "History" });
  }, [navigation]);

  return (
    <View 
      style={[styles.container, { backgroundColor: theme.background }]}
      accessibilityLabel={t("scan_result.title")}
    >
      {/* Заголовок: назад, название, кнопки действий */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goToHistory}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel={t("common.back")}
          accessibilityHint={t("common.back_hint")}
          accessibilityRole="button"
        >
          <ArrowLeft size={24} color={theme.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text 
          style={[styles.headerTitle, { color: theme.text }]}
          accessibilityRole="header"
        >
          {t("scan_result.title")}
        </Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.copyButton, { backgroundColor: theme.primary }]}
            onPress={handleCopy}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel={t("scan.copyToClipboard")}
            accessibilityHint={t("scan_detail.copy_hint")}
            accessibilityRole="button"
          >
            <Copy size={22} color={theme.buttonText} strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.exportButtonWrapper}>
            <ExportButton text={extractedText} />
          </View>
        </View>
      </View>

      {/* Текст результата */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        accessibilityLabel={t("scan_result.text_recognized")}
      >
        <Text 
          style={[styles.text, { color: theme.text }]}
          selectable={true}
          accessibilityLabel={`${t("scan_result.text_recognized")} ${extractedText.substring(0, 100)}${extractedText.length > 100 ? '...' : ''}`}
        >
          {extractedText}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  copyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  exportButtonWrapper: {
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
});

