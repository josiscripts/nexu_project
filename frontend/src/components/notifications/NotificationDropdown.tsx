'use client';

import { useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/contexts/SocketContext';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  onToggle: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Hace un momento';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} min`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Hace ${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Hace ${diffInDays}d`;
  }

  return date.toLocaleDateString('es-ES');
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'like':
      return '❤️';
    case 'comment':
      return '💬';
    case 'follow':
      return '👤';
    case 'mention':
      return '@️';
    default:
      return '🔔';
  }
}

export default function NotificationDropdown({
  notifications,
  unreadCount,
  isOpen,
  onToggle,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) {
          onToggle();
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={onToggle}
        className={cn(
          'relative p-2 rounded-full transition-all duration-200',
          'hover:bg-nexu-gray/80 focus:outline-none focus:ring-2 focus:ring-nexu-cyan/50',
          isOpen && 'bg-nexu-gray'
        )}
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
      >
        <Bell
          className={cn(
            'w-6 h-6 transition-colors',
            unreadCount > 0 ? 'text-nexu-cyan' : 'text-gray-400'
          )}
        />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-nexu-red text-white text-xs font-bold rounded-full shadow-[0_0_10px_rgba(255,59,63,0.6)]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className={cn(
          'absolute right-0 mt-2 w-80 sm:w-96 z-50',
          'bg-nexu-gray border border-gray-700 rounded-xl shadow-2xl',
          'overflow-hidden'
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-white font-semibold">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="flex items-center gap-1.5 text-sm text-nexu-cyan hover:text-nexu-cyan/80 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-700/50">
                {notifications.slice(0, 10).map((notification) => (
                  <li
                    key={notification.id}
                    className={cn(
                      'relative p-4 hover:bg-nexu-dark/50 transition-colors cursor-pointer',
                      !notification.read && 'bg-nexu-cyan/5'
                    )}
                    onClick={() => !notification.read && onMarkAsRead(notification.id)}
                  >
                    {/* Unread Indicator */}
                    {!notification.read && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-nexu-cyan rounded-full shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
                    )}

                    <div className={cn('flex gap-3', !notification.read && 'pl-3')}>
                      {/* Icon */}
                      <span className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm leading-tight">
                          {notification.title}
                        </p>
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.senderName && (
                          <p className="text-nexu-cyan text-xs mt-1">
                            {notification.senderName}
                          </p>
                        )}
                        <p className="text-gray-500 text-xs mt-2">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>

                      {/* Mark as Read Button */}
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead(notification.id);
                          }}
                          className="flex-shrink-0 p-1.5 rounded-full hover:bg-nexu-cyan/20 transition-colors group"
                          aria-label="Marcar como leída"
                        >
                          <Check className="w-4 h-4 text-gray-500 group-hover:text-nexu-cyan" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className="p-3 text-center border-t border-gray-700">
              <button className="text-sm text-nexu-cyan hover:underline">
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}