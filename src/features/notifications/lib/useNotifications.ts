"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markNotificationUnread,
  markAllNotificationsRead,
  deleteNotification,
  type Notification,
} from "@/entities/notification";

const POLL_INTERVAL_MS = 45_000;

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const mounted = useRef(true);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const loadingRef = useRef(false);

  const pollCount = useCallback(async () => {
    if (document.visibilityState === "hidden") return;
    const count = await getUnreadCount().catch(() => null);
    if (count !== null && mounted.current) setUnreadCount(count);
  }, []);

  useEffect(() => {
    mounted.current = true;
    const initialPollId = window.setTimeout(() => {
      void pollCount();
    }, 0);
    const intervalId = window.setInterval(() => {
      void pollCount();
    }, POLL_INTERVAL_MS);
    const handleVisibilityChange = () => {
      void pollCount();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      mounted.current = false;
      window.clearTimeout(initialPollId);
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pollCount]);

  const loadList = useCallback(async () => {
    loadingRef.current = true;
    setListLoading(true);
    const data = await getNotifications(1).catch(() => null);
    if (!mounted.current) return;
    setNotifications(data?.results ?? []);
    pageRef.current = 1;
    hasMoreRef.current = Boolean(data?.next);
    setHasMore(Boolean(data?.next));
    setListLoading(false);
    loadingRef.current = false;
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    const data = await getNotifications(nextPage).catch(() => null);
    if (!mounted.current) return;
    if (data) {
      setNotifications((prev) => {
        const seen = new Set(prev.map((n) => n.id));
        return [...prev, ...data.results.filter((n) => !seen.has(n.id))];
      });
      pageRef.current = nextPage;
      hasMoreRef.current = Boolean(data.next);
      setHasMore(Boolean(data.next));
    }
    setLoadingMore(false);
    loadingRef.current = false;
  }, []);

  const markRead = useCallback(
    async (id: number) => {
      const target = notifications.find((n) => n.id === id);
      if (!target || target.is_read) return;
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await markNotificationRead(id);
      } catch {
        setNotifications((prev) => prev.map((n) => (n.id === id ? target : n)));
        setUnreadCount((prev) => prev + 1);
      }
    },
    [notifications],
  );

  const markUnread = useCallback(
    async (id: number) => {
      const target = notifications.find((n) => n.id === id);
      if (!target || !target.is_read) return;
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)));
      setUnreadCount((prev) => prev + 1);
      try {
        await markNotificationUnread(id);
      } catch {
        setNotifications((prev) => prev.map((n) => (n.id === id ? target : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    },
    [notifications],
  );

  const remove = useCallback(
    async (id: number) => {
      const target = notifications.find((n) => n.id === id);
      if (!target) return;
      const index = notifications.findIndex((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (!target.is_read) setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await deleteNotification(id);
      } catch {
        setNotifications((prev) => [...prev.slice(0, index), target, ...prev.slice(index)]);
        if (!target.is_read) setUnreadCount((prev) => prev + 1);
      }
    },
    [notifications],
  );

  const markAllRead = useCallback(async () => {
    const previous = notifications;
    const previousUnread = unreadCount;
    setNotifications((prev) => prev.map((n) => (n.is_read ? n : { ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      setNotifications(previous);
      setUnreadCount(previousUnread);
    }
  }, [notifications, unreadCount]);

  return {
    unreadCount,
    notifications,
    listLoading,
    loadingMore,
    hasMore,
    loadList,
    loadMore,
    markRead,
    markUnread,
    remove,
    markAllRead,
  };
}
