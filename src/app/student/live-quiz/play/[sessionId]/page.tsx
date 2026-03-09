'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { Settings, Volume2, CheckCircle, XCircle, Trophy, Zap, ArrowLeft } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  correctCount: number;
  wrongCount: number;
  score: number;
  totalTimeMs: number;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correct: number;
  questionIndex: number;
}

interface Session {
  id: string;
  title: string;
  categoryId: string;
  status: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  timePerQuestion: number;
  startedAt: string | null;
}

export default function LiveQuizPlayPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;
  const { socket, isConnected } = useSocket();

  const [session, setSession] = useState<Session | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playingCount, setPlayingCount] = useState(0);
  const [myRank, setMyRank] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answered, setAnswered] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [questionEndsAt, setQuestionEndsAt] = useState<number | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<{
    selectedIndex: number;
    correctIndex: number;
    isCorrect: boolean;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSession = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token || !sessionId) return;
    try {
      const res = await fetch(`/api/student/live-quiz/session/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Session not found');
      const data = await res.json();
      setSession(data.session);
      setCurrentQuestion(data.currentQuestion);
      setLeaderboard(data.leaderboard || []);
      setPlayingCount(data.playingCount ?? 0);
      if (typeof data.myRank === 'number') setMyRank(data.myRank);
      if (data.myEntry) {
        setCorrectCount(data.myEntry.correctCount);
        setWrongCount(data.myEntry.wrongCount);
      } else {
        const me = (data.leaderboard || []).find(
          (e: LeaderboardEntry) => e.userId === (JSON.parse(atob(token.split('.')[1]))?.userId)
        );
        if (me) {
          setMyRank(me.rank);
          setCorrectCount(me.correctCount);
          setWrongCount(me.wrongCount);
        }
      }
      // Estimate endsAt for countdown if server didn't push yet
      if (data.session?.startedAt) {
        const startedAtMs = new Date(data.session.startedAt).getTime();
        const endsAt = startedAtMs + (data.session.currentQuestionIndex + 1) * (data.session.timePerQuestion ?? 10) * 1000;
        setQuestionEndsAt(endsAt);
      } else if (data.session?.timePerQuestion) {
        setQuestionEndsAt(Date.now() + data.session.timePerQuestion * 1000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserId(payload.userId || null);
    } catch (_) {}
    fetchSession();
  }, [fetchSession, router]);

  useEffect(() => {
    if (!socket || !isConnected || !session?.categoryId) return;
    socket.emit('live_quiz_join_category', { categoryId: session.categoryId });

    const onState = (data: {
      categoryId: string;
      session: Session;
      currentQuestion: Question | null;
      questionEndsAt?: number;
      leaderboard?: LeaderboardEntry[];
      playingCount?: number;
      allRanks?: Record<string, number>;
    }) => {
      if (data?.session) {
        setSession((prev) => (prev ? { ...prev, ...data.session } : data.session));
        if (data.session?.id && data.session.id !== sessionId) {
          router.replace(`/student/live-quiz/play/${data.session.id}`);
        }
      }
      setCurrentQuestion(data.currentQuestion ?? null);
      if (typeof data.questionEndsAt === 'number') setQuestionEndsAt(data.questionEndsAt);
      if (Array.isArray(data.leaderboard)) setLeaderboard(data.leaderboard);
      if (typeof data.playingCount === 'number') setPlayingCount(data.playingCount);
      const token = localStorage.getItem('token');
      if (token && typeof data.allRanks === 'object' && data.allRanks) {
        try {
          const uid = JSON.parse(atob(token.split('.')[1]))?.userId;
          if (uid && typeof data.allRanks[uid] === 'number') setMyRank(data.allRanks[uid]);
        } catch (_) {}
      }
    };

    const onRoundStarted = (data: {
      categoryId: string;
      session: Session;
      currentQuestion: Question | null;
      questionEndsAt?: number;
      leaderboard?: LeaderboardEntry[];
      playingCount?: number;
      allRanks?: Record<string, number>;
    }) => {
      setAnswered({});
      setAnswerFeedback(null);
      if (data?.session) {
        setSession(data.session);
        if (data.session?.id) router.replace(`/student/live-quiz/play/${data.session.id}`);
      }
      setCurrentQuestion(data.currentQuestion ?? null);
      if (typeof data.questionEndsAt === 'number') setQuestionEndsAt(data.questionEndsAt);
      if (Array.isArray(data.leaderboard)) setLeaderboard(data.leaderboard);
      if (typeof data.playingCount === 'number') setPlayingCount(data.playingCount);
      const token = localStorage.getItem('token');
      if (token && typeof data.allRanks === 'object' && data.allRanks) {
        try {
          const uid = JSON.parse(atob(token.split('.')[1]))?.userId;
          if (uid && typeof data.allRanks[uid] === 'number') setMyRank(data.allRanks[uid]);
        } catch (_) {}
      }
    };

    const onLeaderboard = (data: { leaderboard: LeaderboardEntry[]; playingCount?: number; allRanks?: Record<string, number> }) => {
      setLeaderboard(data.leaderboard || []);
      if (typeof data.playingCount === 'number') setPlayingCount(data.playingCount);
      const token = localStorage.getItem('token');
      if (token && data.leaderboard?.length) {
        try {
          const uid = JSON.parse(atob(token.split('.')[1]))?.userId;
          const me = data.leaderboard.find((e) => e.userId === uid);
          if (me) {
            setMyRank(me.rank);
            setCorrectCount(me.correctCount);
            setWrongCount(me.wrongCount);
          }
        } catch (_) {}
      }
      if (typeof data.allRanks === 'object' && data.allRanks && token) {
        try {
          const uid = JSON.parse(atob(token.split('.')[1]))?.userId;
          if (uid && typeof data.allRanks[uid] === 'number') setMyRank(data.allRanks[uid]);
        } catch (_) {}
      }
    };

    const onCount = (data: { playingCount: number; categoryId?: string; sessionId?: string }) => {
      if (typeof data.playingCount === 'number') setPlayingCount(data.playingCount);
    };

    const onNext = (data: { currentQuestion: Question | null; session?: Session; questionEndsAt?: number }) => {
      setCurrentQuestion(data.currentQuestion ?? null);
      if (data.session) {
        setSession((prev) => (prev ? { ...prev, ...data.session } : (data.session as Session)));
      }
      if (typeof data.questionEndsAt === 'number') setQuestionEndsAt(data.questionEndsAt);
      setAnswerFeedback(null);
    };
    socket.on('live_quiz_state', onState);
    socket.on('live_quiz_round_started', onRoundStarted);
    socket.on('live_quiz_leaderboard', onLeaderboard);
    socket.on('live_quiz_playing_count', onCount);
    socket.on('live_quiz_next_question', onNext);
    return () => {
      socket.off('live_quiz_state', onState);
      socket.off('live_quiz_round_started', onRoundStarted);
      socket.off('live_quiz_leaderboard', onLeaderboard);
      socket.off('live_quiz_playing_count', onCount);
      socket.off('live_quiz_next_question', onNext);
      socket.emit('live_quiz_leave_category', { categoryId: session.categoryId });
    };
  }, [socket, isConnected, session?.categoryId, router, sessionId]);

  useEffect(() => {
    if (!session || session.status !== 'PLAYING' || !currentQuestion || !questionEndsAt) return;
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    const tick = () => {
      const left = Math.max(0, Math.ceil((questionEndsAt - Date.now()) / 1000));
      setTimeLeft(left);
    };
    tick();
    questionTimerRef.current = setInterval(tick, 250);
    return () => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    };
  }, [session?.id, session?.status, currentQuestion?.questionIndex, questionEndsAt]);

  const handleAnswer = async (optionIndex: number) => {
    const token = localStorage.getItem('token');
    if (!token || !session || !currentQuestion) return;
    if (answered[currentQuestion.questionIndex] !== undefined) return;
    if (submitting) return;
    setSubmitting(true);
    const now = Date.now();
    const timePerMs = (session.timePerQuestion ?? 10) * 1000;
    const remainingMs = questionEndsAt ? Math.max(0, questionEndsAt - now) : 0;
    const timeSpentMs = Math.max(0, timePerMs - remainingMs);
    setAnswered((prev) => ({ ...prev, [currentQuestion.questionIndex]: optionIndex }));

    try {
      const res = await fetch(`/api/student/live-quiz/session/${session.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionIndex: currentQuestion.questionIndex,
          answerIndex: optionIndex,
          timeSpentMs,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 400 && (data.error?.toLowerCase?.().includes('already') || data.error?.toLowerCase?.().includes('answered'))) {
          fetchSession();
        } else {
          alert('Submit failed. Please try again.');
        }
        return;
      }
      setLeaderboard(data.leaderboard || []);
      setPlayingCount(data.playingCount ?? 0);
      if (typeof data.myRank === 'number') setMyRank(data.myRank);
      if (data.myEntry) {
        setCorrectCount(data.myEntry.correctCount);
        setWrongCount(data.myEntry.wrongCount);
      } else {
        const me = (data.leaderboard || []).find((e: LeaderboardEntry) => e.userId === userId);
        if (me) {
          setMyRank(me.rank);
          setCorrectCount(me.correctCount);
          setWrongCount(me.wrongCount);
        }
      }
      if (socket) {
        socket.emit('live_quiz_refresh_leaderboard', {
          categoryId: session.categoryId,
          sessionId: session.id,
        });
      }

      const correctIndex = currentQuestion.correct ?? 0;
      setAnswerFeedback({
        selectedIndex: optionIndex,
        correctIndex,
        isCorrect: data.isCorrect === true,
      });
    } catch (_) {
      alert('Submit failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full border-4 border-violet-500/30 border-t-violet-400 animate-spin mb-6" />
        <p className="text-violet-300/90 text-lg font-medium">Quiz load ho raha hai...</p>
        <p className="text-slate-500 text-sm mt-1">Thoda wait karein</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Kuch galat ho gaya</h2>
          <p className="text-slate-400 mb-6">{error || 'Session not found'}</p>
          <Link href="/student/live-quiz">
            <Button className="w-full bg-violet-600 hover:bg-violet-500 text-white h-12 rounded-2xl font-semibold">
              <ArrowLeft className="w-4 h-4 mr-2" /> Wapas Live Quiz par jayein
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (session.status === 'FINISHED') {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Result card - full width design */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-violet-600/40 to-violet-900/30 border border-violet-500/30 p-8">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-400/10 to-transparent" />
            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-400/20 border-2 border-amber-400/50 mb-6">
                <Trophy className="w-12 h-12 text-amber-400" />
              </div>
              <h1 className="text-3xl font-black text-white mb-1">Quiz khatam!</h1>
              <p className="text-slate-400 mb-8">Aapka score</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Aapka Rank</p>
                  <p className="text-3xl font-black text-white">#{myRank || '-'}</p>
                </div>
                <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Score</p>
                  <p className="text-3xl font-black text-green-400">{correctCount}</p>
                </div>
                <div className="bg-black/30 rounded-2xl p-4 border border-white/5 flex items-center justify-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-2xl font-bold text-white">{correctCount} sahi</span>
                </div>
                <div className="bg-black/30 rounded-2xl p-4 border border-white/5 flex items-center justify-center gap-2">
                  <XCircle className="w-6 h-6 text-red-400" />
                  <span className="text-2xl font-bold text-white">{wrongCount} galat</span>
                </div>
              </div>

              <Link href="/student/live-quiz">
                <Button className="w-full bg-violet-600 hover:bg-violet-500 text-white h-14 rounded-2xl text-base font-bold">
                  Dobara khelein
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentIdx = currentQuestion?.questionIndex ?? session.currentQuestionIndex;
  const progressPercent = session.totalQuestions > 0 ? ((currentIdx + 1) / session.totalQuestions) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col pb-28">
      {/* Top bar - compact */}
      <div className="sticky top-0 z-20 bg-[#0f0f1a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link href="/student/live-quiz" className="flex items-center gap-2 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold truncate max-w-[100px]">{session.title}</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="bg-violet-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              Rank #{myRank || '-'}
            </span>
            <span className="text-slate-500 text-sm">{playingCount} playing</span>
          </div>
        </div>
        {/* Progress bar - full width */}
        <div className="h-1 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Timer + Question number - single row */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-slate-500 text-sm font-medium">Question</span>
          <span className="text-2xl font-black text-white">
            {currentIdx + 1} <span className="text-slate-500 font-normal">/ {session.totalQuestions}</span>
          </span>
        </div>
        {currentQuestion && answered[currentQuestion.questionIndex] === undefined && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2">
            <span className="text-amber-400 font-mono text-xl font-bold">{timeLeft}</span>
            <span className="text-amber-400/80 text-sm">sec</span>
          </div>
        )}
      </div>

      {/* Leaderboard - horizontal scroll, compact */}
      <div className="px-4 py-2 overflow-x-auto flex gap-2" style={{ scrollbarWidth: 'none' }}>
        {leaderboard.slice(0, 6).map((e) => (
          <div
            key={e.userId}
            className={`flex-shrink-0 flex items-center gap-2 rounded-xl px-3 py-2 ${
              e.userId === userId ? 'bg-violet-600/50 border border-violet-400/50' : 'bg-white/5 border border-white/10'
            }`}
          >
            <span className="text-amber-400 font-bold text-sm">#{e.rank}</span>
            <span className="text-slate-200 text-sm truncate max-w-[70px]">{e.name}</span>
            <span className="text-green-400 text-xs font-bold">{e.correctCount}✓</span>
          </div>
        ))}
      </div>

      {/* Your score strip */}
      <div className="px-4 py-2 flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-green-400">
          <CheckCircle className="w-4 h-4" /> {correctCount} sahi
        </span>
        <span className="flex items-center gap-1.5 text-red-400">
          <XCircle className="w-4 h-4" /> {wrongCount} galat
        </span>
      </div>

      {currentQuestion && (
        <>
          {/* Question - big and clear */}
          <div className="px-4 mt-2 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-lg font-semibold text-white leading-relaxed">{currentQuestion.text}</p>
              {answerFeedback && (
                <p className={`mt-3 text-sm font-semibold ${answerFeedback.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {answerFeedback.isCorrect ? '✓ Sahi jawab!' : '✗ Galat — sahi option neeche dikha raha hai.'}
                </p>
              )}
            </div>
          </div>

          {/* Options - 2 columns on small screen, big touch targets */}
          <div className="px-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuestion.options.map((opt, idx) => {
              const isUserChoice = answerFeedback ? idx === answerFeedback.selectedIndex : answered[currentQuestion.questionIndex] === idx;
              const isCorrectOption = idx === (currentQuestion.correct ?? 0);
              const showAsCorrect = answerFeedback ? isCorrectOption : false;
              const showAsWrong = answerFeedback && isUserChoice && !answerFeedback.isCorrect;
              const disabled = answerFeedback != null || answered[currentQuestion.questionIndex] !== undefined || submitting;
              const optionLabel = ['A', 'B', 'C', 'D'][idx] || String(idx + 1);

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && handleAnswer(idx)}
                  className={`relative text-left rounded-2xl p-4 font-medium border-2 transition-all flex items-start gap-3 min-h-[72px] ${
                    showAsCorrect
                      ? 'bg-green-500/20 border-green-500 text-green-300'
                      : showAsWrong
                      ? 'bg-red-500/20 border-red-500 text-red-300'
                      : isUserChoice && !answerFeedback
                      ? 'bg-violet-500/20 border-violet-400 text-white'
                      : answerFeedback
                      ? 'bg-white/5 border-white/10 text-slate-500'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-violet-500/50 active:scale-[0.98]'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  <span className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${
                    showAsCorrect ? 'bg-green-500 text-white' : showAsWrong ? 'bg-red-500 text-white' : 'bg-white/10 text-slate-300'
                  }`}>
                    {optionLabel}
                  </span>
                  <span className="flex-1 pt-1.5">{opt}</span>
                  {showAsCorrect && <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 absolute top-3 right-3" />}
                  {showAsWrong && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 absolute top-3 right-3" />}
                </button>
              );
            })}
          </div>

          {answerFeedback && (
            <p className="px-4 mt-4 text-center text-slate-500 text-sm">Agla question jald aayega...</p>
          )}
        </>
      )}

      {!currentQuestion && session.status === 'PLAYING' && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="font-medium">Next question load ho raha hai...</span>
          </div>
        </div>
      )}
    </div>
  );
}
