import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import type { CreateScanResponse } from "../../../entities/scan/model/types";
import { useTranslation } from "react-i18next";

interface ScanResultProps {
  result: CreateScanResponse;
}

/**
 * Компонент для отображения результата сканирования
 */
export function ScanResult({ result }: ScanResultProps) {
  const { t, i18n } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("scan_result.text_recognized")}</Text>
      <ScrollView style={styles.textContainer}>
        <Text style={styles.text}>{result.scan.extractedText}</Text>
      </ScrollView>
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {t("scan_result.credits_remaining", { count: result.remainingCredits })}
        </Text>
        <Text style={styles.dateText}>
          {new Date(result.scan.scanDate).toLocaleDateString(i18n.language, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  textContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 15,
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  dateText: {
    fontSize: 12,
    color: "#999",
  },
});

