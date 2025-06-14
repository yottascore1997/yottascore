"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { jwtDecode } from 'jwt-decode';

interface Exam {
  id: string;
  title: string;
  description: string;
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
      setLeaderboardLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/student/practice-exams/${examId}/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setLeaderboard(data);
      } catch (e) {
        setLeaderboard([]);
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
          onClick={() => setActiveTab('leaderboard')}
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
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
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
          <div className="bg-white rounded-lg shadow p-4">
            {leaderboardLoading ? (
              <div className="text-center text-gray-500">Loading leaderboard...</div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <div>
                <div className="grid grid-cols-3 text-sm font-semibold mb-2">
                  <div>Rank</div>
                  <div>Name</div>
                  <div>Score</div>
                </div>
                <div className="divide-y">
                  {leaderboard.map((row, i) => (
                    <div
                      key={i}
                      className={`grid grid-cols-3 py-2 items-center ${row.userId === userId ? 'bg-blue-50 font-bold' : ''}`}
                    >
                      <div>#{row.rank}</div>
                      <div>{row.name}</div>
                      <div>{row.score}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">No leaderboard data yet.</div>
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