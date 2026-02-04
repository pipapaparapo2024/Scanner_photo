import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../app/providers/ThemeProvider";
import { CheckCircle } from "lucide-react-native";
import type { RootStackParamList } from "../../app/router/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "RegisterSuccess">;

/**
 * Страница успешной регистрации
 * Пользователь создан в Firebase Auth и Firestore через backend API
 * Firebase Auth автоматически сохраняет сессию на устройстве
 */
export function RegisterSuccessPage() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const handleContinue = () => {
    // Переходим на экран аккаунта
    navigation.reset({
      index: 0,
      routes: [{
        name: "MainTabs",
        state: {
          routes: [{ name: "Account" }],
        },
      }],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <CheckCircle size={80} color={theme.success} style={styles.icon} />
        <Text style={[styles.title, { color: theme.text }]}>Регистрация успешна!</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Добро пожаловать в приложение
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Перейти в главное меню</Text>
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
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    marginBottom: 20,
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
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

