'use client';

import { useEffect, useState } from 'react';
import { FaRupeeSign } from 'react-icons/fa';

interface EndedExam {
  id: string;
  title: string;
  endTime: string;
  totalCollection: number;
  prizePool: number;
  spots: number;
  winningsDistributed: boolean;
}

export default function AdminWinningsPage() {
  const [exams, setExams] = useState<EndedExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchEndedExams();
  }, []);

  const fetchEndedExams = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login as admin');
        return;
      }

      const res = await fetch('/api/admin/ended-exams', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch exams');
      }

      const data = await res.json();
      setExams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  };

  const distributeWinnings = async () => {
    try {
      setDistributing(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login as admin');
        return;
      }

      const res = await fetch('/api/admin/distribute-winnings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to distribute winnings');
      }

      const data = await res.json();
      setSuccess(data.message);
      fetchEndedExams(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to distribute winnings');
    } finally {
      setDistributing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Winnings Distribution</h1>
            <button
              onClick={distributeWinnings}
              disabled={distributing || exams.length === 0}
              className={`px-4 py-2 rounded-lg font-semibold ${
                distributing || exams.length === 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {distributing ? 'Distributing...' : 'Distribute Winnings'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-lg">
              {success}
            </div>
          )}

          {exams.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No ended exams pending winnings distribution
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-semibold">{exam.title}</h3>
                    <div className="text-sm text-gray-600">
                      Ended: {new Date(exam.endTime).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold flex items-center justify-end">
                      <FaRupeeSign className="mr-1" />
                      {exam.prizePool}
                    </div>
                    <div className="text-sm text-gray-600">
                      {exam.spots} participants
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 