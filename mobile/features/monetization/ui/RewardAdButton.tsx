import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { useRewardAds } from "../model/useRewardAds";

interface RewardAdButtonProps {
  onSuccess?: () => void;
  testID?: string;
}

/**
 * Кнопка для просмотра рекламы с наградой
 * Доступна только при scanCredits == 0
 */
export function RewardAdButton({ onSuccess, testID }: RewardAdButtonProps) {
  const { t } = useTranslation();
  const { showRewardedAd, loading, error, canWatchAd } = useRewardAds();

  const handlePress = async () => {
    try {
      await showRewardedAd();
      onSuccess?.();
    } catch (err) {
      console.error("Reward ad failed:", err);
    }
  };

  if (!canWatchAd) {
    return (
      <TouchableOpacity style={[styles.button, styles.buttonDisabled]} disabled testID={testID}>
        <Text style={styles.buttonText}>
          {t("monetization.reward_ad_only_zero")}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, loading && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={loading}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Text style={styles.buttonText}>{t("monetization.watch_ad")}</Text>
          <Text style={styles.rewardText}>{t("monetization.reward_3_tokens")}</Text>
        </>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#FF9800",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: "#999",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  rewardText: {
    color: "#fff",
    fontSize: 14,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
});

