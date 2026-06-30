import { api } from "@/shared/api/base";
import type {
  Notification,
  NotificationChannelPrefs,
  NotificationPreferences,
  NotificationType,
  Paginated,
} from "../model/types";

export async function getNotifications(page = 1): Promise<Paginated<Notification>> {
  const { data } = await api.get<Paginated<Notification>>("/notifications/", { params: { page } });
  return data;
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>("/notifications/unread-count/");
  return data.count;
}

export async function markNotificationRead(id: number): Promise<Notification> {
  const { data } = await api.patch<Notification>(`/notifications/${id}/`, { is_read: true });
  return data;
}

export async function markAllNotificationsRead(): Promise<number> {
  const { data } = await api.post<{ updated: number }>("/notifications/mark-all-read/");
  return data.updated;
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const { data } = await api.get<NotificationPreferences>("/notifications/preferences/");
  return data;
}

export async function updateNotificationPreferences(
  patch: Partial<Record<NotificationType, Partial<NotificationChannelPrefs>>>,
): Promise<NotificationPreferences> {
  const { data } = await api.patch<NotificationPreferences>("/notifications/preferences/", patch);
  return data;
}
