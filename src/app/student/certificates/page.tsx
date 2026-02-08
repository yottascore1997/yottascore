'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Award, FileText, Calendar, ChevronRight } from 'lucide-react';

interface CertificateItem {
  participantId: string;
  examId: string;
  examTitle: string;
  category: string | null;
  duration: number;
  score: number;
  completedAt: string;
  certificateUrl: string;
}

export default function MyCertificatesPage() {
  const [list, setList] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      const res = await fetch('/api/student/certificates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setList(data.certificates || []);
    } catch {
      setError('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#aa35ce] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#aa35ce]/10 flex items-center justify-center">
            <Award className="w-6 h-6 text-[#aa35ce]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
            <p className="text-gray-600 text-sm">Live exams you have completed — view or download certificates</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {list.length === 0 && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No certificates yet</p>
            <p className="text-gray-500 text-sm mt-1">Complete a live exam to get your first certificate.</p>
            <Link
              href="/student/live-exams"
              className="inline-block mt-4 px-5 py-2.5 bg-[#aa35ce] text-white font-medium rounded-lg hover:opacity-90"
            >
              Browse Live Exams
            </Link>
          </div>
        )}

        <ul className="space-y-3">
          {list.map((cert) => (
            <li key={cert.participantId}>
              <Link
                href={cert.certificateUrl}
                className="block bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:border-[#aa35ce]/30 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-900 truncate">{cert.examTitle}</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                      {cert.category && (
                        <span className="bg-gray-100 px-2 py-0.5 rounded">{cert.category}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(cert.completedAt)}
                      </span>
                      <span>Score: {cert.score}%</span>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[#aa35ce] font-medium text-sm shrink-0">
                    View certificate
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
