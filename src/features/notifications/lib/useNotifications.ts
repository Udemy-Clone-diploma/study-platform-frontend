"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
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
    pollCount();
    const id = setInterval(pollCount, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", pollCount);
    return () => {
      mounted.current = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", pollCount);
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
      await markNotificationRead(id).catch(() => null);
    },
    [notifications],
  );

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => (n.is_read ? n : { ...n, is_read: true })));
    setUnreadCount(0);
    await markAllNotificationsRead().catch(() => null);
  }, []);

  return {
    unreadCount,
    notifications,
    listLoading,
    loadingMore,
    hasMore,
    loadList,
    loadMore,
    markRead,
    markAllRead,
  };
}
