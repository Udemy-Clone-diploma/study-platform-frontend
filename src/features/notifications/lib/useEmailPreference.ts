"use client";

import { useCallback, useRef, useState } from "react";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationChannelPrefs,
  type NotificationType,
} from "@/entities/notification";

const EMAIL_TYPES: NotificationType[] = [
  "homework_submitted",
  "homework_graded",
  "schedule_event",
];

export function useEmailPreference() {
  const [emailEnabled, setEmailEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    const prefs = await getNotificationPreferences().catch(() => null);
    if (!prefs) {
      loadedRef.current = false;
      return;
    }
    setEmailEnabled(EMAIL_TYPES.some((t) => prefs[t]?.email));
  }, []);

  const toggle = useCallback(async () => {
    const next = !emailEnabled;
    setEmailEnabled(next);
    setSaving(true);
    const patch: Partial<Record<NotificationType, Partial<NotificationChannelPrefs>>> = {};
    for (const t of EMAIL_TYPES) patch[t] = { email: next };
    await updateNotificationPreferences(patch).catch(() => null);
    setSaving(false);
  }, [emailEnabled]);

  return { emailEnabled, saving, load, toggle };
}
