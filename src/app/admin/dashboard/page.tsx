'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { 
  Users, BookOpen, Trophy, TrendingUp, DollarSign, Calendar, 
  Clock, Award, Activity, Target, Zap, BarChart3 
} from 'lucide-react'

interface DashboardStats {
  totalStudents: number
  totalExams: number
  examsTaken: number
  totalRevenue: number
  activeUsers: number
  averageScore: number
  completionRate: number
  monthlyGrowth: number
  recentActivities: any[]
  examStats: {
    liveExams: number
    completedExams: number
    upcomingExams: number
    totalParticipants: number
  }
  revenueData: Array<{
    month: string
    revenue: number
    participants: number
  }>
  examPerformance: Array<{
    examName: string
    participants: number
    averageScore: number
    completionRate: number
  }>
  userGrowth: Array<{
    month: string
    newUsers: number
    activeUsers: number
  }>
  categoryDistribution: Array<{
    category: string
    count: number
    percentage: number
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalExams: 0,
    examsTaken: 0,
    totalRevenue: 0,
    activeUsers: 0,
    averageScore: 0,
    completionRate: 0,
    monthlyGrowth: 0,
    recentActivities: [],
    examStats: {
      liveExams: 0,
      completedExams: 0,
      upcomingExams: 0,
      totalParticipants: 0
    },
    revenueData: [],
    examPerformance: [],
    userGrowth: [],
    categoryDistribution: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      console.log('Token from localStorage:', token ? 'exists' : 'missing')
      
      if (!token) {
        console.log('No token found, redirecting to login')
        router.push('/auth/login')
        return
      }
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        console.log('Token payload:', payload)
        console.log('User role:', payload.role)
        
        if (payload.role !== 'ADMIN') {
          console.log('User is not admin, redirecting to student dashboard')
          router.push('/student/dashboard')
          return
        }
        // If we reach here, user is authenticated as admin
        console.log('User is admin, fetching dashboard stats')
        fetchDashboardStats()
      } catch (e) {
        console.error('Token parsing error:', e)
        // Don't redirect immediately, try to fetch data first
        console.log('Trying to fetch data despite token parsing error')
        fetchDashboardStats()
      }
    }
    
    checkAuth()
  }, [router])

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token')
      console.log('Fetching dashboard stats with token:', token ? 'exists' : 'missing')
      
      if (!token) {
        console.log('No token for API call, redirecting to login')
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/admin/summary', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      console.log('API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Dashboard data received:', data)
        setStats(data)
      } else if (response.status === 401) {
        // Only redirect on actual auth error
        console.log('401 Unauthorized, redirecting to login')
        router.push('/auth/login')
      } else {
        console.error('API Error:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Comprehensive overview of platform performance and insights</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-semibold text-gray-700">{new Date().toLocaleDateString()}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm">Total</p>
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-1">{(stats.totalStudents || 0).toLocaleString()}</h3>
              <p className="text-blue-100">Students Registered</p>
              <div className="mt-2 flex items-center text-blue-100 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+{stats.monthlyGrowth || 12}% this month</span>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm">Total</p>
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-1">{(stats.totalExams || 0).toLocaleString()}</h3>
              <p className="text-purple-100">Exams Created</p>
              <div className="mt-2 flex items-center text-purple-100 text-sm">
                <Zap className="w-4 h-4 mr-1" />
                <span>{stats.examStats.liveExams || 0} live now</span>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-green-100 text-sm">Revenue</p>
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-1">₹{(stats.totalRevenue || 0).toLocaleString()}</h3>
              <p className="text-green-100">Total Revenue</p>
              <div className="mt-2 flex items-center text-green-100 text-sm">
                <Target className="w-4 h-4 mr-1" />
                <span>{stats.completionRate || 85}% completion rate</span>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-orange-100 text-sm">Average</p>
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-1">{stats.averageScore || 78}%</h3>
              <p className="text-orange-100">Average Score</p>
              <div className="mt-2 flex items-center text-orange-100 text-sm">
                <Activity className="w-4 h-4 mr-1" />
                <span>{stats.activeUsers || 0} active users</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Revenue Trend</h3>
                <p className="text-gray-600">Monthly revenue and participant growth</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="participants" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* User Growth Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">User Growth</h3>
                <p className="text-gray-600">New vs active users over time</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="newUsers" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="activeUsers" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Exam Performance */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Exam Performance</h3>
                <p className="text-gray-600">Top performing exams</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.examPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="examName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="participants" fill="#8884d8" />
                <Bar dataKey="averageScore" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Category Distribution</h3>
                <p className="text-gray-600">Exams by category</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Quick Stats</h3>
                <p className="text-gray-600">Platform overview</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-gray-700">Live Exams</span>
                </div>
                <span className="font-bold text-blue-600">{stats.examStats.liveExams}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                <div className="flex items-center">
                  <Trophy className="w-5 h-5 text-green-600 mr-3" />
                  <span className="text-gray-700">Completed</span>
                </div>
                <span className="font-bold text-green-600">{stats.examStats.completedExams}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-purple-600 mr-3" />
                  <span className="text-gray-700">Upcoming</span>
                </div>
                <span className="font-bold text-purple-600">{stats.examStats.upcomingExams}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-orange-600 mr-3" />
                  <span className="text-gray-700">Participants</span>
                </div>
                <span className="font-bold text-orange-600">{stats.examStats.totalParticipants}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Recent Activities</h2>
                <p className="text-gray-600">Latest platform activities and updates</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          {stats.recentActivities.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {stats.recentActivities.map((activity, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800">{activity.description}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recent Activities</h3>
              <p className="text-gray-500">Activities will appear here as they happen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 