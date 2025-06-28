'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Users, 
  Calendar, 
  FileText, 
  Award, 
  Info, 
  X,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  Trophy,
  BookOpen
} from 'lucide-react';

interface LiveExam {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  category?: string;
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
  attempted: boolean;
  participantsCount?: number;
  status?: string;
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

export default function AdminLiveExams() {
  const router = useRouter();
  const [exams, setExams] = useState<LiveExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<LiveExam | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/admin/live-exams', {
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

  const handleViewDetails = (exam: LiveExam) => {
    setSelectedExam(exam);
    setShowDetails(true);
  };

  const handleEditExam = (examId: string) => {
    router.push(`/admin/live-exams/${examId}/edit`);
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/admin/live-exams/${examId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete exam');
      }

      // Refresh the exams list
      fetchExams();
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete exam');
    }
  };

  const handleToggleLive = async (examId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`/api/admin/live-exams/${examId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isLive: !currentStatus
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update exam status');
      }

      // Update the local state immediately for better UX
      setExams(prev => prev.map(exam => 
        exam.id === examId 
          ? { ...exam, isLive: !currentStatus }
          : exam
      ));

      // Also update selected exam if it's the one being toggled
      if (selectedExam && selectedExam.id === examId) {
        setSelectedExam(prev => prev ? { ...prev, isLive: !currentStatus } : null);
      }

    } catch (error) {
      console.error('Error toggling exam status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update exam status');
    }
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

  const getStatusColor = (exam: LiveExam) => {
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);

    if (now < startTime) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (now >= startTime && now <= endTime) return 'bg-green-100 text-green-700 border-green-300';
    return 'bg-gray-100 text-gray-600 border-gray-300';
  };

  const getStatusText = (exam: LiveExam) => {
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);

    if (now < startTime) return 'UPCOMING';
    if (now >= startTime && now <= endTime) return 'LIVE';
    return 'ENDED';
  };

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
            onClick={fetchExams}
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
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Live Exams</h1>
                  <p className="text-gray-600">Manage and monitor live exam competitions</p>
                </div>
              </div>
              <Button
                onClick={() => router.push('/admin/live-exams/create')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Exam
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Exams</p>
                  <p className="text-2xl font-bold text-gray-900">{exams.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Live Now</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {exams.filter(exam => {
                      const now = new Date();
                      const startTime = new Date(exam.startTime);
                      const endTime = new Date(exam.endTime);
                      return now >= startTime && now <= endTime;
                    }).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Participants</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {exams.reduce((total, exam) => total + (exam.participantsCount || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Prize Pool</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{exams.reduce((total, exam) => total + exam.prizePool, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Exams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => {
              const totalSpots = exam.totalSpots || exam.spots || 0;
              const spotsLeft = exam.spotsLeft || 0;
              const percent = totalSpots ? (spotsLeft / totalSpots) * 100 : 0;
              const timeLeft = getTimeLeft(exam.endTime || exam.startTime);
              const statusColor = getStatusColor(exam);
              const statusText = getStatusText(exam);

              return (
                <div
                  key={exam.id}
                  className={`backdrop-blur-sm rounded-3xl shadow-xl border-2 p-6 relative overflow-hidden hover:shadow-2xl transition-all duration-300 ${
                    exam.isLive
                      ? 'bg-gradient-to-br from-white/90 via-emerald-50/80 to-white/90 border-emerald-300/50'
                      : 'bg-white/80 border-gray-200/50'
                  }`}
                >
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>
                      {statusText}
                    </div>
                  </div>

                  {/* Live Status Indicator */}
                  {exam.isLive && (
                    <div className="absolute top-4 right-20">
                      <div className="px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white border border-green-400 shadow-sm">
                        <div className="flex items-center space-x-1">
                          <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                          <span className="text-[10px]">LIVE</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Live Toggle Button */}
                  <div className="absolute top-4 left-4">
                    <Button
                      onClick={() => handleToggleLive(exam.id, exam.isLive)}
                      size="sm"
                      className={`rounded-full w-10 h-10 p-0 transition-all duration-300 transform hover:scale-110 shadow-lg ${
                        exam.isLive
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-2 border-green-400'
                          : 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white border-2 border-gray-300'
                      }`}
                      title={exam.isLive ? 'Make Inactive' : 'Make Live'}
                    >
                      {exam.isLive ? (
                        <div className="flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse mr-1"></div>
                          <Pause className="w-4 h-4" />
                        </div>
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-start justify-between mb-4">
                    <div className="font-bold text-xl text-gray-900 truncate max-w-[70%]">{exam.title}</div>
                    <div className="w-16 h-16 flex-shrink-0">
                      <img src="/trophy.png" alt="Trophy" className="w-full h-full object-contain" />
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 mb-4 flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{exam.category}</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">{exam.totalMarks || 5} Questions</span>
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

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Entry Fee:</span>
                      <span className="font-semibold text-gray-900">₹{exam.entryFee}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Prize Pool:</span>
                      <span className="font-semibold text-green-700">₹{exam.prizePool}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-semibold text-gray-900">{exam.duration} min</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Participants:</span>
                      <span className="font-semibold text-gray-900">{exam.participantsCount || 0}</span>
                    </div>
                  </div>

                  <div className="text-sm text-orange-600 mb-6 font-medium text-center">
                    ⏰ {timeLeft} remaining
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => handleViewDetails(exam)}
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-700 transition-all duration-200"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    
                    <Button
                      onClick={() => handleEditExam(exam.id)}
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-green-300 hover:border-green-500 hover:bg-green-50 text-green-700 transition-all duration-200"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>

                  <div className="mt-3">
                    <Button
                      onClick={() => handleDeleteExam(exam.id)}
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl border-red-300 hover:border-red-500 hover:bg-red-50 text-red-700 transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}

            {exams.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-12 max-w-md mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trophy className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Live Exams</h3>
                  <p className="text-gray-600 mb-6">You haven't created any live exams yet.</p>
                  <Button
                    onClick={() => router.push('/admin/live-exams/create')}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Exam
                  </Button>
                </div>
              </div>
            )}
          </div>
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
                {/* Title and Status */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{selectedExam.title}</h3>
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(selectedExam)}`}>
                      {getStatusText(selectedExam)}
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{selectedExam.description}</p>
                </div>

                {/* Instructions */}
                {selectedExam.instructions && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-amber-600" />
                      Instructions
                    </h4>
                    <div className="bg-white/60 rounded-xl p-4 border border-amber-200">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedExam.instructions}</p>
                    </div>
                  </div>
                )}

                {/* Live Status */}
                <div className={`rounded-2xl p-6 border-2 transition-all duration-300 ${
                  selectedExam.isLive 
                    ? 'bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 border-emerald-300 shadow-lg shadow-emerald-100' 
                    : 'bg-gradient-to-r from-gray-50 via-slate-50 to-gray-50 border-gray-300 shadow-lg shadow-gray-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        selectedExam.isLive 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse' 
                          : 'bg-gradient-to-r from-gray-400 to-gray-500'
                      }`}>
                        {selectedExam.isLive ? (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        ) : (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-1">Live Status</h4>
                        <p className={`text-sm font-medium ${
                          selectedExam.isLive ? 'text-emerald-700' : 'text-gray-600'
                        }`}>
                          {selectedExam.isLive 
                            ? '✅ This exam is currently visible to students and can be joined' 
                            : '⏸️ This exam is hidden from students and cannot be joined'
                          }
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedExam.isLive 
                            ? 'Students can see this exam in their live exams list' 
                            : 'Students cannot see this exam until you make it live'
                          }
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleToggleLive(selectedExam.id, selectedExam.isLive)}
                      className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${
                        selectedExam.isLive
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-2 border-red-400'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-2 border-green-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {selectedExam.isLive ? (
                          <>
                            <Pause className="w-4 h-4" />
                            <span>Make Inactive</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            <span>Make Live</span>
                          </>
                        )}
                      </div>
                    </Button>
                  </div>
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
                      <Award className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-semibold text-gray-700">Entry Fee</span>
                    </div>
                    <p className="text-lg font-bold text-yellow-700">₹{selectedExam.entryFee}</p>
                  </div>

                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <Trophy className="w-5 h-5 text-orange-600" />
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

                {/* Category Info */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Category Information</h4>
                  <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {selectedExam.category}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
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
                      handleEditExam(selectedExam.id);
                    }}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl h-12 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Edit className="w-5 h-5 mr-2" />
                    Edit Exam
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