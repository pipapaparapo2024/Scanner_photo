import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { useIap } from "../model/useIap";
import { showToast } from "../../../shared/ui/Toast";
import { useTheme } from "../../../app/providers/ThemeProvider";

interface PurchaseButtonProps {
  productId: string;
  productName: string;
  credits: number;
  price?: string; // Для отображения цены (если доступна)
  onSuccess?: () => void;
  testID?: string;
}

/**
 * Кнопка для покупки пакета сканов
 */
export function PurchaseButton({
  productId,
  productName,
  credits,
  price,
  onSuccess,
  testID,
}: PurchaseButtonProps) {
  const { t } = useTranslation();
  const { purchasePack, loading, error } = useIap();
  const { theme } = useTheme();

  const handlePress = async () => {
    try {
      await purchasePack(productId);
      onSuccess?.();
    } catch (err) {
      console.error("Purchase failed:", err);
      const msg = err instanceof Error ? err.message : "";
      const errorMessage = msg === "PAYMENT_UNAVAILABLE" ? t("monetization.payment_unavailable") : msg || t("monetization.payment_unavailable");
      showToast(errorMessage, "error");
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: theme.primary }, loading && { backgroundColor: theme.disabledBackground }]}
      onPress={handlePress}
      disabled={loading}
      testID={testID}
      accessibilityLabel={`${productName}, ${t("monetization.tokens_count", { count: credits })}${price ? `, ${price}` : ""}`}
      accessibilityHint={t("common.buy_pack_hint")}
      accessibilityRole="button"
      accessibilityState={{ disabled: loading }}
    >
      {loading ? (
        <ActivityIndicator color={theme.buttonText} />
      ) : (
        <>
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>{productName}</Text>
          <Text style={[styles.creditsText, { color: theme.buttonText }]}>{t("monetization.tokens_count", { count: credits })}</Text>
          {price && <Text style={[styles.priceText, { color: theme.buttonText }]}>{price}</Text>}
        </>
      )}
      {error && <Text style={[styles.errorText, { color: theme.error }]}>{error === "PAYMENT_UNAVAILABLE" ? t("monetization.payment_unavailable") : error}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  creditsText: {
    fontSize: 14,
    marginBottom: 3,
  },
  priceText: {
    fontSize: 12,
    opacity: 0.9,
  },
  errorText: {
    fontSize: 12,
    marginTop: 5,
  },
});

