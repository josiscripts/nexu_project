'use client';

import { useCallback, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSocket, type Notification } from '@/contexts/SocketContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function useNotifications() {
  const { token } = useAuthStore();
  const {
    socket,
    notifications,
    unreadCount,
    isConnected,
    markAsRead: socketMarkAsRead,
    markAllAsRead: socketMarkAllAsRead,
    addNotification
  } = useSocket();

  // Fetch initial notifications from REST API
  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data: Notification[] = await response.json();

      // Add each notification to the context
      data.forEach((notification) => {
        addNotification(notification);
      });
    } catch (error) {
      console.error('[Notifications] Fetch error:', error);
    }
  }, [token, addNotification]);

  // Mark a single notification as read (REST API + Socket)
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update via socket context
      socketMarkAsRead(notificationId);
    } catch (error) {
      console.error('[Notifications] Mark as read error:', error);
    }
  }, [token, socketMarkAsRead]);

  // Mark all notifications as read (REST API + Socket)
  const markAllAsRead = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update via socket context
      socketMarkAllAsRead();
    } catch (error) {
      console.error('[Notifications] Mark all as read error:', error);
    }
  }, [token, socketMarkAllAsRead]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewNotification = (notification: Notification) => {
      console.log('🔔 Nueva notificación en tiempo real:', notification);
    };

    socket.on('new-notification', handleNewNotification);

    return () => {
      socket.off('new-notification', handleNewNotification);
    };
  }, [socket, isConnected]);

  // Fetch notifications on mount if socket is connected
  useEffect(() => {
    if (token && isConnected && notifications.length === 0) {
      fetchNotifications();
    }
  }, [token, isConnected, notifications.length, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}