'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CardUser {
  id: string;
  userId: string;
  name: string | null;
  profilePhoto: string | null;
  photos?: string[];
  bio: string | null;
  examType: string | null;
  goals: string | null;
  studyTimeFrom: string | null;
  studyTimeTo: string | null;
  studyTimeSlot?: string | null;
  gender?: string | null;
  age?: number | null;
  language: string | null;
  city?: string | null;
  subjects: string[];
  verified?: boolean;
}

export default function StudyPartnerDiscoverPage() {
  const router = useRouter();
  const [list, setList] = useState<CardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [matchModal, setMatchModal] = useState<CardUser | null>(null);

  const fetchDiscovery = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    const res = await fetch('/api/student/study-partner/discovery?limit=20', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
      setIndex(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDiscovery();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

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
        {!current ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No more profiles right now.</p>
            <p className="text-sm text-gray-500 mb-4">Check back later or update your filters.</p>
            <Button variant="outline" onClick={fetchDiscovery}>Refresh</Button>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-lg">
              <div className="aspect-[3/4] relative bg-gray-100">
                {current.profilePhoto ? (
                  <img
                    src={current.profilePhoto}
                    alt={current.name || 'Profile'}
                    className="w-full h-full object-cover"
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
                    <span>Time: {current.studyTimeFrom} - {current.studyTimeTo}</span>
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
            <p className="text-gray-600 mb-4">You and {matchModal.name} liked each other. Start chatting.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setMatchModal(null); setIndex((i) => i + 1); }}>
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
