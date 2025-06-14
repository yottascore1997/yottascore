'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { useSocket } from '@/hooks/useSocket';

export default function StudentBattleQuizPlay() {
  const params = useParams();
  const quizId = params?.quizId as string | undefined;
  const [status, setStatus] = useState<'idle' | 'waiting' | 'matched'>('idle');
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [opponentAnswers, setOpponentAnswers] = useState<Record<number, boolean>>({});
  const [quizComplete, setQuizComplete] = useState(false);
  const [result, setResult] = useState<any>(null);
  const socket = useSocket();

  // Fetch quiz questions on mount
  useEffect(() => {
    async function fetchQuestions() {
      if (!quizId) return;
      
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/battle-quiz/${quizId}/questions`);
        if (res.ok) {
          let data = await res.json();
          data = data.map((q: any) => ({
            ...q,
            correctAnswer: q.correct ?? q.correctAnswer
          }));
          setQuestions(data);
          setSelectedAnswers(Array(data.length).fill(null));
        } else {
          console.error('Failed to fetch questions:', res.status);
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [quizId]);

  // Handle socket events
  useEffect(() => {
    if (!socket || !quizId) return;

    // Join matchmaking
    socket.emit('join_matchmaking', { quizId });

    // Socket event listeners
    socket.on('waiting', () => {
      console.log('Waiting for opponent...');
      setStatus('waiting');
      setOpponentId(null);
    });

    socket.on('matched', ({ opponentId }) => {
      console.log('Matched with opponent:', opponentId);
      setStatus('matched');
      setOpponentId(opponentId);
    });

    socket.on('opponent_answer', ({ questionIdx }) => {
      console.log('Opponent answered question:', questionIdx);
      setOpponentAnswers(prev => ({ ...prev, [questionIdx]: true }));
    });

    socket.on('opponent_disconnected', () => {
      console.log('Opponent disconnected');
      setStatus('waiting');
      setOpponentId(null);
      // Optionally show a message to the user
    });

    socket.on('quiz_result', (data) => {
      console.log('Quiz result received:', data);
      setResult(data);
    });

    // Cleanup
    return () => {
      socket.off('waiting');
      socket.off('matched');
      socket.off('opponent_answer');
      socket.off('opponent_disconnected');
      socket.off('quiz_result');
    };
  }, [socket, quizId]);

  // Emit quiz_complete when all questions are answered
  useEffect(() => {
    if (
      socket &&
      questions.length > 0 &&
      selectedAnswers.every((a) => a !== null) &&
      !quizComplete &&
      status === 'matched'
    ) {
      console.log('Emitting quiz_complete');
      setQuizComplete(true);
      socket.emit('quiz_complete', {
        quizId,
        answers: selectedAnswers,
      });
    }
  }, [selectedAnswers, questions.length, quizComplete, quizId, socket, status]);

  const handleAnswer = (questionIdx: number, optionIdx: number) => {
    if (selectedAnswers[questionIdx] !== null || !socket) return;
    
    setSelectedAnswers(prev => {
      const updated = [...prev];
      updated[questionIdx] = optionIdx;
      return updated;
    });

    socket.emit('answer', { quizId, questionIdx, optionIdx });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Loading quiz...</div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-6">Quiz Result</h1>
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full text-center">
          <div className="text-xl font-semibold mb-2">Your Score: {result.yourScore}</div>
          <div className="text-lg mb-2">Opponent Score: {result.opponentScore}</div>
          <div className={`text-lg font-bold mb-4 ${
            result.winner === 'you' ? 'text-green-600' : 
            result.winner === 'draw' ? 'text-gray-600' : 
            'text-red-600'
          }`}>
            {result.winner === 'you' ? 'You Win!' : 
             result.winner === 'draw' ? 'Draw!' : 
             'You Lose!'}
          </div>
          <div className="text-left mt-4">
            <div className="font-semibold mb-2">Correct Answers:</div>
            <ul className="list-disc ml-6">
              {result.correctAnswers.map((ans: number, idx: number) => (
                <li key={idx}>Q{idx + 1}: Option {ans + 1}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">Battle Quiz</h1>
      
      {status === 'idle' && (
        <div className="text-lg text-gray-700">Connecting to battle server...</div>
      )}
      
      {status === 'waiting' && (
        <div className="text-lg text-gray-700">
          <div className="animate-pulse">Waiting for opponent...</div>
          <div className="text-sm text-gray-500 mt-2">Please keep this window open</div>
        </div>
      )}
      
      {status === 'matched' && (
        <div className="w-full max-w-xl">
          <div className="text-lg text-green-600 font-semibold mb-4">
            Matched! Opponent found.
          </div>
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={q.id || idx} className="bg-white rounded-lg shadow-md p-4">
                <div className="font-semibold mb-2">
                  Q{idx + 1}: {q.question}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((opt: string, oIdx: number) => (
                    <button
                      key={oIdx}
                      className={`border rounded-lg px-4 py-2 text-left transition-colors
                        ${selectedAnswers[idx] === oIdx 
                          ? 'bg-blue-200 border-blue-500 font-bold' 
                          : 'hover:bg-blue-50 border-gray-200'}`}
                      onClick={() => handleAnswer(idx, oIdx)}
                      disabled={selectedAnswers[idx] !== null}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {selectedAnswers[idx] !== null && (
                  <div className="mt-2 text-green-700 font-semibold">
                    You answered: {q.options[selectedAnswers[idx] as number]}
                  </div>
                )}
                {opponentAnswers[idx] && (
                  <div className="mt-1 text-blue-600 text-sm">
                    Opponent has answered!
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 