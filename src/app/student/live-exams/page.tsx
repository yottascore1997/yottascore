'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { FaTrophy, FaRupeeSign } from 'react-icons/fa';
import { GiFlexibleStar } from 'react-icons/gi';

interface LiveExam {
  id: string;
  title: string;
  description: string;
  duration: number;
  totalMarks: number;
  startTime: string;
  endTime: string;
  totalSpots: number;
  spotsLeft: number;
  entryFee: number;
  prizePool: number;
  isLive: boolean;
  subject: string;
  standard: string;
  attempted: boolean;
}

function getTimeLeft(endTime: string) {
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

export default function LiveExams() {
  const router = useRouter();
  const [exams, setExams] = useState<LiveExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        const response = await fetch('/api/student/live-exams', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            router.push('/auth/login');
            return;
          }
          throw new Error('Failed to fetch exams');
        }

        const data = await response.json();
        setExams(data);
      } catch (error) {
        console.error('Error fetching exams:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch exams');
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinExam = async (examId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/student/live-exams/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ examId })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/auth/login');
          return;
        }
        const error = await response.json();
        throw new Error(error.message || 'Failed to join exam');
      }

      router.push(`/student/live-exams/${examId}`);
    } catch (error) {
      console.error('Error joining exam:', error);
      alert(error instanceof Error ? error.message : 'Failed to join exam');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Live Exams</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam) => {
          const totalSpots = exam.totalSpots || exam.spots || 0;
          const spotsLeft = exam.spotsLeft || 0;
          const percent = totalSpots ? (spotsLeft / totalSpots) * 100 : 0;
          const timeLeft = getTimeLeft(exam.endTime || exam.startTime);
          return (
            <div
              key={exam.id}
              className="bg-white rounded-xl shadow-md p-5 border border-gray-200 relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="font-bold text-lg truncate max-w-[70%]">{exam.title}</div>
                <div className="w-14 h-14 flex-shrink-0">
                  <img src="/trophy.png" alt="Trophy" className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="text-xs text-gray-500 mb-2 flex flex-wrap gap-2">
                <span>{exam.subject}</span>
                <span>·</span>
                <span>{exam.standard}</span>
                <span>·</span>
                <span>{exam.totalMarks || 5}Qs</span>
              </div>
              <div className="flex items-center mb-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden mr-2">
                  <div
                    className={`h-2 rounded-full ${percent > 50 ? 'bg-blue-400' : percent > 20 ? 'bg-orange-400' : 'bg-red-400'}`}
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <span className={`text-xs font-semibold ${percent > 20 ? 'text-blue-700' : 'text-red-600'}`}>{spotsLeft} Spots left</span>
                <span className="text-xs text-gray-400 ml-2">/ {totalSpots} Spots</span>
              </div>
              <div className="flex items-center gap-4 text-xs mb-2">
                <span className="flex items-center gap-1"><FaTrophy className="text-yellow-500" /> {exam.entryFee}</span>
                <span className="flex items-center gap-1"><FaTrophy className="text-yellow-500" /> 50%</span>
                <span className="flex items-center gap-1"><GiFlexibleStar className="text-purple-500" /> flexible</span>
              </div>
              <div className="text-xs text-orange-500 mb-2">Remaining time: {timeLeft}</div>
              <div className="mb-2 text-sm">Prize pool of up to <span className="font-bold text-green-700 text-lg flex items-center"><FaRupeeSign className="inline-block mr-1" />{exam.prizePool}*</span></div>
              <button
                onClick={() => handleJoinExam(exam.id)}
                disabled={!exam.isLive || spotsLeft === 0 || exam.attempted}
                className={`w-full py-2 rounded-lg text-white font-semibold text-base flex items-center justify-center gap-2 ${exam.attempted ? 'bg-gray-400' : 'bg-purple-600'} disabled:bg-gray-400`}
              >
                {exam.attempted ? 'Already Attempted' : (<><span>Attempt</span> <FaRupeeSign /> {exam.entryFee}</>)}
              </button>
            </div>
          );
        })}

        {exams.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No live exams available at the moment.
          </div>
        )}
      </div>
    </div>
  );
} 