'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, UserCircle, Heart, ChevronRight } from 'lucide-react';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import { prefetchDiscovery } from '@/lib/study-partner-discovery-cache';

export default function StudyPartnerPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ bio: string | null } | null>(null);
  const [matchesCount, setMatchesCount] = useState(0);
  const [whoLikedCount, setWhoLikedCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    let cancelled = false;
    prefetchDiscovery(token);

    (async () => {
      try {
        const res = await fetchWithTimeout(
          '/api/student/study-partner/summary',
          { headers: { Authorization: `Bearer ${token}` } },
          12000
        );
        if (!cancelled && res.ok) {
          const data = await res.json();
          setProfile(data.profile ?? null);
          setMatchesCount(data.matchesCount ?? 0);
          setWhoLikedCount(data.whoLikedCount ?? 0);
        }
      } catch {
        // Show hub UI even if stats fail
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

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
                  {statsLoading
                    ? 'Loading...'
                    : profile?.bio
                      ? 'Profile filled'
                      : 'Add bio, subjects, exam, study time'}
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
                  {statsLoading
                    ? '...'
                    : `${matchesCount} ${matchesCount === 1 ? 'match' : 'matches'}`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>

        {!statsLoading && whoLikedCount > 0 && (
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
