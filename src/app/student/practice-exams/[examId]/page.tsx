"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { jwtDecode } from 'jwt-decode';

interface Exam {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  category: string;
  subcategory: string;
  startTime: string;
  endTime?: string;
  duration: number;
  spots: number;
  spotsLeft: number;
  attempted: boolean;
}

export default function PracticeExamDetailPage() {
  const router = useRouter();
  const params = useParams();
  const examId = typeof params.examId === "string" ? params.examId : Array.isArray(params.examId) ? params.examId[0] : "";
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'leaderboard' | 'attempts'>('info');
  const [leaderboard, setLeaderboard] = useState<any[] | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [attempt, setAttempt] = useState<any | null>(null);
  const [attemptLoading, setAttemptLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Set tab from query param
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const tab = url.searchParams.get('tab');
      if (tab === 'leaderboard' || tab === 'attempts' || tab === 'info') {
        setActiveTab(tab);
      }
    }
  }, []);

  // Get userId from JWT
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUserId(decoded.userId);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!examId) return;
    const fetchExam = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      const res = await fetch(`/api/student/practice-exams/${examId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        router.push('/student/practice-exams');
        return;
      }
      const data = await res.json();
      setExam(data);
      setLoading(false);
    };
    fetchExam();
  }, [examId, router]);

  // Fetch leaderboard
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchLeaderboard = async () => {
      console.log('Fetching leaderboard for exam:', examId, 'Active tab:', activeTab);
      setLeaderboardLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found');
          setLeaderboard([]);
          return;
        }
        const res = await fetch(`/api/student/practice-exams/${examId}/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          console.log('Leaderboard API error:', res.status);
          setLeaderboard([]);
          return;
        }
        const data = await res.json();
        console.log('Leaderboard data received:', data);
        setLeaderboard(data);
      } catch (e) {
        console.error('Leaderboard fetch error:', e);
        setLeaderboard([]);
      } finally {
        setLeaderboardLoading(false);
      }
    };
    
    if (activeTab === 'leaderboard' && examId) {
      console.log('Starting leaderboard fetch...');
      fetchLeaderboard();
      interval = setInterval(fetchLeaderboard, 10000);
    }
    
    return () => {
      if (interval) {
        console.log('Clearing leaderboard interval');
        clearInterval(interval);
      }
    };
  }, [activeTab, examId]);

  // Fetch attempt
  useEffect(() => {
    if (activeTab !== 'attempts' || !examId) return;
    setAttemptLoading(true);
    const fetchAttempt = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/student/practice-exams/${examId}/attempts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setAttempt(data);
      } catch (e) {
        setAttempt(null);
      } finally {
        setAttemptLoading(false);
      }
    };
    fetchAttempt();
  }, [activeTab, examId]);

  // Manual refresh function for leaderboard
  const refreshLeaderboard = async () => {
    if (!examId) return;
    console.log('Manual refresh triggered');
    setLeaderboardLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLeaderboard([]);
        return;
      }
      const res = await fetch(`/api/student/practice-exams/${examId}/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        setLeaderboard([]);
        return;
      }
      const data = await res.json();
      console.log('Manual refresh - Leaderboard data:', data);
      setLeaderboard(data);
    } catch (e) {
      console.error('Manual refresh error:', e);
      setLeaderboard([]);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  if (loading || !exam) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-blue-50 rounded-b-3xl shadow p-6 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold flex-1 truncate">{exam.title}</h1>
          <span className="text-2xl">📝</span>
        </div>
        <div className="text-sm text-gray-600 mb-2">Category: {exam.category} / {exam.subcategory}</div>
        <div className="flex items-center gap-4 text-xs mb-2">
          <span className="font-semibold">Duration:</span> {exam.duration} mins
          <span className="font-semibold">Spots:</span> {exam.spots}
          <span className="font-semibold">Spots Left:</span> {exam.spotsLeft}
          <span className="ml-auto text-xs text-blue-500">Start: {new Date(exam.startTime).toLocaleString()}</span>
          <span className="text-xs text-blue-500">End: {exam.endTime ? new Date(exam.endTime).toLocaleString() : '-'}</span>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-4 px-6 mb-4">
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${activeTab === 'info' ? 'bg-blue-700 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-blue-100'}`}
          onClick={() => setActiveTab('info')}
        >
          Info
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${activeTab === 'leaderboard' ? 'bg-blue-700 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-blue-100'}`}
          onClick={() => {
            console.log('Leaderboard tab clicked, current activeTab:', activeTab);
            setActiveTab('leaderboard');
            console.log('Setting activeTab to leaderboard');
          }}
        >
          Leaderboard
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${activeTab === 'attempts' ? 'bg-blue-700 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-blue-100'}`}
          onClick={() => setActiveTab('attempts')}
        >
          Attempts
        </button>
      </div>
      <div className="flex-1 px-6 pb-32">
        {activeTab === 'info' && (
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            {exam.instructions && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">📋 Exam Instructions</h3>
                <div className="text-sm text-blue-700 whitespace-pre-wrap">{exam.instructions}</div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="font-semibold">Description:</span> {exam.description}</div>
              <div><span className="font-semibold">Start Time:</span> {new Date(exam.startTime).toLocaleString()}</div>
              <div><span className="font-semibold">End Time:</span> {exam.endTime ? new Date(exam.endTime).toLocaleString() : '-'}</div>
              <div><span className="font-semibold">Duration:</span> {exam.duration} mins</div>
              <div><span className="font-semibold">Spots:</span> {exam.spots}</div>
              <div><span className="font-semibold">Spots Left:</span> {exam.spotsLeft}</div>
            </div>
          </div>
        )}
        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">🏆 Leaderboard</h3>
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-500">
                  {leaderboardLoading ? 'Updating...' : `${leaderboard?.length || 0} participants`}
                </div>
                <button
                  onClick={refreshLeaderboard}
                  disabled={leaderboardLoading}
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <svg className={`w-4 h-4 ${leaderboardLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
              </div>
            </div>
            
            {leaderboardLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading leaderboard...</p>
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-3">
                {/* Top 3 Podium */}
                {leaderboard.slice(0, 3).length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center">🏅 Top Performers</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {/* 2nd Place */}
                      {leaderboard[1] && (
                        <div className="text-center">
                          <div className="relative mb-3">
                            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto flex items-center justify-center text-2xl">
                              🥈
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              2
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-gray-800 truncate">{leaderboard[1].name}</div>
                          <div className="text-lg font-bold text-gray-600">{leaderboard[1].score}%</div>
                          {leaderboard[1].userId === userId && (
                            <div className="text-xs text-blue-600 font-medium mt-1">You</div>
                          )}
                        </div>
                      )}
                      
                      {/* 1st Place */}
                      {leaderboard[0] && (
                        <div className="text-center">
                          <div className="relative mb-3">
                            <div className="w-20 h-20 bg-yellow-200 rounded-full mx-auto flex items-center justify-center text-3xl">
                              🥇
                            </div>
                            <div className="absolute -top-1 -right-1 w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              1
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-gray-800 truncate">{leaderboard[0].name}</div>
                          <div className="text-xl font-bold text-yellow-600">{leaderboard[0].score}%</div>
                          {leaderboard[0].userId === userId && (
                            <div className="text-xs text-blue-600 font-medium mt-1">You</div>
                          )}
                        </div>
                      )}
                      
                      {/* 3rd Place */}
                      {leaderboard[2] && (
                        <div className="text-center">
                          <div className="relative mb-3">
                            <div className="w-16 h-16 bg-orange-200 rounded-full mx-auto flex items-center justify-center text-2xl">
                              🥉
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              3
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-gray-800 truncate">{leaderboard[2].name}</div>
                          <div className="text-lg font-bold text-orange-600">{leaderboard[2].score}%</div>
                          {leaderboard[2].userId === userId && (
                            <div className="text-xs text-blue-600 font-medium mt-1">You</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Full Leaderboard */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">📊 Complete Rankings</h4>
                  <div className="space-y-2">
                    {leaderboard.map((row, i) => {
                      const isCurrentUser = row.userId === userId;
                      const isTop3 = i < 3;
                      
                      return (
                        <div
                          key={i}
                          className={`relative p-4 rounded-xl border transition-all duration-200 ${
                            isCurrentUser 
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md' 
                              : 'bg-white border-gray-100 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            {/* Rank */}
                            <div className="flex-shrink-0">
                              {isTop3 ? (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                  i === 0 ? 'bg-yellow-500' : 
                                  i === 1 ? 'bg-gray-400' : 'bg-orange-400'
                                }`}>
                                  {i + 1}
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm">
                                  {i + 1}
                                </div>
                              )}
                            </div>
                            
                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                  {row.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-800 truncate">
                                    {row.name}
                                    {isCurrentUser && (
                                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                        You
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Score */}
                            <div className="flex-shrink-0 text-right">
                              <div className="text-lg font-bold text-gray-800">{row.score}%</div>
                              <div className="text-xs text-gray-500">Score</div>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Performance</span>
                              <span>{row.score}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  row.score >= 80 ? 'bg-green-500' :
                                  row.score >= 60 ? 'bg-yellow-500' :
                                  row.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(row.score, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* User's Position Summary */}
                {userId && leaderboard.find(row => row.userId === userId) && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600">Your Position</div>
                        <div className="text-2xl font-bold text-blue-600">
                          #{leaderboard.find(row => row.userId === userId)?.rank}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Your Score</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {leaderboard.find(row => row.userId === userId)?.score}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No leaderboard data yet</h3>
                <p className="text-gray-500">Be the first to attempt this exam and see your ranking!</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'attempts' && (
          <div className="bg-white rounded-lg shadow p-4">
            {attemptLoading ? (
              <div className="text-center text-gray-500">Loading attempt...</div>
            ) : attempt ? (
              <div>
                <div className="mb-2 font-semibold">Score: {attempt.score?.toFixed(2) ?? '-'}%</div>
                <div className="mb-2 text-sm text-gray-600">Completed: {attempt.completedAt ? new Date(attempt.completedAt).toLocaleString() : '-'}</div>
                <div className="mb-2 text-sm">Your Answers:</div>
                <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(attempt.answers, null, 2)}</pre>
              </div>
            ) : (
              <div className="text-center text-gray-400">No attempt data yet.</div>
            )}
          </div>
        )}
      </div>
      {/* Sticky Attempt Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-center z-10">
        <button
          className={`w-full max-w-md py-3 rounded-lg font-bold text-lg shadow transition-colors ${exam.attempted ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-700 text-white hover:bg-blue-800'}`}
          disabled={exam.attempted}
          onClick={async () => {
            if (exam.attempted) return;
            const token = localStorage.getItem('token');
            const res = await fetch('/api/student/practice-exams/join', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ examId: exam.id }),
            });
            if (res.ok) {
              router.push(`/student/practice-exams/${exam.id}/attempt`);
            } else {
              const data = await res.json();
              alert(data.error || 'Failed to join exam');
            }
          }}
        >
          {exam.attempted ? 'Already Attempted' : 'Attempt'}
        </button>
      </div>
    </div>
  );
} 