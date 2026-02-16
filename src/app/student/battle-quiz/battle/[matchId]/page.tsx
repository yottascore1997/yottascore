"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Target, 
  Users, 
  Trophy,
  CheckCircle,
  XCircle,
  ArrowRight
} from 'lucide-react';

interface Question {
  id: number;
  text: string;
  options: string[];
  correct: number;
}

interface BattleState {
  status: 'preparing' | 'playing' | 'finished';
  currentQuestion: number;
  totalQuestions: number;
  timeLeft: number;
  question?: Question;
  player1Score: number;
  player2Score: number;
  opponent?: {
    id: string;
    name: string;
  };
  answers: { [key: number]: number };
  opponentAnswers: { [key: number]: number | 'timed_out' }; // Store answer index or 'timed_out'
}

export default function BattlePage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;
  const { socket, isConnected } = useSocket();
  
  const [battleState, setBattleState] = useState<BattleState>({
    status: 'preparing',
    currentQuestion: 0,
    totalQuestions: 5,
    timeLeft: 10,
    player1Score: 0,
    player2Score: 0,
    answers: {},
    opponentAnswers: {}
  });
  
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const socketListenersRef = useRef<Set<string>>(new Set());
  const lastQuestionIndexRef = useRef<number>(-1);

  // Check if running in React Native environment
  const isReactNative = typeof window !== 'undefined' && 
    (window as any).ReactNativeWebView !== undefined || 
    typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Monitor battle state changes
  useEffect(() => {
    console.log('🔄 Battle state changed:', {
      status: battleState.status,
      currentQuestion: battleState.currentQuestion,
      questionText: battleState.question?.text?.substring(0, 50) + '...',
      timeLeft: battleState.timeLeft,
      isReactNative
    });
  }, [battleState, isReactNative]);

  // Cleanup function for socket listeners
  const cleanupSocketListeners = useCallback(() => {
    if (!socket) return;
    
    console.log('🧹 Cleaning up socket listeners...');
    const events = ['match_started', 'next_question', 'match_ended', 'opponent_answered', 'match_not_found', 'pong'];
    
    events.forEach(event => {
      if (socketListenersRef.current.has(event)) {
        socket.off(event);
        socketListenersRef.current.delete(event);
        console.log(`✅ Removed listener for: ${event}`);
      }
    });
  }, [socket]);

  // Setup socket listeners with React Native compatibility
  const setupSocketListeners = useCallback(() => {
    if (!socket || !isConnected) {
      console.log('❌ Cannot setup listeners - socket not connected');
      return;
    }

    console.log('✅ Setting up battle socket listeners for match:', matchId);
    console.log('   - Is React Native:', isReactNative);
    console.log('   - Socket ID:', socket.id);

    // Clean up existing listeners first
    cleanupSocketListeners();

    // Listen for battle events
    console.log('🎧 Attaching socket listeners...');
    
    // Match started event
    const handleMatchStarted = (data: { 
      matchId: string; 
      questionIndex: number; 
      question: Question; 
      timeLimit: number;
      player1Score?: number;
      player2Score?: number;
      myScore?: number;
      opponentScore?: number;
    }) => {
      console.log('🎮 Match started event received:', data);
      setBattleState(prev => ({
        ...prev,
        status: 'playing',
        currentQuestion: data.questionIndex,
        question: data.question,
        timeLeft: data.timeLimit ?? 10,
        player1Score: typeof data.myScore === 'number' ? data.myScore : (data.player1Score ?? 0),
        player2Score: typeof data.opponentScore === 'number' ? data.opponentScore : (data.player2Score ?? 0)
      }));
      startQuestionTimer(data.timeLimit ?? 10);
    };

    // Next question event
    const handleNextQuestion = (data: { 
      questionIndex: number; 
      question: Question;
      player1Score?: number;
      player2Score?: number;
      myScore?: number;
      opponentScore?: number;
      myPosition?: 'player1' | 'player2';
      timeLimit?: number;
      fromTimeout?: boolean;
    }) => {
      console.log('🎯 Next question event received:', data);
      console.log('   - Question index:', data.questionIndex);
      console.log('   - Scores:', data.myScore, data.opponentScore);
      
      // Prevent duplicate processing (except when fromTimeout - always process)
      const fromTimeout = data.fromTimeout;
      if (!fromTimeout && data.questionIndex === lastQuestionIndexRef.current) {
        console.log('⚠️ Duplicate next_question event, ignoring');
        return;
      }
      
      lastQuestionIndexRef.current = data.questionIndex;
      const timeLimit = data.timeLimit ?? 10;
      
      console.log('🎯 Applying next question - index:', data.questionIndex, 'fromTimeout:', fromTimeout);
      
      // Use requestAnimationFrame or shorter delay to ensure UI updates (fixes timeout case not updating)
      const applyUpdate = () => {
        setBattleState(prev => ({
          ...prev,
          currentQuestion: data.questionIndex,
          question: data.question,
          timeLeft: timeLimit,
          player1Score: typeof data.myScore === 'number' ? data.myScore : (data.player1Score ?? prev.player1Score),
          player2Score: typeof data.opponentScore === 'number' ? data.opponentScore : (data.player2Score ?? prev.player2Score)
        }));
        setTimeout(() => startQuestionTimer(timeLimit), 100);
      };
      
      if (fromTimeout) {
        applyUpdate();
      } else {
        setTimeout(applyUpdate, isReactNative ? 100 : 50);
      }
    };

    // Match ended event
    const handleMatchEnded = (data: { 
      matchId: string; 
      player1Score: number; 
      player2Score: number; 
      winner: string; 
      isDraw: boolean;
      myScore: number;
      opponentScore: number;
      myPosition: 'player1' | 'player2';
    }) => {
      console.log('🏁 Match ended event received:', data);
      console.log('   - Player 1 score:', data.player1Score);
      console.log('   - Player 2 score:', data.player2Score);
      console.log('   - My score:', data.myScore);
      console.log('   - Opponent score:', data.opponentScore);
      console.log('   - My position:', data.myPosition);
      console.log('   - Winner:', data.winner);
      console.log('   - Is draw:', data.isDraw);
      console.log('   - Current user ID:', user?.id);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
        questionTimerRef.current = null;
      }
      
      // Use the server-provided scores
      const myScore = data.myScore;
      const opponentScore = data.opponentScore;
      const isWinner = data.winner === user?.id;
      
      console.log('🎯 Final score calculation:');
      console.log('   - My score:', myScore);
      console.log('   - Opponent score:', opponentScore);
      console.log('   - Is winner:', isWinner);
      
      setBattleState(prev => ({
        ...prev,
        status: 'finished',
        player1Score: myScore,
        player2Score: opponentScore,
        winner: data.winner,
        isDraw: data.isDraw,
        isWinner: isWinner
      }));
    };

    // Opponent answered event (answer can be null when opponent timed out)
    const handleOpponentAnswered = (data: { questionIndex: number; answer?: number | null; timedOut?: boolean }) => {
      console.log('👥 Opponent answered event received:', data);
      console.log('   - Question index:', data.questionIndex);
      console.log('   - Opponent answer:', data.answer, 'timedOut:', data.timedOut);
      console.log('   - Current question:', battleState.currentQuestion);
      console.log('   - Is React Native:', isReactNative);
      
      setBattleState(prev => ({
        ...prev,
        opponentAnswers: {
          ...prev.opponentAnswers,
          [data.questionIndex]: data.timedOut ? 'timed_out' : data.answer
        }
      }));
      
      console.log('✅ Opponent answered state updated');
    };

    // Match not found event
    const handleMatchNotFound = (data: { matchId: string }) => {
      console.log('Match not found:', data.matchId);
      setError('Match not found or has already ended. Please start a new match.');
    };

    // Pong event for connection testing
    const handlePong = () => {
      console.log('🏓 Received pong from server - socket connection is working');
    };

    // Attach listeners
    socket.on('match_started', handleMatchStarted);
    socket.on('next_question', handleNextQuestion);
    socket.on('match_ended', handleMatchEnded);
    socket.on('opponent_answered', handleOpponentAnswered);
    socket.on('match_not_found', handleMatchNotFound);
    socket.on('pong', handlePong);

    // Track attached listeners
    socketListenersRef.current.add('match_started');
    socketListenersRef.current.add('next_question');
    socketListenersRef.current.add('match_ended');
    socketListenersRef.current.add('opponent_answered');
    socketListenersRef.current.add('match_not_found');
    socketListenersRef.current.add('pong');

    // Request match status from server
    console.log('📤 Requesting match status from server...');
    console.log('   - Match ID:', matchId);
    console.log('   - Socket ID:', socket.id);
    socket.emit('get_match_status', { matchId });
    console.log('✅ get_match_status event emitted');
    
    // Test socket connection by sending a ping
    setTimeout(() => {
      console.log('🏓 Testing socket connection...');
      socket.emit('ping');
    }, 1000);

    // Additional debugging for React Native
    if (isReactNative) {
      console.log('📱 React Native specific socket setup completed');
      console.log('   - Socket connected:', socket.connected);
      console.log('   - Socket ID:', socket.id);
      console.log('   - Transport:', socket.io.engine.transport.name);
      
      // Monitor socket state changes for React Native
      console.log('📱 React Native socket monitoring enabled');
      console.log('   - Transport type:', socket.io?.engine?.transport?.name || 'unknown');
    }

  }, [socket, isConnected, matchId, cleanupSocketListeners, isReactNative]);

  useEffect(() => {
    console.log('🔄 Battle useEffect triggered:');
    console.log('   - Socket exists:', !!socket);
    console.log('   - Socket connected:', isConnected);
    console.log('   - Match ID:', matchId);
    console.log('   - Socket ID:', socket?.id);
    console.log('   - Is React Native:', isReactNative);
    
    if (!socket || !isConnected) {
      console.log('❌ Socket not connected, waiting...');
      return;
    }

    setupSocketListeners();

    return () => {
      console.log('🧹 Cleaning up battle socket listeners');
      console.log('   - Socket ID:', socket?.id);
      console.log('   - Match ID:', matchId);
      cleanupSocketListeners();
      
      // Clear timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
        questionTimerRef.current = null;
      }
    };
  }, [socket, isConnected, matchId, setupSocketListeners, cleanupSocketListeners, isReactNative]);

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
        console.log('✅ User profile loaded:', data);
        console.log('   - User ID:', data.id);
        console.log('   - User name:', data.name);
      } else {
        console.error('❌ Failed to fetch user profile:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
    }
  };

  const startQuestionTimer = (timeLimit: number) => {
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
    }
    
    setBattleState(prev => ({ ...prev, timeLeft: timeLimit }));
    
    questionTimerRef.current = setInterval(() => {
      setBattleState(prev => {
        if (prev.timeLeft <= 1) {
          // Time's up, auto-submit if not answered
          if (!prev.answers[prev.currentQuestion]) {
            handleAnswer(-1); // -1 means no answer
          }
          return prev;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
  };

  const handleAnswer = (answerIndex: number) => {
    if (!socket || !isConnected) {
      console.log('❌ Cannot submit answer - socket not connected');
      return;
    }
    
    const questionIndex = battleState.currentQuestion;
    const timeSpent = 10 - battleState.timeLeft;
    
    console.log('🖱️ Submitting answer:', { questionIndex, answerIndex, timeSpent });
    console.log('   - Match ID:', matchId);
    console.log('   - User ID:', user?.id);
    console.log('   - Socket connected:', isConnected);
    console.log('   - Is React Native:', isReactNative);
    
    // Record answer locally
    setBattleState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionIndex]: answerIndex
      }
    }));
    
    // Send answer to server
    const answerData = {
      matchId,
      userId: user?.id,
      questionIndex,
      answer: answerIndex,
      timeSpent
    };
    
    console.log('📤 Emitting answer_question:', answerData);
    socket.emit('answer_question', answerData);
    console.log('✅ answer_question event emitted');
    
    // Clear timer
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
  };

  const getAnswerStatus = (questionIndex: number) => {
    if (battleState.answers[questionIndex] !== undefined) {
      return 'answered';
    }
    if (battleState.opponentAnswers[questionIndex] !== undefined) {
      return 'opponent-answered';
    }
    return 'pending';
  };

  const getAnswerClass = (questionIndex: number) => {
    const status = getAnswerStatus(questionIndex);
    switch (status) {
      case 'answered':
        return 'bg-green-100 border-green-500';
      case 'opponent-answered':
        return 'bg-yellow-100 border-yellow-500';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Battle Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/student/battle-quiz')}>
            Back to Battle Quiz
          </Button>
        </div>
      </div>
    );
  }

  if (battleState.status === 'preparing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Preparing Battle</h1>
          <p className="text-gray-600">Setting up your match...</p>
          {isReactNative && (
            <p className="text-sm text-gray-500 mt-2">React Native Mode</p>
          )}
        </div>
      </div>
    );
  }

  if (battleState.status === 'finished') {
    const isWinner = battleState.player1Score > battleState.player2Score;
    const isDraw = battleState.player1Score === battleState.player2Score;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          {isWinner ? (
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          ) : isDraw ? (
            <Target className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          )}
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isWinner ? 'Victory!' : isDraw ? 'Draw!' : 'Defeat!'}
          </h1>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">You:</span>
              <span className="text-lg font-bold">{battleState.player1Score} pts</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Opponent:</span>
              <span className="text-lg font-bold">{battleState.player2Score} pts</span>
            </div>
          </div>
          
          <Button onClick={() => router.push('/student/battle-quiz')} className="w-full">
            Back to Battle Quiz
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">You</div>
                <div className="text-xl font-bold text-blue-600">{battleState.player1Score}</div>
              </div>
              <div className="text-2xl font-bold text-gray-400">VS</div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Opponent</div>
                <div className="text-xl font-bold text-red-600">{battleState.player2Score}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <Clock className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-orange-600">{battleState.timeLeft}s</div>
              </div>
              <div className="text-center">
                <Target className="w-6 h-6 text-purple-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-purple-600">
                  {battleState.currentQuestion + 1}/{battleState.totalQuestions}
                </div>
              </div>
            </div>
          </div>
          {isReactNative && (
            <div className="mt-2 text-center">
              <span className="text-xs text-gray-500">React Native Mode</span>
            </div>
          )}
        </div>

        {/* Question Progress */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex justify-center space-x-2 mb-3">
            {Array.from({ length: battleState.totalQuestions }, (_, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${getAnswerClass(i)}`}
                title={`Question ${i + 1}: ${getAnswerStatus(i)}`}
              >
                {i + 1}
              </div>
            ))}
          </div>
          
          {/* Progress Status */}
          <div className="text-center text-sm text-gray-600">
            {battleState.answers[battleState.currentQuestion] !== undefined && 
             battleState.opponentAnswers[battleState.currentQuestion] !== undefined ? (
              battleState.opponentAnswers[battleState.currentQuestion] === 'timed_out' ? (
                <span className="text-orange-600">⏰ Opponent ran out of time</span>
              ) : (
                <span className="text-green-600">✅ Both players answered</span>
              )
            ) : battleState.answers[battleState.currentQuestion] !== undefined ? (
              <span className="text-blue-600">⏳ Waiting for opponent...</span>
            ) : battleState.opponentAnswers[battleState.currentQuestion] !== undefined ? (
              <span className="text-yellow-600">⏳ Opponent answered, waiting for you...</span>
            ) : (
              <span className="text-gray-500">⏰ Time remaining: {battleState.timeLeft}s</span>
            )}
          </div>
        </div>

        {/* Question */}
        {battleState.question && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {battleState.question.text}
            </h2>
            
            <div className="space-y-3">
              {battleState.question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={battleState.answers[battleState.currentQuestion] !== undefined}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    battleState.answers[battleState.currentQuestion] === index
                      ? 'bg-blue-100 border-blue-500 text-blue-900'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed relative`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option}</span>
                    <div className="flex items-center space-x-2">
                      {/* Your answer indicator */}
                      {battleState.answers[battleState.currentQuestion] === index && (
                        <div className="flex items-center text-blue-600">
                          <CheckCircle className="w-5 h-5 mr-1" />
                          <span className="text-sm font-medium">Your Answer</span>
                        </div>
                      )}
                      
                      {/* Opponent's answer indicator */}
                      {battleState.opponentAnswers[battleState.currentQuestion] === index && (
                        <div className="flex items-center text-yellow-600">
                          <div className="w-5 h-5 bg-yellow-500 rounded-full mr-1 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">O</span>
                          </div>
                          <span className="text-sm font-medium">Opponent</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Real-time status */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-center text-sm text-gray-600">
                {battleState.answers[battleState.currentQuestion] !== undefined && 
                 battleState.opponentAnswers[battleState.currentQuestion] !== undefined ? (
                  battleState.opponentAnswers[battleState.currentQuestion] === 'timed_out' ? (
                    <span className="text-orange-600 font-medium">⏰ Opponent ran out of time!</span>
                  ) : (
                    <span className="text-green-600 font-medium">✅ Both players answered!</span>
                  )
                ) : battleState.answers[battleState.currentQuestion] !== undefined ? (
                  <span className="text-blue-600">⏳ Waiting for opponent to answer...</span>
                ) : battleState.opponentAnswers[battleState.currentQuestion] !== undefined ? (
                  <span className="text-yellow-600">⏳ Opponent answered, waiting for you...</span>
                ) : (
                  <span className="text-gray-500">⏰ Time remaining: {battleState.timeLeft}s</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Answer Comparison - Show when both players have answered */}
        {battleState.question && 
         battleState.answers[battleState.currentQuestion] !== undefined && 
         battleState.opponentAnswers[battleState.currentQuestion] !== undefined && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Answer Comparison
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Your Answer */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-blue-800">Your Answer</span>
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {String.fromCharCode(65 + battleState.answers[battleState.currentQuestion])}
                  </div>
                </div>
                <div className="text-blue-900 font-medium">
                  {battleState.question.options[battleState.answers[battleState.currentQuestion]]}
                </div>
              </div>

              {/* Opponent's Answer */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-yellow-800">Opponent's Answer</span>
                  {battleState.opponentAnswers[battleState.currentQuestion] === 'timed_out' ? (
                    <span className="text-orange-600 text-sm font-medium">⏰</span>
                  ) : (
                    <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {String.fromCharCode(65 + (battleState.opponentAnswers[battleState.currentQuestion] as number))}
                    </div>
                  )}
                </div>
                <div className="text-yellow-900 font-medium">
                  {battleState.opponentAnswers[battleState.currentQuestion] === 'timed_out'
                    ? '⏰ Ran out of time'
                    : battleState.question.options[battleState.opponentAnswers[battleState.currentQuestion] as number]}
                </div>
              </div>
            </div>

            {/* Answer Status */}
            <div className="mt-4 text-center">
              {battleState.opponentAnswers[battleState.currentQuestion] === 'timed_out' ? (
                <div className="text-orange-600 font-medium">⏰ Opponent ran out of time</div>
              ) : battleState.answers[battleState.currentQuestion] === battleState.opponentAnswers[battleState.currentQuestion] ? (
                <div className="text-green-600 font-medium">🤝 Both players selected the same answer!</div>
              ) : (
                <div className="text-gray-600 font-medium">📊 Different answers selected</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 