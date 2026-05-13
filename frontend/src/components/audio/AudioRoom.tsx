'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useRoomParticipants } from '@/hooks/useRoomParticipants';

interface AudioRoomProps {
  roomId: string;
  roomName?: string;
  onLeave?: () => void;
}

interface RemoteAudioProps {
  userId: string;
  stream: MediaStream;
}

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

export function AudioRoom({ roomId, roomName, onLeave }: AudioRoomProps) {
  const {
    isConnected,
    isAudioEnabled,
    error,
    remoteStreams,
    requestMicrophone,
    leaveRoom,
  } = useWebRTC(roomId);

  // SUPABASE REALTIME: Lee participantes directamente de BD
  const { participants, totalUsers, isLoading } = useRoomParticipants(roomId);

  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, [leaveRoom]);

  const handleLeave = useCallback(() => {
    leaveRoom();
    onLeave?.();
  }, [leaveRoom, onLeave]);

  if (error && error.includes('autenticación')) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <p className="font-bold">Error de autenticación</p>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="mt-2 text-blue-600 underline">
          Recargar página
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Sala de Audio: {roomName || roomId}</h2>
        <p className="text-sm text-gray-600">
          Estado: {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
        </p>
      </div>

      {/* Controles de audio - sin validación de socket */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={requestMicrophone}
          className={`px-4 py-2 rounded ${
            isAudioEnabled
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-red-500 hover:bg-red-600'
          } text-white`}
        >
          {isAudioEnabled ? '🎙️ Micrófono activo' : '🎤 Activar micrófono'}
        </button>

        <button
          onClick={handleLeave}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded"
        >
          Salir de la sala
        </button>
      </div>

      {/* Lista de participantes desde SUPABASE REALTIME */}
      <div className="mb-4">
        <h3 className="text-md font-medium mb-2">
          Usuarios en la sala ({isLoading ? '...' : totalUsers})
        </h3>

        {isLoading ? (
          <p className="text-gray-500 text-sm">Cargando participantes...</p>
        ) : totalUsers === 0 ? (
          <p className="text-gray-500 text-sm">No hay usuarios en la sala</p>
        ) : (
          <ul className="space-y-1">
            {participants.map((participant) => (
              <li key={participant.userId} className="flex items-center gap-2 text-sm">
                <span>👤</span>
                <span className="text-gray-700">{participant.userId.slice(0, 8)}...</span>
                {remoteStreams.has(participant.userId) && (
                  <span className="text-xs text-green-600">🔊 Escuchando</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Elementos de audio ocultos */}
      <div className="hidden">
        {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
          <RemoteAudio key={userId} userId={userId} stream={stream} />
        ))}
      </div>
    </div>
  );
}

export default AudioRoom;
