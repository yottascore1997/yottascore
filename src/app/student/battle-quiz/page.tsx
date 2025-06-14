'use client';

import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = typeof window !== 'undefined'
  ? `${window.location.origin.replace(/^http/, 'ws')}/api/socket`
  : '';

export default function BattleQuizMatchmaking() {
  const [status, setStatus] = useState<'idle' | 'waiting' | 'matched'>('idle');
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to socket only once
    if (!socketRef.current && SOCKET_URL) {
      const socket = io(SOCKET_URL, { path: '/api/socket' });
      socketRef.current = socket;

      socket.on('waiting', () => {
        setStatus('waiting');
        setOpponentId(null);
      });

      socket.on('matched', ({ opponentId }) => {
        setStatus('matched');
        setOpponentId(opponentId);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, []);

  const handleStartMatch = () => {
    if (socketRef.current) {
      socketRef.current.emit('join_matchmaking');
      setStatus('waiting');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Battle Quiz Matchmaking</h1>
      {status === 'idle' && (
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700"
          onClick={handleStartMatch}
        >
          Start Match
        </button>
      )}
      {status === 'waiting' && (
        <div className="text-lg text-gray-700">Waiting for opponent...</div>
      )}
      {status === 'matched' && (
        <div className="text-lg text-green-600 font-semibold">
          Matched! Opponent found. <br />
          (Opponent ID: {opponentId})
          {/* Here you can show the quiz UI */}
        </div>
      )}
    </div>
  );
} 