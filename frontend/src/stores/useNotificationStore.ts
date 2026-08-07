import { create } from "zustand";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  timestamp: string;
}

interface NotificationStoreState {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, "id" | "read" | "timestamp">) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStoreState>((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (item) =>
    set((state) => {
      const newNotif: AppNotification = {
        ...item,
        id: Date.now().toString(),
        read: false,
        timestamp: new Date().toISOString(),
      };
      const updated = [newNotif, ...state.notifications];
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    }),
  markAsRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    }),
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
