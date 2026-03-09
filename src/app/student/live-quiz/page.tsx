'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users, ChevronRight, Zap, ArrowLeft, Gamepad2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  questionCount: number;
}

export default function LiveQuizPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchCategories();
  }, [router]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/student/question-categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (categoryId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    setJoining(categoryId);
    try {
      const res = await fetch('/api/student/live-quiz/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categoryId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to join');
      }
      const data = await res.json();
      router.push(`/student/live-quiz/play/${data.session.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to start quiz');
    } finally {
      setJoining(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-950/30 via-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
            <Gamepad2 className="w-7 h-7 text-emerald-500" />
          </div>
          <p className="text-slate-500 font-medium">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950/20 via-slate-50 to-white">
      <div className="max-w-2xl mx-auto p-4 pb-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Live Quiz</h1>
              <p className="text-slate-500 text-sm">Real-time with others, same questions, live leaderboard</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="group bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-200/60 transition-all duration-300"
            >
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0"
                    style={{ backgroundColor: cat.color || '#10b981' }}
                  >
                    {cat.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{cat.name}</div>
                    <div className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Users className="w-4 h-4 text-emerald-500" />
                      <span>{cat.questionCount || 0} questions</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => startQuiz(cat.id)}
                  disabled={joining !== null || (cat.questionCount || 0) < 1}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 py-6 font-semibold shadow-lg shadow-emerald-500/25 flex-shrink-0 group-hover:bg-emerald-600 transition"
                >
                  {joining === cat.id ? (
                    <span className="animate-pulse flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Joining...
                    </span>
                  ) : (
                    <>
                      Play
                      <ChevronRight className="w-5 h-5 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-16 bg-white/80 rounded-2xl border border-slate-100">
            <Gamepad2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No categories available yet.</p>
            <p className="text-slate-400 text-sm mt-1">Check back later or try another section.</p>
          </div>
        )}

        <div className="mt-8">
          <Link
            href="/student/dashboard"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
