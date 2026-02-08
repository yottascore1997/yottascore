'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface CertificateData {
  userName: string;
  examTitle: string;
  category: string | null;
  completedAt: string;
  score: number;
  rank: number;
  totalParticipants: number;
  verificationId: string;
  verificationUrl: string;
}

export default function LiveExamCertificatePage() {
  const params = useParams();
  const router = useRouter();
  const examId = typeof params.examId === 'string' ? params.examId : params.examId?.[0] ?? '';
  const [data, setData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) return;
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetch(`/api/student/live-exams/${examId}/certificate`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Certificate not found');
        return res.json();
      })
      .then(setData)
      .catch(() => setError('Certificate not found'))
      .finally(() => setLoading(false));
  }, [examId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <p className="text-red-600 mb-4">{error || 'Certificate not available'}</p>
        <Link href="/student/dashboard" className="text-purple-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const issuedDate = new Date(data.completedAt);
  const issuedFormatted = issuedDate.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.verificationUrl)}`;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Certificate card - premium look like sample */}
        <div
          className="relative bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(168, 53, 206, 0.04) 0%, transparent 50%),
                            radial-gradient(circle at 80% 50%, rgba(168, 53, 206, 0.04) 0%, transparent 50%)`,
          }}
        >
          {/* Watermark-style background text */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]" aria-hidden>
            <div className="text-[8rem] font-black text-[#aa35ce] rotate-[-12deg] -translate-x-20 -translate-y-10">
              Yottascore
            </div>
            <div className="text-[6rem] font-black text-[#aa35ce] rotate-[8deg] translate-x-40 translate-y-40">
              Yottascore
            </div>
          </div>

          <div className="relative p-8 sm:p-12">
            {/* Top: QR and Scan to Verify */}
            <div className="flex justify-between items-start mb-6">
              <div />
              <div className="text-right">
                <img
                  src={qrUrl}
                  alt="QR Code"
                  className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] border border-gray-200 rounded"
                />
                <p className="text-xs text-gray-500 mt-1">Scan to Verify</p>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center tracking-wide mb-2">
              CERTIFICATE OF COMPLETION
            </h1>

            <p className="text-center text-gray-600 mb-2">This certifies that</p>
            <p className="text-center text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              {data.userName}
            </p>
            <p className="text-center text-gray-600 mb-6 max-w-lg mx-auto">
              has successfully completed the Yottascore Live Exam
              <span className="font-semibold text-gray-800"> &quot;{data.examTitle}&quot;</span>
              {data.category ? ` (${data.category})` : ''} and is hereby declared a
            </p>

            {/* Badge */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-amber-400 bg-amber-50">
                <span className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Participant
                </span>
              </div>
            </div>
            <p className="text-center text-xl font-bold text-gray-800 mb-1">
              Live Exam Completer
            </p>
            <p className="text-center text-gray-600 text-sm mb-6">
              The candidate has completed the exam with a score of {data.score}%
              {data.rank > 0 && (
                <> and secured Rank #{data.rank} out of {data.totalParticipants} participants.</>
              )}
            </p>

            <p className="text-center text-gray-500 text-sm mb-8">
              Issued {issuedFormatted}
            </p>

            {/* Verify URL */}
            <div className="border-t border-gray-200 pt-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Verify completion at:</p>
                <a
                  href={data.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#aa35ce] font-medium hover:underline break-all"
                >
                  {data.verificationUrl}
                </a>
              </div>
              <p className="text-xs text-gray-500">for Yottascore</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4 justify-center no-print">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-[#aa35ce] text-white font-semibold rounded-lg hover:opacity-90"
          >
            Print / Save as PDF
          </button>
          <Link
            href={`/student/live-exams/${examId}/result`}
            className="px-6 py-3 border-2 border-[#aa35ce] text-[#aa35ce] font-semibold rounded-lg hover:bg-[#aa35ce]/5"
          >
            Back to Result
          </Link>
          <Link
            href="/student/dashboard"
            className="px-6 py-3 text-gray-600 font-semibold rounded-lg hover:bg-gray-100"
          >
            Dashboard
          </Link>
        </div>
      </div>

      <div className="no-print mt-8 text-center">
        <Link href="/student/dashboard" className="text-[#aa35ce] hover:underline text-sm">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
