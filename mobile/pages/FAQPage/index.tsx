import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../app/providers/ThemeProvider";
import { Accordion } from "../../shared/ui/Accordion";
import { getFAQData, getFAQCategories, searchFAQ, type FAQItem } from "../../shared/lib/faq/faqData";
import { ArrowLeft, Search, X } from "lucide-react-native";
import type { RootStackParamList } from "../../app/router/types";
import { useTranslation } from 'react-i18next';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "FAQ">;

/**
 * Страница FAQ с вопросами и ответами
 */
export function FAQPage() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Получаем данные с учетом текущего языка
  const faqData = useMemo(() => getFAQData(), [i18n.language]);
  const faqCategories = useMemo(() => getFAQCategories(), [i18n.language]);

  // Фильтруем FAQ по поисковому запросу и категории
  const filteredFAQ = useMemo(() => {
    let result: FAQItem[] = faqData;

    // Применяем поиск
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.question.toLowerCase().includes(lowerQuery) ||
          item.answer.toLowerCase().includes(lowerQuery)
      );
    }

    // Применяем фильтр по категории
    if (selectedCategory) {
      result = result.filter((item) => item.category === selectedCategory);
    }

    return result;
  }, [searchQuery, selectedCategory, faqData]);

  // Группируем FAQ по категориям для отображения
  const groupedFAQ = useMemo(() => {
    const groups: Record<string, FAQItem[]> = {};
    filteredFAQ.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredFAQ]);

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[
        styles.header, 
        { 
          backgroundColor: theme.surface, 
          borderBottomColor: theme.borderColor,
          paddingTop: insets.top > 0 ? insets.top : 12,
          paddingBottom: 12,
          height: 'auto'
        }
      ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t('settings.faq')}
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Поиск */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.background, borderColor: theme.borderColor }]}>
          <Search size={20} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder={t('faq.searchPlaceholder')}
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <X size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Категории */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            {
              backgroundColor: selectedCategory === null ? theme.primary : theme.surface,
              borderColor: theme.borderColor,
            },
          ]}
          onPress={() => handleCategorySelect(null)}
        >
          <Text
            style={[
              styles.categoryText,
              {
                color: selectedCategory === null ? "#FFFFFF" : theme.text,
                fontWeight: selectedCategory === null ? "600" : "500",
              },
            ]}
          >
            {t('faq.allCategories')}
          </Text>
        </TouchableOpacity>
        {faqCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              {
                backgroundColor: selectedCategory === category.id ? theme.primary : theme.surface,
                borderColor: theme.borderColor,
              },
            ]}
            onPress={() => handleCategorySelect(category.id)}
          >
            <Text
              style={[
                styles.categoryText,
                {
                  color: selectedCategory === category.id ? "#FFFFFF" : theme.text,
                  fontWeight: selectedCategory === category.id ? "600" : "500",
                },
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Список FAQ */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredFAQ.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {searchQuery.trim()
                ? t('faq.notFound')
                : t('faq.noQuestions')}
            </Text>
          </View>
        ) : (
          <>
            {/* Если выбрана категория или есть поиск, показываем все вопросы подряд */}
            {selectedCategory || searchQuery.trim() ? (
              filteredFAQ.map((item) => (
                <Accordion key={item.id} title={item.question}>
                  {item.answer}
                </Accordion>
              ))
            ) : (
              // Иначе группируем по категориям
              faqCategories.map((category) => {
                const categoryItems = groupedFAQ[category.id];
                if (!categoryItems || categoryItems.length === 0) return null;

                return (
                  <View key={category.id} style={styles.categorySection}>
                    <Text style={[styles.categoryTitle, { color: theme.text }]}>
                      {category.name}
                    </Text>
                    {categoryItems.map((item) => (
                      <Accordion key={item.id} title={item.question}>
                        {item.answer}
                      </Accordion>
                    ))}
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    // paddingTop: 50, // Убрали лишний отступ
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 12,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  categoriesContainer: {
    marginBottom: 8,
    flexGrow: 0,
    height: 50, // Ensure height for scrolling
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 4, // Reduce vertical padding
    paddingRight: 16,
    alignItems: 'center', // Center items vertically
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
    paddingTop: 16, // Уменьшаем отступ сверху
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
});
