/**
 * Sync Queue
 * Очередь задач синхронизации с облачными хранилищами
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SyncTask, SyncTaskStatus } from "./types";
import { showToast } from "../../ui/Toast";
import { i18n } from "../i18n/i18n";

const QUEUE_KEY = "@scanimg:sync_queue";

/**
 * Получить все задачи из очереди
 */
export async function getSyncTasks(): Promise<SyncTask[]> {
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error("[SyncQueue] Failed to get tasks:", error);
    return [];
  }
}

/**
 * Получить задачи по статусу
 */
export async function getSyncTasksByStatus(status: SyncTaskStatus): Promise<SyncTask[]> {
  const tasks = await getSyncTasks();
  return tasks.filter((task) => task.status === status);
}

/**
 * Получить pending задачи
 */
export async function getPendingTasks(): Promise<SyncTask[]> {
  return getSyncTasksByStatus("pending");
}

/**
 * Получить failed задачи
 */
export async function getFailedTasks(): Promise<SyncTask[]> {
  return getSyncTasksByStatus("failed");
}

/**
 * Добавить задачу в очередь
 */
export async function addSyncTask(task: Omit<SyncTask, "id" | "createdAt" | "updatedAt" | "status" | "retryCount">): Promise<string> {
  try {
    const tasks = await getSyncTasks();
    const newTask: SyncTask = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      status: "pending",
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    tasks.push(newTask);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(tasks));
    
    return newTask.id;
  } catch (error) {
    console.error("[SyncQueue] Failed to add task:", error);
    showToast(
      i18n.t("sync.queue_save_error") || "Ошибка сохранения очереди синхронизации",
      "error"
    );
    throw new Error("Не удалось добавить задачу в очередь");
  }
}

/**
 * Обновить задачу
 */
export async function updateSyncTask(taskId: string, updates: Partial<SyncTask>): Promise<void> {
  try {
    const tasks = await getSyncTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    
    if (index === -1) {
      throw new Error(`Задача ${taskId} не найдена`);
    }
    
    tasks[index] = {
      ...tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("[SyncQueue] Failed to update task:", error);
    // Не показываем тост здесь, так как это часто вызывается фоновым процессом
    throw new Error("Не удалось обновить задачу");
  }
}

/**
 * Удалить задачу из очереди
 */
export async function removeSyncTask(taskId: string): Promise<void> {
  try {
    const tasks = await getSyncTasks();
    const filtered = tasks.filter((t) => t.id !== taskId);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("[SyncQueue] Failed to remove task:", error);
  }
}

/**
 * Очистить очередь
 */
export async function clearSyncQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
  } catch (error) {
    console.error("[SyncQueue] Failed to clear queue:", error);
  }
}

/**
 * Получить количество задач по статусу
 */
export async function getTaskCounts(): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}> {
  const tasks = await getSyncTasks();
  return {
    pending: tasks.filter((t) => t.status === "pending").length,
    processing: tasks.filter((t) => t.status === "processing").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    failed: tasks.filter((t) => t.status === "failed").length,
    total: tasks.length,
  };
}
