'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { FaTrophy, FaRupeeSign } from 'react-icons/fa';
import { GiFlexibleStar } from 'react-icons/gi';
import { 
  Clock, 
  Users, 
  Calendar, 
  FileText, 
  Award, 
  Info, 
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface LiveExam {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  category?: string;
  imageUrl?: string;
  duration: number;
  totalMarks: number;
  startTime: string;
  endTime: string;
  totalSpots: number;
  spots: number;
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
  const [selectedExam, setSelectedExam] = useState<LiveExam | null>(null);
  const [showDetails, setShowDetails] = useState(false);

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

  const handleViewDetails = (exam: LiveExam) => {
    setSelectedExam(exam);
    setShowDetails(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter out expired exams on client side as well
  const activeExams = exams.filter(exam => {
    const endTime = new Date(exam.endTime || exam.startTime).getTime();
    return endTime > now;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading live exams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Exams</h3>
          <p className="text-red-500 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full -translate-y-36 translate-x-36"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full translate-y-48 -translate-x-48"></div>
        
        <div className="relative z-10 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Live Exams</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Join exciting live competitions and win real prizes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {activeExams.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Live Exams Available</h3>
              <p className="text-gray-600 mb-6">There are currently no active live exams. Check back later for new competitions!</p>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Refresh
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeExams.map((exam) => {
              const totalSpots = exam.totalSpots || exam.spots || 0;
              const spotsLeft = exam.spotsLeft || 0;
              const percent = totalSpots ? (spotsLeft / totalSpots) * 100 : 0;
              const timeLeft = getTimeLeft(exam.endTime || exam.startTime);
              return (
                <div
                  key={exam.id}
                  className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6 relative overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      exam.isLive 
                        ? 'bg-green-100 text-green-700 border border-green-300' 
                        : 'bg-gray-100 text-gray-600 border border-gray-300'
                    }`}>
                      {exam.isLive ? 'LIVE' : 'UPCOMING'}
                    </div>
                  </div>

                  <div className="flex items-start justify-between mb-4">
                    <div className="font-bold text-xl text-gray-900 truncate max-w-[70%]">{exam.title}</div>
                    <div className="w-16 h-16 flex-shrink-0">
                      {exam.imageUrl ? (
                        <img 
                          src={exam.imageUrl} 
                          alt={`${exam.title} logo`} 
                          className="w-full h-full object-cover rounded-xl border-2 border-gray-200 shadow-sm"
                          onError={(e) => {
                            // Fallback to default trophy image if logo fails to load
                            const target = e.target as HTMLImageElement;
                            target.src = "/trophy.png";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                          <Award className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 mb-4 flex flex-wrap gap-2">
                    {exam.category && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {exam.category}
                      </span>
                    )}
                    {exam.subject && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {exam.subject}
                      </span>
                    )}
                    {exam.standard && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {exam.standard}
                      </span>
                    )}
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                      {exam.totalMarks || 5} Questions
                    </span>
                  </div>

                  <div className="flex items-center mb-4">
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden mr-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${
                          percent > 50 ? 'bg-gradient-to-r from-green-400 to-green-500' 
                          : percent > 20 ? 'bg-gradient-to-r from-orange-400 to-orange-500' 
                          : 'bg-gradient-to-r from-red-400 to-red-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-semibold ${
                      percent > 20 ? 'text-green-700' : 'text-red-600'
                    }`}>
                      {spotsLeft} left
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm mb-4">
                    <span className="flex items-center gap-1 text-yellow-600">
                      <FaTrophy className="text-yellow-500" /> 
                      ₹{exam.entryFee}
                    </span>
                    <span className="flex items-center gap-1 text-purple-600">
                      <GiFlexibleStar className="text-purple-500" /> 
                      Flexible
                    </span>
                  </div>

                  <div className="text-sm text-orange-600 mb-4 font-medium">
                    ⏰ Remaining: {timeLeft}
                  </div>

                  <div className="mb-6 text-center">
                    <div className="text-sm text-gray-600 mb-1">Prize Pool</div>
                    <div className="font-bold text-green-700 text-2xl flex items-center justify-center">
                      <FaRupeeSign className="mr-1" />
                      {exam.prizePool}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={() => handleViewDetails(exam)}
                      variant="outline"
                      className="w-full rounded-xl border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-700 transition-all duration-200 h-10"
                    >
                      <Info className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    
                    <Button
                      onClick={() => handleJoinExam(exam.id)}
                      disabled={!exam.isLive || spotsLeft === 0 || exam.attempted}
                      className={`w-full rounded-xl font-semibold text-base h-10 transition-all duration-200 ${
                        exam.attempted 
                          ? 'bg-gray-400 text-white' 
                          : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {exam.attempted ? (
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Already Attempted
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span>Attempt</span>
                          <FaRupeeSign className="ml-2" />
                          <span className="ml-1">{exam.entryFee}</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedExam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            <div className="p-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Exam Details</h2>
                    <p className="text-gray-600">Complete information about this live exam</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Exam Information */}
              <div className="space-y-6">
                {/* Title and Status with Logo */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      {selectedExam.imageUrl ? (
                        <img 
                          src={selectedExam.imageUrl} 
                          alt={`${selectedExam.title} logo`} 
                          className="w-16 h-16 object-cover rounded-xl border-2 border-gray-200 shadow-sm flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                          <Award className="w-8 h-8 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedExam.title}</h3>
                        {selectedExam.category && (
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-2">
                            {selectedExam.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      selectedExam.isLive 
                        ? 'bg-green-100 text-green-700 border border-green-300' 
                        : 'bg-gray-100 text-gray-600 border border-gray-300'
                    }`}>
                      {selectedExam.isLive ? 'LIVE NOW' : 'UPCOMING'}
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{selectedExam.description}</p>
                </div>

                {/* Key Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-semibold text-gray-700">Duration</span>
                    </div>
                    <p className="text-lg font-bold text-green-700">{selectedExam.duration} minutes</p>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-semibold text-gray-700">Spots</span>
                    </div>
                    <p className="text-lg font-bold text-purple-700">
                      {selectedExam.spotsLeft} / {selectedExam.totalSpots}
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <FaRupeeSign className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-semibold text-gray-700">Entry Fee</span>
                    </div>
                    <p className="text-lg font-bold text-yellow-700">₹{selectedExam.entryFee}</p>
                  </div>

                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <Award className="w-5 h-5 text-orange-600" />
                      <span className="text-sm font-semibold text-gray-700">Prize Pool</span>
                    </div>
                    <p className="text-lg font-bold text-orange-700">₹{selectedExam.prizePool}</p>
                  </div>
                </div>

                {/* Schedule */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                    Schedule
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Start Time:</span>
                      <span className="font-semibold text-gray-900">{formatDate(selectedExam.startTime)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">End Time:</span>
                      <span className="font-semibold text-gray-900">{formatDate(selectedExam.endTime)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Remaining Time:</span>
                      <span className="font-semibold text-orange-600">{getTimeLeft(selectedExam.endTime || selectedExam.startTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Subject Info */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Exam Information</h4>
                  <div className="flex flex-wrap gap-3">
                    {selectedExam.category && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {selectedExam.category}
                      </span>
                    )}
                    {selectedExam.subject && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {selectedExam.subject}
                      </span>
                    )}
                    {selectedExam.standard && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {selectedExam.standard}
                      </span>
                    )}
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                      {selectedExam.totalMarks || 5} Questions
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetails(false)}
                    className="flex-1 rounded-xl border-gray-300 hover:border-gray-400 hover:bg-gray-50 h-12"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDetails(false);
                      handleJoinExam(selectedExam.id);
                    }}
                    disabled={!selectedExam.isLive || selectedExam.spotsLeft === 0 || selectedExam.attempted}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl h-12 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedExam.attempted ? 'Already Attempted' : 'Join Exam'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 