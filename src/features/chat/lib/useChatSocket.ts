"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatSocketEvent } from "@/entities/chat";

type SocketStatus = "connecting" | "open" | "closed";

type UseChatSocketOptions = {
  enabled: boolean;
  onEvent: (event: ChatSocketEvent) => void;
  onOpen?: () => void;
};

const HEARTBEAT_INTERVAL_MS = 10_000;

function resolveWsUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) {
    const url = new URL(explicit, window.location.origin);
    if (url.protocol === "http:") url.protocol = "ws:";
    if (url.protocol === "https:") url.protocol = "wss:";
    return url.toString();
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1/";
  const url = new URL(apiUrl, window.location.origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws/chat/";
  url.search = "";
  return url.toString();
}

export function useChatSocket({ enabled, onEvent, onOpen }: UseChatSocketOptions) {
  const [status, setStatus] = useState<SocketStatus>("closed");
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);
  const heartbeatTimer = useRef<number | null>(null);
  const attemptRef = useRef(0);
  const manuallyClosed = useRef(false);
  const connectRef = useRef<() => void>(() => {});
  const onEventRef = useRef(onEvent);
  const onOpenRef = useRef(onOpen);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  const clearReconnect = useCallback(() => {
    if (reconnectTimer.current !== null) {
      window.clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  }, []);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatTimer.current !== null) {
      window.clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = null;
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimer.current !== null) return;
    const delay = Math.min(1000 * 2 ** attemptRef.current, 10000);
    attemptRef.current += 1;
    reconnectTimer.current = window.setTimeout(() => {
      reconnectTimer.current = null;
      connectRef.current();
    }, delay);
  }, []);

  const connect = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;
    if (socketRef.current?.readyState === WebSocket.OPEN) return;
    if (socketRef.current?.readyState === WebSocket.CONNECTING) return;

    clearReconnect();
    manuallyClosed.current = false;
    setStatus("connecting");

    const socket = new WebSocket(resolveWsUrl());
    socketRef.current = socket;

    socket.onopen = () => {
      if (socketRef.current !== socket) return;
      attemptRef.current = 0;
      setStatus("open");
      clearHeartbeat();
      heartbeatTimer.current = window.setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "ping", payload: {} }));
        }
      }, HEARTBEAT_INTERVAL_MS);
      onOpenRef.current?.();
    };

    socket.onmessage = (message) => {
      if (socketRef.current !== socket) return;
      try {
        const event = JSON.parse(message.data) as ChatSocketEvent | { type?: string };
        if (event.type === "pong") return;
        onEventRef.current(event as ChatSocketEvent);
      } catch {
        onEventRef.current({ type: "error", code: "invalid_event", detail: "Invalid event." });
      }
    };

    socket.onclose = () => {
      if (socketRef.current !== socket) return;
      clearHeartbeat();
      setStatus("closed");
      socketRef.current = null;
      if (manuallyClosed.current || !enabled) return;
      scheduleReconnect();
    };

    socket.onerror = () => {
      if (socketRef.current !== socket) return;
      socket.close();
    };
  }, [clearHeartbeat, clearReconnect, enabled, scheduleReconnect]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    if (!enabled) return;
    const initialConnectTimer = window.setTimeout(connect, 0);

    const handleOnline = () => connect();
    window.addEventListener("online", handleOnline);

    return () => {
      window.clearTimeout(initialConnectTimer);
      window.removeEventListener("online", handleOnline);
      manuallyClosed.current = true;
      clearReconnect();
      clearHeartbeat();
      const socket = socketRef.current;
      socketRef.current = null;
      socket?.close();
    };
  }, [clearHeartbeat, clearReconnect, connect, enabled]);

  const send = useCallback((type: string, payload: Record<string, unknown>): boolean => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify({ type, payload }));
    return true;
  }, []);

  return { status, send, reconnect: connect };
}
