"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';

interface BattleQuiz {
  id: string;
  title: string;
  description: string;
  entryAmount: number;
  category?: {
    id: string;
    name: string;
    color: string;
  };
  questionCount: number;
  isActive: boolean;
  createdAt: string;
  _count?: {
    participants: number;
    winners: number;
  };
}

interface User {
  id: string;
  name: string;
  wallet: number;
}

export default function BattleQuizList() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<BattleQuiz[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes();
    fetchUserProfile();
  }, []);

  // Debug log for quizzes state
  useEffect(() => {
    console.log('Quizzes state:', quizzes);
  }, [quizzes]);

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/student/battle-quiz', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data); // Debug log
        // Handle the response structure: { quizzes: [], walletBalance: number }
        setQuizzes(data.quizzes || []);
        // Update user wallet if available
        if (data.walletBalance !== undefined && user) {
          setUser(prev => prev ? { ...prev, wallet: data.walletBalance } : null);
        }
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData); // Debug log
        setError('Failed to fetch quizzes');
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setError('Failed to fetch quizzes');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

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

  const handleJoinQuiz = (quiz: BattleQuiz) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.wallet < quiz.entryAmount) {
      alert(`Insufficient balance! You need ₹${quiz.entryAmount} but have ₹${user.wallet}`);
      return;
    }

    router.push(`/student/battle-quiz/${quiz.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Battle Quizzes...</p>
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
            onClick={fetchQuizzes}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
        >
            Try Again
        </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-200/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Battle Quizzes</h1>
              <p className="text-gray-600 mt-1">Challenge other players in real-time battles!</p>
            </div>
            
            {user && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl">
                <div className="text-sm font-medium">Wallet Balance</div>
                <div className="text-2xl font-bold">₹{user.wallet}</div>
              </div>
      )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!Array.isArray(quizzes) || quizzes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Battle Quizzes Available</h2>
            <p className="text-gray-600">Check back later for new challenges!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Quiz Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                      {quiz.category?.name}
                    </span>
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                      quiz.isActive 
                        ? 'bg-green-500/20 text-green-100' 
                        : 'bg-red-500/20 text-red-100'
                    }`}>
                      {quiz.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{quiz.title}</h3>
                  <p className="text-purple-100 text-sm">{quiz.description}</p>
                </div>

                {/* Quiz Details */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{quiz.questionCount}</div>
                      <div className="text-sm text-gray-600">Questions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">20s</div>
                      <div className="text-sm text-gray-600">Per Question</div>
                    </div>
                  </div>

                  {/* Entry Fee & Prize */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                          ₹
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Entry Fee</div>
                          <div className="font-bold text-red-600">₹{quiz.entryAmount}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                          🏆
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Prize Pool</div>
                          <div className="font-bold text-green-600">₹{(quiz.entryAmount * 2 * 0.85).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleJoinQuiz(quiz)}
                    disabled={!quiz.isActive || (user ? user.wallet < quiz.entryAmount : false)}
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
                      !quiz.isActive
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : user && user.wallet < quiz.entryAmount
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                    }`}
                  >
                    {!quiz.isActive 
                      ? 'Quiz Inactive' 
                      : user && user.wallet < quiz.entryAmount
                      ? `Need ₹${quiz.entryAmount - (user?.wallet || 0)} more`
                      : 'Join Battle'
                    }
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
      </div>
    </div>
  );
} 