import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
// 1. Исправленный импорт
import { useNavigation, useRoute } from "@react-navigation/native";
// 2. Добавляем хук для отступов
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTheme } from "../../app/providers/ThemeProvider";
import { ArrowLeft } from "lucide-react-native";
import type { RootStackParamList } from "../../app/router/types";
import { useTranslation } from "react-i18next";

type Props = NativeStackScreenProps<RootStackParamList, "PhotoConfirm">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "PhotoConfirm">;

export function PhotoConfirmPage() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<Props["route"]>();
  const insets = useSafeAreaInsets(); // 3. Инициализируем отступы
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { photoUri } = route.params;

  const handleBack = () => navigation.goBack();
  const handleContinue = () => navigation.navigate("ScanLoading", { photoUri });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 4. Динамический Header с учетом Safe Area */}
      <View style={[
        styles.header,
        {
          backgroundColor: theme.surface,
          borderBottomColor: theme.borderColor || theme.border, // проверьте название в ThemeProvider
          paddingTop: Math.max(insets.top, 12)
        }
      ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t("photo_confirm.title")}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: photoUri }}
          style={styles.image}
          resizeMode="contain"
          // 5. Заглушка на случай ошибки загрузки
          onError={() => console.warn("Ошибка загрузки изображения")}
        />
      </View>

      <View style={[styles.instructionContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.instructionText, { color: theme.textSecondary || theme.text }]}>
          {t("photo_confirm.instruction")}
        </Text>
      </View>

      {/* 6. Кнопка с учетом нижнего отступа (для iPhone без кнопок) */}
      <View style={[
        styles.actionsContainer,
        { paddingBottom: Math.max(insets.bottom, 20) }
      ]}>
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: theme.primary }]}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={[styles.continueButtonText, { color: theme.buttonText || '#FFFFFF' }]}>
            {t("photo_confirm.next")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "600", textAlign: "center" },
  headerSpacer: { width: 40 },
  imageContainer: { flex: 1, padding: 16, justifyContent: "center" },
  image: { width: "100%", height: "100%", borderRadius: 16 },
  instructionContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  instructionText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  actionsContainer: { paddingHorizontal: 16, paddingTop: 8 },
  continueButton: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonText: { fontSize: 16, fontWeight: "600" },
});
