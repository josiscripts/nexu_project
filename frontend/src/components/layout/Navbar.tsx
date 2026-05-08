'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/contexts/SocketContext';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import NexuButton from '@/components/ui/NexuButton';
import { cn } from '@/lib/utils';

interface NavbarProps {
  className?: string;
}

export default function Navbar({ className }: NavbarProps) {
  const { user, logout } = useAuthStore();
  const { isConnected } = useSocket();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 bg-brand-bg/95 backdrop-blur-sm border-b border-brand-red/20',
        'px-4 sm:px-6 py-4',
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy cursor-pointer" onClick={() => router.push('/muro')}>
            NEXU
          </h1>
          {user?.area && (
            <span className="hidden sm:inline-block px-3 py-1 text-sm font-medium text-white bg-brand-navy rounded-full">
              {user.area}
            </span>
          )}
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          <button onClick={() => router.push('/muro')} className="px-3 py-2 text-sm font-medium text-brand-navy hover:text-brand-red transition">Muro</button>
          <button onClick={() => router.push('/explorar')} className="px-3 py-2 text-sm font-medium text-brand-navy hover:text-brand-red transition">Explorar</button>
          <button onClick={() => router.push('/grupos')} className="px-3 py-2 text-sm font-medium text-brand-navy hover:text-brand-red transition">Grupos</button>
          <button onClick={() => router.push('/salas')} className="px-3 py-2 text-sm font-medium text-brand-navy hover:text-brand-red transition">Salas</button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Connection Status Indicator */}
          <div
            className={cn(
              'hidden sm:flex items-center gap-2 text-xs',
              isConnected ? 'text-green-500' : 'text-brand-navy/50'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                isConnected
                  ? 'bg-green-500 shadow-[0_0_8px_rgba(34,184,207,0.6)]'
                  : 'bg-brand-navy/30'
              )}
            />
            {isConnected ? 'Conectado' : 'Desconectado'}
          </div>

          {/* Notification Bell */}
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            isOpen={isDropdownOpen}
            onToggle={toggleDropdown}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
          />

          {/* User Section */}
          <div className="flex items-center gap-3">
            {/* User Avatar */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-red/20 flex items-center justify-center">
                <User className="w-4 h-4 text-brand-red" />
              </div>
              <span className="text-brand-navy text-sm font-medium max-w-[120px] truncate">
                {user?.name || 'Usuario'}
              </span>
            </div>

            {/* Logout Button */}
            <NexuButton
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </NexuButton>
          </div>
        </div>
      </div>

      {/* Mobile Area Badge */}
      {user?.area && (
        <div className="sm:hidden mt-2">
          <span className="inline-block px-3 py-1 text-sm font-medium text-white bg-brand-navy rounded-full">
            {user.area}
          </span>
        </div>
      )}
    </header>
  );
}