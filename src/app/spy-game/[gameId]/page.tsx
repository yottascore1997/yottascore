'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'react-hot-toast';
import ChatInterface from './chat-interface';

interface Player {
  userId: string;
  socketId: string;
  isHost: boolean;
  name: string;
  isSpy?: boolean;
}

interface SpyGame {
  id: string;
  roomCode: string;
  hostId: string;
  maxPlayers: number;
  wordPack: string;
  players: Player[];
  status: string;
  currentPhase: 'LOBBY' | 'WORD_ASSIGNMENT' | 'DESCRIBING' | 'VOTING' | 'REVEAL';
  currentTurn: number;
}

export default function SpyGameRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const searchParams = new URLSearchParams(window.location.search);
  const roomCodeFromUrl = searchParams.get('roomCode');
  
  const [user, setUser] = useState<any>(null);
  const [game, setGame] = useState<SpyGame | null>(null);
  const [myWord, setMyWord] = useState('');
  const [isSpy, setIsSpy] = useState(false);
  const [description, setDescription] = useState('');
  const [descriptions, setDescriptions] = useState<{[key: string]: string}>({});
  const [votes, setVotes] = useState<{[key: string]: string}>({});
  const [gameResults, setGameResults] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const gameId = params.gameId as string;

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (user && gameId && !game) {
      fetchGameData();
    }
  }, [user, gameId, game]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Socket event listeners
    socket.on('spy_game_started', (data: { word: string; isSpy: boolean; gameData: SpyGame }) => {
      setMyWord(data.word);
      setIsSpy(data.isSpy);
      const updatedGameData = {
        ...data.gameData,
        currentPhase: 'WORD_ASSIGNMENT' as const
      };
      setGame(updatedGameData);
      toast.success('Game started! Check your word.');
    });

    socket.on('spy_game_started_broadcast', (data: { gameData: SpyGame; playerWords: Array<{ userId: string; word: string; isSpy: boolean }> }) => {
      const currentUserWord = data.playerWords.find(pw => pw.userId === user?.id);
      if (currentUserWord) {
        setMyWord(currentUserWord.word);
        setIsSpy(currentUserWord.isSpy);
        const updatedGameData = {
          ...data.gameData,
          currentPhase: 'WORD_ASSIGNMENT' as const
        };
        setGame(updatedGameData);
        toast.success('Game started! Check your word.');
      }
    });

    socket.on('player_joined_spy_game', (data: { player: any; game: SpyGame }) => {
      setGame(data.game);
      toast.success(`${data.player.name} joined the game!`);
    });

    socket.on('player_left_spy_game', (data: { player: any; game: SpyGame }) => {
      setGame(data.game);
      toast(`${data.player.name} left the game.`);
    });

    socket.on('description_submitted', (data: { playerId: string; description: string; currentTurn: number }) => {
      setDescriptions(prev => ({
        ...prev,
        [data.playerId]: data.description
      }));
      
      if (data.currentTurn >= game?.players.length!) {
        toast.success('All descriptions submitted! Time to vote.');
      }
    });

    socket.on('description_phase_started', (data: { gameId: string; currentTurn: number; timeLeft: number }) => {
      setGame(prev => prev ? { ...prev, currentPhase: 'DESCRIBING' } : null);
      setCurrentTurn(data.currentTurn);
      setTimeLeft(data.timeLeft);
      setIsMyTurn(data.currentTurn === game?.players.findIndex(p => p.userId === user?.id));
      toast.success('Description phase started!');
    });

    socket.on('turn_started', (data: { gameId: string; currentTurn: number; timeLeft: number }) => {
      setCurrentTurn(data.currentTurn);
      setTimeLeft(data.timeLeft);
      setIsMyTurn(data.currentTurn === game?.players.findIndex(p => p.userId === user?.id));
      
      if (data.currentTurn === game?.players.findIndex(p => p.userId === user?.id)) {
        toast.success('Your turn to describe!');
      }
    });

    socket.on('turn_ended', (data: { gameId: string; nextTurn: number }) => {
      setCurrentTurn(data.nextTurn);
      setIsMyTurn(false);
      setTimeLeft(20);
    });

    socket.on('timer_update', (data: { gameId: string; currentTurn: number; timeLeft: number }) => {
      setTimeLeft(data.timeLeft);
      setCurrentTurn(data.currentTurn);
      setIsMyTurn(data.currentTurn === game?.players.findIndex(p => p.userId === user?.id));
    });

    socket.on('voting_started', (data: { players: Player[] }) => {
      setGame(prev => prev ? { ...prev, currentPhase: 'VOTING' } : null);
      toast.success('Voting phase started!');
    });

    socket.on('vote_submitted', (data: { voterId: string; votedForId: string }) => {
      setVotes(prev => ({
        ...prev,
        [data.voterId]: data.votedForId
      }));
    });

    socket.on('spy_game_ended', (data: any) => {
      setGameResults(data);
      setGame(prev => prev ? { ...prev, currentPhase: 'REVEAL' } : null);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    });

    socket.on('spy_game_error', (data: { message: string }) => {
      toast.error(data.message);
    });

    socket.on('spy_game_data_received', (data: { gameId: string; game: SpyGame }) => {
      setGame(data.game);
      
      if (data.game.currentPhase === 'WORD_ASSIGNMENT' && !myWord) {
        fetchPlayerWord(data.game.id);
      }
      
      toast.success('Game data loaded successfully!');
    });

    return () => {
      socket.off('spy_game_started');
      socket.off('spy_game_started_broadcast');
      socket.off('player_joined_spy_game');
      socket.off('player_left_spy_game');
      socket.off('description_submitted');
      socket.off('voting_started');
      socket.off('vote_submitted');
      socket.off('spy_game_ended');
      socket.off('spy_game_error');
      socket.off('spy_game_data_received');
    };
  }, [socket, isConnected, user?.id]);

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
      console.error('Error fetching user profile:', error);
      router.push('/auth/login');
    }
  };

  const fetchPlayerWord = async (gameId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/student/spy-game/${gameId}/word`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMyWord(data.word);
        setIsSpy(data.isSpy);
        toast.success('Word loaded successfully!');
      }
    } catch (error) {
      console.error('Error fetching player word:', error);
    }
  };

  const fetchGameData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const storedGameData = sessionStorage.getItem('spyGameData');
      if (storedGameData) {
        try {
          const parsedGameData = JSON.parse(storedGameData);
          if (parsedGameData.id === gameId) {
            setGame(parsedGameData);
            sessionStorage.removeItem('spyGameData');
            return;
          }
        } catch (error) {
          sessionStorage.removeItem('spyGameData');
        }
      }

      if (roomCodeFromUrl && socket && isConnected) {
        socket.emit('get_spy_game_data', {
          roomCode: roomCodeFromUrl,
          userId: user?.id
        });
      }
    } catch (error) {
      console.error('Error fetching game data:', error);
    }
  };

  const startGame = () => {
    if (!socket || !game) return;
    socket.emit('start_spy_game', { gameId: game.id });
  };

  const submitDescription = (desc?: string) => {
    if (!socket || !game) return;
    
    const finalDescription = desc || description;
    if (!finalDescription.trim()) {
      toast.error('Please enter a description');
      return;
    }

    socket.emit('submit_description', {
      gameId: game.id,
      description: finalDescription.trim()
    });

    setDescription('');
    setTimeLeft(0);
  };

  const submitVote = (votedForId: string) => {
    if (!socket || !game) return;
    
    socket.emit('submit_vote', {
      gameId: game.id,
      votedForId
    });

    toast.success('Vote submitted!');
  };

  const copyRoomCode = () => {
    if (game?.roomCode) {
      navigator.clipboard.writeText(game.roomCode);
      setCopied(true);
      toast.success('Room code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const leaveGame = () => {
    router.push('/spy-game');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <ChatInterface
        game={game}
        user={user}
        socket={socket}
        isConnected={isConnected}
        currentPhase={game.currentPhase}
        myWord={myWord}
        isSpy={isSpy}
        currentTurn={currentTurn}
        timeLeft={timeLeft}
        isMyTurn={isMyTurn}
      />
    </div>
  );
} 