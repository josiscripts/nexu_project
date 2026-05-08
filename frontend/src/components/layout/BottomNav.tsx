"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Plus, BarChart2, User } from "lucide-react";
import clsx from "clsx";

export function BottomNav() {
  const pathname = usePathname();

  // No mostrar en rutas de autenticación
  const isAuthRoute = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";
  
  if (isAuthRoute) {
    return null;
  }

  const navItems = [
    { name: "FEED", href: "/social", icon: Home },
    { name: "GROUPS", href: "/groups", icon: Users },
  ];

  const rightNavItems = [
    { name: "ROOMS", href: "/rooms", icon: BarChart2 },
    { name: "PROFILE", href: "/profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-brand-gray/50 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
      <div className="max-w-md mx-auto px-6 h-[72px] flex items-center justify-between relative">
        
        {/* Left Items */}
        <div className="flex gap-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={clsx(
                  "flex flex-col items-center justify-center w-12 gap-1 transition-colors",
                  isActive ? "text-brand-cyan" : "text-brand-navy/70 hover:text-brand-navy"
                )}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold tracking-wider">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Center Floating Button */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-5">
          <Link 
            href="/create"
            className="flex items-center justify-center w-[52px] h-[52px] rounded-full bg-brand-coral text-white shadow-lg shadow-brand-coral/30 hover:scale-105 active:scale-95 transition-all"
            style={{
              boxShadow: "0 8px 16px -4px rgba(255, 59, 63, 0.4)"
            }}
          >
            <Plus size={28} strokeWidth={2.5} />
          </Link>
        </div>

        {/* Right Items */}
        <div className="flex gap-8">
          {rightNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={clsx(
                  "flex flex-col items-center justify-center w-12 gap-1 transition-colors",
                  isActive ? "text-brand-cyan" : "text-brand-navy/70 hover:text-brand-navy"
                )}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold tracking-wider">{item.name}</span>
              </Link>
            );
          })}
        </div>

      </div>
    </nav>
  );
}
