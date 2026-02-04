import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../app/providers/ThemeProvider";
import { sendEmailVerificationCode } from "../../shared/lib/firebase/auth";
import { checkEmailExists } from "../../shared/lib/api/authApi";
import { showToast } from "../../shared/ui/Toast";
import type { RootStackParamList } from "../../app/router/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "RegisterEmail">;

/**
 * Страница ввода email для регистрации
 */
export function RegisterEmailPage() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Устанавливаем русский язык по умолчанию для страницы регистрации
  React.useEffect(() => {
    if (i18n.language !== 'ru') {
      i18n.changeLanguage('ru');
    }
  }, [i18n]);

  // Проверка email при вводе (debounced)
  const checkEmail = useCallback(async (emailValue: string) => {
    if (!emailValue.trim()) {
      setEmailError("");
      return;
    }

    // Простая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      setEmailError("");
      return; // Не проверяем существование, если формат неверный
    }

    try {
      setCheckingEmail(true);
      const result = await checkEmailExists(emailValue.trim().toLowerCase());
      if (result.exists) {
        setEmailError(t("auth.email_already_registered"));
      } else {
        setEmailError("");
      }
    } catch (error) {
      // Игнорируем ошибки проверки, чтобы не блокировать пользователя
      console.error("Failed to check email:", error);
      setEmailError("");
    } finally {
      setCheckingEmail(false);
    }
  }, [t]);

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setEmailError("");
    // Проверяем email с задержкой (debounce)
    const timeoutId = setTimeout(() => {
      checkEmail(text);
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  const handleContinue = async () => {
    if (!email.trim()) {
      showToast(t("auth.enter_email_error"), "error");
      return;
    }

    // Простая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast(t("auth.invalid_email_format"), "error");
      return;
    }

    // Проверяем существование email перед отправкой кода
    try {
      setLoading(true);
      const result = await checkEmailExists(email.trim().toLowerCase());
      if (result.exists) {
        showToast(t("auth.email_already_registered"), "error");
        setEmailError(t("auth.email_already_registered"));
        return;
      }

      // Отправляем код на email через backend
      await sendEmailVerificationCode(email);
      // Код отправлен на email - переходим на страницу ввода кода
      navigation.navigate("RegisterCode", { email });
    } catch (error: any) {
      showToast(error.message || t("auth.send_code_error"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t("auth.register")}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t("auth.enter_email")}
        </Text>

        <View style={[styles.inputContainer, { 
          borderColor: emailError ? theme.error : theme.borderColor 
        }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder={t("auth.email_placeholder")}
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            testID="e2e-register-email"
          />
        </View>
        {emailError ? (
          <Text style={[styles.errorText, { color: theme.error }]}>
            {emailError}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.primary },
            loading && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={loading}
          testID="e2e-register-continue"
        >
          <Text style={styles.buttonText}>
            {loading ? t("auth.sending") : t("auth.continue")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 12,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#FF3B30",
    marginTop: -16,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
