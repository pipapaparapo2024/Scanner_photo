/**
 * Скрипт для добавления 50 тестовых сканов в БД
 * Использование: npx ts-node scripts/add-test-scans.ts <userId>
 */

import { firestore } from "../src/config/firebase";
import { randomUUID } from "crypto";
import type { ScanDoc } from "../src/types/firestore";

const USERS_COLLECTION = "users";
const SCANS_SUBCOLLECTION = "scans";

async function addTestScans(userId: string, count: number = 50) {
  try {
    console.log(`Добавление ${count} тестовых сканов для пользователя ${userId}...`);

    const scansRef = firestore
      .collection(USERS_COLLECTION)
      .doc(userId)
      .collection(SCANS_SUBCOLLECTION);

    const now = new Date();
    const scans: ScanDoc[] = [];

    // Создаем сканы с разными датами (последние 30 дней)
    for (let i = 0; i < count; i++) {
      const scanDate = new Date(now);
      scanDate.setDate(scanDate.getDate() - Math.floor(Math.random() * 30));
      scanDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);

      const scan: ScanDoc = {
        scanId: randomUUID(),
        scanDate: scanDate.toISOString(),
        extractedText: `Тестовый скан #${i + 1}\nЭто пустой тестовый скан для проверки пагинации.`,
      };

      scans.push(scan);
    }

    // Добавляем сканы батчами по 10
    const batchSize = 10;
    for (let i = 0; i < scans.length; i += batchSize) {
      const batch = firestore.batch();
      const batchScans = scans.slice(i, i + batchSize);

      batchScans.forEach((scan) => {
        const scanRef = scansRef.doc(scan.scanId);
        batch.set(scanRef, scan);
      });

      await batch.commit();
      console.log(`Добавлено сканов: ${Math.min(i + batchSize, scans.length)}/${scans.length}`);
    }

    console.log(`✅ Успешно добавлено ${count} тестовых сканов!`);
  } catch (error) {
    console.error("Ошибка при добавлении тестовых сканов:", error);
    throw error;
  }
}

// Получаем userId из аргументов командной строки
const userId = process.argv[2];
const count = parseInt(process.argv[3] || "50", 10);

if (!userId) {
  console.error("Использование: npx ts-node scripts/add-test-scans.ts <userId> [count]");
  console.error("Пример: npx ts-node scripts/add-test-scans.ts abc123 50");
  process.exit(1);
}

addTestScans(userId, count)
  .then(() => {
    console.log("Готово!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Ошибка:", error);
    process.exit(1);
  });
