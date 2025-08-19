'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Calendar, 
  Users, 
  Award, 
  ChevronLeft, 
  ChevronRight,
  Star,
  Medal,
  Crown
} from 'lucide-react'

interface Winner {
  rank: number
  userId: string
  userName: string
  userPhoto: string | null
  course: string | null
  year: string | null
  winnings: number
}

interface ExamLeaderboard {
  examId: string
  examTitle: string
  examDate: string
  totalParticipants: number
  prizePool: number
  winners: Winner[]
}

interface LeaderboardData {
  currentWeek: string
  weekStart: string
  weekEnd: string
  totalExams: number
  leaderboard: ExamLeaderboard[]
}

function WeeklyLeaderboardPage() {
  const router = useRouter()
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [selectedWeek])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const url = selectedWeek 
        ? `/api/student/weekly-leaderboard?week=${selectedWeek}`
        : '/api/student/weekly-leaderboard'

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data')
      }

      const leaderboardData = await response.json()
      setData(leaderboardData)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setError('Failed to load leaderboard data')
    } finally {
      setLoading(false)
    }
  }

  const getWeekDisplay = (weekStart: string, weekEnd: string) => {
    const start = new Date(weekStart)
    const end = new Date(weekEnd)
    return `${start.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short' 
    })} - ${end.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    })}`
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />
      default:
        return <Star className="h-5 w-5 text-blue-500" />
    }
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500 text-white'
      case 2:
        return 'bg-gray-400 text-white'
      case 3:
        return 'bg-amber-600 text-white'
      default:
        return 'bg-blue-500 text-white'
    }
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (!data) return

    const currentDate = new Date(data.weekStart)
    const newDate = new Date(currentDate)
    
    if (direction === 'prev') {
      newDate.setDate(currentDate.getDate() - 7)
    } else {
      newDate.setDate(currentDate.getDate() + 7)
    }

    const year = newDate.getFullYear()
    const weekNum = Math.ceil((newDate.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
    const weekString = `${year}-${String(weekNum).padStart(2, '0')}`
    
    setSelectedWeek(weekString)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-red-500 rounded-full"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchLeaderboard} className="bg-blue-500 hover:bg-blue-600">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
                Weekly Leaderboard
              </h1>
              <p className="text-gray-600 mt-1">Top performers from live exams this week</p>
            </div>
            
            {/* Week Navigation */}
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('prev')}
                className="flex items-center"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous Week
              </Button>
              
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span className="font-semibold text-gray-900">
                    {data ? getWeekDisplay(data.weekStart, data.weekEnd) : 'This Week'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {data?.totalExams || 0} exams completed
                </p>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('next')}
                className="flex items-center"
              >
                Next Week
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!data || data.leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No exams this week</h3>
            <p className="text-gray-500 mb-4">
              No live exams were completed during this week.
            </p>
            <Button onClick={() => setSelectedWeek('')} className="bg-blue-500 hover:bg-blue-600">
              View Current Week
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {data.leaderboard.map((exam) => (
              <Card key={exam.examId} className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        {exam.examTitle}
                      </CardTitle>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(exam.examDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {exam.totalParticipants} participants
                        </div>
                        <div className="flex items-center">
                          <Award className="h-4 w-4 mr-1" />
                          ₹{exam.prizePool} prize pool
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {exam.winners.map((winner) => (
                      <div
                        key={winner.userId}
                        className={`relative p-4 rounded-lg border-2 ${
                          winner.rank === 1 ? 'border-yellow-400 bg-yellow-50' :
                          winner.rank === 2 ? 'border-gray-300 bg-gray-50' :
                          winner.rank === 3 ? 'border-amber-500 bg-amber-50' :
                          'border-blue-200 bg-blue-50'
                        }`}
                      >
                        {/* Rank Badge */}
                        <div className="absolute -top-2 -right-2">
                          <Badge className={`${getRankBadgeColor(winner.rank)} text-xs font-bold`}>
                            #{winner.rank}
                          </Badge>
                        </div>
                        
                        {/* User Info */}
                        <div className="text-center">
                          <div className="relative mx-auto mb-3">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                              {winner.userPhoto ? (
                                <img 
                                  src={winner.userPhoto} 
                                  alt={winner.userName}
                                  className="w-16 h-16 rounded-full object-cover"
                                />
                              ) : (
                                winner.userName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="absolute -bottom-1 -right-1">
                              {getRankIcon(winner.rank)}
                            </div>
                          </div>
                          
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {winner.userName}
                          </h4>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {winner.course} • Year {winner.year}
                          </p>
                          
                          <div className="text-lg font-bold text-green-600">
                            ₹{winner.winnings}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default WeeklyLeaderboardPage
