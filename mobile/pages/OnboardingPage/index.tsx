import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../app/providers/ThemeProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Camera, FileType, Download } from "lucide-react-native";
import type { RootStackParamList } from "../../app/router/types";

const ONBOARDING_COMPLETED_KEY = "@scanimg:onboarding_completed";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Onboarding">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface OnboardingPage {
  titleKey: string;
  descriptionKey: string;
  IconComponent: any;
}

const onboardingPages: OnboardingPage[] = [
  {
    titleKey: "onboarding.page1.title",
    descriptionKey: "onboarding.page1.description",
    IconComponent: Camera,
  },
  {
    titleKey: "onboarding.page2.title",
    descriptionKey: "onboarding.page2.description",
    IconComponent: FileType,
  },
  {
    titleKey: "onboarding.page3.title",
    descriptionKey: "onboarding.page3.description",
    IconComponent: Download,
  },
];

/**
 * Onboarding экран приложения
 * Показывает 4 страницы с инструкциями по использованию
 */
export function OnboardingPage() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<Props["route"]>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Если showAuth === false, значит это "О приложении" - не показываем регистрацию
  const showAuth = route.params?.showAuth !== false;

  const handleNext = async () => {
    if (currentPage < onboardingPages.length - 1) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      scrollViewRef.current?.scrollTo({
        x: nextPage * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      // Последняя страница
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
      
      if (showAuth) {
        // Показываем авторизацию только если это не "О приложении"
        navigation.replace("AuthChoice");
      } else {
        // Если это "О приложении", просто возвращаемся назад
        navigation.goBack();
      }
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
    
    if (showAuth) {
      // Показываем авторизацию только если это не "О приложении"
      navigation.replace("AuthChoice");
    } else {
      // Если это "О приложении", просто возвращаемся назад
      navigation.goBack();
    }
  };

  const handlePageChange = (event: any) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentPage(page);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Кнопка пропустить */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip} testID="e2e-onboarding-skip">
        <Text style={[styles.skipText, { color: theme.textSecondary }]}>{t("onboarding.skip")}</Text>
      </TouchableOpacity>

      {/* Скролл с страницами */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handlePageChange}
        style={styles.scrollView}
      >
        {onboardingPages.map((page, index) => {
          const IconComponent = page.IconComponent;
          return (
            <View key={index} style={[styles.page, { width: SCREEN_WIDTH }]}>
              <View style={styles.iconContainer}>
                <IconComponent size={80} color={theme.text} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>{t(page.titleKey)}</Text>
              <Text style={[styles.description, { color: theme.textSecondary }]}>
                {t(page.descriptionKey)}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Индикатор страниц */}
      <View style={styles.pagination}>
        {onboardingPages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === currentPage ? theme.primary : theme.borderColor,
                width: index === currentPage ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Кнопка далее */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: theme.primary }]}
          onPress={handleNext}
          testID="e2e-onboarding-next"
          accessibilityLabel={currentPage === onboardingPages.length - 1 ? t("onboarding.start") : t("onboarding.next")}
          accessibilityHint={currentPage === onboardingPages.length - 1 ? t("onboarding.start_hint") : t("onboarding.next_hint")}
          accessibilityRole="button"
        >
          <Text style={[styles.nextButtonText, { color: theme.buttonText }]}>
            {currentPage === onboardingPages.length - 1 ? t("onboarding.start") : t("onboarding.next")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 80,
    paddingBottom: 20,
  },
  iconContainer: {
    marginBottom: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    paddingTop: 20,
  },
  nextButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
});

