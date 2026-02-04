import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useScanHistory } from "../../features/scan-history/model/useScanHistory";
import { ScanHistoryItem } from "../../features/scan-history/ui/ScanHistoryItem";
import { useTheme } from "../../app/providers/ThemeProvider";
import { FileText, Search, X, Calendar, Trash2, Star } from "lucide-react-native";
import { SkeletonLoader } from "../../shared/ui/SkeletonLoader";
import { showToast } from "../../shared/ui/Toast";
import { ScanCacheService } from "../../shared/lib/cache/scanCache";
import type { ScanDoc } from "../../entities/scan/model/types";
import { useTranslation } from "react-i18next";
import type { MainTabParamList } from "../../app/router/types";
import type { RootStackParamList } from "../../app/router/types";

type NavigationProp = BottomTabNavigationProp<MainTabParamList, "History"> & NativeStackNavigationProp<RootStackParamList>;

/**
 * Экран истории сканов
 */
export function ScanHistoryPage() {
  const { t, i18n } = useTranslation();
  const { scans, loading, loadingMore, error, hasMore, refresh, loadMore, deleteScan, toggleFavorite } = useScanHistory();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  
  // Состояние поиска и фильтров
  const [searchText, setSearchText] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Состояние выбора (Bulk Delete)
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedScanIds, setSelectedScanIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Обновляем список при каждом возврате на экран, чтобы подтянуть новые сканы
  useFocusEffect(
    React.useCallback(() => {
      // Проверяем, есть ли новые данные или изменения
      // Можно добавить оптимизацию, но для надежности лучше обновлять список
      // особенно если мы только что добавили скан
      refresh();
    }, [refresh])
  );

  const handleScanPress = (scan: ScanDoc) => {
    if (isSelectionMode) {
      toggleScanSelection(scan);
    } else {
      navigation.navigate("ScanDetail", { scanId: scan.scanId });
    }
  };

  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      setIsSelectionMode(false);
      setSelectedScanIds(new Set());
    } else {
      setIsSelectionMode(true);
    }
  };

  const toggleScanSelection = (scan: ScanDoc) => {
    const newSelected = new Set(selectedScanIds);
    if (newSelected.has(scan.scanId)) {
      newSelected.delete(scan.scanId);
    } else {
      newSelected.add(scan.scanId);
    }
    setSelectedScanIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedScanIds.size === 0) return;

    Alert.alert(
      t("history.bulk_delete_title", "Удаление"),
      t("history.bulk_delete_confirm", { 
        count: selectedScanIds.size, 
        defaultValue: `Удалить выбранные сканы (${selectedScanIds.size})?` 
      }),
      [
        { text: t("common.cancel"), style: "cancel" },
        { 
          text: t("common.delete"), 
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              const idsToDelete = Array.from(selectedScanIds);
              // Удаляем параллельно
              await Promise.all(idsToDelete.map(id => deleteScan(id)));
              
              await refresh();
              setIsSelectionMode(false);
              setSelectedScanIds(new Set());
              showToast(t("history.bulk_delete_success", "Сканы удалены"), "success");
            } catch (err) {
              showToast(t("history.delete_error"), "error");
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  const handleDelete = async (scanId: string) => {
    try {
      await deleteScan(scanId);
      // Обновляем список после удаления
      await refresh();
      showToast(t("history.delete_success"), "success");
    } catch (err) {
      showToast(t("history.delete_error"), "error");
    }
  };

  // Группировка сканов по дате
  type GroupedScans = {
    title: string;
    scans: ScanDoc[];
  };

  const getDateGroup = (date: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const scanDate = new Date(date);
    scanDate.setHours(0, 0, 0, 0);

    if (scanDate.getTime() === today.getTime()) {
      return t("common.today");
    } else if (scanDate.getTime() === yesterday.getTime()) {
      return t("common.yesterday");
    } else if (scanDate >= weekAgo) {
      return t("common.this_week");
    } else if (scanDate >= monthAgo) {
      return t("common.this_month");
    } else {
      return scanDate.toLocaleDateString(i18n.language === "ru" ? "ru-RU" : "en-US", { month: "long", year: "numeric" });
    }
  };

  // Фильтрация и группировка сканов
  const groupedScans = useMemo(() => {
    // Гарантируем, что result всегда массив
    let result: ScanDoc[] = Array.isArray(scans) ? scans : [];

    // Фильтр по тексту (включая комментарии)
    if (searchText.trim().length > 0) {
      const searchLower = searchText.toLowerCase().trim();
      result = result.filter((scan) => {
        const textMatch = (scan.extractedText || "").toLowerCase().includes(searchLower);
        const commentMatch = scan.comment?.toLowerCase().includes(searchLower) || false;
        return textMatch || commentMatch;
      });
    }

    // Фильтр по дате
    if (startDate || endDate) {
      result = result.filter((scan) => {
        if (!scan.scanDate) return false;
        const scanDate = new Date(scan.scanDate);
        if (isNaN(scanDate.getTime())) return false;
        
        scanDate.setHours(0, 0, 0, 0);
        
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (scanDate < start) return false;
        }
        
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // Включаем весь день
          if (scanDate > end) return false;
        }
        
        return true;
      });
    }

    // Фильтр по избранному
    if (showFavoritesOnly) {
      result = result.filter((scan) => scan.isFavorite);
    }

    // Группировка по дате
    const groups = new Map<string, ScanDoc[]>();
    result.forEach((scan) => {
      if (!scan.scanDate) return;
      const date = new Date(scan.scanDate);
      if (isNaN(date.getTime())) return;
      
      const groupTitle = getDateGroup(date);
      if (!groups.has(groupTitle)) {
        groups.set(groupTitle, []);
      }
      groups.get(groupTitle)!.push(scan);
    });

    // Преобразуем в массив и сортируем группы
    const grouped: GroupedScans[] = Array.from(groups.entries())
      .map(([title, scans]) => ({
        title,
        scans: scans.sort((a, b) => {
           const dateA = new Date(a.scanDate).getTime();
           const dateB = new Date(b.scanDate).getTime();
           return dateB - dateA;
        }),
      }))
      .sort((a, b) => {
        // Сортируем группы: Сегодня, Вчера, На этой неделе, В этом месяце, затем по дате
        const order: Record<string, number> = {
          [t("common.today")]: 0,
          [t("common.yesterday")]: 1,
          [t("common.this_week")]: 2,
          [t("common.this_month")]: 3,
        };
        const aOrder = order[a.title] ?? 99;
        const bOrder = order[b.title] ?? 99;
        if (aOrder !== bOrder) return aOrder - bOrder;
        // Если оба не в порядке, сортируем по первой дате в группе
        return new Date(b.scans[0].scanDate).getTime() - new Date(a.scans[0].scanDate).getTime();
      });

    return grouped;
  }, [scans, searchText, startDate, endDate, showFavoritesOnly, t, i18n.language]);

  const clearFilters = () => {
    setSearchText("");
    setStartDate(null);
    setEndDate(null);
    setShowDateFilter(false);
  };

  const hasActiveFilters = searchText.trim().length > 0 || startDate || endDate;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t("history.title")}</Text>
        </View>
        <View style={styles.listContent}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[styles.skeletonItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.skeletonContent}>
                <SkeletonLoader width="100%" height={22} borderRadius={4} />
                <SkeletonLoader width="70%" height={20} borderRadius={4} style={{ marginTop: 20 }} />
                <SkeletonLoader width="50%" height={20} borderRadius={4} style={{ marginTop: 16 }} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Проверяем ошибку только если она действительно есть - показываем полную информацию для разработки
  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={[styles.errorText, { color: theme.error }]}>{t("history.loading_error")}</Text>
        <ScrollView style={styles.errorScrollView} contentContainerStyle={styles.errorScrollContent}>
          <Text style={[styles.errorConsole, { color: theme.text }]}>
            {error}
          </Text>
        </ScrollView>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={refresh}
          accessibilityLabel="Повторить загрузку"
          accessibilityHint="Повторяет загрузку истории сканов"
          accessibilityRole="button"
        >
          <Text style={[styles.retryButtonText, { color: theme.buttonText }]}>{t("common.retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Если нет ошибки, но список пустой - это нормально, показываем сообщение
  if (!loading && scans.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.background }]} testID="e2e-history">
        <View style={styles.emptyIconContainer}>
          <FileText size={80} color={theme.textSecondary} strokeWidth={1.5} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>{t("history.empty.title")}</Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          {t("history.empty.description")}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]} testID="e2e-history">
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {isSelectionMode ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity onPress={toggleSelectionMode}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.text, marginBottom: 0 }]}>
                {t("common.selected", { defaultValue: "Выбрано" })}: {selectedScanIds.size}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={handleBulkDelete}
              disabled={selectedScanIds.size === 0 || isDeleting}
              style={{ opacity: selectedScanIds.size === 0 ? 0.5 : 1 }}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={theme.error} />
              ) : (
                <Trash2 size={24} color={theme.error} />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[styles.headerTitle, { color: theme.text }]}>{t("history.title")}</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              {groupedScans.reduce((sum, group) => sum + group.scans.length, 0)} {groupedScans.reduce((sum, group) => sum + group.scans.length, 0) === 1 ? t("history.record") : t("history.records")}
              {hasActiveFilters && ` (${t("history.from")} ${scans.length})`}
            </Text>
          </>
        )}
      </View>

      {/* Объединенный поиск и фильтры */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.searchRow}>
          <View style={[styles.searchInputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Search size={18} color={theme.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder={t("history.search_placeholder")}
              placeholderTextColor={theme.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
              testID="e2e-history-search"
              accessibilityLabel="Поиск по тексту"
              accessibilityHint="Введите текст для поиска в истории сканов"
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchText("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Очистить поиск"
                accessibilityRole="button"
              >
                <X size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            style={[
              styles.dateFilterButtonCompact,
              {
                backgroundColor: (startDate || endDate) ? theme.primary : theme.background,
                borderColor: theme.border,
              },
            ]}
            onPress={() => setShowDateFilter(!showDateFilter)}
            accessibilityLabel="Фильтр по дате"
            accessibilityHint={showDateFilter ? "Скрыть фильтр по дате" : "Показать фильтр по дате"}
            accessibilityRole="button"
            accessibilityState={{ selected: !!(startDate || endDate) }}
          >
            <Calendar size={18} color={(startDate || endDate) ? theme.buttonText : theme.text} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dateFilterButtonCompact,
              {
                backgroundColor: showFavoritesOnly ? theme.primary : theme.background,
                borderColor: theme.border,
                marginLeft: 8
              },
            ]}
            onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
            accessibilityLabel="Только избранные"
            accessibilityHint={showFavoritesOnly ? "Показать все сканы" : "Показать только избранные"}
            accessibilityRole="button"
            accessibilityState={{ selected: showFavoritesOnly }}
          >
            <Star 
              size={18} 
              color={showFavoritesOnly ? theme.buttonText : theme.text} 
              fill={showFavoritesOnly ? theme.buttonText : "transparent"}
              strokeWidth={2} 
            />
          </TouchableOpacity>
        </View>

        {/* Показываем выбранные фильтры */}
        {(startDate || endDate || searchText.length > 0 || showFavoritesOnly) && (
          <View style={styles.activeFiltersRow}>
            {showFavoritesOnly && (
              <View style={[styles.filterChip, { backgroundColor: theme.primary }]}>
                <Text style={[styles.filterChipText, { color: theme.buttonText }]}>
                  {t("history.filter.favorites", "Избранное")}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowFavoritesOnly(false)}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  accessibilityLabel="Убрать фильтр избранного"
                  accessibilityRole="button"
                >
                  <X size={14} color={theme.buttonText} />
                </TouchableOpacity>
              </View>
            )}
            {(startDate || endDate) && (
              <View style={[styles.filterChip, { backgroundColor: theme.primary }]}>
                <Text style={[styles.filterChipText, { color: theme.buttonText }]}>
                  {startDate && endDate
                    ? `${startDate.toLocaleDateString(i18n.language === "ru" ? "ru-RU" : "en-US")} - ${endDate.toLocaleDateString(i18n.language === "ru" ? "ru-RU" : "en-US")}`
                    : startDate
                      ? `${t("history.from")} ${startDate.toLocaleDateString(i18n.language === "ru" ? "ru-RU" : "en-US")}`
                      : `${t("history.to")} ${endDate?.toLocaleDateString(i18n.language === "ru" ? "ru-RU" : "en-US")}`}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setStartDate(null);
                    setEndDate(null);
                  }}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  accessibilityLabel="Убрать фильтр по дате"
                  accessibilityRole="button"
                >
                  <X size={14} color={theme.buttonText} />
                </TouchableOpacity>
              </View>
            )}
            {searchText.length > 0 && (
              <View style={[styles.filterChip, { backgroundColor: theme.primary }]}>
                <Text style={[styles.filterChipText, { color: theme.buttonText }]}>{t("history.filter.search")}: "{searchText}"</Text>
                <TouchableOpacity
                  onPress={() => setSearchText("")}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  accessibilityLabel="Убрать поисковый фильтр"
                  accessibilityRole="button"
                >
                  <X size={14} color={theme.buttonText} />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={[styles.clearAllButton, { backgroundColor: theme.error }]}
              onPress={clearFilters}
              accessibilityLabel={t("history.filter.reset_all")}
              accessibilityHint="Очищает все активные фильтры поиска"
              accessibilityRole="button"
            >
              <Text style={[styles.clearAllText, { color: theme.buttonText }]}>{t("history.filter.reset_all")}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Фильтр по дате */}
        {showDateFilter && (
          <View style={[styles.dateFilterContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.dateFilterTitle, { color: theme.text }]}>{t("history.filter.date_range")}</Text>
            
            <View style={styles.dateButtonsRow}>
              <TouchableOpacity
                style={[styles.dateQuickButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  setStartDate(today);
                  const tomorrow = new Date(today);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setEndDate(tomorrow);
                  setShowDateFilter(false);
                }}
                accessibilityLabel={t("history.filter.today")}
                accessibilityHint="Показать сканы за сегодня"
                accessibilityRole="button"
              >
                <Text style={[styles.dateQuickButtonText, { color: theme.buttonText }]}>{t("history.filter.today")}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.dateQuickButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const weekAgo = new Date(today);
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  setStartDate(weekAgo);
                  setEndDate(today);
                  setShowDateFilter(false);
                }}
                accessibilityLabel={t("history.filter.week")}
                accessibilityHint="Показать сканы за последнюю неделю"
                accessibilityRole="button"
              >
                <Text style={[styles.dateQuickButtonText, { color: theme.buttonText }]}>{t("history.filter.week")}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.dateQuickButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const monthAgo = new Date(today);
                  monthAgo.setMonth(monthAgo.getMonth() - 1);
                  setStartDate(monthAgo);
                  setEndDate(today);
                  setShowDateFilter(false);
                }}
                accessibilityLabel={t("history.filter.month")}
                accessibilityHint="Показать сканы за последний месяц"
                accessibilityRole="button"
              >
                <Text style={[styles.dateQuickButtonText, { color: theme.buttonText }]}>{t("history.filter.month")}</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[styles.dateFilterButton, { backgroundColor: theme.background, borderColor: theme.border }]}
              onPress={() => {
                setStartDate(null);
                setEndDate(null);
                setShowDateFilter(false);
              }}
              accessibilityLabel={t("history.filter.clear_date")}
              accessibilityHint="Убирает фильтр по дате"
              accessibilityRole="button"
            >
              <Text style={[styles.dateFilterButtonText, { color: theme.text }]}>{t("history.filter.clear_date")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Список сканов с группировкой */}
      {groupedScans.length === 0 && !loading ? (
        <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {hasActiveFilters ? t("history.empty_search.title") : t("history.empty.title")}
          </Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {hasActiveFilters
              ? t("history.empty_search.description")
              : t("history.empty.description")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedScans}
          keyExtractor={(item, index) => `group-${index}-${item.title}`}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
          renderItem={({ item: group, index: groupIndex }) => {
            let itemIndex = 0;
            // Подсчитываем общий индекс для stagger анимации
            for (let i = 0; i < groupIndex; i++) {
              itemIndex += groupedScans[i].scans.length;
            }
            return (
              <View style={styles.groupContainer}>
                <View style={[styles.groupHeader, { backgroundColor: theme.background }]}>
                  <Text style={[styles.groupTitle, { color: theme.text }]}>{group.title}</Text>
                </View>
                {group.scans.map((scan, scanIndex) => (
                  <ScanHistoryItem
                    key={scan.scanId}
                    scan={scan}
                    onPress={handleScanPress}
                    onDelete={handleDelete}
                    index={itemIndex + scanIndex}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedScanIds.has(scan.scanId)}
                    onToggleSelection={toggleScanSelection}
                    onToggleFavorite={toggleFavorite}
                    onLongPress={(s) => {
                      setIsSelectionMode(true);
                      const newSet = new Set(selectedScanIds);
                      newSet.add(s.scanId);
                      setSelectedScanIds(newSet);
                    }}
                  />
                ))}
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            // Подгружаем следующую страницу при достижении конца списка
            if (hasMore && !loadingMore && !loading) {
              loadMore();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => {
            // Индикатор загрузки внизу списка
            if (loadingMore) {
              return (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={[styles.loadingMoreText, { color: theme.textSecondary }]}>
                    Загрузка...
                  </Text>
                </View>
              );
            }
            if (!hasMore && scans.length > 0) {
              return (
                <View style={styles.endOfListContainer}>
                  <Text style={[styles.endOfListText, { color: theme.textSecondary }]}>
                    Все сканы загружены
                  </Text>
                </View>
              );
            }
            return null;
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
  header: {
    padding: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100, // Отступ для Tab Bar
  },
  loadingMoreContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  loadingMoreText: {
    fontSize: 14,
    marginLeft: 8,
  },
  endOfListContainer: {
    padding: 20,
    alignItems: "center",
  },
  endOfListText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 20,
    paddingTop: 100, // Reduced top padding (was centered ~50%, now ~20-25%)
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 20,
  },
  errorDetails: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 5,
    paddingHorizontal: 20,
  },
  errorScrollView: {
    maxHeight: 250,
    width: "100%",
    marginTop: 15,
    marginBottom: 10,
  },
  errorScrollContent: {
    paddingHorizontal: 20,
  },
  errorConsole: {
    fontSize: 11,
    textAlign: "left",
    fontFamily: "monospace",
    lineHeight: 16,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 150,
    alignSelf: "center",
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyIconContainer: {
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  searchContainer: {
    padding: 12,
    paddingTop: 8,
    borderBottomWidth: 1,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  dateFilterButtonCompact: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  activeFiltersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
    alignItems: "center",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: "500",
  },
  dateFilterContainer: {
    marginTop: 12,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
  },
  dateFilterTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  dateButtonsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  dateQuickButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  dateQuickButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  dateFilterButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  dateFilterButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  groupContainer: {
    marginBottom: 20,
    marginTop: -8,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  groupCount: {
    fontSize: 14,
    fontWeight: "500",
  },
  skeletonItem: {
    padding: 24,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 140,
  },
  skeletonContent: {
    flex: 1,
  },
});

