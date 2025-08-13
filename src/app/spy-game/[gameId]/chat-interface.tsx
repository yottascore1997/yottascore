'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, MessageSquare, Users, Crown, Eye, Play, Copy, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
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
  timeLeft = 20,
  isMyTurn = false
}: ChatInterfaceProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Listen for chat messages
  useEffect(() => {
    if (!socket) return;

    socket.on('chat_message_received', (data: ChatMessage) => {
      setChatMessages(prev => [...prev, data]);
    });

    socket.on('description_submitted', (data: { playerId: string; description: string; currentTurn: number }) => {
      // Add description as a special message type
      const descriptionMessage: ChatMessage = {
        id: Date.now().toString(),
        userId: data.playerId,
        userName: game.players.find((p: any) => p.userId === data.playerId)?.name || 'Unknown',
        message: data.description,
        timestamp: new Date(),
        type: 'description'
      };
      setChatMessages(prev => [...prev, descriptionMessage]);
    });

    socket.on('voting_started', (data: { players: any[] }) => {
      // Add voting phase message
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        userId: 'system',
        userName: 'Game System',
        message: '🗳️ Voting phase started! Vote for who you think is the spy.',
        timestamp: new Date(),
        type: 'system'
      };
      setChatMessages(prev => [...prev, systemMessage]);
    });

    socket.on('turn_ended', (data: { gameId: string; nextTurn: number }) => {
      if (data.nextTurn < game.players.length) {
        const nextPlayer = game.players[data.nextTurn];
        const systemMessage: ChatMessage = {
          id: Date.now().toString(),
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

    return () => {
      socket.off('chat_message_received');
      socket.off('description_submitted');
    };
  }, [socket, game]);

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
      id: Date.now().toString(),
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
            {game?.players?.map((player: Player, index: number) => (
              <div
                key={player.userId}
                className="flex items-center space-x-3 p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700/70 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center relative">
                  <span className="text-white font-bold text-sm">
                    {player.name.charAt(0).toUpperCase()}
                  </span>
                  {player.isHost && (
                    <Crown className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">
                    {player.name}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {player.isHost ? 'Host' : `Player ${index + 1}`}
                  </div>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            ))}
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
                  <div className="text-white font-mono text-lg">{timeLeft}s</div>
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(timeLeft / 20) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Voice Chat Controls */}
              <div className="flex items-center justify-center space-x-4 mt-3">
                <Button
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  variant={isVoiceEnabled ? "default" : "outline"}
                  size="sm"
                  className={isVoiceEnabled ? "bg-green-600 hover:bg-green-700" : "border-gray-600 text-gray-300"}
                >
                  {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  {isVoiceEnabled ? 'Voice On' : 'Voice Off'}
                </Button>
                
                {isMyTurn && (
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
            {currentPhase === 'VOTING' ? (
              <div className="space-y-3">
                <div className="text-center text-white font-medium mb-3">
                  🗳️ Vote for who you think is the spy:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {game.players.map((player: any) => (
                    <Button
                      key={player.userId}
                      onClick={() => {
                        if (socket && game) {
                          socket.emit('submit_vote', {
                            gameId: game.id,
                            votedForId: player.userId
                          });
                        }
                      }}
                      variant="outline"
                      className="border-gray-600 text-white hover:bg-gray-600"
                    >
                      {player.name}
                    </Button>
                  ))}
                </div>
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
    </div>
  );
} 