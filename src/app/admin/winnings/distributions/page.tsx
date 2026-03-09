'use client';

import { useEffect, useState } from 'react';

interface DistRow {
  id: string;
  examId: string;
  userId: string;
  rank: number;
  prizeAmount: number;
  status: string;
  attempts: number;
  lastError?: string | null;
  createdAt: string;
  user?: { id: string; name?: string | null; username?: string | null } | null;
  exam?: { id: string; title?: string | null } | null;
}

export default function DistributionsPage() {
  const [items, setItems] = useState<DistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('FAILED');
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchList();
  }, [statusFilter]);

  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/distributions?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }

  async function retryOne(id: string) {
    setProcessing(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/distributions/${id}/retry`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Retry failed');
      await fetchList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Retry failed');
    } finally {
      setProcessing(false);
    }
  }

  async function retryBulk() {
    setProcessing(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/distributions/retry-bulk`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 50 })
      });
      if (!res.ok) throw new Error('Bulk retry failed');
      await fetchList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bulk retry failed');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Winnings Distributions</h1>
          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border px-2 py-1 rounded"
            >
              <option value="FAILED">FAILED</option>
              <option value="PENDING">PENDING</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="SUCCESS">SUCCESS</option>
            </select>
            <button
              onClick={retryBulk}
              disabled={processing}
              className="px-3 py-1 bg-purple-600 text-white rounded"
            >
              {processing ? 'Processing...' : 'Retry Bulk'}
            </button>
            <button onClick={fetchList} className="px-3 py-1 border rounded">
              Refresh
            </button>
          </div>
        </div>

        {error && <div className="mb-4 text-red-600">{error}</div>}

        {loading ? (
          <div>Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-gray-500">No records</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left">
                  <th className="px-2 py-2">Exam</th>
                  <th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">Rank</th>
                  <th className="px-2 py-2">Prize</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Attempts</th>
                  <th className="px-2 py-2">Last Error</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="px-2 py-3">{it.exam?.title || it.examId}</td>
                    <td className="px-2 py-3">
                      {it.user?.name || it.user?.username || it.userId}
                    </td>
                    <td className="px-2 py-3">{it.rank}</td>
                    <td className="px-2 py-3">₹{it.prizeAmount}</td>
                    <td className="px-2 py-3">{it.status}</td>
                    <td className="px-2 py-3">{it.attempts}</td>
                    <td className="px-2 py-3 text-sm text-red-600">{it.lastError}</td>
                    <td className="px-2 py-3">
                      <button
                        onClick={() => retryOne(it.id)}
                        disabled={processing || it.status === 'SUCCESS'}
                        className="px-2 py-1 bg-green-600 text-white rounded"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

