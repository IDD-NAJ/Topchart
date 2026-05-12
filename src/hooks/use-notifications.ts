"use client";

import useSWR from "swr";

interface Notification {
  id: string;
  type: "success" | "warning" | "info" | "error";
  title: string;
  message: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
}

const fetcher = async (url: string): Promise<NotificationsResponse> => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) return { success: false, notifications: [], unreadCount: 0 };
  return res.json();
};

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR<NotificationsResponse>(
    "/api/notifications",
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 10000,
      refreshInterval: 60000,
    }
  );

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const markAsRead = async (notificationId: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId }),
      credentials: "include",
    });
    mutate();
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
      credentials: "include",
    });
    mutate();
  };

  const deleteNotification = async (notificationId: string) => {
    await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId }),
      credentials: "include",
    });
    mutate();
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllRead,
    deleteNotification,
    refresh: mutate,
  };
}

export type { Notification };
