"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface PracticeExam {
  id: string;
  title: string;
  spots: number;
  spotsLeft: number;
  startTime: string;
  endTime?: string;
}

export default function AdminPracticeExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<PracticeExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'ongoing' | 'ended'>('all');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/practice-exams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExams(data);
      }
    } catch (e) {
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const getExamStatus = (exam: PracticeExam) => {
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = exam.endTime ? new Date(exam.endTime) : null;
    
    if (now < startTime) return 'upcoming';
    if (endTime && now > endTime) return 'ended';
    return 'ongoing';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return '⏰';
      case 'ongoing': return '🟢';
      case 'ended': return '🔚';
      default: return '📝';
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase());
    const status = getExamStatus(exam);
    const matchesFilter = filterStatus === 'all' || status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleDeleteExam = async (examId: string, examTitle: string) => {
    if (confirm(`Are you sure you want to delete "${examTitle}"? This action cannot be undone.`)) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/admin/practice-exams/${examId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          alert(data.message || 'Exam deleted successfully');
          fetchExams();
        } else {
          const errorData = await res.json();
          alert(errorData.error || errorData.message || 'Failed to delete exam. Please try again.');
        }
      } catch (error: any) {
        console.error('Failed to delete exam:', error);
        alert('Failed to delete exam. Please check your connection and try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Practice Exams</h1>
              <p className="text-gray-600 mt-2">Manage and monitor your practice exams</p>
            </div>
            <button
              onClick={() => router.push("/admin/practice-exams/create")}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create New Exam</span>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Exams</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by exam title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">All Exams</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading practice exams...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredExams.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No practice exams found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first practice exam'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => router.push("/admin/practice-exams/create")}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create Your First Exam
              </button>
            )}
          </div>
        )}

        {/* Exams Grid */}
        {!loading && filteredExams.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam) => {
              const status = getExamStatus(exam);
              const occupancyRate = ((exam.spots - exam.spotsLeft) / exam.spots) * 100;
              
              return (
                <div key={exam.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  {/* Status Badge */}
                  <div className="px-6 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        <span className="mr-1">{getStatusIcon(status)}</span>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                      <div className="text-xs text-gray-500">
                        {exam.spotsLeft}/{exam.spots} spots left
                      </div>
                    </div>
                  </div>

                  {/* Exam Content */}
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-gray-800 mb-3 line-clamp-2">{exam.title}</h3>
                    
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Occupancy</span>
                        <span>{Math.round(occupancyRate)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${occupancyRate}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Exam Details */}
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Start: {new Date(exam.startTime).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Time: {new Date(exam.startTime).toLocaleTimeString()}</span>
                      </div>
                      {exam.endTime && (
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>End: {new Date(exam.endTime).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={() => router.push(`/admin/practice-exams/${exam.id}/edit`)}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteExam(exam.id, exam.title)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                        title="Delete exam"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Results Summary */}
        {!loading && filteredExams.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {filteredExams.length} of {exams.length} practice exams
          </div>
        )}
      </div>
    </div>
  );
} 