import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../app/providers/ThemeProvider";
import { verifyEmailCode, sendEmailVerificationCode } from "../../shared/lib/firebase/auth";
import { showToast } from "../../shared/ui/Toast";
import type { RootStackParamList } from "../../app/router/types";

type Props = NativeStackScreenProps<RootStackParamList, "RegisterCode">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "RegisterCode">;

/**
 * Страница ввода 4-значного кода для регистрации
 */
export function RegisterCodePage() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<Props["route"]>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { email } = route.params;
  const [code, setCode] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60); // Таймер на 60 секунд
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Таймер обратного отсчета для повторной отправки кода
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleResendCode = async () => {
    if (resendTimer > 0 || isResending) {
      return;
    }

    try {
      setIsResending(true);
      // Отправляем код на email через backend
      await sendEmailVerificationCode(email);
      setResendTimer(60); // Сбрасываем таймер на 60 секунд
      setError("");
      showToast(t("auth.code_resent_success"), "success");
    } catch (error: any) {
      showToast(error.message || t("auth.send_code_error"), "error");
    } finally {
      setIsResending(false);
    }
  };

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Если вставлен весь код сразу
      const digits = value.split("").slice(0, 4);
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (i < 4) {
          newCode[i] = digit;
        }
      });
      setCode(newCode);
      // Фокус на последний введенный символ
      const lastIndex = Math.min(digits.length - 1, 3);
      inputRefs.current[lastIndex]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");

    // Переход к следующему полю
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const codeString = code.join("");
    if (codeString.length !== 4) {
      setError(t("auth.code_error_length"));
      return;
    }

    try {
      setLoading(true);
      setError("");
      await verifyEmailCode(email, codeString);
      // Код подтвержден - переходим на страницу ввода пароля
      navigation.replace("RegisterPassword", { email });
    } catch (error: any) {
      setError(error.message || t("auth.code_error_invalid"));
      showToast(error.message || t("auth.code_error_invalid"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t("auth.enter_code_title")}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t("auth.enter_code_subtitle", { email })}
        </Text>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.codeInput,
                {
                  borderColor: error ? theme.error : theme.borderColor,
                  color: theme.text,
                },
              ]}
              value={digit}
              onChangeText={(value) => handleCodeChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.primary },
            loading && styles.buttonDisabled,
          ]}
          onPress={handleVerify}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? t("auth.verifying") : t("auth.verify")}
          </Text>
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={[styles.resendText, { color: theme.textSecondary }]}>
            {t("auth.code_not_received")}
          </Text>
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={resendTimer > 0 || isResending}
            style={[
              styles.resendButton,
              (resendTimer > 0 || isResending) && styles.resendButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.resendButtonText,
                { color: resendTimer > 0 ? theme.textSecondary : theme.primary },
              ]}
            >
              {isResending
                ? t("auth.sending")
                : resendTimer > 0
                ? t("auth.resend_timer", { time: formatTimer(resendTimer) })
                : t("auth.resend_code_action")}
            </Text>
          </TouchableOpacity>
        </View>
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
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  codeInput: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
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
  resendContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  resendText: {
    fontSize: 14,
    marginBottom: 8,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
