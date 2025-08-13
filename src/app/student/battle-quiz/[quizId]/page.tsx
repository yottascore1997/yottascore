"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';

interface Question {
  id: string;
  text: string;
  options: string[];
  correct: number;
  marks: number;
}

interface Opponent {
  id: string;
  name: string;
  image?: string;
  score: number;
  currentQuestion: number;
  isAnswered: boolean;
  lastAnswer?: number; // Store the specific answer selected
}

export default function RealTimeBattleQuiz() {
  const params = useParams();
  const router = useRouter();
  const quizId = params?.quizId as string;
  
  const socketHook = useSocket();
  const socket = socketHook.socket;
  
  // Game state
  const [gameState, setGameState] = useState<'waiting' | 'starting' | 'playing' | 'finished'>('waiting');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [myScore, setMyScore] = useState(0);
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionResult, setQuestionResult] = useState<{
    questionIndex: number;
    correctAnswer: number;
    myAnswer: number | null;
    isCorrect: boolean;
  } | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const hasJoinedRef = useRef(false); // Flag to prevent multiple join requests
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const nextQuestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const totalQuestionsRef = useRef(0); // Track total questions from server
  const lastProcessedQuestionRef = useRef(-1); // Track last processed question to prevent duplicates

  // Start ping interval when game starts
  useEffect(() => {
    if (gameState === 'playing' && socket) {
      // Send ping every 10 seconds to keep connection alive
      pingIntervalRef.current = setInterval(() => {
        console.log('🏓 Sending ping to keep connection alive');
        socket.emit('ping');
      }, 10000);
    } else {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    }

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
  }, [gameState, socket]);

  // Socket connection and game events
  useEffect(() => {
    if (!socket || !quizId) return;

    // Reset join flag when socket changes
    hasJoinedRef.current = false;

    // Monitor socket connection status
    const handleConnect = () => {
      console.log('🔗 Socket connected');
    };

    const handleDisconnect = (reason: string) => {
      console.log('🔌 Socket disconnected:', reason);
      if (gameState === 'playing') {
        setError('Connection lost. Please refresh the page to reconnect.');
      }
    };

    const handleConnectError = (error: any) => {
      console.error('🔌 Socket connection error:', error);
      setError('Connection error. Please check your internet connection.');
    };

    // Add connection event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Manual authentication as fallback
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Sending manual authentication...');
      socket.emit('authenticate', { token });
    } else {
      console.error('No token found in localStorage');
      setError('Authentication required. Please login again.');
      return;
    }

    // Listen for authentication
    socket.on('authenticated', (data: { user: any }) => {
      console.log('Socket authenticated successfully:', data.user);
      setLoading(false);
      // Join the battle room only once
      if (!hasJoinedRef.current) {
        console.log('Joining battle for quiz:', quizId);
        hasJoinedRef.current = true;
        socket.emit('join_battle', { quizId });
      } else {
        console.log('Already joined battle, skipping duplicate join request');
      }
    });

    socket.on('auth_error', (message: string) => {
      console.error('Socket authentication error:', message);
      setError(message);
    });

    // Listen for game events
    socket.on('waiting', () => {
      console.log('Waiting for opponent...');
      setGameState('waiting');
      setError(null);
    });

    socket.on('opponent_joined', (data: { opponent: Opponent }) => {
      console.log('Opponent joined:', data.opponent);
      setOpponent(data.opponent);
      setGameState('starting');
      setError(null);
      
      // Start countdown
      let countdown = 3;
      countdownRef.current = setInterval(() => {
        if (countdown > 0) {
          countdown--;
        } else {
          if (countdownRef.current) clearInterval(countdownRef.current);
          setGameState('playing');
          startQuestionTimer();
        }
      }, 1000);
    });

    socket.on('question_start', (data: { questionIndex: number, timeLimit: number, question?: Question, totalQuestions?: number }) => {
      console.log('🎯 Received question_start event:', data);
      
      // Clear the next question timeout if it exists
      if (nextQuestionTimeoutRef.current) {
        clearTimeout(nextQuestionTimeoutRef.current);
        nextQuestionTimeoutRef.current = null;
        console.log('✅ Cleared next question timeout');
      }
      
      // Prevent duplicate processing of the same question
      if (data.questionIndex === lastProcessedQuestionRef.current) {
        console.log('⚠️ Duplicate question_start event received, ignoring');
        return;
      }
      
      // Update the last processed question
      lastProcessedQuestionRef.current = data.questionIndex;
      
      setCurrentQuestionIndex(data.questionIndex);
      setTimeLeft(data.timeLimit);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setQuestionResult(null); // Clear any previous question result
      setGameState('playing');
      
      // If question data is provided, update questions array
      if (data.question) {
        setQuestions(prev => {
          const newQuestions = [...prev];
          newQuestions[data.questionIndex] = data.question!;
          return newQuestions;
        });
      }
      
      console.log('🎯 Question started successfully:');
      console.log('   - Question index:', data.questionIndex);
      console.log('   - Time limit:', data.timeLimit);
      console.log('   - Total questions:', data.totalQuestions);
      
      startQuestionTimer();
    });

    socket.on('opponent_answer', (data: { questionIndex: number, answer: number }) => {
      console.log('👥 Opponent answered:', data);
      setOpponent(prev => prev ? {
        ...prev,
        currentQuestion: data.questionIndex,
        isAnswered: true,
        lastAnswer: data.answer // Store the specific answer
      } : null);
    });

    socket.on('question_result', (data: { 
      questionIndex: number, 
      correctAnswer: number, 
      myScore: number, 
      opponentScore: number,
      totalQuestions?: number
    }) => {
      console.log('📊 Received question_result event:', data);
      console.log('📊 Current question index:', currentQuestionIndex);
      console.log('📊 Total questions from server:', data.totalQuestions || 'unknown');
      
      // Update total questions count from server
      if (data.totalQuestions) {
        totalQuestionsRef.current = data.totalQuestions;
      }
      
      setMyScore(data.myScore);
      setOpponent(prev => prev ? { ...prev, score: data.opponentScore } : null);
      
      // Show question result
      setQuestionResult({
        questionIndex: data.questionIndex,
        correctAnswer: data.correctAnswer,
        myAnswer: selectedAnswer,
        isCorrect: selectedAnswer === data.correctAnswer
      });
      
      console.log('📊 Question result processed:');
      console.log('   - Question index:', data.questionIndex);
      console.log('   - My score:', data.myScore);
      console.log('   - Opponent score:', data.opponentScore);
      console.log('   - Is correct:', selectedAnswer === data.correctAnswer);
      
      // Show result briefly before next question
      setTimeout(() => {
        console.log('⏭️ Question result timeout completed, waiting for next question...');
        setQuestionResult(null); // Clear the result
        
        // Check if this was the last question using the question index from the result
        const isLastQuestion = data.totalQuestions ? 
          (data.questionIndex >= data.totalQuestions - 1) : 
          (data.questionIndex >= totalQuestionsRef.current - 1);
          
        if (isLastQuestion) {
          console.log('🏁 Last question completed, game should finish');
          setGameState('finished');
        } else {
          console.log('📝 Expecting next question from server...');
          console.log('   - Current question index from result:', data.questionIndex);
          console.log('   - Total questions:', data.totalQuestions);
          console.log('   - Next question should be:', data.questionIndex + 1);
          
          // Only set timeout if we haven't already received the next question
          // Check if the next question has already been processed
          const nextQuestionIndex = data.questionIndex + 1;
          if (lastProcessedQuestionRef.current < nextQuestionIndex) {
            console.log('⏰ Setting timeout for next question...');
            nextQuestionTimeoutRef.current = setTimeout(() => {
              console.log('⚠️ Next question timeout - opponent may have disconnected');
              setError('Opponent may have disconnected. Please refresh to try again.');
            }, 5000); // 5 second timeout
          } else {
            console.log('✅ Next question already received, skipping timeout');
          }
        }
      }, 2000);
    });

    socket.on('game_finished', (data: { 
      winner: string, 
      myScore: number, 
      opponentScore: number, 
      prizeAmount: number 
    }) => {
      console.log('🏁 Game finished event received:', data);
      setGameResult(data);
      setGameState('finished');
    });

    socket.on('opponent_disconnected', () => {
      console.log('🔌 Opponent disconnected');
      setGameResult({ 
        winner: 'you', 
        reason: 'Opponent disconnected',
        myScore,
        opponentScore: opponent?.score || 0
      });
      setGameState('finished');
    });

    socket.on('error', (message: string) => {
      setError(message);
      console.error('Socket error:', message);
    });

    socket.on('pong', () => {
      console.log('🏓 Received pong from server');
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('authenticated');
      socket.off('auth_error');
      socket.off('waiting');
      socket.off('opponent_joined');
      socket.off('question_start');
      socket.off('opponent_answer');
      socket.off('question_result');
      socket.off('game_finished');
      socket.off('opponent_disconnected');
      socket.off('error');
      socket.off('pong');
      
      // Clear timeouts
      if (nextQuestionTimeoutRef.current) {
        clearTimeout(nextQuestionTimeoutRef.current);
        nextQuestionTimeoutRef.current = null;
      }
    };
  }, [socket, quizId]);

  // Timer for questions
  const startQuestionTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Auto-submit if not answered
          if (!isAnswered) {
            handleAnswer(-1); // No answer selected
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnswer = (answerIndex: number) => {
    console.log('🖱️ Answer button clicked:', answerIndex);
    console.log('🖱️ Current state:', { isAnswered, gameState });
    
    if (isAnswered || gameState !== 'playing') {
      console.log('❌ Cannot submit answer - already answered or not playing');
      return;
    }
    
    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Debug log before emitting
    console.log('Emitting submit_answer:', {
      quizId,
      questionIndex: currentQuestionIndex,
      answer: answerIndex
    });
    // Send answer to server
    socket?.emit('submit_answer', {
      quizId,
      questionIndex: currentQuestionIndex,
      answer: answerIndex
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Battle Quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/student/battle-quiz')}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (gameResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">
            {gameResult.winner === 'you' ? '🏆' : '😔'}
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {gameResult.winner === 'you' ? 'You Won!' : 'You Lost!'}
          </h1>
          <p className="text-gray-600 mb-6">
            {gameResult.reason || `Final Score: ${gameResult.myScore} - ${gameResult.opponentScore}`}
          </p>
          
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-600">Your Score</div>
            <div className="text-2xl font-bold text-purple-600">{gameResult.myScore}</div>
          </div>
          
          {gameResult.prizeAmount > 0 && (
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-600">Prize Won</div>
              <div className="text-2xl font-bold text-yellow-600">₹{gameResult.prizeAmount}</div>
            </div>
          )}
          
          <button
            onClick={() => router.push('/student/battle-quiz')}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
          >
            Play Again
          </button>
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
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg">
                <div className="text-sm font-medium">Your Score</div>
                <div className="text-xl font-bold">{myScore}</div>
              </div>
              
              {opponent && (
                <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg">
                  <div className="text-sm font-medium">{opponent.name}</div>
                  <div className="text-xl font-bold">{opponent.score}</div>
                </div>
              )}
            </div>
            
            {gameState === 'playing' && (
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg">
                <div className="text-sm font-medium">Time Left</div>
                <div className="text-xl font-bold">{timeLeft}s</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {gameState === 'waiting' && (
          <div className="text-center py-12">
            <div className="animate-pulse">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Waiting for Opponent</h2>
              <p className="text-gray-600">Finding someone to battle with...</p>
            </div>
          </div>
        )}

        {gameState === 'starting' && (
          <div className="text-center py-12">
            <div className="text-6xl font-bold text-purple-600 mb-4">3</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Ready!</h2>
            <p className="text-gray-600">Battle starting in...</p>
          </div>
        )}

        {gameState === 'playing' && questions[currentQuestionIndex] && (
          <div className="space-y-6">
            {/* Question Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-500">
                  Question {currentQuestionIndex + 1} of {totalQuestionsRef.current || '?'}
                </div>
                <div className="text-sm text-gray-500">
                  {questions[currentQuestionIndex]?.marks || 1} point{questions[currentQuestionIndex]?.marks !== 1 ? 's' : ''}
                </div>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {questions[currentQuestionIndex]?.text}
              </h2>

              {/* Answer Options */}
              <div className="space-y-3">
                {questions[currentQuestionIndex]?.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={isAnswered}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                      selectedAnswer === index
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    } ${isAnswered ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'} relative`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                          selectedAnswer === index
                            ? 'border-purple-500 bg-purple-500 text-white'
                            : 'border-gray-300'
                        }`}>
                          {selectedAnswer === index && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="font-medium">{option}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Your answer indicator */}
                        {selectedAnswer === index && (
                          <div className="flex items-center text-purple-600">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">You</span>
                          </div>
                        )}
                        
                        {/* Opponent's answer indicator */}
                        {opponent?.lastAnswer === index && (
                          <div className="flex items-center text-orange-600">
                            <div className="w-4 h-4 bg-orange-500 rounded-full mr-1 flex items-center justify-center">
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
                  {isAnswered && opponent?.isAnswered ? (
                    <span className="text-green-600 font-medium">✅ Both players answered!</span>
                  ) : isAnswered ? (
                    <span className="text-purple-600">⏳ Waiting for opponent to answer...</span>
                  ) : opponent?.isAnswered ? (
                    <span className="text-orange-600">⏳ Opponent answered, waiting for you...</span>
                  ) : (
                    <span className="text-gray-500">⏰ Time remaining: {timeLeft}s</span>
                  )}
                </div>
              </div>
            </div>

            {/* Question Result */}
            {questionResult && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className={`text-center p-4 rounded-lg ${
                  questionResult.isCorrect 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  <div className="text-2xl mb-2">
                    {questionResult.isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                  </div>
                  <p className="text-sm">
                    {questionResult.isCorrect 
                      ? 'Great job! You got it right.' 
                      : `The correct answer was: ${questions[questionResult.questionIndex]?.options[questionResult.correctAnswer]}`
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Answer Comparison - Show when both players have answered */}
            {isAnswered && opponent?.isAnswered && opponent?.lastAnswer !== undefined && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  Answer Comparison
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Your Answer */}
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-purple-800">Your Answer</span>
                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {String.fromCharCode(65 + (selectedAnswer || 0))}
                      </div>
                    </div>
                    <div className="text-purple-900 font-medium">
                      {questions[currentQuestionIndex]?.options[selectedAnswer || 0]}
                    </div>
                  </div>

                  {/* Opponent's Answer */}
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-orange-800">Opponent's Answer</span>
                      <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {String.fromCharCode(65 + opponent.lastAnswer)}
                      </div>
                    </div>
                    <div className="text-orange-900 font-medium">
                      {questions[currentQuestionIndex]?.options[opponent.lastAnswer]}
                    </div>
                  </div>
                </div>

                {/* Answer Status */}
                <div className="mt-4 text-center">
                  {selectedAnswer === opponent.lastAnswer ? (
                    <div className="text-green-600 font-medium">
                      🤝 Both players selected the same answer!
                    </div>
                  ) : (
                    <div className="text-gray-600 font-medium">
                      📊 Different answers selected
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 