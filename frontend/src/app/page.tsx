"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function Home() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    // Cuando el usuario entra a la raíz "/", decidimos a dónde mandarlo
    if (token) {
      router.replace("/social");
    } else {
      router.replace("/login");
    }
  }, [token, router]);

  // Pantalla de carga transitoria
  return (
    <main className="min-h-screen bg-brand-navy flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-coral border-t-transparent rounded-full animate-spin"></div>
    </main>
  );
}
