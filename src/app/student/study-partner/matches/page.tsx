'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Match {
  matchId: string;
  otherUser: { id: string; name: string | null; profilePhoto: string | null };
  createdAt: string;
}

export default function StudyPartnerMatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [unmatching, setUnmatching] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetch('/api/student/study-partner/matches', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setMatches(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [router]);

  const handleUnmatch = async (otherUserId: string) => {
    if (!confirm('Unmatch? You will no longer see each other in matches.')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setUnmatching(otherUserId);
    try {
      const res = await fetch('/api/student/study-partner/unmatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ otherUserId }),
      });
      if (res.ok) setMatches((prev) => prev.filter((m) => m.otherUser.id !== otherUserId));
    } finally {
      setUnmatching(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 pb-8">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/student/study-partner" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Matches</h1>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-2">No matches yet.</p>
          <p className="text-sm mb-4">Swipe right on Discover to like. When they like you back, you match.</p>
          <Link href="/student/study-partner/discover">
            <Button>Discover</Button>
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {matches.map((m) => (
            <li
              key={m.matchId}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {m.otherUser.profilePhoto ? (
                  <img src={m.otherUser.profilePhoto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-semibold text-gray-500">
                    {m.otherUser.name?.charAt(0) || '?'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{m.otherUser.name || 'Unknown'}</p>
                <p className="text-xs text-gray-500">Matched</p>
              </div>
              <Link href={`/student/messages?user=${m.otherUser.id}`}>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <MessageCircle className="w-4 h-4 mr-1" /> Message
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500"
                disabled={unmatching === m.otherUser.id}
                onClick={() => handleUnmatch(m.otherUser.id)}
              >
                Unmatch
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
