import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowLeft } from "lucide-react-native";
import { useTheme } from "../../app/providers/ThemeProvider";
import type { RootStackParamList } from "../../app/router/types";
import { useTranslation } from "react-i18next";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "PrivacyPolicy">;

/**
 * Страница политики конфиденциальности
 */
export function PrivacyPolicyPage() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();

  const handleOpenWeb = () => {
    Linking.openURL("https://example.com/privacy-policy"); // Заглушка, замените на реальный URL
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Заголовок */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={24} color={theme.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t("privacy.title")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Контент */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>{t("privacy.title")}</Text>
        <Text style={[styles.lastUpdated, { color: theme.textSecondary }]}>
          {t("privacy.last_updated", { date: new Date().toLocaleDateString(i18n.language === "ru" ? "ru-RU" : "en-US") })}
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("privacy.section1.title")}</Text>
        <Text style={[styles.text, { color: theme.text }]}>{t("privacy.section1.text")}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("privacy.section2.title")}</Text>
        <Text style={[styles.text, { color: theme.text }]}>{t("privacy.section2.text")}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("privacy.section3.title")}</Text>
        <Text style={[styles.text, { color: theme.text }]}>{t("privacy.section3.text")}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("privacy.section4.title")}</Text>
        <Text style={[styles.text, { color: theme.text }]}>{t("privacy.section4.text")}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("privacy.section5.title")}</Text>
        <Text style={[styles.text, { color: theme.text }]}>{t("privacy.section5.text")}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("privacy.section6.title")}</Text>
        <Text style={[styles.text, { color: theme.text }]}>{t("privacy.section6.text")}</Text>

        {/* Ссылка на веб-страницу */}
        <TouchableOpacity
          style={[styles.webLink, { borderColor: theme.border }]}
          onPress={handleOpenWeb}
        >
          <Text style={[styles.webLinkText, { color: theme.primary }]}>
            {t("privacy.web_link")}
          </Text>
        </TouchableOpacity>
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
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 12,
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  webLink: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  webLinkText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
