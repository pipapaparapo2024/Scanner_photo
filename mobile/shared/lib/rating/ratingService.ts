import AsyncStorage from "@react-native-async-storage/async-storage";

const RATING_STORAGE_KEY = "@rating_preferences";
const SCANS_COUNT_KEY = "@successful_scans_count";
const LAST_RATING_PROMPT_KEY = "@last_rating_prompt_date";

interface RatingPreferences {
  dontAskAgain: boolean;
  successfulScansCount: number;
  lastPromptDate: string | null;
}

const MIN_SCANS_FOR_RATING = 1; // После 1 успешного скана
const DAYS_BETWEEN_PROMPTS = 7; // Не чаще раза в неделю

/**
 * Сервис для управления запросами оценки приложения
 */
export class RatingService {
  /**
   * Получить настройки рейтинга
   */
  static async getPreferences(): Promise<RatingPreferences> {
    try {
      const data = await AsyncStorage.getItem(RATING_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn("RatingService: Failed to load preferences", error);
    }
    return {
      dontAskAgain: false,
      successfulScansCount: 0,
      lastPromptDate: null,
    };
  }

  /**
   * Сохранить настройки рейтинга
   */
  static async savePreferences(prefs: RatingPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(RATING_STORAGE_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.warn("RatingService: Failed to save preferences", error);
    }
  }

  /**
   * Увеличить счетчик успешных сканов
   */
  static async incrementSuccessfulScans(): Promise<void> {
    const prefs = await this.getPreferences();
    prefs.successfulScansCount += 1;
    await this.savePreferences(prefs);
  }

  /**
   * Проверить, нужно ли показать запрос оценки
   */
  static async shouldShowRatingPrompt(): Promise<boolean> {
    const prefs = await this.getPreferences();

    // Не показывать, если пользователь выбрал "Не предлагать"
    if (prefs.dontAskAgain) {
      return false;
    }

    // Показывать только после минимального количества сканов
    if (prefs.successfulScansCount < MIN_SCANS_FOR_RATING) {
      return false;
    }

    // Проверяем, прошло ли достаточно времени с последнего запроса
    if (prefs.lastPromptDate) {
      const lastPrompt = new Date(prefs.lastPromptDate);
      const now = new Date();
      const daysSinceLastPrompt = (now.getTime() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastPrompt < DAYS_BETWEEN_PROMPTS) {
        return false;
      }
    }

    return true;
  }

  /**
   * Отметить, что запрос оценки был показан
   */
  static async markPromptShown(): Promise<void> {
    const prefs = await this.getPreferences();
    prefs.lastPromptDate = new Date().toISOString();
    await this.savePreferences(prefs);
  }

  /**
   * Отметить, что пользователь не хочет видеть запросы оценки
   */
  static async setDontAskAgain(): Promise<void> {
    const prefs = await this.getPreferences();
    prefs.dontAskAgain = true;
    await this.savePreferences(prefs);
  }

  /**
   * Сбросить настройки (для тестирования)
   */
  static async reset(): Promise<void> {
    await AsyncStorage.removeItem(RATING_STORAGE_KEY);
  }
}
