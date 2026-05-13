'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export interface WebRTCSignal {
  fromUserId: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export function useWebRTC(roomId?: string) {
  const { token, user } = useAuthStore();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [totalUsers, setTotalUsers] = useState(0);
  const roomSocket = useRef<Socket | null>(null);
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const shouldReconnectRef = useRef(true);

  const createPeerConnection = useCallback((targetUserId: string): RTCPeerConnection | null => {
    if (!localStream) return null;

    if (peerConnectionsRef.current.has(targetUserId)) {
      return peerConnectionsRef.current.get(targetUserId)!;
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && roomSocket.current) {
        roomSocket.current.emit('webrtc:ice-candidate', {
          targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setRemoteStreams((prev) => new Map(prev).set(targetUserId, remoteStream));
    };

    peerConnectionsRef.current.set(targetUserId, pc);
    return pc;
  }, [localStream]);

  // Inicializar socket SOLO si token existe
  useEffect(() => {
    // REGLA #1: NO iniciar socket sin token
    if (!token) {
      console.log('⏸️ [WebRTC] Socket en pausa - esperando token...');
      setIsConnected(false);
      return;
    }

    console.log(`TOKEN ENVIADO AL SOCKET: ${token.substring(0, 5)}...`);

    const socketInstance = io(`${SOCKET_URL}/rooms`, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
    });

    roomSocket.current = socketInstance;

    socketInstance.on('connect', () => {
      console.log('✅ [WebRTC] Socket CONECTADO');
      setIsConnected(true);
      shouldReconnectRef.current = true;
      setError(null);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log(`❌ [WebRTC] Desconectado: ${reason}`);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error: any) => {
      console.error(`❌ [WebRTC] Error: ${error.message}`);

      // REGLA #2: Si es Unauthorized, DETENER reconexión
      if (error.message.includes('Unauthorized') || error.message.includes('Token')) {
        console.error('🛑 [WebRTC] ERROR DE AUTENTICACIÓN - Deteniendo reconexiones');
        shouldReconnectRef.current = false;
        socketInstance.disconnect();
        setError('❌ Error de autenticación. Por favor, recarga la página.');
        setIsConnected(false);
      } else {
        setError(`Error: ${error.message}`);
      }
    });

    socketInstance.on('user-joined', (data: { userId: string; email: string; name: string }) => {
      if (!localStream || data.userId === user?.id) return;

      const pc = createPeerConnection(data.userId);
      if (!pc) return;

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          socketInstance.emit('webrtc:offer', {
            targetUserId: data.userId,
            offer: pc.localDescription,
          });
        })
        .catch((err) => console.error('Error:', err));
    });

    socketInstance.on('user-left', (data: { userId: string }) => {
      const pc = peerConnectionsRef.current.get(data.userId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(data.userId);
      }
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    });

    socketInstance.on('webrtc:offer', async (signal: WebRTCSignal) => {
      if (!user || !localStream) return;

      const { fromUserId, offer } = signal;
      const pc = createPeerConnection(fromUserId);
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(offer!));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketInstance.emit('webrtc:answer', {
        targetUserId: fromUserId,
        answer,
      });
    });

    socketInstance.on('webrtc:answer', async (signal: WebRTCSignal) => {
      const { fromUserId, answer } = signal;
      const pc = peerConnectionsRef.current.get(fromUserId);

      if (pc && answer) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socketInstance.on('webrtc:ice-candidate', async (signal: WebRTCSignal) => {
      const { fromUserId, candidate } = signal;
      const pc = peerConnectionsRef.current.get(fromUserId);

      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error ICE:', err);
        }
      }
    });

    // REGLA #3: Contar usuarios directamente desde BD
    socketInstance.on('room_users_update', (data: { totalUsers: number }) => {
      console.log(`👥 Usuarios en sala: ${data.totalUsers}`);
      setTotalUsers(data.totalUsers);
    });

    return () => {
      if (shouldReconnectRef.current) {
        socketInstance.disconnect();
      }
      roomSocket.current = null;
    };
  }, [token, user?.id, localStream, createPeerConnection]);

  // REGLA #4: Pedir micrófono INSTANTÁNEO al clic
  const requestMicrophone = useCallback(async () => {
    if (localStream) {
      // Ya tenemos stream
      toggleAudio();
      return;
    }

    try {
      console.log('🎤 Pidiendo permiso de micrófono...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      setLocalStream(stream);
      audioTrackRef.current = stream.getAudioTracks()[0];
      setIsAudioEnabled(true);
      setError(null);

      console.log('✅ Micrófono activado');

      // Unirse a la sala CON el stream
      if (roomSocket.current && roomSocket.current.connected) {
        roomSocket.current.emit('join-room', { roomId });
      }
    } catch (err: any) {
      console.error('❌ Permiso denegado:', err.message);
      setError(`Permiso de micrófono: ${err.message}`);
    }
  }, [localStream, roomId]);

  const toggleAudio = useCallback(() => {
    if (!audioTrackRef.current) return;
    audioTrackRef.current.enabled = !audioTrackRef.current.enabled;
    setIsAudioEnabled(audioTrackRef.current.enabled);
  }, []);

  const leaveRoom = useCallback(async () => {
    // Eliminar participante de la BD
    if (roomId && user?.id) {
      try {
        const { error } = await (async () => {
          const response = await fetch(`${SOCKET_URL}/rooms/${roomId}/leave`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id }),
          });

          if (!response.ok) {
            return { error: await response.text() };
          }
          return { error: null };
        })();

        if (!error) {
          console.log(`✅ [WebRTC] Participante eliminado de BD`);
        }
      } catch (err) {
        console.error('Error eliminando participante:', err);
      }
    }

    // Cerrar socket
    if (roomId && roomSocket.current && roomSocket.current.connected) {
      roomSocket.current.emit('leave-room', { roomId });
    }

    // Limpiar audio
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
      audioTrackRef.current = null;
      setIsAudioEnabled(false);
    }

    // Cerrar peer connections
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    setRemoteStreams(new Map());
  }, [roomId, user?.id, token, localStream]);

  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
    };
  }, [localStream]);

  return {
    isConnected,
    localStream,
    isAudioEnabled,
    error,
    remoteStreams,
    totalUsers,
    requestMicrophone,
    leaveRoom,
    toggleAudio,
  };
}
