'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface VerifyData {
  valid: boolean;
  userName?: string;
  examTitle?: string;
  category?: string | null;
  completedAt?: string;
  score?: number;
  rank?: number;
  totalParticipants?: number;
  error?: string;
}

export default function VerifyCertificatePage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0] ?? '';
  const [data, setData] = useState<VerifyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetch(`/api/verify/certificate/${id}`)
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData({ valid: false, error: 'Failed to verify' }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#aa35ce] border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <p className="text-gray-600">Invalid verification request.</p>
      </div>
    );
  }

  if (!data.valid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Certificate Not Found</h1>
          <p className="text-gray-600">{data.error || 'This certificate is invalid or has been revoked.'}</p>
        </div>
      </div>
    );
  }

  const issuedDate = data.completedAt
    ? new Date(data.completedAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2 text-center">Certificate Verified</h1>
        <p className="text-gray-600 text-center mb-6">This certificate is valid and issued by Yottascore.</p>
        <div className="space-y-2 text-sm border-t border-gray-200 pt-4">
          <p><span className="font-semibold text-gray-700">Name:</span> {data.userName}</p>
          <p><span className="font-semibold text-gray-700">Exam:</span> {data.examTitle}</p>
          {data.category && <p><span className="font-semibold text-gray-700">Category:</span> {data.category}</p>}
          <p><span className="font-semibold text-gray-700">Completed:</span> {issuedDate}</p>
          {data.score != null && <p><span className="font-semibold text-gray-700">Score:</span> {data.score}%</p>}
          {data.rank != null && data.totalParticipants != null && (
            <p><span className="font-semibold text-gray-700">Rank:</span> #{data.rank} of {data.totalParticipants}</p>
          )}
        </div>
      </div>
    </div>
  );
}
