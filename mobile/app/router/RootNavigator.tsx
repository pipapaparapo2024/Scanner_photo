import React, { useEffect, useRef, useState } from "react";
import { NavigationContainer, NavigationContainerRef, NavigationState } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
import { TabNavigator } from "./TabNavigator";
import { ScanDetailPage } from "../../pages/ScanDetailPage";
import { MonetizationPage } from "../../pages/MonetizationPage";
import { CameraModalPage } from "../../pages/CameraModalPage";
import { ImagePickerPage } from "../../pages/ImagePickerPage";
import { OnboardingPage } from "../../pages/OnboardingPage";
import { PhotoConfirmPage } from "../../pages/PhotoConfirmPage";
import { ScanLoadingPage } from "../../pages/ScanLoadingPage";
import { ScanResultPage } from "../../pages/ScanResultPage";
import { ScanErrorPage } from "../../pages/ScanErrorPage";
import { AuthChoicePage } from "../../pages/AuthChoicePage";
import { RegisterEmailPage } from "../../pages/RegisterEmailPage";
import { RegisterCodePage } from "../../pages/RegisterCodePage";
import { RegisterPasswordPage } from "../../pages/RegisterPasswordPage";
import { RegisterSuccessPage } from "../../pages/RegisterSuccessPage";
import { LoginEmailPage } from "../../pages/LoginEmailPage";
import { FeedbackPage } from "../../pages/FeedbackPage";
import { PrivacyPolicyPage } from "../../pages/PrivacyPolicyPage";
import { TermsOfServicePage } from "../../pages/TermsOfServicePage";
import { FAQPage } from "../../pages/FAQPage";
import { CloudStorageSettingsPage } from "../../pages/CloudStorageSettingsPage";
import { useTheme } from "../providers/ThemeProvider";
import { setToastContainer } from "../../shared/ui/Toast";
import { RatingModal } from "../../shared/ui/RatingModal";
import { RatingService } from "../../shared/lib/rating/ratingService";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  showOnboarding?: boolean;
  showAuth?: boolean;
}

/**
 * Главный навигатор приложения
 * Использует Stack Navigator для модальных окон поверх Tab Navigator
 */
export function RootNavigator({ showOnboarding = false, showAuth = false }: RootNavigatorProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const [toast, setToast] = useState<React.ReactNode | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  useEffect(() => {
    setToastContainer(setToast);
  }, []);

  // Обработка ошибок навигации
  const handleNavigationError = (error: Error) => {
    console.error("Navigation error:", error);
    // Предотвращаем краш приложения при ошибках навигации
    // Пытаемся вернуться на безопасный экран
    try {
      if (navigationRef.current?.isReady()) {
        // Если навигация готова, пытаемся перейти на главный экран
        navigationRef.current?.navigate("MainTabs" as never);
      }
    } catch (navError) {
      console.error("Failed to handle navigation error:", navError);
    }
  };

  // Обработка изменения состояния навигации
  const handleNavigationStateChange = (state: NavigationState | undefined) => {
    // Проверяем, что состояние навигации валидно
    if (!state) {
      console.warn("Navigation state is undefined");
      return;
    }
  };

  // Проверяем, нужно ли показать запрос оценки
  useEffect(() => {
    const checkRatingPrompt = async () => {
      const shouldShow = await RatingService.shouldShowRatingPrompt();
      if (shouldShow) {
        // Небольшая задержка, чтобы не показывать сразу при загрузке
        setTimeout(() => {
          setShowRatingModal(true);
        }, 2000);
      }
    };
    checkRatingPrompt();
  }, []);

  // Показываем onboarding при первом запуске
  // НО только если пользователь НЕ авторизован
  useEffect(() => {
    if (showOnboarding && !showAuth && navigationRef.current) {
      const timer = setTimeout(() => {
        navigationRef.current?.navigate("Onboarding");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showOnboarding, showAuth]);

  // Показываем экран авторизации после onboarding, если пользователь не авторизован
  useEffect(() => {
    if (showAuth && navigationRef.current) {
      const timer = setTimeout(() => {
        navigationRef.current?.navigate("AuthChoice");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showAuth]);
  
  return (
    <NavigationContainer 
      ref={navigationRef}
      onStateChange={handleNavigationStateChange}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.surface,
          },
          headerTintColor: theme.text,
          headerTitleStyle: {
            fontWeight: "bold",
            color: theme.text,
          },
          animation: "fade",
          animationDuration: 300,
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ScanDetail"
          component={ScanDetailPage}
          options={{
            title: t("scan_detail.title"),
          }}
        />
        <Stack.Screen
          name="Monetization"
          component={MonetizationPage}
          options={{
            title: t("monetization.title"),
          }}
        />
        <Stack.Screen
          name="CameraModal"
          component={CameraModalPage}
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
            animationDuration: 300,
          }}
        />
        <Stack.Screen
          name="ImagePicker"
          component={ImagePickerPage}
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
            animationDuration: 300,
          }}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingPage}
          options={{
            headerShown: false,
            presentation: "modal",
            animation: "fade",
            animationDuration: 300,
          }}
        />
        <Stack.Screen
          name="PhotoConfirm"
          component={PhotoConfirmPage}
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
            animationDuration: 300,
          }}
        />
        <Stack.Screen
          name="ScanLoading"
          component={ScanLoadingPage}
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            gestureEnabled: false,
            animation: "fade",
            animationDuration: 200,
          }}
        />
        <Stack.Screen
          name="ScanResult"
          component={ScanResultPage}
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
            animationDuration: 300,
          }}
        />
        <Stack.Screen
          name="ScanError"
          component={ScanErrorPage}
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "fade",
            animationDuration: 300,
          }}
        />
        <Stack.Screen
          name="AuthChoice"
          component={AuthChoicePage}
          options={{
            headerShown: false,
            presentation: "modal",
            animation: "fade",
            animationDuration: 300,
          }}
        />
        <Stack.Screen
          name="RegisterEmail"
          component={RegisterEmailPage}
          options={{
            title: t("auth.registration_title"),
          }}
        />
        <Stack.Screen
          name="RegisterCode"
          component={RegisterCodePage}
          options={{
            title: t("auth.confirmation_title"),
          }}
        />
        <Stack.Screen
          name="RegisterPassword"
          component={RegisterPasswordPage}
          options={{
            title: t("auth.create_password_title"),
          }}
        />
        <Stack.Screen
          name="RegisterSuccess"
          component={RegisterSuccessPage}
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="LoginEmail"
          component={LoginEmailPage}
          options={{
            title: t("auth.login_title"),
          }}
        />
        <Stack.Screen
          name="Feedback"
          component={FeedbackPage}
          options={{
            title: t("feedback.title"),
          }}
        />
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyPage}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="TermsOfService"
          component={TermsOfServicePage}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="FAQ"
          component={FAQPage}
          options={{
            headerShown: false,
            presentation: "card",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="CloudStorageSettings"
          component={CloudStorageSettingsPage}
          options={{
            headerShown: false,
            presentation: "card",
            animation: "slide_from_right",
          }}
        />
      </Stack.Navigator>
      {toast && <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "box-none" }}>{toast}</View>}
      {/* Rating Modal */}
      <RatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onRate={() => setShowRatingModal(false)}
        onLater={() => setShowRatingModal(false)}
        onDontAsk={() => setShowRatingModal(false)}
      />
    </NavigationContainer>
  );
}

