// =============================================================
// Notification Store — In-app notifications, unread badge
// =============================================================
import { create } from 'zustand';
import { apiClient } from '../api/client';
import { STORAGE_KEYS } from '../services/storage';
import { swrFetch } from '../services/cache';
import type { AppNotification, NotificationType } from '../types';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  deviceRegistered: boolean;
  isLoading: boolean;

  // Actions
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: AppNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  registerDevice: () => Promise<void>;
  loadWithCache: () => Promise<void>;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  deviceRegistered: false,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await apiClient.notifications.list();
      const unread = res.data.filter(n => !n.read).length;
      set({
        notifications: res.data,
        unreadCount: unread,
        isLoading: false,
      });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  /**
   * Add notification dynamically (from simulation engine)
   */
  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.read ? 0 : 1),
    }));
  },

  markRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  registerDevice: async () => {
    try {
      const deviceId = `device-${Date.now()}`;
      const fcmToken = `mock-fcm-${Math.random().toString(36).slice(2)}`;
      const res = await apiClient.notifications.registerDevice(deviceId, fcmToken);
      if (res.data.registered) {
        set({ deviceRegistered: true });
      }
    } catch (e) {
      console.warn('[NotificationStore] registerDevice failed:', e);
    }
  },

  loadWithCache: async () => {
    await swrFetch({
      cacheKey: STORAGE_KEYS.NOTIFICATIONS,
      ttlMs: 60_000,
      fetcher: async () => {
        const res = await apiClient.notifications.list();
        return res.data;
      },
      onData: (data) => {
        const unread = data.filter(n => !n.read).length;
        set({ notifications: data, unreadCount: unread });
      },
    });
  },

  reset: () => {
    set({
      notifications: [],
      unreadCount: 0,
      deviceRegistered: false,
      isLoading: false,
    });
  },
}));
