'use client';

import { useState, useEffect } from 'react';
import { FaRupeeSign, FaUsers, FaGift, FaChartLine, FaUserPlus } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

interface ReferralData {
  statistics: {
    totalReferrals: number;
    totalReferralEarnings: number;
    totalReferralBonus: number;
  };
  topReferrers: Array<{
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    referralCode: string;
    referralCount: number;
    totalReferralEarnings: number;
    createdAt: string;
  }>;
  recentReferrals: Array<{
    id: string;
    code: string;
    joinedAt: string;
    referrer: {
      id: string;
      name: string;
      email: string;
      phoneNumber: string;
    };
    referred: {
      id: string;
      name: string;
      email: string;
      phoneNumber: string;
    };
  }>;
  usersWithCodes: Array<{
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    referralCode: string;
    createdAt: string;
  }>;
}

export default function AdminReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/admin/referrals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const referralData = await response.json();
        setData(referralData);
      } else {
        setError('Failed to fetch referral data');
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
      setError('Failed to fetch referral data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Referral Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchReferralData}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Referral Management</h1>
          <p className="text-gray-600 text-lg">Monitor and manage the referral system</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Referrals</p>
                <p className="text-3xl font-bold text-purple-600">{data?.statistics.totalReferrals || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FaUsers className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Earnings</p>
                <p className="text-3xl font-bold text-green-600">
                  <FaRupeeSign className="inline text-2xl" />
                  {data?.statistics.totalReferralEarnings || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FaGift className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Bonus Paid</p>
                <p className="text-3xl font-bold text-blue-600">
                  <FaRupeeSign className="inline text-2xl" />
                  {data?.statistics.totalReferralBonus || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FaChartLine className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Referrers</p>
                <p className="text-3xl font-bold text-orange-600">{data?.topReferrers.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <FaUserPlus className="text-orange-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Referrers */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Top Referrers</h2>
            <div className="space-y-4">
              {data?.topReferrers.map((referrer, index) => (
                <div key={referrer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-purple-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{referrer.name}</p>
                      <p className="text-gray-600 text-sm">{referrer.email}</p>
                      <p className="text-purple-600 text-sm font-mono">{referrer.referralCode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{referrer.referralCount}</p>
                    <p className="text-sm text-gray-500">referrals</p>
                    <p className="text-green-600 font-semibold">
                      <FaRupeeSign className="inline" />
                      {referrer.totalReferralEarnings}
                    </p>
                  </div>
                </div>
              ))}
              {(!data?.topReferrers || data.topReferrers.length === 0) && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">👥</div>
                  <p className="text-gray-500">No referrals yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Referrals */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Referrals</h2>
            <div className="space-y-4">
              {data?.recentReferrals.map((referral) => (
                <div key={referral.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(referral.joinedAt), { addSuffix: true })}
                    </span>
                    <span className="text-purple-600 font-mono text-sm">{referral.code}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-gray-800">Referrer</p>
                      <p className="text-gray-600">{referral.referrer.name}</p>
                      <p className="text-gray-500">{referral.referrer.email}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Referred</p>
                      <p className="text-gray-600">{referral.referred.name}</p>
                      <p className="text-gray-500">{referral.referred.email}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-green-600 font-semibold">+₹100 earned</span>
                  </div>
                </div>
              ))}
              {(!data?.recentReferrals || data.recentReferrals.length === 0) && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="text-gray-500">No recent referrals</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Users with Codes but No Referrals */}
        {data?.usersWithCodes && data.usersWithCodes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Users with Referral Codes (No Referrals Yet)</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Referral Code</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.usersWithCodes.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{user.name}</td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
                      <td className="py-3 px-4 text-gray-600">{user.phoneNumber}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-purple-600 bg-purple-50 px-2 py-1 rounded">
                          {user.referralCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-8">
          <h3 className="text-xl font-bold text-blue-800 mb-4">How the Referral System Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h4 className="font-semibold text-blue-800 mb-2">Generate Code</h4>
              <p className="text-blue-700 text-sm">Users generate their unique referral code</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h4 className="font-semibold text-blue-800 mb-2">Share Code</h4>
              <p className="text-blue-700 text-sm">Share the code with friends during registration</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h4 className="font-semibold text-blue-800 mb-2">Earn Rewards</h4>
              <p className="text-blue-700 text-sm">Earn ₹100 for each successful referral</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 