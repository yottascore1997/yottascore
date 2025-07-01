'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FaRupeeSign, FaUsers, FaGift, FaCopy, FaShare, FaQrcode } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

interface ReferralStats {
  referralCode: string | null;
  referralCount: number;
  totalEarnings: number;
  referredBy: string | null;
  referrerInfo: {
    id: string;
    name: string;
    email: string;
    profilePhoto?: string;
  } | null;
  referrals: Array<{
    id: string;
    name: string;
    email: string;
    profilePhoto?: string;
    joinedAt: string;
  }>;
}

export default function ReferralPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/student/referral/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('Failed to fetch referral stats');
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      setError('Failed to fetch referral stats');
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async () => {
    try {
      setGeneratingCode(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/student/referral/generate-code', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(prev => prev ? { ...prev, referralCode: data.referralCode } : null);
      } else {
        setError('Failed to generate referral code');
      }
    } catch (error) {
      console.error('Error generating referral code:', error);
      setError('Failed to generate referral code');
    } finally {
      setGeneratingCode(false);
    }
  };

  const copyReferralCode = async () => {
    if (stats?.referralCode) {
      try {
        await navigator.clipboard.writeText(stats.referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const shareReferralCode = async () => {
    if (stats?.referralCode) {
      const shareText = `Join ExamIndia and use my referral code ${stats.referralCode} to get started! 🎓📚`;
      const shareUrl = `${window.location.origin}/auth/register?ref=${stats.referralCode}`;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Join ExamIndia',
            text: shareText,
            url: shareUrl
          });
        } catch (error) {
          console.error('Error sharing:', error);
        }
      } else {
        // Fallback to copying to clipboard
        try {
          await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (error) {
          console.error('Failed to copy:', error);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Referral Stats...</p>
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
          <Button
            onClick={fetchReferralStats}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Refer & Earn</h1>
          <p className="text-gray-600 text-lg">Invite friends and earn ₹100 for each successful referral!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Referrals</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.referralCount || 0}</p>
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
                  {stats?.totalEarnings || 0}
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
                <p className="text-gray-600 text-sm">Potential Earnings</p>
                <p className="text-3xl font-bold text-blue-600">
                  <FaRupeeSign className="inline text-2xl" />
                  {(stats?.referralCount || 0) * 100}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FaQrcode className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Referral Code Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Referral Code</h2>
          
          {stats?.referralCode ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 bg-gray-50 rounded-lg p-4 border-2 border-purple-200">
                  <p className="text-2xl font-mono font-bold text-purple-600 text-center">
                    {stats.referralCode}
                  </p>
                </div>
                <Button
                  onClick={copyReferralCode}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                >
                  <FaCopy className="mr-2" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  onClick={shareReferralCode}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                >
                  <FaShare className="mr-2" />
                  Share
                </Button>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-purple-800 text-sm">
                  <strong>How it works:</strong> Share your referral code with friends. When they register using your code, you'll earn ₹100 instantly!
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">You don't have a referral code yet. Generate one to start earning!</p>
              <Button
                onClick={generateReferralCode}
                disabled={generatingCode}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                {generatingCode ? 'Generating...' : 'Generate Referral Code'}
              </Button>
            </div>
          )}
        </div>

        {/* Referred By Section */}
        {stats?.referrerInfo && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">You were referred by</h2>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                {stats.referrerInfo.profilePhoto ? (
                  <img 
                    src={stats.referrerInfo.profilePhoto} 
                    alt={stats.referrerInfo.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-purple-600">
                    {stats.referrerInfo.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800">{stats.referrerInfo.name}</p>
                <p className="text-gray-600">{stats.referrerInfo.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Referrals List */}
        {stats?.referrals && stats.referrals.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">People you've referred</h2>
            <div className="space-y-4">
              {stats.referrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      {referral.profilePhoto ? (
                        <img 
                          src={referral.profilePhoto} 
                          alt={referral.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-purple-600">
                          {referral.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{referral.name}</p>
                      <p className="text-gray-600 text-sm">{referral.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Joined {formatDistanceToNow(new Date(referral.joinedAt), { addSuffix: true })}
                    </p>
                    <p className="text-green-600 font-semibold">+₹100 earned</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats?.referrals && stats.referrals.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No referrals yet</h2>
            <p className="text-gray-600 mb-6">
              Start sharing your referral code with friends and family to earn rewards!
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-blue-800 text-sm">
                <strong>Tip:</strong> Share your referral code on social media, WhatsApp, or directly with friends studying for exams!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 