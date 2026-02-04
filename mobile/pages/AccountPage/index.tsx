import React, { useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Animated, Modal } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useUser } from "../../entities/user/model/useUser";
import { useAuth } from "../../app/providers/FirebaseProvider";
import { useTheme } from "../../app/providers/ThemeProvider";
import { BalanceSkeleton, SectionSkeleton } from "../../shared/ui/SkeletonLoader";
import { RatingModal } from "../../shared/ui/RatingModal";
import { Star, MessageSquare, Moon, Info, Shield, FileText, HelpCircle, Cloud, Globe, Check } from "lucide-react-native";
import type { MainTabParamList } from "../../app/router/types";
import type { RootStackParamList } from "../../app/router/types";
import { useTranslation } from 'react-i18next';

type NavigationProp = BottomTabNavigationProp<MainTabParamList, "Account"> & NativeStackNavigationProp<RootStackParamList>;

/**
 * Страница аккаунта
 * Профиль пользователя, баланс, монетизация
 */
export function AccountPage() {
  const navigation = useNavigation<NavigationProp>();
  const { user: authUser, signOut } = useAuth();
  const { user, loading, refresh, updateLanguage } = useUser();
  const { theme, themeMode, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const switchAnim = useRef(new Animated.Value(themeMode === "dark" ? 1 : 0)).current;
  const themeAnim = useRef(new Animated.Value(themeMode === "dark" ? 1 : 0)).current;
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [lang, setLang] = useState(i18n.language);

  // Force re-render on language change
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setLang(lng);
    };
    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  // Обновляем баланс при фокусе на экране
  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Плавная анимация переключения темы
  useEffect(() => {
    Animated.parallel([
      Animated.timing(switchAnim, {
        toValue: themeMode === "dark" ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(themeAnim, {
        toValue: themeMode === "dark" ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [themeMode, switchAnim, themeAnim]);

  const handleToggleTheme = () => {
    toggleTheme();
  };

  if (loading) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <View style={[styles.avatarSkeleton, { backgroundColor: theme.borderColor || "#E0E0E0" }]} />
          <BalanceSkeleton />
        </View>
        <SectionSkeleton />
        <SectionSkeleton />
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      contentContainerStyle={styles.content}
      key={lang} // Force re-render when language changes
    >
      {/* Верхняя секция - Профиль */}
      <View style={styles.profileSection}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Text style={styles.avatarText}>
            {authUser?.email?.charAt(0).toUpperCase() || "U"}
          </Text>
        </View>
        {authUser?.email && (
          <Text style={[styles.email, { color: theme.textSecondary }]}>{authUser.email}</Text>
        )}
        <View style={[styles.balanceCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>{t('account.balance')}</Text>
          <Text style={[styles.balanceValue, { color: theme.text }]}>
            {user?.scanCredits ?? 0} {t('account.tokens')}
          </Text>
        </View>
      </View>

      {/* Секция монетизации */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('account.topUp')}</Text>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate("Monetization")}
          testID="e2e-account-monetization"
          accessibilityLabel="Купить пакеты сканов"
          accessibilityHint="Переход к покупке пакетов сканирования"
          accessibilityRole="button"
        >
          <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>{t('account.buyScanPackages')}</Text>
        </TouchableOpacity>
        {user?.scanCredits === 0 && (
          <Text style={[styles.hintText, { color: theme.textSecondary }]}>
            {t('account.watchAds')}
          </Text>
        )}
      </View>

      {/* Секция настроек */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('navigation.settings')}</Text>
        <TouchableOpacity 
          style={[styles.settingItem, { borderBottomColor: theme.border }]}
          onPress={() => navigation.navigate("CloudStorageSettings")}
        >
          <View style={styles.settingItemContent}>
            <Cloud size={18} color={theme.text} strokeWidth={2} />
            <Text style={[styles.settingText, { color: theme.text, marginLeft: 8 }]}>{t('settings.cloudStorage')}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.settingItem, { borderBottomColor: theme.border }]}
          onPress={() => navigation.navigate("FAQ")}
        >
          <View style={styles.settingItemContent}>
            <HelpCircle size={18} color={theme.text} strokeWidth={2} />
            <Text style={[styles.settingText, { color: theme.text, marginLeft: 8 }]}>{t('settings.faq')}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.settingItem, { borderBottomColor: theme.border }]}
          onPress={() => navigation.navigate("Feedback")}
        >
          <View style={styles.settingItemContent}>
            <MessageSquare size={18} color={theme.text} strokeWidth={2} />
            <Text style={[styles.settingText, { color: theme.text, marginLeft: 8 }]}>{t('settings.feedback')}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.settingItem, { borderBottomColor: theme.border }]}
          onPress={() => setShowRatingModal(true)}
        >
          <View style={styles.settingItemContent}>
            <Star size={18} color={theme.text} strokeWidth={2} />
            <Text style={[styles.settingText, { color: theme.text, marginLeft: 8 }]}>{t('settings.rateApp')}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.settingItem, { borderBottomColor: theme.border }]}
          onPress={() => setShowLanguageModal(true)}
        >
          <View style={styles.settingItemContent}>
            <Globe size={18} color={theme.text} strokeWidth={2} />
            <Text style={[styles.settingText, { color: theme.text, marginLeft: 8 }]}>{t('settings.language')}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.settingItem, { borderBottomColor: theme.border }]}
          onPress={() => navigation.navigate("PrivacyPolicy")}
        >
          <View style={styles.settingItemContent}>
            <Shield size={18} color={theme.text} strokeWidth={2} />
            <Text style={[styles.settingText, { color: theme.text, marginLeft: 8 }]}>{t('settings.privacyPolicy')}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.settingItem, { borderBottomColor: theme.border }]}
          onPress={() => navigation.navigate("TermsOfService")}
        >
          <View style={styles.settingItemContent}>
            <FileText size={18} color={theme.text} strokeWidth={2} />
            <Text style={[styles.settingText, { color: theme.text, marginLeft: 8 }]}>{t('settings.termsOfService')}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.settingItem, { borderBottomColor: theme.border }]}
          onPress={() => navigation.navigate("Onboarding", { showAuth: false })}
        >
          <View style={styles.settingItemContent}>
            <Info size={18} color={theme.text} strokeWidth={2} />
            <Text style={[styles.settingText, { color: theme.text, marginLeft: 8 }]}>{t('settings.aboutApp')}</Text>
          </View>
        </TouchableOpacity>
        <View style={[styles.settingItem, styles.themeToggleItem, { borderBottomColor: theme.border }]}>
          <View style={styles.settingItemContent}>
            <Moon size={18} color={theme.text} strokeWidth={2} />
            <Text style={[styles.settingText, { color: theme.text, marginLeft: 8 }]}>{t('settings.darkTheme')}</Text>
          </View>
          <Animated.View
            style={{
              opacity: themeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1],
              }),
            }}
          >
            <Switch
              value={themeMode === "dark"}
              onValueChange={handleToggleTheme}
              trackColor={{ false: theme.borderColor, true: theme.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={theme.borderColor}
            />
          </Animated.View>
        </View>

        <TouchableOpacity 
          style={[styles.settingItem, { borderBottomColor: "transparent", marginTop: 20 }]}
          onPress={async () => {
            try {
              await signOut();
            } catch (e) {
              console.error(e);
            }
          }}
        >
          <View style={styles.settingItemContent}>
             <Text style={[styles.settingText, styles.signOutText, { marginLeft: 8 }]}>{t('auth.logout')}</Text>
          </View>
        </TouchableOpacity>
      </View>
      <RatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onRate={() => setShowRatingModal(false)}
        onLater={() => setShowRatingModal(false)}
        onDontAsk={() => setShowRatingModal(false)}
      />
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t('settings.selectLanguage')}</Text>
            <TouchableOpacity
              style={[
                styles.languageOption, 
                { borderBottomColor: theme.borderColor },
                lang === 'en' && { backgroundColor: theme.primary + '10', borderBottomWidth: 0 }
              ]}
              onPress={async () => {
                await updateLanguage('en');
                setShowLanguageModal(false);
              }}
            >
              <View style={styles.languageOptionContent}>
                <Text style={[
                  styles.languageText, 
                  { color: theme.text },
                  lang === 'en' && { color: theme.primary, fontWeight: 'bold' }
                ]}>{t('languages.en')}</Text>
                {lang === 'en' && <Check size={20} color={theme.primary} />}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageOption,
                { borderBottomColor: theme.borderColor },
                lang === 'ru' && { backgroundColor: theme.primary + '10', borderBottomWidth: 0 }
              ]}
              onPress={async () => {
                await updateLanguage('ru');
                setShowLanguageModal(false);
              }}
            >
              <View style={styles.languageOptionContent}>
                <Text style={[
                  styles.languageText, 
                  { color: theme.text },
                  lang === 'ru' && { color: theme.primary, fontWeight: 'bold' }
                ]}>{t('languages.ru')}</Text>
                {lang === 'ru' && <Check size={20} color={theme.primary} />}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={[styles.modalCloseText, { color: theme.buttonText }]}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100, // Отступ для Tab Bar
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  avatarSkeleton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },
  email: {
    fontSize: 16,
    marginBottom: 20,
  },
  balanceCard: {
    padding: 20,
    borderRadius: 12,
    width: "100%",
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
  balanceLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: "bold",
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  primaryButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  hintText: {
    fontSize: 12,
    marginTop: 10,
    textAlign: "center",
  },
  settingItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "transparent", // Будет переопределено через style prop
  },
  themeToggleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingText: {
    fontSize: 16,
  },
  settingItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  signOutText: {
    color: "#FF6B6B",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  languageOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    paddingHorizontal: 10,
  },
  languageOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 16,
  },
  modalCloseButton: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
