import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScanResult } from "../../features/camera-scan/ui/ScanResult";
import { useCameraScan } from "../../features/camera-scan/model/useCameraScan";
import { useUser } from "../../entities/user/model/useUser";
import { useTheme } from "../../app/providers/ThemeProvider";
import { Camera } from "lucide-react-native";
import type { MainTabParamList } from "../../app/router/types";
import type { RootStackParamList } from "../../app/router/types";
import { OnboardingTour } from "../../shared/ui/OnboardingTour";
import { useOnboardingTour } from "../../shared/lib/onboarding/useOnboardingTour";
import { SkeletonLoader } from "../../shared/ui/SkeletonLoader";

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Scan">,
  NativeStackNavigationProp<RootStackParamList>
>;

/**
 * Главный экран приложения
 * Показывает результат сканирования или кнопку для открытия камеры
 */
export function HomePage() {
  const navigation = useNavigation<NavigationProp>();
  const { lastScanResult, reset } = useCameraScan();
  const { user, loading: userLoading } = useUser();
  const { theme } = useTheme();
  const { steps, refs } = useOnboardingTour();

  // Показываем результат сканирования
  if (lastScanResult) {
    return (
      <View 
        style={[styles.container, { backgroundColor: theme.background }]}
        accessibilityLabel="Результат сканирования"
      >
        <ScanResult result={lastScanResult} />
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={() => {
              reset();
              navigation.navigate("CameraModal");
            }}
            accessibilityLabel="Сканировать еще"
            accessibilityHint="Открывает камеру для нового сканирования"
            accessibilityRole="button"
          >
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>Сканировать еще</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Показываем пустой экран с кнопкой для открытия камеры
  return (
    <View 
      style={[styles.container, { backgroundColor: theme.background }]} 
      testID="e2e-home"
      accessibilityLabel="Главный экран"
    >
      <View style={styles.emptyContainer}>
        <View 
          style={styles.iconContainer}
          accessibilityLabel="Иконка камеры"
        >
          <Camera size={80} color={theme.primary} />
        </View>
        <Text 
          style={[styles.emptyTitle, { color: theme.text }]} 
          testID="e2e-home-ready"
          accessibilityRole="header"
        >
          Готов к сканированию
        </Text>
        <Text 
          style={[styles.emptyText, { color: theme.textSecondary }]}
          accessibilityLabel="Инструкция: нажмите на кнопку Scan внизу, чтобы открыть камеру"
        >
          Нажмите на кнопку Scan внизу, чтобы открыть камеру
        </Text>
        
        {/* Баланс токенов с loading state */}
        {userLoading ? (
          <View style={[styles.balanceCard, { backgroundColor: theme.surface }]}>
            <SkeletonLoader width={100} height={16} style={{ marginBottom: 8 }} />
            <SkeletonLoader width={60} height={36} />
          </View>
        ) : user ? (
          <View 
            style={[styles.balanceCard, { backgroundColor: theme.surface }]}
            accessibilityLabel={`Доступно ${user.scanCredits ?? 0} токенов`}
            accessibilityRole="text"
          >
            <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>
              Доступно токенов
            </Text>
            <Text style={[styles.balanceValue, { color: theme.text }]}>
              {user.scanCredits ?? 0}
            </Text>
          </View>
        ) : null}
      </View>
      
      {/* Интерактивный тур онбординга */}
      {!lastScanResult && (
        <OnboardingTour
          steps={steps}
          enabled={true}
          onComplete={() => {
            console.log("[Onboarding] Tour completed");
          }}
          onSkip={() => {
            console.log("[Onboarding] Tour skipped");
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  iconContainer: {
    marginBottom: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 22,
  },
  balanceCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: "bold",
  },
  actions: {
    padding: 20,
    paddingBottom: 100, // Отступ для Tab Bar
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

