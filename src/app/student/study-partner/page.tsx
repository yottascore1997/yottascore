'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, UserCircle, Heart, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StudyPartnerPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [matchesCount, setMatchesCount] = useState(0);
  const [whoLikedCount, setWhoLikedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    (async () => {
      try {
        const [profileRes, matchesRes, whoRes] = await Promise.all([
          fetch('/api/student/study-partner/profile', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/student/study-partner/matches', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/student/study-partner/who-liked-you', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (profileRes.ok) setProfile(await profileRes.json());
        if (matchesRes.ok) {
          const m = await matchesRes.json();
          setMatchesCount(Array.isArray(m) ? m.length : 0);
        }
        if (whoRes.ok) {
          const w = await whoRes.json();
          setWhoLikedCount(Array.isArray(w) ? w.length : 0);
        }
      } catch (_) {}
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Study Partner</h1>
      <p className="text-gray-600 mb-6">Find study buddies. Swipe right to like, left to pass. Match and chat.</p>

      <div className="space-y-3">
        <Link href="/student/study-partner/profile">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between shadow-sm hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">My profile</p>
                <p className="text-sm text-gray-500">
                  {profile?.bio ? 'Profile filled' : 'Add bio, subjects, exam, study time'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>

        <Link href="/student/study-partner/discover">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between shadow-sm hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Discover</p>
                <p className="text-sm text-gray-500">Swipe and find study partners</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>

        <Link href="/student/study-partner/matches">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between shadow-sm hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Matches</p>
                <p className="text-sm text-gray-500">
                  {matchesCount} {matchesCount === 1 ? 'match' : 'matches'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>

        {whoLikedCount > 0 && (
          <Link href="/student/study-partner/who-liked-you">
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-amber-900">Who liked you</p>
                <p className="text-sm text-amber-700">{whoLikedCount} people liked you</p>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-600" />
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
