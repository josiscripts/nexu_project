'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const roomSocket = useRef<Socket | null>(null);
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  // Create a peer connection for a target user
  const createPeerConnection = useCallback((targetUserId: string): RTCPeerConnection | null => {
    if (!localStream) {
      console.error('❌ No hay localStream para crear peer connection');
      return null;
    }

    if (peerConnectionsRef.current.has(targetUserId)) {
      console.log('[WebRTC] Peer connection ya existe para:', targetUserId);
      return peerConnectionsRef.current.get(targetUserId)!;
    }

    console.log('[WebRTC] Creando peer connection para:', targetUserId);

    const pc = new RTCPeerConnection(RTC_CONFIG);

    // Add local audio track to the connection
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
      console.log('[WebRTC] Track añadido:', track.kind);
    });

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] ICE candidate generado:', event.candidate.type);
        if (roomSocket.current) {
          roomSocket.current.emit('webrtc:ice-candidate', {
            targetUserId,
            candidate: event.candidate,
          });
        }
      } else {
        console.log('[WebRTC] ICE candidates completados');
      }
    };

    // Handle receiving remote tracks
    pc.ontrack = (event) => {
      console.log('🔊 Recibiendo audio de:', targetUserId);

      const remoteStream = event.streams[0];
      setRemoteStreams((prev) => new Map(prev).set(targetUserId, remoteStream));
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Estado conexión con ${targetUserId}:`, pc.connectionState);
    };

    peerConnectionsRef.current.set(targetUserId, pc);
    return pc;
  }, [localStream]);

  // Initialize room socket connection
  useEffect(() => {
    if (!token) return;

    const socketInstance = io(`${SOCKET_URL}/rooms`, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    roomSocket.current = socketInstance;

    socketInstance.on('connect', () => {
      console.log('[WebRTC] Connected to rooms namespace');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[WebRTC] Disconnected from rooms namespace');
      setIsConnected(false);
    });

    // Handle incoming WebRTC offer
    socketInstance.on('webrtc:offer', async (signal: WebRTCSignal) => {
      console.log('📡 Señal recibida:', 'offer', signal);

      if (!user || !localStream) return;

      const { fromUserId, offer } = signal;

      // Create peer connection
      const pc = createPeerConnection(fromUserId);
      if (!pc) return;

      // Set remote description
      await pc.setRemoteDescription(new RTCSessionDescription(offer!));

      // Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketInstance.emit('webrtc:answer', {
        targetUserId: fromUserId,
        answer,
      });

      console.log(`📡 Answer enviado a ${fromUserId}`);
    });

    // Handle incoming WebRTC answer
    socketInstance.on('webrtc:answer', async (signal: WebRTCSignal) => {
      console.log('📡 Señal recibida:', 'answer', signal);

      const { fromUserId, answer } = signal;
      const pc = peerConnectionsRef.current.get(fromUserId);

      if (pc && answer) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log(`Remote description set para ${fromUserId}`);
      }
    });

    // Handle incoming ICE candidate
    socketInstance.on('webrtc:ice-candidate', async (signal: WebRTCSignal) => {
      console.log('📡 Señal recibida:', 'ice-candidate', signal);

      const { fromUserId, candidate } = signal;
      const pc = peerConnectionsRef.current.get(fromUserId);

      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log(`ICE candidate añadido de ${fromUserId}`);
        } catch (err) {
          console.error('Error al añadir ICE candidate:', err);
        }
      }
    });

    // Handle user joined room
    socketInstance.on('user-joined', (data: { userId: string; email: string; name: string }) => {
      console.log('[WebRTC] Usuario entró a la sala:', data);

      // Only create peer connection if we have local stream and it's not ourselves
      if (!localStream || data.userId === user?.id) return;

      // Create peer connection and send offer
      const pc = createPeerConnection(data.userId);
      if (!pc) return;

      // Store pending offer
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          socketInstance.emit('webrtc:offer', {
            targetUserId: data.userId,
            offer: pc.localDescription,
          });
          console.log(`📡 Offer enviado a ${data.userId}`);
        })
        .catch((err) => console.error('Error creando offer:', err));
    });

    // Handle user left room
    socketInstance.on('user-left', (data: { userId: string; email: string; name: string }) => {
      console.log('[WebRTC] Usuario salió de la sala:', data);

      // Clean up peer connection for this user
      const pc = peerConnectionsRef.current.get(data.userId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(data.userId);
      }

      // Clean up remote stream
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    });

    return () => {
      socketInstance.disconnect();
      roomSocket.current = null;
    };
  }, [token, user?.id, localStream, createPeerConnection]);

  /**
   * Join a room and request microphone access
   */
  const joinRoom = useCallback(async () => {
    if (!roomId || !roomSocket.current) {
      console.error('❌ No hay roomSocket o roomId disponible');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      setLocalStream(stream);
      audioTrackRef.current = stream.getAudioTracks()[0];
      setIsAudioEnabled(true);
      setError(null);

      // Join the room via WebSocket
      roomSocket.current.emit('join-room', { roomId });

      console.log('🎙️ Micrófono accedido con éxito');
    } catch (err) {
      console.error('❌ Error al acceder al micrófono:', err);
      setError('No se pudo acceder al micrófono');
    }
  }, [roomId]);

  /**
   * Leave the current room and clean up media stream
   */
  const leaveRoom = useCallback(() => {
    if (roomId && roomSocket.current) {
      roomSocket.current.emit('leave-room', { roomId });
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
      audioTrackRef.current = null;
      setIsAudioEnabled(true);
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    // Clear remote streams
    setRemoteStreams(new Map());

    console.log('🎙️ Sala abandonada, micrófono liberado');
  }, [roomId, localStream]);

  /**
   * Toggle audio track (mute/unmute)
   */
  const toggleAudio = useCallback(() => {
    const audioTrack = audioTrackRef.current;
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setIsAudioEnabled(audioTrack.enabled);

    console.log(`🎙️ Micrófono ${audioTrack.enabled ? 'activado' : 'silenciado'}`);
  }, []);

  /**
   * Toggle video track (placeholder for future video support)
   */
  const toggleVideo = useCallback(() => {
    console.log('📹 Video toggle - no implementado aún');
  }, []);

  // Cleanup on unmount
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
    peerConnections: peerConnectionsRef.current,
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
  };
}
