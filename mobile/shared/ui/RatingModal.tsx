import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Linking } from "react-native";
import { Star, X } from "lucide-react-native";
import { useTheme } from "../../app/providers/ThemeProvider";
import { useTranslation } from "react-i18next";
import { RatingService } from "../lib/rating/ratingService";

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  onRate: () => void;
  onLater: () => void;
  onDontAsk: () => void;
}

/**
 * Модальное окно для запроса оценки приложения
 */
export function RatingModal({
  visible,
  onClose,
  onRate,
  onLater,
  onDontAsk,
}: RatingModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleRate = async () => {
    // Открываем RuStore (или Play Store в зависимости от платформы)
    // Для RuStore нужно использовать правильный URL
    const rustoreUrl = "https://apps.rustore.ru/app/com.scanimg.app"; // Замените на реальный URL вашего приложения
    try {
      const canOpen = await Linking.canOpenURL(rustoreUrl);
      if (canOpen) {
        await Linking.openURL(rustoreUrl);
      } else {
        // Fallback на Play Store, если RuStore недоступен
        await Linking.openURL("https://play.google.com/store/apps/details?id=com.scanimg.app");
      }
    } catch (error) {
      console.warn("Failed to open store:", error);
    }
    await RatingService.markPromptShown();
    onRate();
  };

  const handleLater = async () => {
    await RatingService.markPromptShown();
    onLater();
  };

  const handleDontAsk = async () => {
    await RatingService.setDontAskAgain();
    onDontAsk();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              {/* Кнопка закрытия */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color={theme.textSecondary} strokeWidth={2} />
              </TouchableOpacity>

              {/* Иконка звезды */}
              <View style={[styles.iconContainer, { backgroundColor: `${theme.primary}15` }]}>
                <Star size={32} color={theme.primary} fill={theme.primary} strokeWidth={2} />
              </View>

              {/* Заголовок */}
              <Text style={[styles.title, { color: theme.text }]}>
                {t("rating.title")}
              </Text>

              {/* Сообщение */}
              <Text style={[styles.message, { color: theme.textSecondary }]}>
                {t("rating.message")}
              </Text>

              {/* Кнопки */}
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={[styles.rateButton, { backgroundColor: theme.primary }]}
                  onPress={handleRate}
                  accessibilityLabel={t("rating.rate_button")}
                  accessibilityHint={t("rating.rate_hint")}
                  accessibilityRole="button"
                >
                  <Star size={18} color={theme.buttonText} fill={theme.buttonText} strokeWidth={2} />
                  <Text style={[styles.rateButtonText, { color: theme.buttonText }]}>{t("rating.rate_button")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.laterButton, { borderColor: theme.border }]}
                  onPress={handleLater}
                >
                  <Text style={[styles.laterButtonText, { color: theme.text }]}>{t("rating.later_button")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dontAskButton}
                  onPress={handleDontAsk}
                >
                  <Text style={[styles.dontAskButtonText, { color: theme.textSecondary }]}>
                    {t("rating.dont_ask_button")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    paddingTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  buttonsContainer: {
    gap: 12,
  },
  rateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  rateButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  laterButton: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  laterButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  dontAskButton: {
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dontAskButtonText: {
    fontSize: 14,
  },
});
