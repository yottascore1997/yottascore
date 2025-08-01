"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Clock, 
  Copy, 
  Share2, 
  ArrowLeft, 
  Gamepad2,
  CheckCircle,
  AlertCircle,
  Crown,
  Trophy
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  profilePhoto?: string;
  level: number;
  isHost: boolean;
}

interface RoomState {
  roomCode: string;
  host: User | null;
  players: User[];
  maxPlayers: number;
  status: 'waiting' | 'starting' | 'playing' | 'finished';
  countdown: number;
  category?: string;
  timePerQuestion: number;
  questionCount: number;
}

export default function PrivateRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  
  const roomCode = params?.roomCode as string;
  
  const [roomState, setRoomState] = useState<RoomState>({
    roomCode: roomCode,
    host: null,
    players: [],
    maxPlayers: 2,
    status: 'waiting',
    countdown: 0,
    timePerQuestion: 15,
    questionCount: 10
  });
  
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const hasJoinedRoom = useRef(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Debug room state changes
  useEffect(() => {
    console.log('🔄 Room state changed:', roomState);
    console.log('   - Players:', roomState.players);
    console.log('   - Player count:', roomState.players.length);
    console.log('   - Max players:', roomState.maxPlayers);
    console.log('   - Status:', roomState.status);
  }, [roomState]);

  // Debug user changes
  useEffect(() => {
    console.log('👤 User state changed:', user);
    if (user) {
      console.log('   - User ID:', user.id);
      console.log('   - User name:', user.name);
      console.log('   - User isHost:', user.isHost);
      
      // Reset hasJoinedRoom flag when user is loaded so we can join room
      if (hasJoinedRoom.current) {
        console.log('🔄 Resetting hasJoinedRoom flag for user:', user.id);
        hasJoinedRoom.current = false;
      }
    }
  }, [user]);

  useEffect(() => {
    console.log('🔍 useEffect triggered:');
    console.log('   - Socket exists:', !!socket);
    console.log('   - Is connected:', isConnected);
    console.log('   - Has joined room:', hasJoinedRoom.current);
    console.log('   - User exists:', !!user);
    console.log('   - User data:', user);
    
    if (!socket || !isConnected || hasJoinedRoom.current || !user) {
      console.log('❌ Cannot join room - conditions not met');
      return;
    }

    console.log('✅ Joining private room:', roomCode);
    console.log('User data:', user);
    hasJoinedRoom.current = true;

    // Join the private room
    console.log('📤 Emitting join_private_room event');
    socket.emit('join_private_room', { 
      roomCode,
      userId: user.id,
      quizData: {
        categoryId: roomState.category,
        questionCount: roomState.questionCount,
        timePerQuestion: roomState.timePerQuestion
      }
    });
    console.log('📤 join_private_room event emitted');

    // Listen for room events
    socket.on('room_joined', (data: { 
      room: RoomState; 
      user: User; 
      isHost: boolean 
    }) => {
      console.log('🎯 Room joined event received:');
      console.log('   - Full data:', data);
      console.log('   - Room state:', data.room);
      console.log('   - Players in room:', data.room.players);
      console.log('   - Player count:', data.room.players.length);
      console.log('   - Max players:', data.room.maxPlayers);
      console.log('   - User:', data.user);
      console.log('   - Is host:', data.isHost);
      
      setRoomState(data.room);
      
      // Update user with isHost value from server
      const updatedUser = { 
        ...data.user, 
        isHost: data.isHost 
      };
      console.log('🔄 Updating user with isHost:', updatedUser);
      setUser(updatedUser);
      
      console.log('✅ Room state updated');
    });

    socket.on('player_joined', (data: { player: User }) => {
      console.log('Player joined:', data);
      setRoomState(prev => ({
        ...prev,
        players: [...prev.players, data.player]
      }));
    });

    socket.on('room_updated', (data: { room: RoomState }) => {
      console.log('Room updated:', data);
      setRoomState(data.room);
    });

    socket.on('player_left', (data: { playerId: string }) => {
      console.log('Player left:', data);
      setRoomState(prev => ({
        ...prev,
        players: prev.players.filter(p => p.id !== data.playerId)
      }));
    });

    socket.on('room_starting', (data: { countdown: number }) => {
      console.log('Room starting:', data);
      setRoomState(prev => ({
        ...prev,
        status: 'starting',
        countdown: data.countdown
      }));

      // Start countdown
      countdownRef.current = setInterval(() => {
        setRoomState(prev => {
          if (prev.countdown <= 1) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
              countdownRef.current = null;
            }
            return { ...prev, status: 'playing', countdown: 0 };
          }
          return { ...prev, countdown: prev.countdown - 1 };
        });
      }, 1000);
    });

    socket.on('game_started', (data: { matchId: string }) => {
      console.log('🎮 Game started event received:', data);
      console.log('   - Match ID:', data.matchId);
      console.log('   - Redirecting to battle page...');
      
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      
      router.push(`/student/battle-quiz/battle/${data.matchId}`);
    });

    socket.on('room_error', (data: { message: string }) => {
      console.error('Room error:', data);
      setError(data.message);
    });

    socket.on('room_not_found', () => {
      console.error('Room not found:', roomCode);
      setError('Room not found. Please check the room code.');
    });

    socket.on('room_full', () => {
      console.error('Room is full:', roomCode);
      setError('Room is full. Maximum 2 players allowed.');
    });

    // Add connection error handling
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Connection error. Please refresh the page.');
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        setError('Disconnected from server. Please refresh the page.');
      }
    });

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      
      // Clean up socket listeners
      socket.off('room_joined');
      socket.off('player_joined');
      socket.off('room_updated');
      socket.off('player_left');
      socket.off('room_starting');
      socket.off('game_started');
      socket.off('room_error');
      socket.off('room_not_found');
      socket.off('room_full');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('room_full');
    };
  }, [socket, isConnected, roomCode, router, user]);

  const fetchUserProfile = async () => {
    console.log('🔍 Fetching user profile...');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No token found, redirecting to login');
        router.push('/auth/login');
        return;
      }

      console.log('📤 Fetching profile from API...');
      const response = await fetch('/api/student/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ User profile loaded:', data);
        setUser(data);
      } else {
        console.log('❌ Failed to fetch user profile:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
    }
  };

  const handleStartGame = () => {
    console.log('🎮 Start game button clicked');
    console.log('   - Socket connected:', isConnected);
    console.log('   - User is host:', user?.isHost);
    console.log('   - Room code:', roomCode);
    
    if (socket && isConnected && user?.isHost) {
      console.log('✅ Emitting start_private_game event');
      socket.emit('start_private_game', { roomCode });
    } else {
      console.log('❌ Cannot start game:');
      console.log('   - Socket exists:', !!socket);
      console.log('   - Is connected:', isConnected);
      console.log('   - User is host:', user?.isHost);
    }
  };

  const handleLeaveRoom = () => {
    if (socket && isConnected) {
      socket.emit('leave_private_room', { roomCode });
    }
    router.push('/student/battle-quiz');
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy room code:', error);
    }
  };

  const shareRoom = async () => {
    const shareData = {
      title: 'Join my Battle Quiz Room!',
      text: `Join my private battle quiz room: ${roomCode}`,
      url: `${window.location.origin}/student/battle-quiz/room/${roomCode}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        copyRoomCode();
      }
    } catch (error) {
      console.error('Error sharing:', error);
      copyRoomCode();
    }
  };

  const getCategoryName = (categoryId?: string) => {
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
          <h1 className="text-2xl font-bold mb-4 text-red-600">Room Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={() => router.push('/student/battle-quiz')}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
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
                onClick={handleLeaveRoom}
                className="p-2 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Private Room</h1>
                <p className="text-gray-600">Room Code: {roomCode}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={copyRoomCode}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy Code'}
              </Button>
              <Button
                onClick={shareRoom}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Room Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{roomState.players.length}</div>
              <div className="text-sm text-gray-600">Players</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{roomState.timePerQuestion}s</div>
              <div className="text-sm text-gray-600">Per Question</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{roomState.questionCount}</div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Category:</span>
              <span className="font-semibold">{getCategoryName(roomState.category)}</span>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Players</h2>
          
          <div className="space-y-4">
            {roomState.players.map((player, index) => (
              <div key={player.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{player.name}</span>
                      {player.isHost && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Level {player.level}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Player {index + 1}</div>
                  {player.isHost && (
                    <div className="text-xs text-yellow-600 font-medium">Host</div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Empty slots */}
            {Array.from({ length: roomState.maxPlayers - roomState.players.length }).map((_, index) => (
              <div key={`empty-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-400">Waiting for player...</div>
                    <div className="text-sm text-gray-400">Empty slot</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Controls */}
        {roomState.status === 'waiting' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {(() => {
              console.log('🎮 Game Controls Debug:');
              console.log('   - User:', user);
              console.log('   - User isHost:', user?.isHost);
              console.log('   - Room host:', roomState.host);
              console.log('   - Room creator ID:', roomState.host?.id);
              console.log('   - Current user ID:', user?.id);
              console.log('   - Players:', roomState.players);
              
              return user?.isHost ? (
                <div className="text-center">
                  <Button
                    onClick={handleStartGame}
                    disabled={roomState.players.length < 2}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3"
                  >
                    <Gamepad2 className="w-5 h-5 mr-2" />
                    Start Game
                  </Button>
                  {roomState.players.length < 2 && (
                    <p className="text-gray-600 mt-2">Need at least 2 players to start</p>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 text-gray-600">
                    <Clock className="w-5 h-5" />
                    <span>Waiting for host to start the game...</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Countdown */}
        {roomState.status === 'starting' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-6xl font-bold text-purple-600 mb-4">
              {roomState.countdown}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Game Starting!</h2>
            <p className="text-gray-600">Get ready to battle...</p>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">How to Play</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Answer questions within {roomState.timePerQuestion} seconds</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Faster answers earn more points</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Winner takes the prize money</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm">Earn experience and climb levels</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 