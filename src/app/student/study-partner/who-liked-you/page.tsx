'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WhoLikedUser {
  userId: string;
  name: string | null;
  profilePhoto: string | null;
  likedAt: string;
}

export default function WhoLikedYouPage() {
  const router = useRouter();
  const [list, setList] = useState<WhoLikedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetch('/api/student/study-partner/who-liked-you', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setList(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLikeBack = async (userId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLiking(userId);
    try {
      const res = await fetch('/api/student/study-partner/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUserId: userId, action: 'like' }),
      });
      const data = await res.json();
      setList((prev) => prev.filter((u) => u.userId !== userId));
      if (data.newMatch) {
        if (confirm('It\'s a match! Open chat?')) {
          router.push(`/student/messages?user=${userId}`);
        }
      }
    } finally {
      setLiking(null);
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
        <h1 className="text-xl font-bold text-gray-900">Who liked you</h1>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No one has liked you yet.</p>
          <p className="text-sm mt-2">Complete your profile and appear in Discover so others can like you.</p>
          <Link href="/student/study-partner/discover" className="inline-block mt-4">
            <Button>Discover</Button>
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((u) => (
            <li
              key={u.userId}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {u.profilePhoto ? (
                  <img src={u.profilePhoto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-semibold text-gray-500">{u.name?.charAt(0) || '?'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{u.name || 'Unknown'}</p>
                <p className="text-xs text-gray-500">Liked you</p>
              </div>
              <Button
                size="sm"
                className="bg-pink-500 hover:bg-pink-600"
                disabled={liking === u.userId}
                onClick={() => handleLikeBack(u.userId)}
              >
                <Heart className="w-4 h-4 mr-1" /> {liking === u.userId ? '...' : 'Like back'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
