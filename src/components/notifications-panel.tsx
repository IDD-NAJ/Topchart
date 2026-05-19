"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useNotifications, type Notification } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  Check,
  Trash2,
  CheckCheck,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import Link from "next/link";

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  success: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
  error: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50" },
};

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const config = typeConfig[notification.type] || typeConfig.info;
  const Icon = config.icon;

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg transition-colors",
        !notification.is_read && "bg-muted/30"
      )}
    >
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", config.bg)}>
        <Icon className={cn("w-4 h-4", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("text-sm font-medium truncate", !notification.is_read && "font-semibold")}>
            {notification.title}
          </p>
          {!notification.is_read && (
            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-muted-foreground">
            {new Date(notification.created_at).toLocaleDateString("en-GH", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <div className="flex items-center gap-1 ml-auto">
            {!notification.is_read && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(notification.id);
                }}
                className="p-1 rounded hover:bg-muted transition-colors"
                title="Mark as read"
              >
                <Check className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className="p-1 rounded hover:bg-destructive/10 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (notification.action_url) {
    return (
      <Link href={notification.action_url!} onClick={() => !notification.is_read && onMarkRead(notification.id)}>
        {content}
      </Link>
    );
  }

  return content;
}

export function NotificationsPanel() {
  const { user } = useAuth()
  const { notifications, markAsRead, deleteNotification, markAllRead, isLoading, unreadCount } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [prevUnreadCount, setPrevUnreadCount] = useState(0)
  const [animateBell, setAnimateBell] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (unreadCount > prevUnreadCount && prevUnreadCount === 0) {
      setAnimateBell(true)
      setTimeout(() => setAnimateBell(false), 1000)
    }
    setPrevUnreadCount(unreadCount)
  }, [unreadCount, prevUnreadCount])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={cn("w-5 h-5 transition-transform", animateBell && "animate-bounce")} />
          {unreadCount > 0 && (
            <Badge className={cn("absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[9px] font-bold bg-red-500 text-white border-0 transition-all", animateBell && "scale-110")}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">Notifications</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-muted-foreground animate-pulse">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center space-y-2">
              <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto" />
              <p className="text-xs text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border">
                {notifications.slice(0, 5).map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onMarkRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </div>
              {notifications.length > 5 && (
                <div className="p-2 border-t">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full text-xs text-center text-muted-foreground hover:text-foreground py-2 rounded hover:bg-muted transition-colors"
                  >
                    View all {notifications.length} notifications
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
