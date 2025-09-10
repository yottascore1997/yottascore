'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, MessageSquare, Users, Crown, Eye, Play, Copy, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
// Daily integration toggle (set NEXT_PUBLIC_USE_DAILY=true in env to enable)
const USE_DAILY = process.env.NEXT_PUBLIC_USE_DAILY === 'true';
import { toast } from 'react-hot-toast';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'chat' | 'description' | 'system';
}

interface Player {
  userId: string;
  name: string;
  isHost: boolean;
}

interface ChatInterfaceProps {
  game: any;
  user: any;
  socket: any;
  isConnected: boolean;
  currentPhase: string;
  myWord?: string;
  isSpy?: boolean;
  currentTurn?: number;
  timeLeft?: number;
  isMyTurn?: boolean;
  results?: any;
}

export default function ChatInterface({
  game,
  user,
  socket,
  isConnected,
  currentPhase,
  myWord,
  isSpy,
  currentTurn = 0,
  timeLeft = 10,
  isMyTurn = false,
  results
}: ChatInterfaceProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [votingActive, setVotingActive] = useState(false);
  const [categoryVoteActive, setCategoryVoteActive] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<Array<{ id: string; name: string; description?: string }>>([]);
  const [myCategoryVote, setMyCategoryVote] = useState<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const remoteAudioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const makingOfferRef = useRef<Record<string, boolean>>({});
  const [revealData, setRevealData] = useState<any>(null);
  const prevIsMyTurnRef = useRef<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Daily voice call integration (web)
  const [dailyLib, setDailyLib] = useState<any>(null);
  const [dailyCall, setDailyCall] = useState<any>(null);
  const [isDailyJoined, setIsDailyJoined] = useState(false);

  const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  // Listen for chat messages
  useEffect(() => {
    if (!socket) return;

    socket.on('chat_message_received', (data: ChatMessage) => {
      const safeId = data.id || generateUniqueId();
      setChatMessages(prev => [...prev, { ...data, id: safeId }]);
    });

    socket.on('description_submitted', (data: { playerId: string; description: string; currentTurn: number }) => {
      // Add description as a special message type
      const descriptionMessage: ChatMessage = {
        id: generateUniqueId(),
        userId: data.playerId,
        userName: game.players.find((p: any) => p.userId === data.playerId)?.name || 'Unknown',
        message: data.description,
        timestamp: new Date(),
        type: 'description'
      };
      setChatMessages(prev => [...prev, descriptionMessage]);
    });

    socket.on('voting_started', (data: { players: any[] }) => {
      // Reset my vote at the start of voting
      setMyVote(null);
      setVotingActive(true);
      // Add voting phase message
      const systemMessage: ChatMessage = {
        id: generateUniqueId(),
        userId: 'system',
        userName: 'Game System',
        message: '🗳️ Voting phase started! Vote for who you think is the spy.',
        timestamp: new Date(),
        type: 'system'
      };
      setChatMessages(prev => [...prev, systemMessage]);
    });

    socket.on('vote_submitted', (data: { voterId: string; votedForId: string }) => {
      // If I was the voter, confirm selection and show toast
      if (data.voterId === user?.id) {
        setMyVote(data.votedForId);
        toast.success('Vote submitted!');
      }
    });

    // Category vote flow
    socket.on('category_vote_started', (data: { categories: Array<{ id: string; name: string; description?: string }>; timeoutSec?: number }) => {
      setCategoryOptions(data.categories || []);
      setCategoryVoteActive(true);
      setMyCategoryVote(null);
    });

    socket.on('category_vote_submitted', (data: { userId: string; categoryId: string }) => {
      if (data.userId === user?.id) {
        toast.success('Category vote submitted!');
      }
    });

    socket.on('category_vote_result', (data: { categoryId: string; categoryName: string }) => {
      setCategoryVoteActive(false);
      setMyCategoryVote(null);
      toast.success(`Category selected: ${data.categoryName}`);
    });

    socket.on('turn_ended', (data: { gameId: string; nextTurn: number }) => {
      if (data.nextTurn < game.players.length) {
        const nextPlayer = game.players[data.nextTurn];
        const systemMessage: ChatMessage = {
          id: generateUniqueId(),
          userId: 'system',
          userName: 'Game System',
          message: `⏰ Time's up! ${nextPlayer?.name || `Player ${data.nextTurn + 1}`}'s turn now`,
          timestamp: new Date(),
          type: 'system'
        };
        setChatMessages(prev => [...prev, systemMessage]);
      }
    });

    // Removed all system messages - no more Game System messages

    socket.on('user_typing', (data: { userId: string; userName: string }) => {
      setTypingUsers(prev => {
        if (!prev.includes(data.userName)) {
          return [...prev, data.userName];
        }
        return prev;
      });
    });

    socket.on('user_stopped_typing', (data: { userId: string; userName: string }) => {
      setTypingUsers(prev => prev.filter(name => name !== data.userName));
    });

    // Removed turn_ended system message

    socket.on('timer_update', (data: { gameId: string; currentTurn: number; timeLeft: number }) => {
      // Update timer without adding system messages
      // This is handled by the parent component
    });

    // Ensure local UI exits voting when next phase starts or game ends
    socket.on('description_phase_started', () => {
      setVotingActive(false);
      setMyVote(null);
    });
    socket.on('spy_game_ended', (data: any) => {
      setVotingActive(false);
      setRevealData(data);
      try {
        toast.success(data?.winner === 'VILLAGERS' ? 'Villagers Win! 🎉' : data?.winner === 'SPY' ? 'Spy Wins! 🕵️‍♂️' : 'Round Ended');
      } catch {}
    });

    return () => {
      socket.off('chat_message_received');
      socket.off('description_submitted');
      socket.off('voting_started');
      socket.off('vote_submitted');
      socket.off('category_vote_started');
      socket.off('category_vote_submitted');
      socket.off('category_vote_result');
      socket.off('description_phase_started');
      socket.off('spy_game_ended');
    };
  }, [socket, game, user?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !game) return;
    
    // Send message to all players (including self)
    socket.emit('send_chat_message', {
      gameId: game.id,
      message: newMessage.trim()
    });
    
    setNewMessage('');
  };

  const sendDescription = () => {
    if (!newMessage.trim() || !socket || !game) return;
    
    const messageData: ChatMessage = {
      id: generateUniqueId(),
      userId: user?.id || '',
      userName: user?.name || 'Unknown',
      message: newMessage.trim(),
      timestamp: new Date(),
      type: 'description'
    };
    
    socket.emit('submit_description', {
      gameId: game.id,
      description: newMessage.trim()
    });
    
    setChatMessages(prev => [...prev, messageData]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = () => {
    if (socket && game) {
      socket.emit('typing', {
        gameId: game.id,
        userId: user?.id,
        userName: user?.name
      });
    }
  };

  const handleStopTyping = () => {
    if (socket && game) {
      socket.emit('stop_typing', {
        gameId: game.id,
        userId: user?.id,
        userName: user?.name
      });
    }
  };

  const formatTime = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      return dateObj.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  useEffect(() => {
    if (!socket || !game?.id || USE_DAILY) return;

    const handlePeers = async ({ peers }: { peers: string[] }) => {
      for (const peerId of peers) {
        await createOffer(peerId);
      }
    };

    const handleUserJoined = async ({ socketId }: { socketId: string }) => {
      await createOffer(socketId);
    };

    const handleOffer = async ({ from, sdp }: { from: string; sdp: RTCSessionDescriptionInit }) => {
      const pc = await getPeer(from);
      try {
        // Simple glare handling: ignore offers when not stable
        if (pc.signalingState !== 'stable') {
          console.warn('Ignoring offer due to non-stable state:', pc.signalingState);
          return;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc_answer', { targetSocketId: from, sdp: answer });
      } catch (e) {
        console.error('Error handling offer:', e);
      }
    };

    const handleAnswer = async ({ from, sdp }: { from: string; sdp: RTCSessionDescriptionInit }) => {
      const pc = await getPeer(from);
      try {
        // Only accept answer if we have a local offer pending
        if (pc.signalingState !== 'have-local-offer') {
          console.warn('Ignoring answer in state:', pc.signalingState);
          return;
        }
        // Avoid setting the same remote description again
        if (pc.currentRemoteDescription && pc.currentRemoteDescription.sdp === (sdp as any).sdp) {
          return;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } catch (e) {
        console.error('Error handling answer:', e);
      }
    };

    const handleCandidate = async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      const pc = await getPeer(from);
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
    };

    const handleUserLeft = ({ socketId }: { socketId: string }) => {
      const pc = peersRef.current[socketId];
      if (pc) {
        pc.close();
        delete peersRef.current[socketId];
      }
      const audio = remoteAudioRefs.current[socketId];
      if (audio) {
        audio.srcObject = null;
        delete remoteAudioRefs.current[socketId];
      }
    };

    // Join signaling
    socket.emit('webrtc_join', { gameId: game.id });
    socket.on('webrtc_peers', handlePeers);
    socket.on('webrtc_user_joined', handleUserJoined);
    socket.on('webrtc_offer', handleOffer);
    socket.on('webrtc_answer', handleAnswer);
    socket.on('webrtc_ice_candidate', handleCandidate);
    socket.on('webrtc_user_left', handleUserLeft);

    return () => {
      socket.emit('webrtc_leave', { gameId: game.id });
      socket.off('webrtc_peers', handlePeers);
      socket.off('webrtc_user_joined', handleUserJoined);
      socket.off('webrtc_offer', handleOffer);
      socket.off('webrtc_answer', handleAnswer);
      socket.off('webrtc_ice_candidate', handleCandidate);
      socket.off('webrtc_user_left', handleUserLeft);
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
    };
  }, [socket, game?.id]);

  async function ensureLocalStream() {
    if (USE_DAILY) return null;
    if (!localStreamRef.current) {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Apply turn-based mic gating
      setMicEnabled(isMyTurn);
    }
    return localStreamRef.current;
  }

  function setMicEnabled(enabled: boolean) {
    if (USE_DAILY) {
      try { dailyCall?.setLocalAudio(!!enabled); } catch {}
      return;
    }
    const stream = localStreamRef.current;
    if (stream) { stream.getAudioTracks().forEach((t) => (t.enabled = enabled)); }
  }

  async function getPeer(peerId: string) {
    if (peersRef.current[peerId]) return peersRef.current[peerId];
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket?.emit('webrtc_ice_candidate', { targetSocketId: peerId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      let audio = remoteAudioRefs.current[peerId];
      if (!audio) {
        audio = document.createElement('audio');
        audio.autoplay = true;
        // playsInline for iOS
        audio.setAttribute('playsinline', 'true');
        remoteAudioRefs.current[peerId] = audio;
        // Attach to DOM in a hidden container
        const container = document.getElementById('webrtc-audio-sink');
        if (container) container.appendChild(audio);
      }
      audio.srcObject = e.streams[0];
      // Force play to bypass autoplay restrictions when possible
      const p = (audio as HTMLMediaElement).play?.();
      if (p && typeof p.then === 'function') {
        p.catch(() => {
          // Will play after a user gesture
        });
      }
    };

    // Add local track
    const stream = await ensureLocalStream();
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    peersRef.current[peerId] = pc;
    return pc;
  }

  async function createOffer(peerId: string) {
    const pc = await getPeer(peerId);
    // Only create offer when stable and not already making one
    if (pc.signalingState !== 'stable' || makingOfferRef.current[peerId]) {
      return;
    }
    makingOfferRef.current[peerId] = true;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket?.emit('webrtc_offer', { targetSocketId: peerId, sdp: offer });
    } finally {
      makingOfferRef.current[peerId] = false;
    }
  }

  // Daily: lazy-load SDK and create call object
  useEffect(() => {
    if (!USE_DAILY) return;
    let disposed = false;
    (async () => {
      try {
        const lib = await import(/* webpackIgnore: true */ '@daily-co/daily-js').catch(() => null as any);
        if (!lib) return;
        if (disposed) return;
        setDailyLib(lib);
        const call = lib.createCallObject({ audioSource: true, videoSource: false });
        setDailyCall(call);
        call.on('joined-meeting', () => { setIsDailyJoined(true); try { toast.success('Voice connected'); } catch {} });
        call.on('left-meeting', () => setIsDailyJoined(false));
        call.on('error', (e: any) => { try { console.error('Daily error', e); toast.error('Voice error'); } catch {} });
      } catch (e) {
        try { console.error('Failed to load Daily SDK', e); toast.error('Unable to init voice'); } catch {}
      }
    })();
    return () => {
      disposed = true;
      try { dailyCall?.leave?.(); dailyCall?.destroy?.(); } catch {}
    };
  }, []);

  // Play a short beep when it's my turn
  const playTurnBeep = () => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current as AudioContext;
      if (!ctx) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, (ctx as AudioContext).currentTime);
      g.gain.exponentialRampToValueAtTime(0.3, (ctx as AudioContext).currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, (ctx as AudioContext).currentTime + 0.2);
      o.start();
      o.stop((ctx as AudioContext).currentTime + 0.22);
    } catch {}
  };

  // Detect start of my turn to play cue and ensure mic gating
  useEffect(() => {
    if (currentPhase === 'DESCRIBING') {
      if (isMyTurn && !prevIsMyTurnRef.current) {
        playTurnBeep();
      }
    }
    prevIsMyTurnRef.current = isMyTurn;
  }, [isMyTurn, currentPhase]);

  // Join Daily room when enabling voice or entering describing phase
  const joinDailyIfNeeded = async () => {
    if (!USE_DAILY) return;
    if (!dailyCall || isDailyJoined) return;
    const url = process.env.NEXT_PUBLIC_DAILY_URL;
    if (!url) { try { toast.error('Missing DAILY URL'); } catch {} return; }
    try {
      await dailyCall.join({ url, audioSource: true, videoSource: false });
      // Gate mic initially by turn/voice toggle
      dailyCall.setLocalAudio(isMyTurn && isVoiceEnabled);
    } catch (e) {
      try { console.error('Daily join failed', e); toast.error('Voice join failed'); } catch {}
    }
  };

  // React to turn / toggle changes to gate mic
  useEffect(() => {
    setMicEnabled(isMyTurn && isVoiceEnabled);
    if (USE_DAILY && isVoiceEnabled) { joinDailyIfNeeded(); }
  }, [isMyTurn, isVoiceEnabled]);

  // Auto manage voice for Description phase only (join on start, leave on end)
  useEffect(() => {
    if (!USE_DAILY) return;
    if (!dailyCall) return;
    if (currentPhase === 'DESCRIBING') {
      // Ensure we are joined and voice UI on
      setIsVoiceEnabled(true);
      (async () => {
        await joinDailyIfNeeded();
        try { dailyCall?.setLocalAudio(isMyTurn); } catch {}
      })();
    } else {
      try { dailyCall?.leave?.(); } catch {}
      setIsDailyJoined(false);
      setIsVoiceEnabled(false);
    }
  }, [currentPhase, dailyCall, isMyTurn]);

  return (
    <div className="max-w-6xl mx-auto h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Who's the Spy</h1>
              <p className="text-blue-100 text-sm">
                {currentPhase === 'LOBBY' && 'Waiting for players...'}
                {currentPhase === 'WORD_ASSIGNMENT' && 'Check your word!'}
                {currentPhase === 'DESCRIBING' && 'Describe your word without saying it!'}
                {currentPhase === 'VOTING' && 'Vote for who you think is the spy!'}
                {currentPhase === 'REVEAL' && 'The spy has been revealed!'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-white/20 rounded-lg px-3 py-1">
              <div className="text-xs text-blue-100">Room</div>
              <div className="text-sm font-bold text-white font-mono">{game?.roomCode}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex bg-gray-900">
        {/* Players Sidebar */}
        <div className="w-64 bg-gray-800 p-4 border-r border-gray-700">
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 text-gray-300 mr-2" />
            <h3 className="text-white font-semibold">Players ({game?.players?.length || 0})</h3>
          </div>
          
          <div className="space-y-3">
            {game?.players?.map((player: Player, index: number) => {
              const isSpeaking = currentPhase === 'DESCRIBING' && index === currentTurn;
              return (
                <div
                  key={player.userId}
                  className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                    isSpeaking ? 'bg-green-600/20 border border-green-500/40' : 'bg-gray-700/50 hover:bg-gray-700/70'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center relative ${
                    isSpeaking ? 'bg-green-500/40 ring-2 ring-green-400 animate-pulse' : 'bg-gradient-to-br from-blue-400 to-purple-500'
                  }`}>
                    <span className="text-white font-bold text-sm">
                      {player.name.charAt(0).toUpperCase()}
                    </span>
                    {player.isHost && (
                      <Crown className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate flex items-center gap-2">
                      {player.name}
                      {isSpeaking && (
                        <span className="text-green-300 text-[10px] uppercase tracking-wide">Speaking now</span>
                      )}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {player.isHost ? 'Host' : `Player ${index + 1}`}
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-400' : 'bg-green-500'}`}></div>
                </div>
              );
            })}
          </div>

          {/* Game Controls */}
          {currentPhase === 'LOBBY' && (
            <div className="mt-6 space-y-3">
              {/* Host Controls */}
              {game.players.find((p: any) => p.userId === user?.id)?.isHost && (
                <div className="p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/30">
                  <h3 className="text-white font-semibold mb-3 flex items-center">
                    <Crown className="w-4 h-4 mr-2 text-yellow-400" />
                    Host Controls
                  </h3>
                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        if (socket && game) {
                          socket.emit('start_spy_game', { gameId: game.id });
                        }
                      }}
                      disabled={!isConnected || game.players.length < 2}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Game
                    </Button>
                    <div className="text-xs text-gray-400 text-center">
                      {game.players.length < 2 ? 'Need at least 2 players' : 'Ready to start!'}
                    </div>
                  </div>
                </div>
              )}

              {/* Room Code */}
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <div className="text-gray-300 text-xs mb-1">Room Code</div>
                <div className="flex items-center justify-between">
                  <div className="text-white font-mono text-lg">{game.roomCode}</div>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(game.roomCode);
                      toast.success('Room code copied!');
                    }}
                    size="sm"
                    variant="outline"
                    className="text-gray-300 border-gray-600 hover:bg-gray-600"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Voice Controls (always visible) */}
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-gray-300 text-xs">Voice</div>
                  {USE_DAILY && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDailyJoined ? 'bg-green-600/40 text-green-200 border border-green-500/40' : 'bg-gray-600/40 text-gray-200 border border-gray-500/40'}`}>
                      {isDailyJoined ? 'Connected' : 'Off'}
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <Button
                    onClick={() => {
                      const next = !isVoiceEnabled;
                      setIsVoiceEnabled(next);
                      if (USE_DAILY) {
                        if (next) { joinDailyIfNeeded(); }
                        try { dailyCall?.setLocalAudio(isMyTurn && next); } catch {}
                      }
                    }}
                    size="sm"
                    className={isVoiceEnabled ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'}
                  >
                    {isVoiceEnabled ? 'Voice On' : 'Voice Off'}
                  </Button>
                </div>
                <div className="text-xs text-gray-400 mt-1">Mic opens on your turn.</div>
              </div>
            </div>
          )}

          {/* Word Display (if in word assignment phase or describing phase) */}
          {(currentPhase === 'WORD_ASSIGNMENT' || currentPhase === 'DESCRIBING') && myWord && (
            <div className="mt-6 p-4 bg-blue-600/20 rounded-lg border border-blue-500/30">
              <div className="text-blue-200 text-sm font-medium mb-2">Your Word:</div>
              <div className="text-2xl font-bold text-white mb-2">{myWord}</div>
              <Badge variant={isSpy ? "destructive" : "default"} className="text-xs">
                {isSpy ? 'You are the SPY!' : 'You are NOT the spy'}
              </Badge>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Reveal Banner */}
          {(currentPhase === 'REVEAL' || revealData) && (results || revealData) && (
            <div className="p-4 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 border-b border-emerald-500/30">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {(results || revealData)?.winner === 'VILLAGERS' ? 'Villagers Win! 🎉' : (results || revealData)?.winner === 'SPY' ? 'Spy Wins! 🕵️‍♂️' : 'Results'}
                </div>
                <div className="text-gray-200">
                  {(() => {
                    const getNameById = (id?: string) => {
                      if (!id) return 'Unknown';
                      return (
                        game?.players?.find((p: any) => p.userId === id)?.name ||
                        (results || revealData)?.players?.find((p: any) => p.userId === id)?.name ||
                        'Unknown'
                      );
                    };
                    const votedOutName = getNameById((results || revealData)?.votedOutUserId);
                    const spyName = getNameById((results || revealData)?.spyUserId);
                    return `Voted out: ${votedOutName} • Spy: ${spyName}`;
                  })()}
                </div>
              </div>
            </div>
          )}
          {/* Description Phase Timer */}
          {currentPhase === 'DESCRIBING' && (
            <div className="p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-purple-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-white font-medium">
                    {isMyTurn ? 'Your Turn' : `Player ${currentTurn + 1}'s Turn`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {USE_DAILY && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isDailyJoined ? 'bg-green-600/40 text-green-200 border border-green-500/40' : 'bg-gray-600/40 text-gray-200 border border-gray-500/40'}`}>
                      {isDailyJoined ? 'Voice Connected' : 'Voice Off'}
                    </span>
                  )}
                  <div className="text-white font-mono text-lg">{timeLeft}s</div>
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(timeLeft / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              {/* Now Speaking Banner */}
              <div className="mt-3">
                <div className="flex items-center justify-center gap-3 bg-green-600/15 border border-green-500/30 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                  <div className="text-white text-sm">
                    <span className="opacity-80 mr-1">Now speaking:</span>
                    <span className="font-semibold">
                      {game?.players?.[currentTurn]?.name || `Player ${currentTurn + 1}`}
                    </span>
                  </div>
                  {game?.players && currentTurn + 1 < game.players.length && (
                    <div className="text-gray-300 text-xs ml-2">
                      <span className="opacity-70">Up next:</span> {game.players[currentTurn + 1].name}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Voice Chat Controls */}
              <div className="flex items-center justify-center space-x-4 mt-3">
                <Button
                  onClick={() => {
                    const next = !isVoiceEnabled;
                    setIsVoiceEnabled(next);
                    if (USE_DAILY) {
                      if (next) { joinDailyIfNeeded(); }
                      try { dailyCall?.setLocalAudio(isMyTurn && next); } catch {}
                    }
                  }}
                  variant={isVoiceEnabled ? "default" : "outline"}
                  size="sm"
                  className={isVoiceEnabled ? "bg-green-600 hover:bg-green-700" : "border-gray-600 text-gray-300"}
                >
                  {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  {isVoiceEnabled ? 'Voice On' : 'Voice Off'}
                </Button>
                
                {isMyTurn && !USE_DAILY && (
                  <Button
                    onClick={() => setIsRecording(!isRecording)}
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    className={isRecording ? "bg-red-600 hover:bg-red-700" : "border-gray-600 text-gray-300"}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-400 mt-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.userId === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.userId === user?.id
                        ? 'bg-blue-600 text-white'
                        : message.type === 'description'
                        ? 'bg-purple-600 text-white'
                        : message.type === 'system'
                        ? 'bg-gray-600 text-gray-200'
                        : 'bg-gray-700 text-white'
                    }`}
                  >
                    <div className="text-xs opacity-75 mb-1 font-medium">
                      {message.userName}
                      {message.type === 'description' && (
                        <span className="ml-2 text-yellow-300">📝 Description</span>
                      )}
                    </div>
                    <div className="text-sm">{message.message}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
            
            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <div className="px-4 py-2">
                <div className="text-gray-400 text-sm italic">
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  <span className="inline-block ml-1">
                    <span className="animate-pulse">.</span>
                    <span className="animate-pulse delay-100">.</span>
                    <span className="animate-pulse delay-200">.</span>
                  </span>
                </div>
              </div>
            )}
          </div>

                    {/* Input Area */}
          <div className="p-4 border-t border-gray-700 bg-gray-800">
            {(currentPhase === 'REVEAL' || revealData) ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-2">
                    {(results || revealData)?.winner === 'VILLAGERS' ? 'Villagers Win! 🎉' : (results || revealData)?.winner === 'SPY' ? 'Spy Wins! 🕵️‍♂️' : 'Results'}
                  </div>
                  <div className="text-gray-300">
                    {(() => {
                      const getNameById = (id?: string) => {
                        if (!id) return 'Unknown';
                        return (
                          game?.players?.find((p: any) => p.userId === id)?.name ||
                          (results || revealData)?.players?.find((p: any) => p.userId === id)?.name ||
                          'Unknown'
                        );
                      };
                      const votedOutName = getNameById((results || revealData)?.votedOutUserId);
                      const spyName = getNameById((results || revealData)?.spyUserId);
                      return `Voted out: ${votedOutName} • Spy: ${spyName}`;
                    })()}
                  </div>
                </div>
                {(results || revealData)?.tally && (
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="text-gray-300 text-sm mb-2">Vote Tally</div>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries((results || revealData).tally).map(([userId, count]: any) => (
                        <div key={userId} className="flex items-center justify-between text-white text-sm">
                          <span>{
                            game?.players?.find((p: any) => p.userId === userId)?.name ||
                            (results || revealData)?.players?.find((p: any) => p.userId === userId)?.name ||
                            'Unknown'
                          }</span>
                          <span className="font-mono">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (currentPhase === 'VOTING' || votingActive) ? (
              <div className="space-y-3">
                <div className="text-center text-white font-medium mb-3">
                  🗳️ Vote for who you think is the spy:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {game.players.map((player: any) => (
                    <Button
                      key={player.userId}
                      onClick={() => {
                        if (socket && game && !myVote) {
                          socket.emit('submit_vote', {
                            gameId: game.id,
                            votedForId: player.userId
                          });
                          // Optimistically block re-vote
                          setMyVote(player.userId);
                        }
                      }}
                      disabled={!socket || !!myVote}
                      variant={myVote === player.userId ? "default" : "outline"}
                      className={myVote === player.userId ? "bg-green-600 text-white" : "border-gray-600 text-white hover:bg-gray-600"}
                    >
                      {player.name}
                    </Button>
                  ))}
                </div>
                {myVote && (
                  <div className="text-center text-gray-300 text-sm">Vote submitted. Waiting for others...</div>
                )}
              </div>
            ) : (
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={handleKeyPress}
                  onBlur={handleStopTyping}
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || !isConnected}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            {/* Game Phase Info */}
            {currentPhase === 'DESCRIBING' && (
              <div className="mt-2 text-xs text-gray-400">
                {isMyTurn ? (
                  <span className="text-green-400">✅ Your turn to describe! ({timeLeft}s left)</span>
                ) : (
                  <span className="text-yellow-400">⏳ {game.players[currentTurn]?.name || `Player ${currentTurn + 1}`}'s turn ({timeLeft}s)</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Category Vote Modal */}
      {categoryVoteActive && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gray-800 rounded-xl border border-gray-700 p-4 shadow-xl">
            <div className="mb-4">
              <h3 className="text-white text-lg font-semibold">Select a Category</h3>
              <p className="text-gray-300 text-sm">Everyone votes. Majority wins. Random picks a random category.</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {categoryOptions.map((opt) => (
                <Button
                  key={opt.id}
                  onClick={() => {
                    if (!socket || !game || myCategoryVote) return;
                    socket.emit('submit_category_vote', { gameId: game.id, categoryId: opt.id });
                    setMyCategoryVote(opt.id);
                  }}
                  disabled={!socket || !!myCategoryVote}
                  variant={myCategoryVote === opt.id ? 'default' : 'outline'}
                  className={myCategoryVote === opt.id ? 'bg-green-600 text-white' : 'border-gray-600 text-white hover:bg-gray-700'}
                >
                  <div className="text-left">
                    <div className="font-medium">{opt.name}</div>
                    {opt.description && (
                      <div className="text-xs opacity-75">{opt.description}</div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
            {myCategoryVote && (
              <div className="text-center text-gray-300 text-sm mt-3">Vote submitted. Waiting for others...</div>
            )}
          </div>
        </div>
      )}
      {/* Hidden audio sink for remote peers */}
      <div id="webrtc-audio-sink" style={{ display: 'none' }} />
    </div>
  );
} 