'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';

interface AudioRoomProps {
  roomId: string;
  onLeave?: () => void;
}

interface RemoteAudioProps {
  userId: string;
  stream: MediaStream;
}

/**
 * Componente para renderizar el audio de un usuario remoto
 */
function RemoteAudio({ userId, stream }: RemoteAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
      console.log(`🔊 Audio asignado para usuario: ${userId}`);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.srcObject = null;
      }
    };
  }, [userId, stream]);

  return (
    <audio
      ref={audioRef}
      autoPlay
      playsInline
      className="hidden"
    />
  );
}

/**
 * Componente principal de la sala de audio
 */
export function AudioRoom({ roomId, onLeave }: AudioRoomProps) {
  const {
    isConnected,
    localStream,
    isAudioEnabled,
    error,
    remoteStreams,
    joinRoom,
    leaveRoom,
    toggleAudio,
  } = useWebRTC(roomId);

  // Unirse a la sala cuando el componente se monta
  useEffect(() => {
    joinRoom();

    return () => {
      leaveRoom();
    };
  }, [roomId]);

  // Manejar leave
  const handleLeave = useCallback(() => {
    leaveRoom();
    onLeave?.();
  }, [leaveRoom, onLeave]);

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <p className="font-bold">Error de audio</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Sala de Audio: {roomId}</h2>
        <p className="text-sm text-gray-600">
          Estado: {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
        </p>
      </div>

      {/* Controles de audio */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={toggleAudio}
          disabled={!localStream}
          className={`px-4 py-2 rounded ${
            isAudioEnabled
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-red-500 hover:bg-red-600'
          } text-white disabled:opacity-50`}
        >
          {isAudioEnabled ? '🎙️ Micrófono activo' : '🔇 Silenciado'}
        </button>

        <button
          onClick={handleLeave}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded"
        >
          Salir de la sala
        </button>
      </div>

      {/* Lista de usuarios remotos con audio */}
      <div className="mb-4">
        <h3 className="text-md font-medium mb-2">
          Usuarios en la sala ({remoteStreams.size})
        </h3>
        {remoteStreams.size === 0 ? (
          <p className="text-gray-500 text-sm">No hay otros usuarios en la sala</p>
        ) : (
          <ul className="space-y-2">
            {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
              <li key={userId} className="flex items-center gap-2">
                <span className="text-sm">👤 Usuario {userId.slice(0, 8)}...</span>
                <span className="text-xs text-green-600">🔊 Escuchando</span>
                {/* Elemento de audio oculto para este usuario */}
                <RemoteAudio userId={userId} stream={stream} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Elementos de audio ocultos para cada stream remoto */}
      <div className="hidden">
        {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
          <RemoteAudio key={userId} userId={userId} stream={stream} />
        ))}
      </div>
    </div>
  );
}

export default AudioRoom;
