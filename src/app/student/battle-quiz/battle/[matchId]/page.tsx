"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  opponentAnswers: { [key: number]: number };
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
    timeLeft: 15,
    player1Score: 0,
    player2Score: 0,
    answers: {},
    opponentAnswers: {}
  });
  
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('Socket not connected, waiting...');
      return;
    }

    console.log('Setting up battle socket listeners for match:', matchId);

    // Clean up any existing listeners first
    socket.off('match_started');
    socket.off('next_question');
    socket.off('match_ended');
    socket.off('opponent_answered');
    socket.off('match_not_found');

    // Listen for battle events
    socket.on('match_started', (data: { 
      matchId: string; 
      questionIndex: number; 
      question: Question; 
      timeLimit: number 
    }) => {
      console.log('Match started event received:', data);
      setBattleState(prev => ({
        ...prev,
        status: 'playing',
        currentQuestion: data.questionIndex,
        question: data.question,
        timeLeft: data.timeLimit
      }));
      startQuestionTimer(data.timeLimit);
    });

    socket.on('next_question', (data: { 
      questionIndex: number; 
      question: Question 
    }) => {
      console.log('Next question event received:', data);
      setBattleState(prev => ({
        ...prev,
        currentQuestion: data.questionIndex,
        question: data.question,
        timeLeft: 15 // Default time limit
      }));
      startQuestionTimer(15);
    });

    socket.on('match_ended', (data: { 
      matchId: string; 
      player1Score: number; 
      player2Score: number; 
      winner: string; 
      isDraw: boolean 
    }) => {
      console.log('Match ended event received:', data);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
        questionTimerRef.current = null;
      }
      
      setBattleState(prev => ({
        ...prev,
        status: 'finished',
        player1Score: data.player1Score,
        player2Score: data.player2Score
      }));
    });

    socket.on('opponent_answered', (data: { questionIndex: number }) => {
      console.log('Opponent answered event received:', data);
      setBattleState(prev => ({
        ...prev,
        opponentAnswers: {
          ...prev.opponentAnswers,
          [data.questionIndex]: 1 // Just mark as answered
        }
      }));
    });

    socket.on('match_not_found', (data: { matchId: string }) => {
      console.log('Match not found:', data.matchId);
      setError('Match not found or has already ended. Please start a new match.');
    });

    // Request match status from server
    console.log('Requesting match status from server...');
    socket.emit('get_match_status', { matchId });

    return () => {
      console.log('Cleaning up battle socket listeners');
      socket.off('match_started');
      socket.off('next_question');
      socket.off('match_ended');
      socket.off('opponent_answered');
      socket.off('match_not_found');
    };
  }, [socket, isConnected, matchId]);

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
    if (!socket || !isConnected) return;
    
    const questionIndex = battleState.currentQuestion;
    const timeSpent = 15 - battleState.timeLeft;
    
    console.log('Submitting answer:', { questionIndex, answerIndex, timeSpent });
    
    // Record answer locally
    setBattleState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionIndex]: answerIndex
      }
    }));
    
    // Send answer to server
    socket.emit('answer_question', {
      matchId,
      userId: user?.id,
      questionIndex,
      answer: answerIndex,
      timeSpent
    });
    
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
    if (battleState.opponentAnswers[questionIndex]) {
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
        </div>

        {/* Question Progress */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex justify-center space-x-2">
            {Array.from({ length: battleState.totalQuestions }, (_, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${getAnswerClass(i)}`}
              >
                {i + 1}
              </div>
            ))}
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
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option}</span>
                    {battleState.answers[battleState.currentQuestion] === index && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 