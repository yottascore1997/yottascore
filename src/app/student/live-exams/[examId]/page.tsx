'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FaTrophy, FaRupeeSign } from 'react-icons/fa';
import { GiFlexibleStar } from 'react-icons/gi';
import { jwtDecode } from 'jwt-decode';

interface Exam {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime?: string;
  duration: number;
  spots: number;
  spotsLeft: number;
  entryFee: number;
  prizePool: number;
  isLive: boolean;
}

interface Question {
  id: string;
  text: string;
  options: string[];
}

interface Result {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  userId: string;
  score: number;
  timeTaken?: number | null;
  completedAt?: string | null;
  prizeAmount?: number;
}

interface LeaderboardResponse {
  currentUser: LeaderboardEntry | null;
  leaderboard: LeaderboardEntry[];
}

function getTimeLeft(endTime?: string) {
  if (!endTime) return '00:00:00';
  const end = new Date(endTime).getTime();
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) return '00:00:00';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatTimeTaken(seconds: number | null | undefined): string {
  if (!seconds) return 'N/A';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

export default function LiveExamDetailPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params && typeof params.examId === 'string' ? params.examId : Array.isArray(params?.examId) ? params.examId[0] : '';
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'leaderboard' | 'winnings' | 'attempts'>('info');
  const [now, setNow] = useState(Date.now());

  // Tab data states
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [winnings, setWinnings] = useState<any[] | null>(null);
  const [winningsLoading, setWinningsLoading] = useState(false);
  const [attempt, setAttempt] = useState<any | null>(null);
  const [attemptLoading, setAttemptLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) return;
    const fetchExam = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      const res = await fetch(`/api/student/live-exams/${examId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        router.push('/student/dashboard');
        return;
      }
      const data = await res.json();
      setExam(data);
      setLoading(false);
    };
    fetchExam();
  }, [examId, router]);

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
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh leaderboard every 10s if tab is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchLeaderboard = async () => {
      setLeaderboardLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/student/live-exams/${examId}/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setLeaderboard(data);
      } catch (e) {
        setLeaderboard(null);
      } finally {
        setLeaderboardLoading(false);
      }
    };
    if (activeTab === 'leaderboard' && examId) {
      fetchLeaderboard();
      interval = setInterval(fetchLeaderboard, 10000);
    }
    return () => interval && clearInterval(interval);
  }, [activeTab, examId]);

  // Fetch winnings
  useEffect(() => {
    if (activeTab !== 'winnings' || !examId) return;
    setWinningsLoading(true);
    const fetchWinnings = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/student/live-exams/${examId}/winnings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setWinnings(data);
      } catch (e) {
        setWinnings([]);
      } finally {
        setWinningsLoading(false);
      }
    };
    fetchWinnings();
  }, [activeTab, examId]);

  // Fetch attempts (also on mount for button state)
  useEffect(() => {
    if (!examId) return;
    setAttemptLoading(true);
    const fetchAttempt = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/student/live-exams/${examId}/attempts`, {
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

  const handleStartExam = async () => {
    setQuestionsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // First check if user is a participant
      const participantRes = await fetch(`/api/student/live-exams/${examId}/participant`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!participantRes.ok) {
        throw new Error('You are not a participant in this exam');
      }

      // Fetch questions for this exam
      const res = await fetch(`/api/student/live-exams/${examId}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Could not fetch questions');
      }

      const data = await res.json();
      setQuestions(data);
      setStarted(true);
    } catch (error) {
      console.error('Error starting exam:', error);
      alert(error instanceof Error ? error.message : 'Failed to start exam');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = async () => {
    if (!exam) return;
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/student/live-exams/${examId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers })
      });

      if (!response.ok) {
        throw new Error('Failed to submit answers');
      }

      const result = await response.json();
      
      // Store result in localStorage for the result page
      localStorage.setItem(`liveExamResult_${examId}`, JSON.stringify(result));
      
      // Redirect to beautiful result page
      router.push(`/student/live-exams/${examId}/result`);
    } catch (error) {
      console.error('Error submitting answers:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit answers');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!exam) return <div className="min-h-screen flex items-center justify-center">Exam not found.</div>;

  // HEADER UI
  const totalSpots = exam.spots;
  const spotsLeft = exam.spotsLeft;
  const percent = totalSpots ? (spotsLeft / totalSpots) * 100 : 0;
  const timeLeft = getTimeLeft(exam.endTime);

  // If exam started (questions loaded and not completed), show questions UI
  if (questions.length > 0 && !(attempt && attempt.completedAt)) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">{exam.title}</h1>
        <div className="mb-6">Exam Started!</div>
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="p-4 border rounded">
              <div className="font-semibold mb-2">Q{idx + 1}: {q.text}</div>
              <ul className="space-y-2">
                {q.options.map((opt, i) => (
                  <li key={i} className="flex items-center">
                    <input
                      type="radio"
                      name={`q${q.id}`}
                      id={`q${q.id}_opt${i}`}
                      className="mr-2"
                      checked={answers[q.id] === i}
                      onChange={() => handleAnswerSelect(q.id, i)}
                    />
                    <label htmlFor={`q${q.id}_opt${i}`}>{opt}</label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="mt-6">
            <button
              className="w-full px-6 py-2 bg-primary text-white rounded"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-purple-50 rounded-b-3xl shadow p-6 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold flex-1 truncate">{exam.title}</h1>
          <span className="text-2xl">🏆</span>
        </div>
        <div className="text-sm text-gray-600 mb-2">Prize Pool</div>
        <div className="text-3xl font-extrabold text-purple-800 flex items-center mb-2">
          <FaRupeeSign className="mr-1" />{exam.prizePool}<span className="text-lg">*</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full ${percent > 50 ? 'bg-blue-400' : percent > 20 ? 'bg-orange-400' : 'bg-red-400'}`}
              style={{ width: `${percent}%` }}
            ></div>
          </div>
          <span className={`text-xs font-semibold ${percent > 20 ? 'text-orange-700' : 'text-red-600'}`}>{spotsLeft} Spots left</span>
          <span className="text-xs text-gray-400 ml-2">/ {totalSpots} Spots</span>
        </div>
        <div className="flex items-center gap-4 text-xs mb-2">
          <span className="flex items-center gap-1"><FaTrophy className="text-yellow-500" /> {exam.entryFee}</span>
          <span className="flex items-center gap-1"><FaTrophy className="text-yellow-500" /> 50%</span>
          <span className="flex items-center gap-1"><GiFlexibleStar className="text-purple-500" /> Flexible</span>
          <span className="ml-auto text-xs text-orange-500">Remaining time: {timeLeft}</span>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-4">
        <button onClick={() => setActiveTab('info')} className={`px-4 py-2 rounded-full text-sm font-semibold ${activeTab === 'info' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Info</button>
        <button onClick={() => setActiveTab('leaderboard')} className={`px-4 py-2 rounded-full text-sm font-semibold ${activeTab === 'leaderboard' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Leaderboard</button>
        <button onClick={() => setActiveTab('winnings')} className={`px-4 py-2 rounded-full text-sm font-semibold ${activeTab === 'winnings' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Winnings</button>
        <button onClick={() => setActiveTab('attempts')} className={`px-4 py-2 rounded-full text-sm font-semibold ${activeTab === 'attempts' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Attempts</button>
      </div>
      {/* Tab Content */}
      <div className="flex-1 px-4 pb-32">
        {activeTab === 'info' && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-semibold">Description:</span> {exam.description}</div>
              <div><span className="font-semibold">Start Time:</span> {new Date(exam.startTime).toLocaleString()}</div>
              <div><span className="font-semibold">End Time:</span> {exam.endTime ? new Date(exam.endTime).toLocaleString() : '-'}</div>
              <div><span className="font-semibold">Duration:</span> {exam.duration} mins</div>
              <div><span className="font-semibold">Spots:</span> {exam.spots}</div>
              <div><span className="font-semibold">Entry Fee:</span> ₹{exam.entryFee}</div>
              <div><span className="font-semibold">Prize Pool:</span> ₹{exam.prizePool}</div>
              <div><span className="font-semibold">Status:</span> {exam.isLive ? 'Live' : 'Not Live'}</div>
            </div>
          </div>
        )}
        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-lg shadow p-4">
            {leaderboardLoading ? (
              <div className="text-center text-gray-500">Loading leaderboard...</div>
            ) : leaderboard && leaderboard.currentUser ? (
              <div className="space-y-6">
                {/* Current User's Rank - Highlighted at Top */}
                <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-4 border-2 border-purple-300">
                  <div className="text-center mb-3">
                    <h3 className="text-lg font-bold text-purple-800 mb-1">Your Rank</h3>
                    <div className="text-2xl font-extrabold text-purple-900">#{leaderboard.currentUser.rank}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-sm text-gray-600">Name</div>
                      <div className="font-semibold text-purple-800">{leaderboard.currentUser.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Score</div>
                      <div className="font-semibold text-purple-800">{leaderboard.currentUser.score}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Time Taken</div>
                      <div className="font-semibold text-purple-800">
                        {formatTimeTaken(leaderboard.currentUser.timeTaken)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Prize</div>
                      <div className="font-semibold text-green-700 flex items-center justify-center">
                        {leaderboard.currentUser.prizeAmount && leaderboard.currentUser.prizeAmount > 0 ? (
                          <>
                            <FaRupeeSign className="mr-1" />
                            {leaderboard.currentUser.prizeAmount}
                          </>
                        ) : (
                          '-'
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full Leaderboard */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Complete Leaderboard</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left">Rank</th>
                        <th className="py-2 text-left">Name</th>
                        <th className="py-2 text-left">Score</th>
                        <th className="py-2 text-left">Time Taken</th>
                        <th className="py-2 text-left">Prize</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.leaderboard.map((row, i) => (
                        <tr key={i} className={`border-b ${userId && row.userId === userId ? 'bg-purple-100 font-bold' : ''}`}>
                          <td className="py-2">#{row.rank}</td>
                          <td className="py-2">{row.name}</td>
                          <td className="py-2">{row.score}</td>
                          <td className="py-2">{formatTimeTaken(row.timeTaken)}</td>
                          <td className="py-2 flex items-center">
                            {(row.prizeAmount ?? 0) > 0 ? (
                              <>
                                <FaRupeeSign className="mr-1 text-green-600" />
                                {row.prizeAmount}
                              </>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : leaderboard && leaderboard.leaderboard && leaderboard.leaderboard.length > 0 ? (
              // Fallback for old API structure or when user hasn't participated
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Rank</th>
                    <th className="py-2 text-left">Name</th>
                    <th className="py-2 text-left">Score</th>
                    <th className="py-2 text-left">Time Taken</th>
                    <th className="py-2 text-left">Prize</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.leaderboard.map((row, i) => (
                    <tr key={i} className={`border-b ${userId && row.userId === userId ? 'bg-purple-100 font-bold' : ''}`}>
                      <td className="py-2">#{row.rank}</td>
                      <td className="py-2">{row.name}</td>
                      <td className="py-2">{row.score}</td>
                      <td className="py-2">{formatTimeTaken(row.timeTaken)}</td>
                      <td className="py-2 flex items-center">
                        {(row.prizeAmount ?? 0) > 0 ? (
                          <>
                            <FaRupeeSign className="mr-1 text-green-600" />
                            {row.prizeAmount}
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center text-gray-400">No leaderboard data yet.</div>
            )}
          </div>
        )}
        {activeTab === 'winnings' && (
          <div className="bg-white rounded-lg shadow p-4">
            {winningsLoading ? (
              <div className="text-center text-gray-500">Loading winnings...</div>
            ) : winnings && winnings.length > 0 ? (
              <div>
                <div className="grid grid-cols-2 text-sm font-semibold mb-2">
                  <div>Rank</div>
                  <div>Prize</div>
                </div>
                <div className="space-y-3">
                  {winnings.map((row, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 shadow-sm">
                      <div className="font-bold text-lg">#{row.rank}</div>
                      <div className="flex items-center text-green-700 text-lg font-bold">
                        <FaRupeeSign className="mr-1" />{row.prize}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">No winnings data yet.</div>
            )}
          </div>
        )}
        {activeTab === 'attempts' && (
          <div className="bg-white rounded-lg shadow p-4">
            {attemptLoading ? (
              <div className="text-center text-gray-500">Loading your attempt...</div>
            ) : attempt ? (
              <div>
                <div className="mb-2"><span className="font-semibold">Score:</span> {attempt.score ?? '-'}</div>
                <div className="mb-2"><span className="font-semibold">Completed At:</span> {attempt.completedAt ? new Date(attempt.completedAt).toLocaleString() : '-'}</div>
                <div className="mb-2"><span className="font-semibold">Answers:</span> {attempt.answers ? JSON.stringify(attempt.answers) : '-'}</div>
              </div>
            ) : (
              <div className="text-center text-gray-400">No attempt found.</div>
            )}
          </div>
        )}
      </div>
      {/* Sticky Attempt Button */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 flex justify-end z-10">
        <button
          className="px-8 py-3 bg-purple-600 text-white rounded-full font-bold text-lg shadow-lg hover:bg-purple-700 transition"
          onClick={handleStartExam}
          disabled={questionsLoading || !exam.isLive || spotsLeft === 0 || (attempt && attempt.completedAt)}
        >
          {attempt && attempt.completedAt ? 'Already Attempted' : questionsLoading ? 'Starting...' : `Attempt ₹${exam.entryFee}`}
        </button>
      </div>
    </div>
  );
} 