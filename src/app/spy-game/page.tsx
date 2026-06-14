'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Gamepad2, 
  Crown, 
  Eye, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  Play,
  Settings,
  Trophy
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SpyGame {
  id: string;
  roomCode: string;
  hostId: string;
  maxPlayers: number;
  wordPack: string;
  players: Array<{
    userId: string;
    socketId: string;
    isHost: boolean;
    name: string;
  }>;
  status: string;
  currentPhase: string;
  currentTurn: number;
}

export default function SpyGamePage() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [user, setUser] = useState<any>(null);
  const [game, setGame] = useState<SpyGame | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [wordPack, setWordPack] = useState('default');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const createTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const joinTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
if (!socket || !isConnected) {
return;
    }

    // Spy Game Socket Events
    socket.on('spy_game_created', (data: { gameId: string; roomCode: string; game: SpyGame }) => {
// Clear the timeout
      if (createTimeoutRef.current) {
        clearTimeout(createTimeoutRef.current);
        createTimeoutRef.current = null;
      }
      
setGame(data.game);
setIsCreating(false);
toast.success(`Game created! Room code: ${data.roomCode}`);
// Pass the room code as a query parameter
      router.push(`/spy-game/${data.gameId}?roomCode=${data.roomCode}`);
});

    socket.on('spy_game_error', (data: { message: string }) => {
// Clear the timeout
      if (createTimeoutRef.current) {
        clearTimeout(createTimeoutRef.current);
        createTimeoutRef.current = null;
      }
      
      toast.error(data.message);
      setIsCreating(false);
      setIsJoining(false);
    });

    socket.on('player_joined_spy_game', (data: { player: any; game: SpyGame }) => {
setGame(data.game);
      toast.success(`${data.player.name} joined the game!`);
    });

    socket.on('spy_game_joined', (data: { gameId: string; game: SpyGame }) => {
// Clear the join timeout
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
        joinTimeoutRef.current = null;
      }
      
      setIsJoining(false);
      setGame(data.game);
      toast.success(`Successfully joined game! Room code: ${data.game.roomCode}`);
alert(`Joining game: ${data.gameId} with room code: ${data.game.roomCode}`);
      // Store the game data in sessionStorage so the game room page can access it
      sessionStorage.setItem('spyGameData', JSON.stringify(data.game));
      router.push(`/spy-game/${data.gameId}?roomCode=${data.game.roomCode}`);
});

    socket.on('spy_game_join_error', (data: { message: string }) => {
// Clear the join timeout
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
        joinTimeoutRef.current = null;
      }
      
      setIsJoining(false);
      toast.error(data.message);
    });

    // Test socket connection
socket.emit('ping');
    
    socket.on('pong', () => {
});

    return () => {
// Clear any pending timeouts
      if (createTimeoutRef.current) {
        clearTimeout(createTimeoutRef.current);
      }
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
      }
      
      socket.off('spy_game_created');
      socket.off('spy_game_error');
      socket.off('player_joined_spy_game');
      socket.off('spy_game_joined');
      socket.off('spy_game_join_error');
      socket.off('pong');
    };
  }, [socket, isConnected, router]);

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
        const userData = await response.json();
        setUser(userData);
      } else {
        router.push('/auth/login');
      }
    } catch (error) {
router.push('/auth/login');
    }
  };

  const createGame = () => {
if (!socket) {
toast.error('Socket connection not available');
      return;
    }
    
    if (!isConnected) {
toast.error('Not connected to server. Please refresh the page.');
      return;
    }
    
    if (!user) {
toast.error('User not authenticated');
      return;
    }

setIsCreating(true);
    
    // Set a timeout to prevent stuck loading state
    const timeout = setTimeout(() => {
// Only reset if we're still creating (game wasn't created successfully)
      if (isCreating) {
        setIsCreating(false);
        toast.error('Game creation timed out. Please try again.');
      }
    }, 10000); // 10 seconds timeout
    
    createTimeoutRef.current = timeout;
    
    // Emit the create game event
socket.emit('create_spy_game', {
      userId: user.id,
      maxPlayers,
      wordPack
    });
    
};

  const joinGame = () => {
    if (!socket || !isConnected || !user) {
      toast.error('Not connected to server');
      return;
    }

    if (!roomCode.trim()) {
      toast.error('Please enter a room code');
      return;
    }

    setIsJoining(true);
    
    // Set a timeout for join operation
    const timeout = setTimeout(() => {
setIsJoining(false);
      toast.error('Join game timed out. Please try again.');
    }, 10000); // 10 seconds timeout
    
    joinTimeoutRef.current = timeout;
    
    socket.emit('join_spy_game', {
      userId: user.id,
      roomCode: roomCode.trim().toUpperCase()
    });
  };

  const copyRoomCode = () => {
    if (game?.roomCode) {
      navigator.clipboard.writeText(game.roomCode);
      setCopied(true);
      toast.success('Room code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const wordPacks = [
    { id: 'default', name: 'Default', description: 'General words' },
    { id: 'funny', name: 'Funny', description: 'Humorous words' },
    { id: 'hard', name: 'Hard', description: 'Challenging words' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Eye className="w-12 h-12 text-yellow-400 mr-3" />
            <h1 className="text-5xl font-bold text-white">Spy Game</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Find the spy among your friends! One player gets a different word and must blend in without being caught.
          </p>
        </div>

        {/* Debug Info */}
        <div className="text-center mb-8 p-4 bg-white/10 rounded-lg">
          <p className="text-white mb-2">Debug Info:</p>
          <p className="text-gray-300 text-sm">Socket Connected: {isConnected ? '✅ Yes' : '❌ No'}</p>
          <p className="text-gray-300 text-sm">User: {user ? '✅ Loaded' : '❌ Not Loaded'}</p>
          <p className="text-gray-300 text-sm">User ID: {user?.id || 'Not Available'}</p>
        </div>

        {/* Test Button */}
        <div className="text-center mb-8">
          <button
            onClick={() => {
alert(`Socket: ${!!socket}, Connected: ${isConnected}, User: ${!!user}`);
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg mr-4"
          >
            🧪 Test Debug Info
          </button>
          
          <button
            onClick={() => {
if (!socket) {
                alert('❌ Socket not available');
                return;
              }
              if (!isConnected) {
                alert('❌ Socket not connected');
                return;
              }
              if (!user) {
                alert('❌ User not available');
                return;
              }
              
socket.emit('create_spy_game', {
                userId: user.id,
                maxPlayers: 6,
                wordPack: 'default'
              });
              alert('📤 create_spy_game event sent! Check console for response.');
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            🎮 Test Create Game
          </button>
        </div>

        {/* Connection Status */}
        <div className="flex justify-center mb-8">
          <Badge variant={isConnected ? "default" : "destructive"} className="text-lg px-4 py-2">
            {isConnected ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Connected
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                Disconnected
              </>
            )}
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Create Game */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Crown className="w-6 h-6 mr-2 text-yellow-400" />
                Create New Game
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Max Players */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Players
                </label>
                <div className="flex gap-2">
                  {[2, 4, 5, 6, 8].map(num => (
                    <Button
                      key={num}
                      variant={maxPlayers === num ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMaxPlayers(num)}
                      className="flex-1"
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Word Pack */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Word Pack
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {wordPacks.map(pack => (
                    <Button
                      key={pack.id}
                      variant={wordPack === pack.id ? "default" : "outline"}
                      onClick={() => setWordPack(pack.id)}
                      className="justify-start"
                    >
                      <div className="text-left">
                        <div className="font-medium">{pack.name}</div>
                        <div className="text-xs opacity-75">{pack.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <button
                onClick={createGame}
                disabled={!isConnected || isCreating}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2 inline-block" />
                    Create Game
                  </>
                )}
              </button>
            </CardContent>
          </Card>

          {/* Join Game */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Users className="w-6 h-6 mr-2 text-green-400" />
                Join Game
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Room Code
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter room code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-gray-400"
                    maxLength={6}
                  />
                  <Button
                    onClick={joinGame}
                    disabled={!isConnected || isJoining || !roomCode.trim()}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {isJoining ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Joining...
                      </>
                    ) : (
                      <>
                        <Gamepad2 className="w-4 h-4 mr-2" />
                        Join
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-300 text-sm mb-4">
                  Ask your friend for the room code to join their game
                </p>
                <div className="bg-white/10 rounded-lg p-4 text-left">
                  <h4 className="text-white font-medium mb-2">How to join a game:</h4>
                  <ol className="text-gray-300 text-sm space-y-1">
                    <li>1. Ask the host for the 6-digit room code</li>
                    <li>2. Enter the room code in the input field above</li>
                    <li>3. Click "Join" to enter the game lobby</li>
                    <li>4. Wait for the host to start the game</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Game Rules */}
        <Card className="mt-12 bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Trophy className="w-6 h-6 mr-2 text-yellow-400" />
              How to Play
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-gray-300">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Get Your Word</h3>
                <p className="text-sm">Most players get the same word, but one spy gets a different word</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Describe Your Word</h3>
                <p className="text-sm">Take turns describing your word without saying it directly</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Vote for the Spy</h3>
                <p className="text-sm">Vote for who you think is the spy. Team wins if spy is caught!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 