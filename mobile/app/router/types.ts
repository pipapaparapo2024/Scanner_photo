import type { NavigatorScreenParams } from "@react-navigation/native";

/**
 * Типы для навигации
 * Определяет параметры для каждого экрана
 */

// Tab Navigator параметры
export type MainTabParamList = {
  History: undefined;
  Scan: undefined;
  Account: undefined;
};

// Stack Navigator параметры (для модальных окон)
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  ScanDetail: { scanId: string };
  Monetization: undefined;
  CameraModal: undefined;
  ImagePicker: undefined;
  Onboarding: { showAuth?: boolean } | undefined;
  PhotoConfirm: { photoUri: string };
  ScanLoading: { photoUri: string };
  ScanResult: { scanId: string; extractedText: string };
  ScanError: undefined;
  AuthChoice: undefined;
  RegisterEmail: undefined;
  RegisterCode: { email: string };
  RegisterPassword: { email: string };
  RegisterSuccess: undefined;
  LoginEmail: undefined;
  Feedback: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  FAQ: undefined;
  CloudStorageSettings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

