'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FaGraduationCap, FaBook, FaTrophy, FaUsers, FaClock, FaBrain, 
  FaGamepad, FaChartLine, FaStar, FaFire, FaRocket, FaMedal,
  FaCheckCircle, FaLightbulb, FaUserFriends, FaBolt, FaGem,
  FaShieldAlt, FaMoneyBillWave, FaDownload, FaBars, FaTimes,
  FaPlay, FaCalendarAlt, FaBell, FaAward, FaBookOpen, FaArrowRight,
  FaCoins, FaChartBar, FaMobileAlt, FaDesktop, FaCloud, FaInfinity
} from 'react-icons/fa';

export default function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [liveExamCount, setLiveExamCount] = useState(12);
  const [activeStudents, setActiveStudents] = useState(2847);
  const [totalEarnings, setTotalEarnings] = useState(5000000000);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);

  // Simulate live counter updates
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStudents(prev => prev + Math.floor(Math.random() * 15));
      setTotalEarnings(prev => prev + Math.floor(Math.random() * 50000));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex(prev => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const examCategories = [
    { 
      name: 'JEE Main', 
      icon: '🔬', 
      students: '15.2K', 
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      liveExams: 8,
      nextExam: '2:30 PM',
      prize: '₹5,000'
    },
    { 
      name: 'NEET', 
      icon: '🏥', 
      students: '12.8K', 
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      liveExams: 6,
      nextExam: '3:00 PM',
      prize: '₹4,500'
    },
    { 
      name: 'UPSC', 
      icon: '🏛️', 
      students: '8.5K', 
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      liveExams: 5,
      nextExam: '4:15 PM',
      prize: '₹6,000'
    },
    { 
      name: 'SSC CGL', 
      icon: '📝', 
      students: '10.2K', 
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      liveExams: 7,
      nextExam: '5:00 PM',
      prize: '₹3,500'
    },
    { 
      name: 'Banking', 
      icon: '🏦', 
      students: '9.7K', 
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-50',
      liveExams: 4,
      nextExam: '6:30 PM',
      prize: '₹4,000'
    },
    { 
      name: 'Railways', 
      icon: '🚂', 
      students: '7.3K', 
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50',
      liveExams: 3,
      nextExam: '7:00 PM',
      prize: '₹3,000'
    },
  ];

  const features = [
    {
      icon: FaClock,
      title: 'Live Competitive Exams',
      description: 'Join real-time exams with instant results. Compete with lakhs of students nationwide!',
      color: 'from-red-500 to-pink-500',
      stats: '50+ Daily Exams',
      badge: 'MOST POPULAR'
    },
    {
      icon: FaBrain,
      title: 'AI-Powered Practice',
      description: 'Smart practice tests that adapt to your level. Get personalized question recommendations.',
      color: 'from-blue-500 to-cyan-500',
      stats: '10,000+ Questions',
      badge: 'AI POWERED'
    },
    {
      icon: FaGamepad,
      title: '1v1 Battle Quiz',
      description: 'Challenge friends or random opponents. Win real money instantly. Minimum ₹10 entry!',
      color: 'from-purple-500 to-pink-500',
      stats: '₹1Cr+ Daily Prize',
      badge: 'TRENDING'
    },
    {
      icon: FaUserFriends,
      title: 'Social Feed & Stories',
      description: 'Instagram-like social feed! Share study updates, post questions, connect with friends & create stories.',
      color: 'from-pink-500 to-rose-500',
      stats: '1M+ Posts Daily',
      badge: 'SOCIAL'
    },
    {
      icon: FaBook,
      title: 'Buy/Sell/Rent Books',
      description: 'Marketplace for used books! Sell your old books, rent textbooks, or donate to help others. Save 70%!',
      color: 'from-green-500 to-emerald-500',
      stats: '50K+ Books',
      badge: 'MARKETPLACE'
    },
    {
      icon: FaChartLine,
      title: 'Performance Analytics',
      description: 'Detailed analytics, weak topic identification, improvement suggestions & rank prediction.',
      color: 'from-orange-500 to-yellow-500',
      stats: 'Smart Reports',
      badge: 'PRO FEATURE'
    },
    {
      icon: FaBolt,
      title: 'Daily Challenges',
      description: 'New challenges every day! Maintain streaks, earn badges, and win surprise rewards.',
      color: 'from-indigo-500 to-purple-500',
      stats: 'Win Daily',
      badge: 'NEW'
    },
    {
      icon: FaCalendarAlt,
      title: 'Smart Timetable',
      description: 'Create study schedules, set reminders, track progress & stay organized with AI suggestions.',
      color: 'from-cyan-500 to-blue-500',
      stats: 'Auto Organize',
      badge: 'SMART'
    },
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      exam: 'NEET 2024 - AIR 247',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=b6e3f4',
      review: 'YottaScore ke practice tests ne meri life change kar di! Daily live exams se time management perfect ho gaya. NEET mein AIR 247 aaya aur ₹15,000 bhi jeete!',
      rating: 5,
      score: 'AIR 247',
      amount: '₹15,000',
      exams: '156',
      city: 'Delhi'
    },
    {
      name: 'Rahul Kumar',
      exam: 'JEE Main 2024 - 99.2%ile',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul&backgroundColor=c0aede',
      review: 'Physics aur Maths ke questions bilkul real exam jaise hain! Battle quiz se confidence badha. JEE mein 99.2 percentile mila. Thank you YottaScore! 🙏',
      rating: 5,
      score: '99.2%ile',
      amount: '₹22,000',
      exams: '203',
      city: 'Mumbai'
    },
    {
      name: 'Amit Singh',
      exam: 'UPSC Prelims Qualified',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit&backgroundColor=ffd5dc',
      review: 'GK section is outstanding! Current affairs daily updates perfect hain. Prelims clear kiya first attempt mein. Paisa bhi kama liya preparation karte hue!',
      rating: 5,
      score: 'Qualified',
      amount: '₹18,500',
      exams: '178',
      city: 'Bangalore'
    },
    {
      name: 'Sneha Patel',
      exam: 'SSC CGL 2024',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha&backgroundColor=d1d4f9',
      review: 'Mock tests bilkul real exam pattern ke hain! Quantitative aptitude weak tha, analytics ne identify karke improve karne mein help ki. SSC clear! 🎉',
      rating: 5,
      score: 'Selected',
      amount: '₹12,000',
      exams: '134',
      city: 'Ahmedabad'
    },
    {
      name: 'Vikram Joshi',
      exam: 'Banking PO - SBI',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram&backgroundColor=ffdfbf',
      review: 'Reasoning aur English sections bahut strong hain. Daily battle quiz se speed badh gayi. SBI PO mein selection ho gaya. Best investment! 💪',
      rating: 5,
      score: 'SBI PO',
      amount: '₹16,800',
      exams: '145',
      city: 'Pune'
    },
    {
      name: 'Kavya Reddy',
      exam: 'GATE CSE - AIR 89',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kavya&backgroundColor=b6e3f4',
      review: 'Technical questions ka level amazing hai! Coding questions practice karne se concepts clear ho gaye. GATE mein top 100 rank aur ₹14K earning! 🚀',
      rating: 5,
      score: 'AIR 89',
      amount: '₹14,200',
      exams: '167',
      city: 'Hyderabad'
    },
  ];

  const stats = [
    { number: '1M+', label: 'Active Students', icon: FaUsers, color: 'from-blue-500 to-cyan-500' },
    { number: '₹50Cr+', label: 'Total Winnings', icon: FaMoneyBillWave, color: 'from-green-500 to-emerald-500' },
    { number: '10K+', label: 'Daily Winners', icon: FaTrophy, color: 'from-yellow-500 to-orange-500' },
    { number: '4.9★', label: 'User Rating', icon: FaStar, color: 'from-purple-500 to-pink-500' }
  ];

  const upcomingExams = [
    { title: 'Mathematics Master Challenge', time: '2:30 PM', prize: '₹5,000', students: 1243, difficulty: 'Medium' },
    { title: 'Physics Rapid Fire', time: '3:00 PM', prize: '₹3,500', students: 856, difficulty: 'Hard' },
    { title: 'Chemistry Quiz Battle', time: '4:15 PM', prize: '₹4,000', students: 967, difficulty: 'Easy' },
  ];

  const achievements = [
    { icon: '🏆', title: 'Top Performer', desc: 'Score 95%+ in 5 exams' },
    { icon: '🔥', title: 'Streak Master', desc: 'Maintain 30 day streak' },
    { icon: '💎', title: 'Quiz Champion', desc: 'Win 100 battle quizzes' },
    { icon: '⚡', title: 'Speed Demon', desc: 'Finish exam in <10 min' },
    { icon: '🎯', title: 'Perfect Score', desc: 'Score 100% in any exam' },
    { icon: '👑', title: 'Rank 1', desc: 'Top the leaderboard' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sticky Header - Mobile Optimized */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100">
        <div className="container mx-auto px-3 py-3">
          <div className="flex items-center justify-between">
            {/* Logo - Mobile Optimized */}
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg blur-sm group-hover:blur-md transition-all"></div>
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <FaGraduationCap className="text-white text-lg sm:text-xl" />
                </div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  YottaScore
                </h1>
                <p className="text-xs text-gray-600 font-semibold hidden sm:block">Exam • Learn • Earn</p>
              </div>
            </Link>
            
            {/* Desktop Navigation - Removed for cleaner look */}
            <nav className="hidden lg:flex items-center space-x-8">
              {/* Navigation removed - focusing on CTA buttons */}
            </nav>

            {/* CTA Buttons - Desktop */}
            <div className="hidden lg:flex items-center space-x-4">
              <Link 
                href="/login" 
                className="px-6 py-2.5 bg-white border-2 border-blue-600 text-blue-600 rounded-full font-bold hover:bg-blue-50 transition-all duration-300"
              >
                Login
              </Link>
              <Link 
                href="/register" 
                className="relative px-6 py-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-full font-bold hover:shadow-lg hover:scale-105 transition-all duration-300 overflow-hidden group"
              >
                <span className="relative z-10">Sign Up Free</span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
            </button>
          </div>

          {/* Mobile Menu - Enhanced */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t border-gray-100 pt-4 animate-slideDown">
              <div className="flex flex-col space-y-3">
                <Link 
                  href="/login" 
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold text-center text-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold text-center text-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign Up Free
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Spacer */}
      <div className="h-20"></div>

      {/* Hero Section - Mobile Optimized */}
      <section className="relative min-h-[90vh] sm:min-h-[95vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        {/* Animated Background - Mobile Optimized */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-48 h-48 sm:w-96 sm:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
          <div className="absolute top-20 right-10 w-64 h-64 sm:w-[500px] sm:h-[500px] bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-10 left-1/2 w-48 h-48 sm:w-96 sm:h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{animationDelay: '4s'}}></div>
          
          {/* Floating Icons - Mobile Optimized */}
          <div className="absolute top-1/4 left-1/4 text-3xl sm:text-6xl opacity-10 animate-float">📚</div>
          <div className="absolute top-1/3 right-1/4 text-2xl sm:text-5xl opacity-10 animate-float" style={{animationDelay: '1s'}}>🎓</div>
          <div className="absolute bottom-1/4 left-1/3 text-4xl sm:text-7xl opacity-10 animate-float" style={{animationDelay: '2s'}}>🏆</div>
          <div className="absolute bottom-1/3 right-1/3 text-2xl sm:text-5xl opacity-10 animate-float" style={{animationDelay: '3s'}}>💰</div>
        </div>

        <div className="container mx-auto px-3 sm:px-4 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left - Content - Mobile Optimized */}
              <div className="text-center lg:text-left">
                {/* Live Status Badge - Mobile Optimized */}
                <div className="inline-flex items-center bg-white/20 backdrop-blur-md text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full mb-6 sm:mb-8 border border-white/30 shadow-2xl">
                  <div className="relative mr-2 sm:mr-3">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-ping absolute"></div>
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                  </div>
                  <FaFire className="text-yellow-400 mr-1 sm:mr-2 text-sm sm:text-lg animate-pulse" />
                  <span className="font-bold text-sm sm:text-lg">{liveExamCount} LIVE • {activeStudents.toLocaleString()} Online!</span>
                </div>

                {/* Main Headline - Mobile Optimized */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-4 sm:mb-6 leading-tight">
                  <span className="block bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-2xl">
                    Ace Your Exams
                  </span>
                  <span className="block bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 bg-clip-text text-transparent mt-1 sm:mt-2">
                    Earn Big Rewards!
                  </span>
                </h1>

                <p className="text-lg sm:text-xl md:text-2xl text-white/95 mb-6 sm:mb-8 leading-relaxed font-medium">
                  Practice • Compete • Win Real Money 💸
                  <br />
                  <span className="text-yellow-300 font-bold">India's Most Trusted Exam Platform</span>
                </p>

                {/* Stats Pills - Mobile Optimized */}
                <div className="flex flex-wrap gap-2 sm:gap-4 mb-8 sm:mb-10 justify-center lg:justify-start">
                  <div className="bg-white/20 backdrop-blur-md px-3 py-2 sm:px-6 sm:py-3 rounded-full border border-white/30 shadow-xl">
                    <div className="text-white font-bold text-sm sm:text-lg">1M+ Students</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-3 py-2 sm:px-6 sm:py-3 rounded-full border border-white/30 shadow-xl">
                    <div className="text-white font-bold text-sm sm:text-lg">₹50Cr+ Won</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-3 py-2 sm:px-6 sm:py-3 rounded-full border border-white/30 shadow-xl">
                    <div className="text-white font-bold text-sm sm:text-lg">4.9★ Rated</div>
                  </div>
                </div>

                {/* CTA Buttons - Mobile Optimized */}
                <div className="flex flex-col gap-3 sm:gap-4 justify-center lg:justify-start">
                  <Link 
                    href="/register"
                    className="group relative px-6 py-4 sm:px-10 sm:py-5 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white rounded-full font-black text-lg sm:text-xl shadow-2xl hover:shadow-yellow-500/50 hover:scale-105 transition-all duration-300 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      <FaRocket className="mr-2 sm:mr-3 text-lg sm:text-2xl group-hover:rotate-45 transition-transform duration-300" />
                      <span className="hidden sm:inline">Start Free - Win ₹50 Bonus!</span>
                      <span className="sm:hidden">Start Free - ₹50 Bonus!</span>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 sm:px-4 sm:py-1.5 rounded-full animate-pulse shadow-lg">
                      ₹50
                    </div>
                  </Link>
                  <Link 
                    href="/student/live-exams"
                    className="group px-6 py-4 sm:px-10 sm:py-5 bg-white/20 backdrop-blur-md text-white border-2 border-white/50 rounded-full font-bold text-lg sm:text-xl hover:bg-white/30 transition-all duration-300 flex items-center justify-center"
                  >
                    <FaPlay className="mr-2 sm:mr-3 group-hover:translate-x-1 transition-transform" />
                    Join Live Exam
                  </Link>
                </div>

                {/* Trust Badges - Mobile Optimized */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-6 mt-8 sm:mt-10 text-white/90">
                  <div className="flex items-center gap-2">
                    <FaShieldAlt className="text-green-400 text-xl sm:text-2xl" />
                    <div>
                      <div className="font-bold text-xs sm:text-sm">100% Secure</div>
                      <div className="text-xs text-white/70">Bank Level Security</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-blue-400 text-xl sm:text-2xl" />
                    <div>
                      <div className="font-bold text-xs sm:text-sm">Instant Payouts</div>
                      <div className="text-xs text-white/70">Withdraw Anytime</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaStar className="text-yellow-400 text-xl sm:text-2xl" />
                    <div>
                      <div className="font-bold text-xs sm:text-sm">Top Rated</div>
                      <div className="text-xs text-white/70">4.9★ by 1M Users</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right - Visual/Dashboard Preview */}
              <div className="hidden lg:block relative">
                <div className="relative">
                  {/* Main Dashboard Card */}
                  <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                    {/* Mini Dashboard */}
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-white font-bold text-2xl">Your Dashboard</h3>
                          <p className="text-white/70 text-sm">Track your progress</p>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                          <FaChartLine className="text-white text-xl" />
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-5 shadow-lg">
                          <div className="text-white/80 text-sm mb-1">Exams Taken</div>
                          <div className="text-white font-black text-3xl">156</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-5 shadow-lg">
                          <div className="text-white/80 text-sm mb-1">Win Rate</div>
                          <div className="text-white font-black text-3xl">89%</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-5 shadow-lg">
                          <div className="text-white/80 text-sm mb-1">Total Won</div>
                          <div className="text-white font-black text-3xl">₹2.4K</div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 shadow-lg">
                          <div className="text-white/80 text-sm mb-1">Rank</div>
                          <div className="text-white font-black text-3xl">#47</div>
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
                        <h4 className="text-white font-bold mb-4 flex items-center">
                          <FaClock className="mr-2 text-blue-400" />
                          Recent Activity
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-white text-sm">Physics Test</span>
                            </div>
                            <span className="text-green-400 font-bold text-sm">+₹75</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <span className="text-white text-sm">Math Quiz</span>
                            </div>
                            <span className="text-green-400 font-bold text-sm">+₹50</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                              <span className="text-white text-sm">GK Battle</span>
                            </div>
                            <span className="text-green-400 font-bold text-sm">+₹100</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Achievement Badges */}
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                    <FaTrophy className="text-white text-2xl" />
                  </div>
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl animate-bounce" style={{animationDelay: '1s'}}>
                    <FaMedal className="text-white text-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </section>



      {/* Exam Categories Section - Mobile Optimized */}
      <section id="exams" className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
        {/* Animated Background - Mobile Optimized */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.3),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.3),transparent_50%)]"></div>
          <div className="absolute top-10 left-10 w-48 h-48 sm:w-96 sm:h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 sm:w-96 sm:h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-[600px] sm:h-[600px] bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="container mx-auto px-3 sm:px-4 relative z-10">
          {/* Section Header - Mobile Optimized */}
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 sm:px-8 sm:py-3 rounded-full font-black text-xs sm:text-sm mb-4 sm:mb-6 shadow-2xl animate-pulse">
              <FaFire className="mr-1 sm:mr-2 text-sm sm:text-lg" />
              <span className="hidden sm:inline">🔥 TRENDING EXAMS - 50,000+ STUDENTS ONLINE NOW!</span>
              <span className="sm:hidden">🔥 TRENDING EXAMS - 50K+ ONLINE!</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 sm:mb-6 leading-tight">
              <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 bg-clip-text text-transparent drop-shadow-2xl">
                Choose Your Dream Exam
              </span>
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
              Join <span className="text-yellow-300 font-bold">lakhs of students</span> preparing for India's top competitive exams
              <br className="hidden sm:block" />
              <span className="text-green-300 font-bold">Live Classes • Mock Tests • Instant Results • Real Money Prizes! 💰</span>
            </p>
          </div>

          {/* Exam Cards Grid - Mobile Optimized */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
            {examCategories.map((category, index) => (
              <Link
                key={index}
                href="/student/practice-exams"
                className="group relative bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl hover:shadow-[0_20px_60px_rgba(59,130,246,0.5)] transition-all duration-500 hover:-translate-y-2 sm:hover:-translate-y-4 hover:scale-105 border-2 border-white/50"
              >
                {/* Animated Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Live Pulse Badge - Mobile Optimized */}
                {category.liveExams > 0 && (
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20">
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                      <div className="relative bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-full text-xs font-black flex items-center gap-1 sm:gap-2 shadow-2xl">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="hidden sm:inline">{category.liveExams} LIVE</span>
                        <span className="sm:hidden">{category.liveExams}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content - Mobile Optimized */}
                <div className="relative z-10 p-4 sm:p-6 lg:p-8">
                  {/* Icon with Glow Effect - Mobile Optimized */}
                  <div className="relative mb-4 sm:mb-6">
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} rounded-2xl sm:rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500`}></div>
                    <div className={`relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br ${category.color} rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
                      <span className="text-3xl sm:text-4xl lg:text-6xl group-hover:scale-125 transition-transform duration-500">{category.icon}</span>
                    </div>
                  </div>

                  {/* Title with Gradient - Mobile Optimized */}
                  <h3 className={`text-xl sm:text-2xl lg:text-3xl font-black mb-4 sm:mb-6 bg-gradient-to-r ${category.color} bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300`}>
                    {category.name}
                  </h3>

                  {/* Enhanced Stats Grid - Mobile Optimized */}
                  <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                    {/* Active Students */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg sm:rounded-xl p-3 sm:p-4 group-hover:shadow-lg transition-all">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <FaUsers className="text-blue-600 text-sm sm:text-lg" />
                        <span className="text-gray-700 font-bold text-xs sm:text-sm">Students</span>
                      </div>
                      <span className="font-black text-blue-600 text-sm sm:text-lg">{category.students}</span>
                    </div>

                    {/* Live Exams */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-red-50 to-pink-50 rounded-lg sm:rounded-xl p-3 sm:p-4 group-hover:shadow-lg transition-all">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <FaFire className="text-red-600 text-sm sm:text-lg animate-pulse" />
                        <span className="text-gray-700 font-bold text-xs sm:text-sm">Live Now</span>
                      </div>
                      <span className="font-black text-red-600 text-sm sm:text-lg">{category.liveExams} Exams</span>
                    </div>

                    {/* Next Exam Countdown */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg sm:rounded-xl p-3 sm:p-4 group-hover:shadow-lg transition-all">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <FaClock className="text-purple-600 text-sm sm:text-lg" />
                        <span className="text-gray-700 font-bold text-xs sm:text-sm">Next Exam</span>
                      </div>
                      <span className="font-black text-purple-600 text-sm sm:text-lg">{category.nextExam}</span>
                    </div>

                    {/* Prize Pool */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-3 sm:p-4 group-hover:shadow-lg transition-all">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <FaTrophy className="text-green-600 text-sm sm:text-lg" />
                        <span className="text-gray-700 font-bold text-xs sm:text-sm">Win Upto</span>
                      </div>
                      <span className="font-black text-green-600 text-sm sm:text-lg">{category.prize}</span>
                    </div>
                  </div>

                  {/* Call to Action Button - Mobile Optimized */}
                  <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r ${category.color} p-1 shadow-2xl group-hover:shadow-[0_10px_40px_rgba(59,130,246,0.6)] transition-all duration-500`}>
                    <div className="bg-white rounded-lg sm:rounded-xl px-4 py-3 sm:px-6 sm:py-4 group-hover:bg-transparent transition-all duration-300">
                      <div className={`flex items-center justify-center gap-2 sm:gap-3 font-black text-sm sm:text-lg group-hover:text-white transition-colors duration-300 bg-gradient-to-r ${category.color} bg-clip-text text-transparent group-hover:bg-clip-border`}>
                        <FaRocket className="text-lg sm:text-2xl group-hover:rotate-45 transition-transform duration-500" />
                        <span className="hidden sm:inline">Start Free Trial</span>
                        <span className="sm:hidden">Start Free</span>
                        <FaArrowRight className="group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>

                  {/* Bonus Badge - Mobile Optimized */}
                  <div className="mt-3 sm:mt-4 text-center">
                    <div className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-black border-2 border-yellow-300 shadow-lg">
                      <span className="hidden sm:inline">🎁 FREE TRIAL + ₹50 BONUS</span>
                      <span className="sm:hidden">🎁 FREE + ₹50</span>
                    </div>
                  </div>
                </div>

                {/* Shimmer Effect on Hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>
                </div>

                {/* Corner Decoration - Mobile Optimized */}
                <div className="absolute -top-1 -left-1 sm:-top-2 sm:-left-2 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                  <FaStar className="text-white text-sm sm:text-xl animate-spin" style={{animationDuration: '3s'}} />
                </div>
              </Link>
            ))}
          </div>

          {/* Bottom CTA Bar - Mobile Optimized */}
          <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl text-center">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-3 sm:mb-4">
              🎯 Not Sure Which Exam? Take Our FREE Career Quiz!
            </h3>
            <p className="text-lg sm:text-xl text-white/90 mb-4 sm:mb-6">
              Get personalized exam recommendations based on your interests & strengths
            </p>
            <button className="px-6 py-3 sm:px-10 sm:py-4 bg-white text-orange-600 rounded-full font-black text-lg sm:text-xl hover:scale-110 transition-all duration-300 shadow-2xl">
              <span className="hidden sm:inline">Start Career Quiz →</span>
              <span className="sm:hidden">Start Quiz →</span>
            </button>
          </div>
        </div>
      </section>

      {/* Live Winners Leaderboard Section - Mobile Optimized */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
        {/* Animated Background - Mobile Optimized */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-48 h-48 sm:w-96 sm:h-96 bg-yellow-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 sm:w-96 sm:h-96 bg-green-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: '2s'}}></div>
          {/* Floating Money Icons - Mobile Optimized */}
          <div className="absolute top-20 left-1/4 text-3xl sm:text-6xl opacity-5 animate-float">💰</div>
          <div className="absolute bottom-20 right-1/4 text-2xl sm:text-5xl opacity-5 animate-float" style={{animationDelay: '1s'}}>🏆</div>
          <div className="absolute top-1/2 right-1/3 text-2xl sm:text-4xl opacity-5 animate-float" style={{animationDelay: '2s'}}>💎</div>
        </div>

        <div className="container mx-auto px-3 sm:px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Header - Mobile Optimized */}
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full font-black text-xs sm:text-sm mb-4 sm:mb-6 shadow-2xl">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full mr-1 sm:mr-2 animate-ping"></div>
                <span className="hidden sm:inline">LIVE WINNERS - UPDATED 2 MINS AGO</span>
                <span className="sm:hidden">LIVE WINNERS - 2 MINS AGO</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6">
                🏆 Today's Top Winners
              </h2>
              <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto">
                Real students winning real money right now! You could be next! 💸
              </p>
            </div>

            {/* Leaderboard Container - Mobile Optimized */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/10 shadow-2xl">
              {/* Leaderboard Header - Mobile Optimized */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-white/10 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <FaTrophy className="text-white text-xl sm:text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-white">Live Leaderboard</h3>
                    <p className="text-xs sm:text-sm text-gray-400">Mathematics Master Challenge</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs sm:text-sm text-gray-400">Total Prize Pool</div>
                  <div className="text-2xl sm:text-3xl font-black text-green-400">₹50,000</div>
                </div>
              </div>

              {/* Winner Entries - Mobile Optimized */}
              <div className="space-y-3 sm:space-y-4">
                {[
                  { rank: 1, name: 'Arjun Sharma', score: '98/100', time: '8:45', won: '₹15,000', city: 'Delhi', avatar: 'AS', color: 'from-yellow-400 to-orange-500', rankBg: 'bg-gradient-to-br from-yellow-400 to-orange-500', medal: '🥇' },
                  { rank: 2, name: 'Priya Patel', score: '96/100', time: '9:12', won: '₹10,000', city: 'Mumbai', avatar: 'PP', color: 'from-gray-300 to-gray-400', rankBg: 'bg-gradient-to-br from-gray-300 to-gray-400', medal: '🥈' },
                  { rank: 3, name: 'Rahul Kumar', score: '94/100', time: '8:58', won: '₹7,500', city: 'Bangalore', avatar: 'RK', color: 'from-orange-400 to-amber-600', rankBg: 'bg-gradient-to-br from-orange-400 to-amber-600', medal: '🥉' },
                  { rank: 4, name: 'Sneha Singh', score: '92/100', time: '9:34', won: '₹5,000', city: 'Pune', avatar: 'SS', color: 'from-blue-400 to-cyan-500', rankBg: 'bg-gradient-to-br from-blue-500 to-cyan-600', medal: '4️⃣' },
                  { rank: 5, name: 'Vikram Reddy', score: '90/100', time: '9:05', won: '₹3,500', city: 'Hyderabad', avatar: 'VR', color: 'from-purple-400 to-pink-500', rankBg: 'bg-gradient-to-br from-purple-500 to-pink-600', medal: '5️⃣' },
                ].map((winner, index) => (
                  <div 
                    key={index}
                    className={`group relative bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border ${
                      index === 0 ? 'border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.3)]' :
                      index === 1 ? 'border-gray-400/50 shadow-[0_0_20px_rgba(156,163,175,0.2)]' :
                      index === 2 ? 'border-orange-500/50 shadow-[0_0_20px_rgba(251,146,60,0.2)]' :
                      'border-white/10'
                    } hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02]`}
                  >
                    <div className="flex items-center gap-3 sm:gap-6">
                      {/* Rank Badge - Mobile Optimized */}
                      <div className="relative">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 ${winner.rankBg} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl ${
                          index < 3 ? 'animate-pulse' : ''
                        }`}>
                          <span className="text-white font-black text-xl sm:text-3xl">{winner.medal}</span>
                        </div>
                        {index === 0 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                            <FaFire className="text-white text-xs" />
                          </div>
                        )}
                      </div>

                      {/* User Info - Mobile Optimized */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                          {/* Avatar */}
                          <div className={`w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br ${winner.color} rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg`}>
                            <span className="text-white font-black text-sm sm:text-lg">{winner.avatar}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm sm:text-lg lg:text-xl font-black text-white flex items-center gap-1 sm:gap-2 truncate">
                              {winner.name}
                              {index < 3 && <FaCheckCircle className="text-green-400 text-xs sm:text-sm flex-shrink-0" />}
                            </h4>
                            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                📍 {winner.city}
                              </span>
                              <span className="flex items-center gap-1">
                                <FaClock className="text-blue-400" />
                                {winner.time} min
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Score - Mobile Optimized */}
                      <div className="text-center px-2 sm:px-6">
                        <div className="text-xs sm:text-sm text-gray-400 mb-1">Score</div>
                        <div className="text-lg sm:text-2xl lg:text-3xl font-black text-white">{winner.score}</div>
                      </div>

                      {/* Winnings - Mobile Optimized */}
                      <div className="relative">
                        <div className={`absolute inset-0 bg-gradient-to-br ${winner.color} blur-xl opacity-50`}></div>
                        <div className={`relative bg-gradient-to-br ${winner.color} rounded-xl sm:rounded-2xl px-4 py-3 sm:px-8 sm:py-5 text-center shadow-2xl ${
                          index === 0 ? 'animate-pulse' : ''
                        }`}>
                          <div className="text-white/90 text-xs font-bold mb-1">WON</div>
                          <div className="text-white font-black text-lg sm:text-2xl lg:text-3xl">{winner.won}</div>
                          {index === 0 && (
                            <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-red-500 text-white text-xs font-bold px-1 py-0.5 sm:px-2 sm:py-1 rounded-full animate-bounce">
                              NEW!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Confetti for Top 3 - Mobile Optimized */}
                    {index < 3 && (
                      <div className="absolute top-1 left-1 sm:top-2 sm:left-2 text-lg sm:text-2xl opacity-50 animate-bounce" style={{animationDelay: `${index * 0.2}s`}}>
                        🎉
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* View Full Leaderboard CTA */}
              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <Link 
                  href="/student/live-exams"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold text-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:scale-105 transition-all duration-300 group"
                >
                  <FaTrophy className="mr-2 text-xl" />
                  View Full Leaderboard & Join Next Exam
                  <FaArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Quick Stats Below Leaderboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              {[
                { label: 'Winners Today', value: '2,847', icon: FaTrophy, color: 'from-yellow-400 to-orange-500' },
                { label: 'Money Won Today', value: '₹12.5L', icon: FaMoneyBillWave, color: 'from-green-400 to-emerald-500' },
                { label: 'Exams Completed', value: '156', icon: FaCheckCircle, color: 'from-blue-400 to-cyan-500' },
                { label: 'Active Now', value: activeStudents.toLocaleString(), icon: FaUsers, color: 'from-purple-400 to-pink-500' },
              ].map((stat, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center hover:bg-white/10 transition-all duration-300">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                    <stat.icon className="text-white text-xl" />
                  </div>
                  <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400 font-semibold">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Exams Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-5xl font-black text-gray-800 mb-4">
                <FaFire className="inline text-orange-500 mr-3" />
                Upcoming Live Exams
              </h2>
              <p className="text-xl text-gray-600">
                Join now and compete for real money prizes!
              </p>
            </div>

            <div className="space-y-4">
              {upcomingExams.map((exam, index) => (
                <div 
                  key={index}
                  className="group bg-gradient-to-r from-white to-blue-50 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-blue-100 hover:border-blue-500"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                          <FaBook className="text-white text-xl" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                            {exam.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1">
                              <FaClock className="text-blue-500" />
                              {exam.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <FaUsers className="text-green-500" />
                              {exam.students} joined
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              exam.difficulty === 'Easy' ? 'bg-green-100 text-green-600' :
                              exam.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-red-100 text-red-600'
                            }`}>
                              {exam.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">Prize Pool</div>
                        <div className="text-2xl font-black text-green-600">{exam.prize}</div>
                      </div>
                      <Link
                        href="/student/live-exams"
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
                      >
                        Join Now
                        <FaArrowRight />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link 
                href="/student/live-exams"
                className="inline-flex items-center text-blue-600 font-bold text-lg hover:text-blue-700 transition-colors group"
              >
                View All Live Exams
                <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section id="features" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block bg-purple-100 text-purple-600 px-6 py-2 rounded-full font-bold text-sm mb-4">
              WHY CHOOSE US
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-gray-800 mb-6">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Complete exam preparation platform with gamified learning and real money rewards
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 border-2 border-gray-100 hover:border-blue-500 overflow-hidden"
              >
                {/* Badge */}
                <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                  {feature.badge}
                </div>

                {/* Icon */}
                <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  <feature.icon className="text-3xl text-white" />
                </div>
                
                {/* Content */}
                <h3 className="text-2xl font-black text-gray-800 mb-4 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Stats Badge */}
                <div className={`inline-flex items-center px-5 py-3 bg-gradient-to-r ${feature.color} bg-opacity-10 rounded-full border-2 border-transparent group-hover:border-current`}>
                  <span className="font-black text-sm bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {feature.stats}
                  </span>
                </div>

                {/* Hover Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`}></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Showcase */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-gray-800 mb-4">
              Unlock Amazing Achievements
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Complete challenges, earn badges, and showcase your skills!
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {achievements.map((achievement, index) => (
              <div 
                key={index}
                className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-gray-100 hover:border-yellow-500 text-center"
              >
                <div className="text-6xl mb-4 group-hover:scale-125 transition-transform duration-300">
                  {achievement.icon}
                </div>
                <h4 className="font-bold text-gray-800 mb-2">{achievement.title}</h4>
                <p className="text-xs text-gray-600">{achievement.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black text-gray-800 mb-6">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start your exam preparation journey and earning in just minutes!
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '1',
                  title: 'Sign Up Free',
                  desc: 'Create your account in 30 seconds. Get ₹50 welcome bonus instantly!',
                  icon: FaUserFriends,
                  color: 'from-blue-500 to-cyan-500'
                },
                {
                  step: '2',
                  title: 'Choose Your Exam',
                  desc: 'Select your exam category. Start with practice tests or join live exams!',
                  icon: FaBookOpen,
                  color: 'from-purple-500 to-pink-500'
                },
                {
                  step: '3',
                  title: 'Learn & Earn',
                  desc: 'Practice daily, compete in exams, win prizes & withdraw instantly!',
                  icon: FaTrophy,
                  color: 'from-green-500 to-emerald-500'
                }
              ].map((item, index) => (
                <div key={index} className="relative">
                  {/* Connecting Line */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-20 -right-4 w-8 h-1 bg-gradient-to-r from-gray-300 to-gray-400 z-0"></div>
                  )}
                  
                  <div className="relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-gray-100">
                    {/* Step Number */}
                    <div className={`absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center shadow-xl border-4 border-white`}>
                      <span className="text-white font-black text-xl">{item.step}</span>
                    </div>

                    {/* Icon */}
                    <div className={`w-20 h-20 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                      <item.icon className="text-3xl text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-black text-gray-800 mb-4 text-center">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-center leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Battle Quiz Preview */}
      <section id="battle" className="py-20 bg-black relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left - Content */}
              <div>
                <div className="inline-block bg-purple-500/20 backdrop-blur-sm text-purple-300 px-6 py-2 rounded-full font-bold text-sm mb-6 border border-purple-500/30">
                  🎮 BATTLE QUIZ
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
                  Challenge & Win Real Money!
                </h2>
                <p className="text-xl text-white/80 mb-8 leading-relaxed">
                  1v1 Quiz Battles • Instant Payouts • Win Every Minute!
                  <br />
                  <span className="text-green-400 font-bold">Minimum Entry: Just ₹10</span>
                </p>

                {/* Features List */}
                <div className="space-y-4 mb-10">
                  {[
                    { icon: FaBolt, text: 'Lightning fast 60-second rounds', color: 'text-yellow-400' },
                    { icon: FaMoneyBillWave, text: 'Win 2x your entry amount instantly', color: 'text-green-400' },
                    { icon: FaInfinity, text: 'Unlimited battles, unlimited earnings', color: 'text-blue-400' },
                    { icon: FaShieldAlt, text: 'Fair play guaranteed with anti-cheat', color: 'text-purple-400' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                        <item.icon className={`text-2xl ${item.color}`} />
                      </div>
                      <span className="text-white font-semibold text-lg">{item.text}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/student/battle-quiz"
                  className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white rounded-full font-black text-xl shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300"
                >
                  <FaGamepad className="mr-3 text-2xl" />
                  Start Battle Now
                </Link>
              </div>

              {/* Right - Battle Preview */}
              <div className="relative">
                <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-3xl p-8 shadow-2xl border-2 border-white/20">
                  {/* Battle Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <FaGamepad className="text-white text-xl" />
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">Battle Quiz</div>
                        <div className="text-white/70 text-sm">1v1 Challenge</div>
                      </div>
                    </div>
                    <div className="bg-red-500 px-4 py-2 rounded-full text-white font-bold text-sm animate-pulse">
                      LIVE
                    </div>
                  </div>

                  {/* Players */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl">
                        YOU
                      </div>
                      <div className="text-white font-bold text-lg mb-1">Player 1</div>
                      <div className="text-green-400 font-black text-3xl">850</div>
                      <div className="text-white/70 text-xs">points</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl">
                        AI
                      </div>
                      <div className="text-white font-bold text-lg mb-1">Player 2</div>
                      <div className="text-red-400 font-black text-3xl">720</div>
                      <div className="text-white/70 text-xs">points</div>
                    </div>
                  </div>

                  {/* Prize Pool */}
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-5 text-center shadow-lg mb-6">
                    <div className="text-white/90 text-sm font-bold mb-1">PRIZE POOL</div>
                    <div className="text-white font-black text-4xl mb-1">₹200</div>
                    <div className="text-white/90 text-xs">Winner Takes All!</div>
                  </div>

                  {/* Question Preview */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                    <div className="text-white/70 text-xs mb-2">Question 3/5</div>
                    <div className="text-white font-bold mb-4">What is the capital of India?</div>
                    <div className="grid grid-cols-2 gap-2">
                      {['Delhi', 'Mumbai', 'Kolkata', 'Chennai'].map((option, i) => (
                        <button 
                          key={i}
                          className={`p-3 rounded-xl text-sm font-bold transition-all ${
                            i === 0 
                              ? 'bg-green-500 text-white' 
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-6 -left-6 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                  <FaCoins className="text-white text-2xl" />
                </div>
                <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-green-400 rounded-full flex items-center justify-center shadow-2xl animate-bounce" style={{animationDelay: '1s'}}>
                  <FaTrophy className="text-white text-3xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Download Section - Enhanced */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-400 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left - Content */}
              <div className="text-center lg:text-left">
                <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
                  Download YottaScore App
                </h2>
                <p className="text-2xl text-white/90 mb-8 leading-relaxed">
                  Practice Anywhere, Anytime! 
                  <br />
                  <span className="text-yellow-300 font-bold">Available on All Platforms 📱💻</span>
                </p>

                {/* Download Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-10 justify-center lg:justify-start">
                  <button className="group px-8 py-4 bg-black text-white rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3">
                    <FaMobileAlt className="text-2xl" />
                    <div className="text-left">
                      <div className="text-xs">Download on</div>
                      <div className="text-lg font-black">Google Play</div>
                    </div>
                  </button>
                  <button className="group px-8 py-4 bg-black text-white rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3">
                    <FaMobileAlt className="text-2xl" />
                    <div className="text-left">
                      <div className="text-xs">Download on</div>
                      <div className="text-lg font-black">App Store</div>
                    </div>
                  </button>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: FaDesktop, text: 'Web Platform' },
                    { icon: FaMobileAlt, text: 'Mobile Apps' },
                    { icon: FaCloud, text: 'Auto Sync' },
                    { icon: FaBolt, text: 'Offline Mode' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <item.icon className="text-white text-2xl" />
                      <span className="text-white font-semibold">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right - App Preview */}
              <div className="relative">
                <div className="relative z-10">
                  {/* Phone Mockup */}
                  <div className="w-80 mx-auto bg-gray-900 rounded-[3rem] p-4 shadow-2xl border-8 border-gray-800">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-[2.5rem] overflow-hidden">
                      {/* Status Bar */}
                      <div className="bg-black/20 px-6 py-3 flex items-center justify-between">
                        <span className="text-white text-xs font-semibold">9:41</span>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-3 border border-white rounded-sm"></div>
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      </div>

                      {/* App Content */}
                      <div className="p-6 h-[600px] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-white font-black text-2xl">Hello, Student! 👋</h3>
                            <p className="text-white/70 text-sm">Ready to ace your exams?</p>
                          </div>
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <FaBell className="text-white" />
                          </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                            <div className="text-white/70 text-xs mb-1">Today's Streak</div>
                            <div className="text-white font-black text-2xl">🔥 15</div>
                          </div>
                          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                            <div className="text-white/70 text-xs mb-1">Total Earned</div>
                            <div className="text-green-400 font-black text-2xl">₹2.4K</div>
                          </div>
                        </div>

                        {/* Live Exam Card */}
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-5 mb-4 shadow-lg">
                          <div className="flex items-center justify-between mb-3">
                            <span className="bg-red-500 px-3 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1">
                              <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                              LIVE NOW
                            </span>
                            <span className="text-white text-xs font-bold">2,450 joined</span>
                          </div>
                          <h4 className="text-white font-black text-lg mb-2">Math Challenge</h4>
                          <p className="text-white/90 text-sm mb-4">Win ₹5,000 • Top 10 Winners</p>
                          <button className="w-full bg-white text-orange-600 py-3 rounded-xl font-black hover:scale-105 transition-transform">
                            JOIN NOW →
                          </button>
                        </div>

                        {/* Practice Tests */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                          <h4 className="text-white font-bold mb-4">Continue Practice</h4>
                          <div className="space-y-3">
                            {['Physics - Wave Motion', 'Chemistry - Organic', 'Math - Calculus'].map((topic, i) => (
                              <div key={i} className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                                <span className="text-white text-sm font-semibold">{topic}</span>
                                <FaArrowRight className="text-white/50" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Download Stats */}
                <div className="absolute -top-8 -right-8 bg-white rounded-2xl p-6 shadow-2xl">
                  <div className="text-center">
                    <FaDownload className="text-4xl text-blue-600 mx-auto mb-2" />
                    <div className="text-3xl font-black text-gray-800">1M+</div>
                    <div className="text-sm text-gray-600 font-semibold">Downloads</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Numbers */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 shadow-2xl">
              <div className="grid md:grid-cols-4 gap-8 text-center text-white">
                <div>
                  <div className="text-5xl font-black mb-2">50K+</div>
                  <div className="text-white/80 font-semibold">Daily Exams</div>
                </div>
                <div>
                  <div className="text-5xl font-black mb-2">1M+</div>
                  <div className="text-white/80 font-semibold">Questions</div>
                </div>
                <div>
                  <div className="text-5xl font-black mb-2">5K+</div>
                  <div className="text-white/80 font-semibold">Study Groups</div>
                </div>
                <div>
                  <div className="text-5xl font-black mb-2">24/7</div>
                  <div className="text-white/80 font-semibold">Live Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-pulse"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-black text-white mb-8">
              Ready to Start Your
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Success Journey?
              </span>
            </h2>
            <p className="text-2xl text-white/90 mb-12 leading-relaxed">
              Trusted by Crores of Students Who Are Already Learning & Earning! 
              <br />
              <span className="text-yellow-300 font-bold text-3xl">🎁 Get ₹50 Sign-Up Bonus + ₹100 First Exam Bonus!</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Link 
                href="/register"
                className="group relative px-12 py-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white rounded-full font-black text-2xl shadow-2xl hover:shadow-yellow-500/50 hover:scale-110 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <FaRocket className="mr-3 text-3xl group-hover:rotate-12 transition-transform" />
                  Sign Up Free Now!
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>

            {/* Final Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-8 text-white/80 text-lg">
              <div className="flex items-center gap-2">
                <FaShieldAlt className="text-green-400 text-2xl" />
                <span className="font-semibold">100% Safe & Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-blue-400 text-2xl" />
                <span className="font-semibold">Verified by 1M+ Users</span>
              </div>
              <div className="flex items-center gap-2">
                <FaStar className="text-yellow-400 text-2xl" />
                <span className="font-semibold">4.9★ Rated</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FaGraduationCap className="text-white text-2xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">YottaScore</h3>
                  <p className="text-xs text-gray-400">Exam • Learn • Earn</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                India's #1 Educational Gaming Platform. Learn, compete, and earn real money!
              </p>
              <div className="flex space-x-4">
                {['📘', '📱', '💼', '📺'].map((emoji, i) => (
                  <div key={i} className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center cursor-pointer transition-colors">
                    <span>{emoji}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Exam Categories */}
            <div>
              <h4 className="font-black mb-6 text-lg">Exam Categories</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors flex items-center gap-2"><FaArrowRight className="text-xs" /> JEE Main & Advanced</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors flex items-center gap-2"><FaArrowRight className="text-xs" /> NEET UG & PG</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors flex items-center gap-2"><FaArrowRight className="text-xs" /> UPSC Civil Services</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors flex items-center gap-2"><FaArrowRight className="text-xs" /> SSC CGL/CHSL</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors flex items-center gap-2"><FaArrowRight className="text-xs" /> Banking & Insurance</Link></li>
              </ul>
            </div>
            
            {/* Features */}
            <div>
              <h4 className="font-black mb-6 text-lg">Features</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors flex items-center gap-2"><FaArrowRight className="text-xs" /> Live Competitive Exams</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors flex items-center gap-2"><FaArrowRight className="text-xs" /> Practice Tests</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors flex items-center gap-2"><FaArrowRight className="text-xs" /> 1v1 Battle Quiz</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors flex items-center gap-2"><FaArrowRight className="text-xs" /> Study Groups</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors flex items-center gap-2"><FaArrowRight className="text-xs" /> Performance Analytics</Link></li>
              </ul>
            </div>
            
            {/* Support */}
            <div>
              <h4 className="font-black mb-6 text-lg">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors flex items-center gap-2"><FaArrowRight className="text-xs" /> Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors flex items-center gap-2"><FaArrowRight className="text-xs" /> FAQs</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors flex items-center gap-2"><FaArrowRight className="text-xs" /> Contact Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors flex items-center gap-2"><FaArrowRight className="text-xs" /> Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors flex items-center gap-2"><FaArrowRight className="text-xs" /> Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 mb-4">
              &copy; 2024 YottaScore. All rights reserved. Made with ❤️ for Indian Students
            </p>
            <p className="text-gray-500 text-sm">
              🏆 India's Most Trusted Educational Platform • 4.9★ Rating • 1M+ Happy Students
            </p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
