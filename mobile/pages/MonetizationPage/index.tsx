import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useUser } from "../../entities/user/model/useUser";
import { useTheme } from "../../app/providers/ThemeProvider";
import { PurchaseButton } from "../../features/monetization/ui/PurchaseButton";
import { RewardAdButton } from "../../features/monetization/ui/RewardAdButton";
import { BalanceSkeleton, SectionSkeleton } from "../../shared/ui/SkeletonLoader";
import { useTranslation } from "react-i18next";

/**
 * Экран монетизации
 * Покупки пакетов сканов и просмотр рекламы
 */
export function MonetizationPage() {
  const { user, loading, refresh } = useUser();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const handleSuccess = () => {
    // Обновляем баланс после успешной покупки/просмотра рекламы
    refresh();
  };

  if (loading) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
        <BalanceSkeleton />
        <SectionSkeleton />
        <SectionSkeleton />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content} testID="e2e-monetization">
      <View style={[styles.balanceSection, { backgroundColor: theme.surface }]} testID="e2e-monetization-balance">
        <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>{t("monetization.current_balance")}:</Text>
        <Text style={[styles.balanceValue, { color: theme.text }]}>{user?.scanCredits ?? 0} {t("monetization.tokens")}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("monetization.buy_packs")}</Text>
        <PurchaseButton
          productId="pack_50_scans"
          productName={t("monetization.pack_50")}
          credits={50}
          onSuccess={handleSuccess}
          testID="e2e-purchase-50"
        />
        <PurchaseButton
          productId="pack_100_scans"
          productName={t("monetization.pack_100")}
          credits={100}
          onSuccess={handleSuccess}
          testID="e2e-purchase-100"
        />
      </View>

      {user?.scanCredits === 0 && (
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("monetization.reward_ad_title")}</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            {t("monetization.reward_ad_desc")}
          </Text>
          <RewardAdButton onSuccess={handleSuccess} testID="e2e-ad-reward" />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100, // Отступ для Tab Bar
  },
  balanceSection: {
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: "bold",
  },
  section: {
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 20,
  },
});

