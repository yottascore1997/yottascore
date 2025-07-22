"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Users, 
  Trophy, 
  Clock, 
  Zap, 
  Crown, 
  Target, 
  Gamepad2,
  Copy,
  Share2,
  Plus,
  ArrowRight,
  Star,
  TrendingUp
} from "lucide-react";

interface User {
  id: string;
  name: string;
  wallet: number;
  battleStats?: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
    level: number;
    currentStreak: number;
    totalPrizeMoney: number;
  };
}

interface Category {
  id: string;
  name: string;
  color: string;
  questionCount: number;
}

interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    name: string;
    profilePhoto?: string;
  };
  stats: {
    wins: number;
    totalMatches: number;
    winRate: number;
    level: number;
    currentStreak: number;
  };
}

export default function BattleQuizHomepage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfile();
    fetchCategories();
    fetchLeaderboard();
  }, []);

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

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/question-categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        console.error('Failed to fetch categories:', response.status);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/battle-quiz/leaderboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMatch = (categoryId?: string) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const params = new URLSearchParams();
    if (categoryId) {
      params.append('category', categoryId);
    }
    params.append('mode', 'quick');
    
    router.push(`/student/battle-quiz/matchmaking?${params.toString()}`);
  };

  const handleCreatePrivateRoom = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/battle-quiz/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          categoryId: selectedCategory,
          timePerQuestion: 15,
          questionCount: 10
        })
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/student/battle-quiz/room/${data.roomCode}`);
      }
    } catch (error) {
      console.error('Error creating private room:', error);
    }
  };

  const handleJoinPrivateRoom = () => {
    if (!roomCode.trim()) {
      alert('Please enter a room code');
      return;
    }
    router.push(`/student/battle-quiz/room/${roomCode.trim()}`);
  };

  const copyRoomCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Room code copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Battle Arena...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Battle Arena</h1>
              <p className="text-gray-600 mt-1">Challenge players in real-time quiz battles!</p>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                {/* User Stats */}
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-xl">
                  <div className="text-sm font-medium">Level {user.battleStats?.level || 1}</div>
                  <div className="text-xs opacity-90">{user.battleStats?.wins || 0} Wins</div>
                </div>
                
                {/* Wallet */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl">
                  <div className="text-sm font-medium">Wallet</div>
                  <div className="text-lg font-bold">₹{user.wallet}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Game Modes */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Match Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Quick Match</h2>
                    <p className="text-gray-600">Find opponents instantly</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Average Wait</div>
                  <div className="text-lg font-bold text-green-600">~30s</div>
                </div>
              </div>

              {/* Category Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Choose Category (Optional)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleQuickMatch()}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      !selectedCategory 
                        ? 'border-purple-500 bg-purple-50 text-purple-700' 
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-sm font-medium">Any Category</div>
                    <div className="text-xs text-gray-500">Random questions</div>
                  </button>
                  
                  {categories.map((category: Category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedCategory === category.id 
                          ? 'border-purple-500 bg-purple-50 text-purple-700' 
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="text-sm font-medium">{category.name}</div>
                      <div className="text-xs text-gray-500">{category.questionCount} questions</div>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => handleQuickMatch(selectedCategory || undefined)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg font-semibold"
              >
                <Gamepad2 className="w-5 h-5 mr-2" />
                Find Opponent
              </Button>
            </div>

            {/* Private Room Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Private Room</h2>
                  <p className="text-gray-600">Play with friends</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Create Room */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Create Room</h3>
                  <Button
                    onClick={() => setShowCreateRoom(!showCreateRoom)}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Private Room
                  </Button>
                  
                  {showCreateRoom && (
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium mb-2">Category</label>
                        <select 
                          value={selectedCategory || ''} 
                          onChange={(e) => setSelectedCategory(e.target.value || null)}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Any Category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        onClick={handleCreatePrivateRoom}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        Create & Share
                      </Button>
                    </div>
                  )}
                </div>

                {/* Join Room */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Join Room</h3>
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      placeholder="Enter room code"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleJoinPrivateRoom}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Join
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Game Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Real-time Battles</h3>
                    <p className="text-sm text-gray-600">15 seconds per question</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Live opponent progress</li>
                  <li>• Instant score updates</li>
                  <li>• Real-time leaderboards</li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Win Rewards</h3>
                    <p className="text-sm text-gray-600">Earn money & climb ranks</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Prize money for winners</li>
                  <li>• Experience points</li>
                  <li>• Level progression</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Leaderboard & Stats */}
          <div className="space-y-6">
            
            {/* User Stats */}
            {user?.battleStats && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Your Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Matches</span>
                    <span className="font-semibold">{user.battleStats.totalMatches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Win Rate</span>
                    <span className="font-semibold text-green-600">{(user.battleStats.winRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Streak</span>
                    <span className="font-semibold text-orange-600">{user.battleStats.currentStreak}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Winnings</span>
                    <span className="font-semibold text-green-600">₹{user.battleStats.totalPrizeMoney}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Global Leaderboard */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Top Players</h3>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              
              <div className="space-y-3">
                {leaderboard.slice(0, 10).map((entry: any, index: number) => (
                  <div key={entry.user.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-500 text-white' :
                      'bg-gray-200 text-gray-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{entry.user.name}</div>
                      <div className="text-xs text-gray-500">
                        Level {entry.stats.level} • {entry.stats.wins} wins
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600">
                        {(entry.stats.winRate * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.stats.currentStreak} streak
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button
                onClick={() => router.push('/student/battle-quiz/leaderboard')}
                variant="outline"
                className="w-full mt-4"
              >
                View Full Leaderboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 