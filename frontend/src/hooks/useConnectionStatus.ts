import { useEffect, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { supabase, isSupabaseAvailable } from '@/lib/supabase';

export interface ConnectionStatus {
  socketConnected: boolean;
  supabaseConnected: boolean;
  isOverallConnected: boolean;
  details: string;
}

export function useConnectionStatus(): ConnectionStatus {
  const { isConnected: socketConnected } = useSocket();
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [details, setDetails] = useState('Inicializando...');

  useEffect(() => {
    // Monitor Supabase Realtime connection
    const checkSupabaseConnection = async () => {
      if (!isSupabaseAvailable) {
        setSupabaseConnected(false);
        return;
      }

      try {
        // Try a simple query to verify auth works
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          setSupabaseConnected(false);
          setDetails('Supabase: No autenticado');
          return;
        }

        if (data.user) {
          setSupabaseConnected(true);
          setDetails('Supabase: Conectado');
        }
      } catch (err) {
        setSupabaseConnected(false);
        setDetails('Supabase: Error de conexión');
        console.error('[useConnectionStatus] Supabase check failed:', err);
      }
    };

    checkSupabaseConnection();

    // Recheck every 5 seconds
    const interval = setInterval(checkSupabaseConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  // Overall connection: true if EITHER Socket.io OR Supabase is connected
  // (Since we use both for different purposes)
  const isOverallConnected = socketConnected || supabaseConnected;

  useEffect(() => {
    if (socketConnected && supabaseConnected) {
      setDetails('Todo conectado');
    } else if (socketConnected) {
      setDetails('Socket.io ✓ (Supabase pendiente)');
    } else if (supabaseConnected) {
      setDetails('Supabase ✓ (Socket.io pendiente)');
    } else {
      setDetails('Sin conexión');
    }
  }, [socketConnected, supabaseConnected]);

  return {
    socketConnected,
    supabaseConnected,
    isOverallConnected,
    details,
  };
}
