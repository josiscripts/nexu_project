'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import type { Post } from '@/services/post.service';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  senderId?: string;
  senderName?: string;
}


interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  posts: Post[];
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  addPost: (post: Post) => void;
  joinArea: (area: string) => void;
  leaveArea: (area: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const { token, user } = useAuthStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => {
      // Avoid duplicates
      if (prev.some((n) => n.id === notification.id)) return prev;
      return [notification, ...prev];
    });
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );

    if (socket && isConnected) {
      socket.emit('notification:read', { notificationId });
    }
  }, [socket, isConnected]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    if (socket && isConnected) {
      socket.emit('notification:readAll');
    }
  }, [socket, isConnected]);

  const addPost = useCallback((post: Post) => {
    setPosts((prev) => {
      // Avoid duplicates
      if (prev.some((p) => p.id === post.id)) return prev;
      return [post, ...prev];
    });
  }, []);

  const joinArea = useCallback((area: string) => {
    if (socket && isConnected) {
      socket.emit('joinArea', area);
      console.log('[Socket] Joined area:', area);
    }
  }, [socket, isConnected]);

  const leaveArea = useCallback((area: string) => {
    if (socket && isConnected) {
      socket.emit('leaveArea', area);
      console.log('[Socket] Left area:', area);
    }
  }, [socket, isConnected]);

  useEffect(() => {
    if (!token) {
      console.log('❌ [Socket] No token disponible en useAuthStore');
      return;
    }

    console.log(`📍 [Socket] Intentando conectar a ${SOCKET_URL}/notifications`);
    console.log('[Socket] Token disponible:', token.substring(0, 30) + '...');
    console.log('[Socket] Token completo:', token); // DEBUG

    const socketInstance = io(`${SOCKET_URL}/notifications`, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketInstance.on('connect', () => {
      console.log('✅ [Socket] Conectado a namespace /notifications');
      console.log('[Socket] Socket ID:', socketInstance.id);
      setIsConnected(true);

      // Auto-join user's area room if available
      if (user?.area) {
        socketInstance.emit('joinArea', user.area);
        console.log('[Socket] Auto-joined area:', user.area);
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ [Socket] Desconectado:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ [Socket] Error de conexión:', error.message);
      console.error('[Socket] Detalles del error:', error);
      setIsConnected(false);
    });

    // Listen for new notification event
    socketInstance.on('new-notification', (notification: Notification) => {
      console.log('🔔 Nueva notificación recibida:', notification);
      addNotification(notification);
    });

    // Listen for all read event
    socketInstance.on('notification:allRead', () => {
      console.log('[Socket] All notifications marked as read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    });

    // Listen for initial notifications load
    socketInstance.on('notification:list', (notificationList: Notification[]) => {
      console.log('[Socket] Received notification list:', notificationList.length);
      setNotifications(notificationList);
    });

    // Listen for new posts in area
    socketInstance.on('post:new', (data: any) => {
      console.log('[Socket] New post in area:', data);
      // This is a notification about a post, convert to notification format
      addNotification({
        id: `post-${data.id}`,
        title: data.title || 'Nueva publicación',
        message: data.message,
        type: 'post',
        read: false,
        createdAt: data.createdAt,
        senderId: data.senderId,
        senderName: data.senderName,
      });
    });

    // Listen for feed updates (new posts)
    socketInstance.on('feed:update', (data: { post: Post }) => {
      console.log('[Socket] Feed update - new post:', data.post);
      addPost(data.post);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, user?.area, addNotification, addPost]);

  const value: SocketContextType = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    posts,
    addNotification,
    markAsRead,
    markAllAsRead,
    addPost,
    joinArea,
    leaveArea,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}