'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import {
  type DiscoveryCard,
  getCachedDiscovery,
  setCachedDiscovery,
} from '@/lib/study-partner-discovery-cache';

export default function StudyPartnerDiscoverPage() {
  const router = useRouter();
  const [list, setList] = useState<DiscoveryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [index, setIndex] = useState(0);
  const [matchModal, setMatchModal] = useState<DiscoveryCard | null>(null);
  const listRef = useRef<DiscoveryCard[]>([]);

  const fetchDiscovery = async (opts?: { silent?: boolean }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const hasCards = listRef.current.length > 0;
    if (opts?.silent) {
      setRefreshing(true);
    } else if (!hasCards) {
      setLoading(true);
    }

    try {
      const res = await fetchWithTimeout(
        '/api/student/study-partner/discovery?limit=12',
        { headers: { Authorization: `Bearer ${token}` } },
        10000
      );
      if (res.ok) {
        const data = await res.json();
        const next = Array.isArray(data) ? data : [];
        listRef.current = next;
        setList(next);
        setIndex(0);
        setCachedDiscovery(next);
      }
    } catch {
      if (!hasCards) {
        listRef.current = [];
        setList([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    listRef.current = list;
  }, [list]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const cached = getCachedDiscovery();
    if (cached && cached.length > 0) {
      listRef.current = cached;
      setList(cached);
      setIndex(0);
      setLoading(false);
      fetchDiscovery({ silent: true });
      return;
    }

    fetchDiscovery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleLike = async () => {
    const current = list[index];
    if (!current) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch('/api/student/study-partner/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ targetUserId: current.userId, action: 'like' }),
    });
    const data = await res.json();
    if (data.newMatch) setMatchModal(current);
    setIndex((i) => i + 1);
  };

  const handlePass = async () => {
    const current = list[index];
    if (!current) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    await fetch('/api/student/study-partner/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ targetUserId: current.userId, action: 'pass' }),
    });
    setIndex((i) => i + 1);
  };

  const current = list[index];

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <Link href="/student/study-partner" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Discover</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {loading ? (
          <div className="w-full max-w-sm text-center">
            <div className="aspect-[3/4] rounded-2xl bg-gray-100 animate-pulse mb-4" />
            <p className="text-gray-600 font-medium">Finding study buddies...</p>
            <p className="text-sm text-gray-400 mt-1">This should only take a moment</p>
          </div>
        ) : !current ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No more profiles right now.</p>
            <p className="text-sm text-gray-500 mb-4">
              Turn on &quot;Show me in discovery&quot; in your profile so others can find you.
            </p>
            <Button variant="outline" onClick={() => fetchDiscovery()} disabled={refreshing}>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            {refreshing && (
              <p className="text-center text-xs text-gray-400 mb-2">Updating profiles...</p>
            )}
            <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-lg">
              <div className="aspect-[3/4] relative bg-gray-100">
                {current.profilePhoto ? (
                  <img
                    src={current.profilePhoto}
                    alt={current.name || 'Profile'}
                    className="w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                    {current.name?.charAt(0) || '?'}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white">
                  <h2 className="text-xl font-bold">{current.name || 'Unknown'}</h2>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm opacity-90">
                    {current.age != null && <span>{current.age} yrs</span>}
                    {current.gender && <span>• {current.gender}</span>}
                    {current.studyTimeSlot && <span>• {current.studyTimeSlot}</span>}
                    {current.examType && <span>• {current.examType}</span>}
                  </div>
                </div>
              </div>
              <div className="p-4">
                {current.bio && <p className="text-gray-700 text-sm mb-2">{current.bio}</p>}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                  {current.city && <span>City: {current.city}</span>}
                  {current.language && <span>Language: {current.language}</span>}
                  {current.studyTimeSlot && <span>Study: {current.studyTimeSlot}</span>}
                  {current.studyTimeFrom && current.studyTimeTo && (
                    <span>
                      Time: {current.studyTimeFrom} - {current.studyTimeTo}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-8 mt-6">
              <button
                onClick={handlePass}
                className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 hover:bg-red-200 transition"
              >
                <X className="w-8 h-8" />
              </button>
              <button
                onClick={handleLike}
                className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200 transition"
              >
                <Heart className="w-8 h-8" />
              </button>
            </div>
          </div>
        )}
      </div>

      {matchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">It&apos;s a match!</h3>
            <p className="text-gray-600 mb-4">
              You and {matchModal.name} liked each other. Start chatting.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setMatchModal(null);
                  setIndex((i) => i + 1);
                }}
              >
                Keep swiping
              </Button>
              <Link href={`/student/messages?user=${matchModal.userId}`} className="flex-1">
                <Button className="w-full bg-green-600 hover:bg-green-700">Message</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
