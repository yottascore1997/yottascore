"use client";

import React, { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';

export default function SocketDebugPage() {
  const { socket, isConnected, error } = useSocket();
  const [logs, setLogs] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    // Get userId from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.userId || 'Unknown');
      } catch (error) {
        setUserId('Error decoding token');
      }
    }
  }, []);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => addLog('Socket connected');
    const handleDisconnect = () => addLog('Socket disconnected');
    const handleMatchmakingUpdate = (data: any) => addLog(`Matchmaking update: ${JSON.stringify(data)}`);
    const handleOpponentFound = (data: any) => addLog(`Opponent found: ${JSON.stringify(data)}`);
    const handleMatchStarting = (data: any) => addLog(`Match starting: ${JSON.stringify(data)}`);
    const handleMatchReady = (data: any) => addLog(`Match ready: ${JSON.stringify(data)}`);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('matchmaking_update', handleMatchmakingUpdate);
    socket.on('opponent_found', handleOpponentFound);
    socket.on('match_starting', handleMatchStarting);
    socket.on('match_ready', handleMatchReady);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('matchmaking_update', handleMatchmakingUpdate);
      socket.off('opponent_found', handleOpponentFound);
      socket.off('match_starting', handleMatchStarting);
      socket.off('match_ready', handleMatchReady);
    };
  }, [socket]);

  const startMatchmaking = () => {
    if (!socket || !isConnected) {
      addLog('Socket not connected');
      return;
    }

    addLog('Starting matchmaking...');
    addLog(`User ID: ${userId}`);
    addLog(`Socket ID: ${socket.id}`);
    
    socket.emit('join_matchmaking', {
      categoryId: 'test',
      mode: 'quick'
    });
    
    addLog('Emitted join_matchmaking event');
  };

  const cancelMatchmaking = () => {
    if (!socket || !isConnected) {
      addLog('Socket not connected');
      return;
    }

    addLog('Cancelling matchmaking...');
    socket.emit('cancel_matchmaking');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Socket Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
          <p>Connected: <span className={isConnected ? 'text-green-600' : 'text-red-600'}>{isConnected ? 'Yes' : 'No'}</span></p>
          <p>User ID: {userId}</p>
          <p>Socket ID: {socket?.id || 'Not connected'}</p>
          {error && <p className="text-red-600">Error: {error}</p>}
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Actions</h2>
          <div className="space-y-2">
            <button 
              onClick={startMatchmaking}
              disabled={!isConnected}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
            >
              Start Matchmaking
            </button>
            <button 
              onClick={cancelMatchmaking}
              disabled={!isConnected}
              className="bg-red-600 text-white px-4 py-2 rounded disabled:bg-gray-400 ml-2"
            >
              Cancel Matchmaking
            </button>
            <button 
              onClick={clearLogs}
              className="bg-gray-600 text-white px-4 py-2 rounded ml-2"
            >
              Clear Logs
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Event Logs</h2>
        <div className="bg-gray-100 p-4 rounded h-96 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">No events yet...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 