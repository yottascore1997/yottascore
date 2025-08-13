"use client";

import React, { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SocketDebugPage() {
  const { socket, isConnected, error, isReactNative } = useSocket();
  const [logs, setLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<any>({});

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    addLog(`Environment: ${isReactNative ? 'React Native' : 'Web Browser'}`);
    addLog(`Socket connected: ${isConnected}`);
    addLog(`Socket ID: ${socket?.id || 'Not connected'}`);
    addLog(`Error: ${error || 'None'}`);
  }, [isConnected, socket, error, isReactNative]);

  const testPing = () => {
    if (!socket) {
      addLog('❌ Cannot test ping - socket not connected');
      return;
    }

    addLog('🏓 Sending ping to server...');
    socket.emit('ping');
    
    // Listen for pong response
    const handlePong = () => {
      addLog('✅ Received pong from server');
      setTestResults(prev => ({ ...prev, ping: 'SUCCESS' }));
      socket.off('pong', handlePong);
    };
    
    socket.on('pong', handlePong);
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (testResults.ping !== 'SUCCESS') {
        addLog('❌ Ping timeout - no pong received');
        setTestResults(prev => ({ ...prev, ping: 'TIMEOUT' }));
        socket.off('pong', handlePong);
      }
    }, 5000);
  };

  const testAuthentication = () => {
    if (!socket) {
      addLog('❌ Cannot test auth - socket not connected');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      addLog('❌ No auth token found');
      setTestResults(prev => ({ ...prev, auth: 'NO_TOKEN' }));
      return;
    }

    addLog('🔐 Testing authentication...');
    socket.emit('authenticate', { token });
    
    const handleAuthenticated = (data: any) => {
      addLog(`✅ Authentication successful: ${data.user?.name || 'Unknown user'}`);
      setTestResults(prev => ({ ...prev, auth: 'SUCCESS' }));
      socket.off('authenticated', handleAuthenticated);
      socket.off('auth_error', handleAuthError);
    };
    
    const handleAuthError = (error: any) => {
      addLog(`❌ Authentication failed: ${error.message || error}`);
      setTestResults(prev => ({ ...prev, auth: 'FAILED' }));
      socket.off('authenticated', handleAuthenticated);
      socket.off('auth_error', handleAuthError);
    };
    
    socket.on('authenticated', handleAuthenticated);
    socket.on('auth_error', handleAuthError);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (testResults.auth !== 'SUCCESS' && testResults.auth !== 'FAILED') {
        addLog('❌ Authentication timeout');
        setTestResults(prev => ({ ...prev, auth: 'TIMEOUT' }));
        socket.off('authenticated', handleAuthenticated);
        socket.off('auth_error', handleAuthError);
      }
    }, 10000);
  };

  const testBattleQuizEvents = () => {
    if (!socket) {
      addLog('❌ Cannot test battle quiz - socket not connected');
      return;
    }

    addLog('🎮 Testing Battle Quiz specific events...');
    
    // Test all battle quiz events
    const events = [
      'match_started',
      'next_question', 
      'opponent_answered',
      'match_ended',
      'question_result',
      'opponent_disconnected'
    ];
    
    events.forEach(eventName => {
      const handler = (data: any) => {
        addLog(`✅ Received ${eventName}: ${JSON.stringify(data).substring(0, 100)}...`);
        setTestResults(prev => ({ ...prev, [eventName]: 'RECEIVED' }));
        socket.off(eventName, handler);
      };
      
      socket.on(eventName, handler);
      addLog(`👂 Listening for ${eventName}...`);
      setTestResults(prev => ({ ...prev, [eventName]: 'LISTENING' }));
    });
    
    // Clean up after 60 seconds
    setTimeout(() => {
      events.forEach(eventName => {
        socket.off(eventName);
      });
      addLog('🧹 Battle quiz event listeners cleaned up');
    }, 60000);
  };

  const testBattleEvents = () => {
    if (!socket) {
      addLog('❌ Cannot test battle events - socket not connected');
      return;
    }

    addLog('🎮 Testing battle event listeners...');
    
    // Test match_started event
    const handleMatchStarted = (data: any) => {
      addLog(`✅ Received match_started: ${data.matchId}`);
      setTestResults(prev => ({ ...prev, matchStarted: 'RECEIVED' }));
    };
    
    // Test next_question event
    const handleNextQuestion = (data: any) => {
      addLog(`✅ Received next_question: ${data.questionIndex}`);
      setTestResults(prev => ({ ...prev, nextQuestion: 'RECEIVED' }));
    };
    
    // Test opponent_answered event
    const handleOpponentAnswered = (data: any) => {
      addLog(`✅ Received opponent_answered: ${data.questionIndex}`);
      setTestResults(prev => ({ ...prev, opponentAnswered: 'RECEIVED' }));
    };
    
    socket.on('match_started', handleMatchStarted);
    socket.on('next_question', handleNextQuestion);
    socket.on('opponent_answered', handleOpponentAnswered);
    
    // Clean up after 30 seconds
    setTimeout(() => {
      socket.off('match_started', handleMatchStarted);
      socket.off('next_question', handleNextQuestion);
      socket.off('opponent_answered', handleOpponentAnswered);
      addLog('🧹 Battle event listeners cleaned up');
    }, 30000);
    
    setTestResults(prev => ({ 
      ...prev, 
      matchStarted: 'LISTENING',
      nextQuestion: 'LISTENING',
      opponentAnswered: 'LISTENING'
    }));
  };

  const clearLogs = () => {
    setLogs([]);
    setTestResults({});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
      case 'RECEIVED':
        return 'text-green-600';
      case 'FAILED':
      case 'TIMEOUT':
      case 'NO_TOKEN':
        return 'text-red-600';
      case 'LISTENING':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Socket Debug Console</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-semibold mb-2">Connection Status</h3>
                <div className="space-y-1 text-sm">
                  <div>Environment: <span className={isReactNative ? 'text-blue-600' : 'text-gray-600'}>{isReactNative ? 'React Native' : 'Web Browser'}</span></div>
                  <div>Connected: <span className={isConnected ? 'text-green-600' : 'text-red-600'}>{isConnected ? 'Yes' : 'No'}</span></div>
                  <div>Socket ID: <span className="text-gray-600">{socket?.id || 'Not connected'}</span></div>
                  {error && <div>Error: <span className="text-red-600">{error}</span></div>}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Test Results</h3>
                <div className="space-y-1 text-sm">
                  <div>Ping: <span className={getStatusColor(testResults.ping)}>{testResults.ping || 'NOT_TESTED'}</span></div>
                  <div>Auth: <span className={getStatusColor(testResults.auth)}>{testResults.auth || 'NOT_TESTED'}</span></div>
                  <div>Match Started: <span className={getStatusColor(testResults.matchStarted)}>{testResults.matchStarted || 'NOT_TESTED'}</span></div>
                  <div>Next Question: <span className={getStatusColor(testResults.nextQuestion)}>{testResults.nextQuestion || 'NOT_TESTED'}</span></div>
                  <div>Opponent Answered: <span className={getStatusColor(testResults.opponentAnswered)}>{testResults.opponentAnswered || 'NOT_TESTED'}</span></div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Button onClick={testPing} disabled={!isConnected}>
                Test Ping
              </Button>
              <Button onClick={testAuthentication} disabled={!isConnected}>
                Test Auth
              </Button>
                             <Button onClick={testBattleEvents} disabled={!isConnected}>
                 Test Battle Events
               </Button>
               <Button onClick={testBattleQuizEvents} disabled={!isConnected}>
                 Test Battle Quiz Events
               </Button>
              <Button onClick={clearLogs} variant="outline">
                Clear Logs
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debug Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet. Run some tests to see activity.</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 