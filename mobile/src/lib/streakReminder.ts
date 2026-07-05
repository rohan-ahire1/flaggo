import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { dateKey } from "@flaggo/core/utils/dailyChallenge";
import type { AppProgress } from "@flaggo/core/types/progress";

const STREAK_REMINDER_KEY = "flaggo-streak-reminder";
const CHANNEL_ID = "streak";

export async function setStreakReminderEnabled(on: boolean): Promise<void> {
  await AsyncStorage.setItem(STREAK_REMINDER_KEY, on ? "1" : "0");
  if (!on && Platform.OS !== "web") await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function isStreakReminderEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(STREAK_REMINDER_KEY)) === "1";
}

function reminderDate(progress: AppProgress) {
  const now = new Date();
  const target = new Date(now);
  target.setHours(19, 0, 0, 0);
  const today = dateKey();
  const doneToday = progress.daily.lastDate === today && Boolean(progress.daily.history[today]);
  if (doneToday || now.getTime() >= target.getTime()) target.setDate(target.getDate() + 1);
  return target;
}

export async function syncStreakReminder(progress: AppProgress): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const enabled = await isStreakReminderEnabled();
  if (!enabled) return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Streak reminders",
      importance: Notifications.AndroidImportance.DEFAULT
    });
  }

  const permissions = await Notifications.requestPermissionsAsync();
  if (!permissions.granted) {
    await setStreakReminderEnabled(false);
    return false;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  const target = reminderDate(progress);
  const streak = progress.daily.streak ?? 0;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: streak > 0 ? `Keep your ${streak}-day streak` : "Today's Five is ready",
      body: "Play today's Five before midnight."
    },
    trigger: {
      channelId: Platform.OS === "android" ? CHANNEL_ID : undefined,
      year: target.getFullYear(),
      month: target.getMonth() + 1,
      day: target.getDate(),
      hour: 19,
      minute: 0,
      second: 0,
      repeats: false
    } as Notifications.NotificationTriggerInput
  });
  return true;
}
