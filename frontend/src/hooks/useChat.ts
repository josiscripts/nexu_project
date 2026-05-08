'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/contexts/SocketContext';

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    email: string;
  };
  receiver?: {
    id: string;
    name: string;
    email: string;
  };
}


export function useChat(otherUserId?: string) {
  const { token } = useAuthStore();
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatConnected, setIsChatConnected] = useState(false);

  // Load chat messages from history
  const loadHistory = useCallback(async () => {
    if (!token || !otherUserId || !socket) return;

    socket.emit('chat:history', { otherUserId }, (response: any) => {
      if (response.success) {
        setMessages(response.messages);
      }
    });
  }, [token, otherUserId, socket]);

  // Send a chat message
  const sendMessage = useCallback(
    async (content: string, receiverId: string) => {
      if (!token || !socket) return;

      socket.emit(
        'chat:message',
        { content, receiverId },
        (response: any) => {
          if (response.success) {
            console.log('Mensaje enviado:', response.message);
          } else {
            console.error('Error al enviar mensaje:', response.error);
          }
        },
      );
    },
    [token, socket],
  );

  // Listen for incoming chat messages
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Mark as connected when socket is ready
    setIsChatConnected(true);

    // Listen for new chat message event
    socket.on('chat:message', (message: ChatMessage) => {
      console.log('💬 Nuevo mensaje:', message);

      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    return () => {
      socket.off('chat:message');
    };
  }, [socket, isConnected]);

  // Load history when chat connects and otherUserId is provided
  useEffect(() => {
    if (isChatConnected && otherUserId && messages.length === 0) {
      loadHistory();
    }
  }, [isChatConnected, otherUserId, messages.length, loadHistory]);

  return {
    messages,
    isChatConnected,
    sendMessage,
    loadHistory,
  };
}
