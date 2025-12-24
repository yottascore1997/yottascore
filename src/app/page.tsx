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
  { title: 'Mathematics Master Challenge', time: 'Today • 14:30 IST', prize: '₹5,000', students: 1243, difficulty: 'Medium' },
  { title: 'Physics Rapid Fire', time: 'Today • 17:00 IST', prize: '₹3,500', students: 856, difficulty: 'Hard' },
  { title: 'Chemistry Quiz Battle', time: 'Today • 19:15 IST', prize: '₹4,000', students: 967, difficulty: 'Easy' },
  { title: 'NEET Biology Full Mock', time: 'Today • 21:00 IST', prize: '₹6,000', students: 1_105, difficulty: 'Medium' },
  { title: 'SSC CGL Quant Drill', time: 'Tomorrow • 07:30 IST', prize: '₹3,000', students: 742, difficulty: 'Medium' },
  { title: 'Bank PO Reasoning Sprint', time: 'Tomorrow • 09:00 IST', prize: '₹2,500', students: 689, difficulty: 'Hard' },
  { title: 'UPSC GS Paper 1 Marathon', time: 'Tomorrow • 11:30 IST', prize: '₹7,500', students: 918, difficulty: 'Hard' },
  { title: 'GATE CSE Systems Mock', time: 'Tomorrow • 14:00 IST', prize: '₹5,500', students: 654, difficulty: 'Medium' },
  { title: 'Railway NTPC Speed Test', time: 'Tomorrow • 16:30 IST', prize: '₹3,200', students: 811, difficulty: 'Easy' }
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

      {/* Hero Section - Professional & Clean */}
      <section className="relative py-16 sm:py-20 flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        {/* Simple Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="container mx-auto px-3 sm:px-4 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              {/* Left - Content - Mobile Optimized */}
              <div className="text-center lg:text-left">
                {/* Live Status Badge - Clean */}
                <div className="inline-flex items-center bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg mb-4 border border-white/30">
                  <div className="relative mr-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                  <FaFire className="text-yellow-400 mr-2 text-sm" />
                  <span className="font-semibold text-sm">{liveExamCount} LIVE • {activeStudents.toLocaleString()} Online</span>
                </div>

                {/* Main Headline - Professional & Clean */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 leading-tight">
                  <span className="block text-white">
                    Ace Your Exams
                  </span>
                  <span className="block text-yellow-300 mt-1">
                    Earn Big Rewards
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-white/90 mb-5 leading-relaxed">
                  Practice • Compete • Win Real Money
                  <br />
                  <span className="text-yellow-200 font-medium">India's Most Trusted Exam Platform</span>
                </p>

                {/* Stats Pills - Clean */}
                <div className="flex flex-wrap gap-2 mb-5 justify-center lg:justify-start">
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/30">
                    <div className="text-white font-medium text-xs">1M+ Students</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/30">
                    <div className="text-white font-medium text-xs">₹50Cr+ Won</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/30">
                    <div className="text-white font-medium text-xs">4.9★ Rated</div>
                  </div>
                </div>

                {/* CTA Buttons - Clean */}
                <div className="flex flex-col gap-2 justify-center lg:justify-start">
                  <Link 
                    href="/register"
                    className="group relative px-6 py-2.5 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    <span className="relative z-20 flex items-center justify-center text-white">
                      <FaRocket className="mr-2 text-base" />
                      <span>Start Free - Win ₹50 Bonus!</span>
                    </span>
                  </Link>
                  <Link 
                    href="/student/live-exams"
                    className="group px-6 py-2.5 bg-white/20 backdrop-blur-md text-white border border-white/50 rounded-lg font-medium text-sm hover:bg-white/30 transition-all duration-300 flex items-center justify-center"
                  >
                    <FaPlay className="mr-2" />
                    Join Live Exam
                  </Link>
                </div>

                {/* Trust Badges - Clean */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-5 text-white/90">
                  <div className="flex items-center gap-1.5">
                    <FaShieldAlt className="text-green-400 text-sm" />
                    <div>
                      <div className="font-medium text-xs">100% Secure</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FaCheckCircle className="text-blue-400 text-sm" />
                    <div>
                      <div className="font-medium text-xs">Instant Payouts</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FaStar className="text-yellow-400 text-sm" />
                    <div>
                      <div className="font-medium text-xs">4.9★ Rated</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </section>



{/* Upcoming Exams Section - Professional & Clean */}
      <section className="bg-slate-50 py-12 sm:py-16">
        <div className="w-full px-4 sm:px-6 lg:px-10">
          <div className="w-full">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                <FaFire className="mr-2 inline h-6 w-6 text-amber-500 sm:mr-3 sm:h-7 sm:w-7" />
                Upcoming live exams
              </h2>
              <p className="mt-3 text-sm text-slate-600 sm:text-base">
                Reserve a slot that matches your schedule. Every exam includes proctoring, instant analytics, and clear payouts.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {upcomingExams.map((exam, index) => (
              <div
                key={index}
                className="group h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex h-full flex-col gap-6">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white">
                      <FaBook className="text-lg" />
                    </span>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-slate-800 transition-colors group-hover:text-blue-600 sm:text-xl">
                        {exam.title}
                      </h3>
                      <p className="flex items-center gap-2 text-sm text-slate-600">
                        <FaClock className="text-blue-500" />
                        {exam.time}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                          <FaUsers className="text-blue-500" />
                          {exam.students.toLocaleString()} joined
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 ${
                            exam.difficulty === 'Easy'
                              ? 'bg-emerald-100 text-emerald-700'
                              : exam.difficulty === 'Medium'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {exam.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Prize pool</p>
                      <p className="text-2xl font-semibold text-emerald-600">{exam.prize}</p>
                    </div>
                    <Link
                      href="/student/live-exams"
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:from-indigo-600 hover:to-blue-700"
                    >
                      Book a slot
                      <FaArrowRight className="text-xs" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/student/live-exams"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900"
              >
                View full live exam calendar
                <FaArrowRight className="text-xs" />
              </Link>
            </div>
          </div>
        </div>
      </section>

{/* Achievements Showcase - Professional & Clean */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
              Unlock Amazing Achievements
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
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

      {/* How It Works Section - Professional & Clean */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-slate-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
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

      {/* Battle Quiz Preview - Professional & Clean */}
      <section id="battle" className="py-12 sm:py-16 bg-black relative overflow-hidden">
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
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                  Challenge & Win Real Money!
                </h2>
                <p className="text-base text-white/80 mb-6 leading-relaxed">
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

      {/* App Download Section - Professional & Clean */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-400 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left - Content */}
              <div className="text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                  Download YottaScore App
                </h2>
                <p className="text-base sm:text-lg text-white/90 mb-6 leading-relaxed">
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

      {/* Social Proof - Numbers - Professional & Clean */}
      <section className="py-12 bg-white">
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

      {/* Final CTA - Professional & Clean */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-pulse"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Your
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Success Journey?
              </span>
            </h2>
            <p className="text-base sm:text-lg text-white/90 mb-8 leading-relaxed">
              Trusted by Crores of Students Who Are Already Learning & Earning! 
              <br />
              <span className="text-yellow-300 font-bold text-3xl">🎁 Get ₹50 Sign-Up Bonus + ₹100 First Exam Bonus!</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Link 
                href="/register"
                className="group relative px-8 py-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-20 flex items-center justify-center text-white">
                  <FaRocket className="mr-3 text-2xl group-hover:rotate-12 transition-transform" />
                  Sign Up Free Now!
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
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
                <li><Link href="/privacy" className="hover:text-white transition-colors flex items-center gap-2"><FaArrowRight className="text-xs" /> Privacy Policy</Link></li>
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
