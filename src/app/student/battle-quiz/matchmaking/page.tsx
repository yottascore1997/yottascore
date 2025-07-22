"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Clock, 
  Zap, 
  ArrowLeft, 
  Target, 
  Gamepad2,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  profilePhoto?: string;
  level: number;
}

interface MatchmakingState {
  status: 'searching' | 'found' | 'starting' | 'error';
  timeElapsed: number;
  opponent?: User;
  category?: string;
  estimatedWait: number;
}

export default function MatchmakingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { socket, isConnected } = useSocket();
  
  const [matchmakingState, setMatchmakingState] = useState<MatchmakingState>({
    status: 'searching',
    timeElapsed: 0,
    estimatedWait: 30
  });
  
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const searchStartTime = useRef<number>(Date.now());
  const hasStartedSearch = useRef(false);

  const category = searchParams.get('category');
  const mode = searchParams.get('mode');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (!socket || !isConnected || hasStartedSearch.current) return;

    console.log('Starting matchmaking...', { category, mode });
    hasStartedSearch.current = true;
    searchStartTime.current = Date.now();

    // Ensure user is registered first
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.userId) {
          socket.emit('register_user', payload.userId);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }

    // Start the search timer
    timerRef.current = setInterval(() => {
      setMatchmakingState(prev => ({
        ...prev,
        timeElapsed: Math.floor((Date.now() - searchStartTime.current) / 1000)
      }));
    }, 1000);

    // Emit matchmaking request
    socket.emit('join_matchmaking', {
      categoryId: category,
      mode: mode || 'quick'
    });

    // Listen for matchmaking events
    socket.on('matchmaking_update', (data: { 
      status: string; 
      estimatedWait?: number; 
      message?: string 
    }) => {
      console.log('Matchmaking update:', data);
      setMatchmakingState(prev => ({
        ...prev,
        status: data.status as any,
        estimatedWait: data.estimatedWait || prev.estimatedWait
      }));
    });

    socket.on('opponent_found', (data: { opponent: User; category?: string }) => {
      console.log('Opponent found:', data);
      setMatchmakingState(prev => ({
        ...prev,
        status: 'found',
        opponent: data.opponent,
        category: data.category
      }));
    });

    socket.on('match_starting', (data: { countdown: number }) => {
      console.log('Match starting:', data);
      setMatchmakingState(prev => ({
        ...prev,
        status: 'starting'
      }));
    });

    socket.on('match_ready', (data: { matchId: string; roomCode?: string }) => {
      console.log('Match ready:', data);
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Redirect to the battle
      if (data.roomCode) {
        router.push(`/student/battle-quiz/room/${data.roomCode}`);
      } else {
        router.push(`/student/battle-quiz/battle/${data.matchId}`);
      }
    });

    socket.on('matchmaking_error', (data: { message: string }) => {
      console.error('Matchmaking error:', data);
      setError(data.message);
      setMatchmakingState(prev => ({ ...prev, status: 'error' }));
    });

    socket.on('opponent_cancelled', () => {
      console.log('Opponent cancelled matchmaking');
      setMatchmakingState(prev => ({ ...prev, status: 'searching' }));
    });

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Clean up socket listeners
      socket.off('matchmaking_update');
      socket.off('opponent_found');
      socket.off('match_starting');
      socket.off('match_ready');
      socket.off('matchmaking_error');
      socket.off('opponent_cancelled');
    };
  }, [socket, isConnected, category, mode, router]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/student/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleCancelSearch = () => {
    if (socket && isConnected) {
      socket.emit('cancel_matchmaking');
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    router.push('/student/battle-quiz');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryName = (categoryId?: string | null) => {
    if (!categoryId) return 'Any Category';
    // You can add a mapping here or fetch categories
    return categoryId;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-red-600">Matchmaking Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/student/battle-quiz')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-200/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleCancelSearch}
                className="p-2 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Finding Opponent</h1>
                <p className="text-gray-600">Looking for the perfect match...</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500">Time Elapsed</div>
              <div className="text-2xl font-bold text-purple-600">
                {formatTime(matchmakingState.timeElapsed)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center">
          
          {/* Search Animation */}
          {matchmakingState.status === 'searching' && (
            <div className="mb-8">
              <div className="relative w-32 h-32 mx-auto mb-6">
                {/* Outer ring */}
                <div className="absolute inset-0 border-4 border-purple-200 rounded-full animate-pulse"></div>
                {/* Inner ring */}
                <div className="absolute inset-4 border-4 border-purple-400 rounded-full animate-ping"></div>
                {/* Center icon */}
                <div className="absolute inset-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Searching for Opponent</h2>
              <p className="text-gray-600 mb-6">
                Looking for players in {getCategoryName(category)} category...
              </p>
              
              <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md mx-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Estimated Wait</span>
                    <span className="font-semibold text-green-600">~{matchmakingState.estimatedWait}s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Category</span>
                    <span className="font-semibold">{getCategoryName(category)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Mode</span>
                    <span className="font-semibold capitalize">{mode || 'quick'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Opponent Found */}
          {matchmakingState.status === 'found' && matchmakingState.opponent && (
            <div className="mb-8">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-16 h-16 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Opponent Found!</h2>
              <p className="text-gray-600 mb-6">Preparing your battle...</p>
              
              <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md mx-auto">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {matchmakingState.opponent.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-xl font-semibold">{matchmakingState.opponent.name}</h3>
                    <p className="text-gray-600">Level {matchmakingState.opponent.level}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Match Starting */}
          {matchmakingState.status === 'starting' && (
            <div className="mb-8">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center animate-pulse">
                <Gamepad2 className="w-16 h-16 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Battle Starting!</h2>
              <p className="text-gray-600 mb-6">Get ready to compete...</p>
              
              <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md mx-auto">
                <div className="text-center">
                  <div className="text-6xl font-bold text-purple-600 mb-4">3</div>
                  <p className="text-gray-600">Battle begins in...</p>
                </div>
              </div>
            </div>
          )}

          {/* Cancel Button */}
          {matchmakingState.status === 'searching' && (
            <Button
              onClick={handleCancelSearch}
              variant="outline"
              className="px-8 py-3"
            >
              Cancel Search
            </Button>
          )}

          {/* Tips */}
          <div className="mt-12 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-4">Tips for Better Matchmaking</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <h4 className="font-semibold mb-1">Quick Matches</h4>
                <p className="text-sm text-gray-600">Choose "Any Category" for faster matching</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-semibold mb-1">Specific Categories</h4>
                <p className="text-sm text-gray-600">Select a category for focused competition</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <Clock className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h4 className="font-semibold mb-1">Peak Hours</h4>
                <p className="text-sm text-gray-600">Evening hours have more active players</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 