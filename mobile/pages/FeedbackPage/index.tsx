import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../app/providers/ThemeProvider";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Send, ChevronDown } from "lucide-react-native";
import { useAuth } from "../../app/providers/FirebaseProvider";
import { submitFeedback } from "../../entities/feedback/api/feedbackApi";
import { showToast } from "../../shared/ui/Toast";
import type { RootStackParamList } from "../../app/router/types";

const FEEDBACK_SUBJECT_KEYS = ["bug", "suggestion", "question", "complaint", "other"];

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Feedback">;

/**
 * Страница обратной связи
 */
export function FeedbackPage() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const [subjectKey, setSubjectKey] = useState<string | null>(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(authUser?.email || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!subjectKey || !message.trim()) {
      showToast(t("feedback.validation_error"), "warning");
      return;
    }

    try {
      setLoading(true);
      const translatedSubject = t(`feedback.subjects.${subjectKey}`);
      await submitFeedback({
        subject: translatedSubject,
        message: message.trim(),
        email: email.trim() || undefined,
      });
      showToast(t("feedback.success"), "info");
      setSubjectKey(null);
      setMessage("");
      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (error: any) {
      console.error("Failed to submit feedback:", error);
      const errorMessage = error?.message || t("feedback.send_error");
      if (error?.status === 500) {
        showToast(t("feedback.server_error"), "error");
      } else {
        showToast(errorMessage, "error");
      }
    } finally {
      setLoading(false);
    }
  }, [subjectKey, message, email, navigation, t]);

  const handleSelectSubject = (key: string) => {
    setSubjectKey(key);
    setShowSubjectPicker(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>{t("feedback.title")}</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {t("feedback.description")}
        </Text>

        {/* Тема */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.text }]}>{t("feedback.subject")} *</Text>
          <TouchableOpacity
            style={[styles.subjectPicker, { borderColor: theme.border, backgroundColor: theme.surface }]}
            onPress={() => setShowSubjectPicker(true)}
          >
            <Text style={[styles.subjectPickerText, { color: subjectKey ? theme.text : theme.textSecondary }]}>
              {subjectKey ? t(`feedback.subjects.${subjectKey}`) : t("feedback.subject_placeholder")}
            </Text>
            <ChevronDown size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Сообщение */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.text }]}>{t("feedback.message")} *</Text>
          <TextInput
            style={[styles.textArea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
            placeholder={t("feedback.message_placeholder")}
            placeholderTextColor={theme.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            maxLength={2000}
          />
          <Text style={[styles.charCount, { color: theme.textSecondary }]}>
            {message.length}/2000
          </Text>
        </View>

        {/* Email (опционально) */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.text }]}>{t("feedback.email")}</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
            placeholder={t("feedback.email_placeholder")}
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={[styles.hint, { color: theme.textSecondary }]}>{t("feedback.email_hint")}</Text>
        </View>

        {/* Кнопка отправки */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.primary }, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          accessibilityLabel={t("feedback.send")}
          accessibilityRole="button"
          accessibilityState={{ disabled: loading }}
        >
          {loading ? (
            <ActivityIndicator color={theme.buttonText} />
          ) : (
            <>
              <Send size={20} color={theme.buttonText} strokeWidth={2} />
              <Text style={[styles.submitButtonText, { color: theme.buttonText }]}>{t("feedback.send")}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Модальное окно выбора темы */}
      <Modal
        visible={showSubjectPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubjectPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSubjectPicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t("feedback.subject_placeholder")}</Text>
            {FEEDBACK_SUBJECT_KEYS.map((key: string) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.modalItem,
                  { borderBottomColor: theme.border },
                  subjectKey === key && { backgroundColor: theme.background },
                ]}
                onPress={() => handleSelectSubject(key)}
              >
                <Text style={[styles.modalItemText, { color: theme.text }]}>{t(`feedback.subjects.${key}`)}</Text>
                {subjectKey === key && (
                  <View style={[styles.checkmark, { backgroundColor: theme.primary }]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    maxHeight: 200,
  },
  charCount: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "right",
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  subjectPicker: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subjectPickerText: {
    fontSize: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
    flex: 1,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
