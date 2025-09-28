'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FirebaseIntegrationPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const navigateToFeature = (path: string) => {
    router.push(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h1 className="text-3xl font-bold mb-4">🔥 Firebase Integration with YottaScore</h1>
          <p className="text-gray-600 mb-6">
            Firebase OTP login is now integrated with all existing features. Your old login system continues to work alongside Firebase authentication.
          </p>
          
          {user ? (
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <h2 className="text-xl font-semibold mb-2">✅ Logged in as:</h2>
              <p><strong>Name:</strong> {user.name || 'User'}</p>
              <p><strong>Phone:</strong> {user.phoneNumber || 'Not provided'}</p>
              <p><strong>Email:</strong> {user.email || 'Not provided'}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>User ID:</strong> {user.id}</p>
              <button
                onClick={handleLogout}
                className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded-lg mb-6">
              <h2 className="text-xl font-semibold mb-2">🔐 Not Logged In</h2>
              <p>Please login using Firebase OTP to access all features.</p>
              <a
                href="/firebase-test"
                className="inline-block mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Login with OTP
              </a>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Battle Quiz */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">⚔️</div>
            <h3 className="text-xl font-semibold mb-2">Battle Quiz</h3>
            <p className="text-gray-600 mb-4">Play real money battle quizzes with other players</p>
            <button
              onClick={() => navigateToFeature('/student/battle-quiz')}
              className="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600"
            >
              Play Battle Quiz
            </button>
          </div>

          {/* Live Exams */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2">Live Exams</h3>
            <p className="text-gray-600 mb-4">Participate in live competitive exams</p>
            <button
              onClick={() => navigateToFeature('/student/live-exams')}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              View Live Exams
            </button>
          </div>

          {/* Practice Exams */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">Practice Exams</h3>
            <p className="text-gray-600 mb-4">Practice with unlimited mock tests</p>
            <button
              onClick={() => navigateToFeature('/student/practice-exams')}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              Practice Now
            </button>
          </div>

          {/* Social Feed */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2">Social Feed</h3>
            <p className="text-gray-600 mb-4">Connect with other students and share</p>
            <button
              onClick={() => navigateToFeature('/student/feed')}
              className="w-full bg-pink-500 text-white py-2 px-4 rounded hover:bg-pink-600"
            >
              View Feed
            </button>
          </div>

          {/* Wallet */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-semibold mb-2">Wallet</h3>
            <p className="text-gray-600 mb-4">Manage your earnings and transactions</p>
            <button
              onClick={() => navigateToFeature('/student/wallet')}
              className="w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600"
            >
              View Wallet
            </button>
          </div>

          {/* Timetable */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-semibold mb-2">Timetable</h3>
            <p className="text-gray-600 mb-4">Schedule your study sessions</p>
            <button
              onClick={() => navigateToFeature('/student/timetable')}
              className="w-full bg-indigo-500 text-white py-2 px-4 rounded hover:bg-indigo-600"
            >
              View Timetable
            </button>
          </div>
        </div>

        {/* Integration Benefits */}
        <div className="bg-blue-50 p-6 rounded-lg shadow mt-6">
          <h2 className="text-xl font-semibold mb-4">🚀 Firebase Integration Benefits:</h2>
          <ul className="space-y-2 text-sm">
            <li>• <strong>Seamless Login:</strong> OTP-based authentication without passwords</li>
            <li>• <strong>Existing Features:</strong> All your current features work exactly the same</li>
            <li>• <strong>User Management:</strong> Automatic user creation and linking</li>
            <li>• <strong>Security:</strong> Firebase handles all authentication security</li>
            <li>• <strong>Welcome Bonus:</strong> New users get ₹100 in wallet</li>
            <li>• <strong>Phone Verification:</strong> Real phone number verification</li>
          </ul>
        </div>

        {/* Technical Details */}
        <div className="bg-gray-50 p-6 rounded-lg shadow mt-6">
          <h2 className="text-xl font-semibold mb-4">🔧 Technical Integration:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Firebase Features:</h3>
              <ul className="space-y-1">
                <li>• Phone/OTP Authentication</li>
                <li>• Email/Password Authentication</li>
                <li>• reCAPTCHA Integration</li>
                <li>• JWT Token Generation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">YottaScore Features:</h3>
              <ul className="space-y-1">
                <li>• Battle Quiz System</li>
                <li>• Live Exam Platform</li>
                <li>• Social Learning</li>
                <li>• Wallet Management</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
