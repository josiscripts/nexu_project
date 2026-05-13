import { useState, useEffect } from 'react';
import { supabase, isSupabaseAvailable } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export interface Participant {
  userId: string;
  roomId: string;
  joinedAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useRoomParticipants(roomId: string) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuthStore();

  useEffect(() => {
    if (!roomId) return;

    // Cargar participantes iniciales desde backend
    const loadParticipants = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/rooms/${roomId}/participants`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        setParticipants(data.participants || []);
        setTotalUsers(data.totalUsers || 0);
        console.log(`📊 [Backend] Participantes iniciales: ${data.totalUsers}`);
        setError(null);
      } catch (err: any) {
        console.error('❌ Error cargando participantes:', err.message);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadParticipants();

    if (!isSupabaseAvailable) {
      console.warn('⚠️ Supabase no disponible - Realtime deshabilitado');
      return;
    }

    // Suscribirse a cambios en tiempo real via Supabase Realtime
    console.log(`🔄 [Supabase] Suscribiendo a cambios en RoomParticipant para sala: ${roomId}`);

    const subscription = supabase
      .channel(`room:${roomId}:participants`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'RoomParticipant',
          filter: `roomId=eq.${roomId}`,
        },
        (payload) => {
          console.log('🔄 [Supabase] Cambio detectado:', payload.eventType);

          if (payload.eventType === 'INSERT') {
            // Nuevo usuario se unió
            const newParticipant = payload.new as Participant;
            setParticipants((prev) => {
              // Evitar duplicados
              if (prev.some((p) => p.userId === newParticipant.userId)) {
                return prev;
              }
              return [...prev, newParticipant];
            });
            setTotalUsers((prev) => prev + 1);
          } else if (payload.eventType === 'DELETE') {
            // Usuario se fue
            const deletedParticipant = payload.old as Participant;
            setParticipants((prev) =>
              prev.filter((p) => p.userId !== deletedParticipant.userId)
            );
            setTotalUsers((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, token]);

  return { participants, totalUsers, isLoading, error };
}
