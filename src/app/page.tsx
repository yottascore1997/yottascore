'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaDownload, FaQrcode, FaStar, FaTrophy, FaUsers, FaShieldAlt, FaGift, FaDice, FaGamepad, FaGraduationCap, FaBook, FaBrain, FaUsersCog, FaLightbulb, FaRocket, FaMedal, FaGlobe, FaPuzzlePiece, FaComments, FaUserFriends } from 'react-icons/fa';
import { MdSportsCricket, MdSportsFootball, MdSportsKabaddi, MdSportsBasketball, MdSchool, MdQuiz, MdGroup, MdTrendingUp } from 'react-icons/md';
import { GiPokerHand, GiChessKing, GiCardAceSpades } from 'react-icons/gi';

export default function HomePage() {
  const [phoneNumber, setPhoneNumber] = useState('');

  const educationalGames = [
    { name: 'Math Battle', icon: FaBrain, color: 'bg-gradient-to-r from-blue-500 to-cyan-500', description: 'Compete in math challenges' },
    { name: 'Science Quiz', icon: FaLightbulb, color: 'bg-gradient-to-r from-green-500 to-emerald-500', description: 'Test your science knowledge' },
    { name: 'English Master', icon: FaBook, color: 'bg-gradient-to-r from-purple-500 to-violet-500', description: 'Improve English skills' },
    { name: 'History Quest', icon: FaGraduationCap, color: 'bg-gradient-to-r from-orange-500 to-red-500', description: 'Explore world history' },
    { name: 'Geography Challenge', icon: FaGlobe, color: 'bg-gradient-to-r from-teal-500 to-blue-500', description: 'Learn world geography' },
    { name: 'Logic Puzzles', icon: FaPuzzlePiece, color: 'bg-gradient-to-r from-indigo-500 to-purple-500', description: 'Solve brain teasers' },
  ];

  const battleQuizzes = [
    { name: 'Math Battle Royale', icon: FaBrain, color: 'bg-gradient-to-r from-blue-600 to-cyan-600', participants: '500+', prize: '₹5000' },
    { name: 'Science Showdown', icon: FaLightbulb, color: 'bg-gradient-to-r from-green-600 to-emerald-600', participants: '300+', prize: '₹3000' },
    { name: 'English Championship', icon: FaBook, color: 'bg-gradient-to-r from-purple-600 to-violet-600', participants: '400+', prize: '₹4000' },
    { name: 'General Knowledge', icon: FaGraduationCap, color: 'bg-gradient-to-r from-orange-600 to-red-600', participants: '600+', prize: '₹6000' },
  ];

  const socialFeatures = [
    { name: 'Study Groups', icon: FaUsers, color: 'bg-gradient-to-r from-blue-500 to-indigo-500' },
    { name: 'Peer Learning', icon: FaUsersCog, color: 'bg-gradient-to-r from-green-500 to-teal-500' },
    { name: 'Discussion Forums', icon: FaComments, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { name: 'Study Buddies', icon: FaUserFriends, color: 'bg-gradient-to-r from-orange-500 to-yellow-500' },
  ];

  const topContests = [
    { game: 'Math Battle', prize: '₹5000', participants: 500, entry: '₹50' },
    { game: 'Science Quiz', prize: '₹3000', participants: 300, entry: '₹30' },
    { game: 'English Master', prize: '₹4000', participants: 400, entry: '₹40' },
    { game: 'GK Challenge', prize: '₹6000', participants: 600, entry: '₹60' },
  ];

  // Hero slider slides
  const heroSlides = [
    {
      bg: 'bg-gradient-to-br from-sky-100 via-blue-200 to-violet-100',
      headline: 'Yaha Mile Talent Ki Value',
      sub: 'Play Quizzes & Win Rewards',
      mascot: (
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <ellipse cx="100" cy="170" rx="60" ry="18" fill="#e0e7ef" />
          <circle cx="100" cy="100" r="60" fill="#fff" />
          <ellipse cx="100" cy="110" rx="40" ry="50" fill="#a5b4fc" />
          <ellipse cx="100" cy="110" rx="30" ry="40" fill="#fff" />
          <circle cx="100" cy="100" r="18" fill="#6366f1" />
          <ellipse cx="100" cy="120" rx="12" ry="6" fill="#6366f1" />
          <ellipse cx="100" cy="120" rx="8" ry="3" fill="#fff" />
          <ellipse cx="90" cy="95" rx="3" ry="5" fill="#fff" />
          <ellipse cx="110" cy="95" rx="3" ry="5" fill="#fff" />
        </svg>
      ),
      cta: 'GET APP LINK',
      ctaColor: 'bg-gradient-to-r from-blue-500 to-teal-400',
    },
    {
      bg: 'bg-gradient-to-br from-cyan-100 via-teal-100 to-blue-100',
      headline: 'Compete in Live Battle Quizzes',
      sub: 'Answer, Win, and Climb the Leaderboard!',
      mascot: (
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <ellipse cx="100" cy="170" rx="60" ry="18" fill="#d1fae5" />
          <circle cx="100" cy="100" r="60" fill="#fff" />
          <ellipse cx="100" cy="110" rx="40" ry="50" fill="#6ee7b7" />
          <ellipse cx="100" cy="110" rx="30" ry="40" fill="#fff" />
          <circle cx="100" cy="100" r="18" fill="#14b8a6" />
          <ellipse cx="100" cy="120" rx="12" ry="6" fill="#14b8a6" />
          <ellipse cx="100" cy="120" rx="8" ry="3" fill="#fff" />
          <ellipse cx="90" cy="95" rx="3" ry="5" fill="#fff" />
          <ellipse cx="110" cy="95" rx="3" ry="5" fill="#fff" />
        </svg>
      ),
      cta: 'Try Demo Quiz',
      ctaColor: 'bg-gradient-to-r from-teal-400 to-cyan-400',
    },
    {
      bg: 'bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100',
      headline: 'Join Study Groups',
      sub: 'Connect, Discuss, and Grow with Peers!',
      mascot: (
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <ellipse cx="100" cy="170" rx="60" ry="18" fill="#fce7f3" />
          <circle cx="100" cy="100" r="60" fill="#fff" />
          <ellipse cx="100" cy="110" rx="40" ry="50" fill="#f9a8d4" />
          <ellipse cx="100" cy="110" rx="30" ry="40" fill="#fff" />
          <circle cx="100" cy="100" r="18" fill="#a21caf" />
          <ellipse cx="100" cy="120" rx="12" ry="6" fill="#a21caf" />
          <ellipse cx="100" cy="120" rx="8" ry="3" fill="#fff" />
          <ellipse cx="90" cy="95" rx="3" ry="5" fill="#fff" />
          <ellipse cx="110" cy="95" rx="3" ry="5" fill="#fff" />
        </svg>
      ),
      cta: 'Join Community',
      ctaColor: 'bg-gradient-to-r from-pink-400 to-purple-400',
    },
  ];
  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-100 to-blue-50">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-30 bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900/95 backdrop-blur-xl shadow-xl border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent drop-shadow-lg animate-gradient-glow">EduBattle</h1>
              <nav className="hidden md:flex space-x-6">
                <a href="#games" className="relative text-white/90 hover:text-yellow-300 font-semibold transition duration-300 group">
                  <span>Games</span>
                  <span className="absolute left-0 -bottom-1 w-0 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full group-hover:w-full transition-all duration-300"></span>
                </a>
                <a href="#battles" className="relative text-white/90 hover:text-yellow-300 font-semibold transition duration-300 group">
                  <span>Battle Quiz</span>
                  <span className="absolute left-0 -bottom-1 w-0 h-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full group-hover:w-full transition-all duration-300"></span>
                </a>
                <a href="#social" className="relative text-white/90 hover:text-yellow-300 font-semibold transition duration-300 group">
                  <span>Social Learning</span>
                  <span className="absolute left-0 -bottom-1 w-0 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full group-hover:w-full transition-all duration-300"></span>
                </a>
                <a href="#courses" className="relative text-white/90 hover:text-yellow-300 font-semibold transition duration-300 group">
                  <span>Courses</span>
                  <span className="absolute left-0 -bottom-1 w-0 h-1 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full group-hover:w-full transition-all duration-300"></span>
                </a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="bg-gradient-to-r from-blue-700 to-violet-700 text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:from-blue-800 hover:to-violet-800 hover:scale-105 transition duration-300 flex items-center gap-2 border-2 border-white/20 backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 12H3m0 0l4-4m-4 4l4 4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="18" cy="12" r="3"/></svg>
                Login
              </Link>
              <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:from-yellow-600 hover:to-orange-600 hover:scale-105 transition duration-300 flex items-center gap-2 border-2 border-white/20 backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Download App
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="h-20 md:h-24"></div>

      {/* Hero Section Slider */}
      <section className="w-full py-24 px-4 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'}}>
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob"></div>
          <div className="absolute top-0 right-4 w-72 h-72 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-4000"></div>
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-gradient-to-r from-blue-300 to-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-6000"></div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-70 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10 min-h-[600px]">
          {/* Left Side */}
          <div className="flex-1 flex flex-col items-start justify-center text-left">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 animate-gradient bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent drop-shadow-lg">
              {heroSlides[heroIndex].headline}
            </h1>
            <p className="text-2xl md:text-3xl text-white font-semibold mb-10 drop-shadow-lg">
              {heroSlides[heroIndex].sub}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 w-full max-w-md">
              <div className="flex w-full">
                <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-3 rounded-l-lg border border-white/30 flex items-center font-semibold">+91</span>
                <input
                  type="tel"
                  placeholder="Enter Mobile Number"
                  className="flex-1 px-4 py-3 rounded-r-lg bg-white/20 backdrop-blur-sm text-white placeholder-white/70 border-t border-b border-r border-white/30 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-300/40 transition-all duration-200 focus:scale-105"
                />
              </div>
              <button className={`${heroSlides[heroIndex].ctaColor} text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:scale-105 focus:ring-4 focus:ring-blue-300/40 transition-all duration-300 backdrop-blur-sm`}>
                {heroSlides[heroIndex].cta}
              </button>
            </div>
            <div className="flex items-center gap-4 mb-10">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg shadow-lg flex items-center justify-center border border-white/30">
                <FaQrcode className="text-4xl text-white" />
              </div>
              <span className="text-white/90 font-medium">Scan Code To Download the App</span>
            </div>
            {/* Trusted by bar */}
            <div className="mt-10 flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white font-semibold text-sm flex items-center gap-2 shadow-lg border border-white/30">
                <FaStar className="text-yellow-300" /> 4.9/5 by 10,000+ students
              </div>
              <div className="flex items-center gap-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Google-flutter-logo.svg" alt="Partner" className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm p-1 border border-white/30" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="Partner" className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm p-1 border border-white/30" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png" alt="Partner" className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm p-1 border border-white/30" />
              </div>
            </div>
          </div>

          {/* Right Side (Mascot/Illustration) */}
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[500px]">
            <div className="w-80 h-80 flex items-center justify-center relative z-20">
              {heroSlides[heroIndex].mascot}
            </div>
          </div>
        </div>
        {/* Navigation dots */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex space-x-3 z-20">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setHeroIndex(idx)}
              className={`w-4 h-4 rounded-full border-2 ${heroIndex === idx ? 'bg-white border-white scale-125' : 'bg-white/50 border-white/70'} transition-all duration-300`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
        {/* SVG Wave Divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10">
          <svg className="w-full h-24" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#fff" fillOpacity="1" d="M0,224L48,202.7C96,181,192,139,288,144C384,149,480,203,576,197.3C672,192,768,128,864,128C960,128,1056,192,1152,197.3C1248,203,1344,149,1392,122.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* Steps Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Steps to Join a Battle Quiz
        </h2>
        <div className="flex flex-col md:flex-row justify-center items-stretch gap-8">
          {/* Step 1 */}
          <div className="flex-1 bg-gradient-to-br from-blue-500 via-cyan-400 to-blue-700 rounded-2xl shadow-2xl p-8 flex flex-col items-center relative border-0">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-gradient-to-br from-blue-700 to-cyan-400 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg border-4 border-white">1</div>
            <div className="w-20 h-20 flex items-center justify-center mb-4 mt-6 bg-white/20 rounded-full shadow-lg">
              <FaUserFriends className="text-white text-3xl" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Register on EduBattle</h3>
            <p className="text-blue-100 text-center">Sign up with your phone or email to get started.</p>
          </div>
          {/* Step 2 */}
          <div className="flex-1 bg-gradient-to-br from-green-500 via-emerald-400 to-teal-500 rounded-2xl shadow-2xl p-8 flex flex-col items-center relative border-0">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-gradient-to-br from-green-700 to-emerald-400 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg border-4 border-white">2</div>
            <div className="w-20 h-20 flex items-center justify-center mb-4 mt-6 bg-white/20 rounded-full shadow-lg">
              <FaBrain className="text-white text-3xl" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Select a Quiz</h3>
            <p className="text-green-100 text-center">Choose your favorite subject and join a live battle quiz.</p>
          </div>
          {/* Step 3 */}
          <div className="flex-1 bg-gradient-to-br from-purple-500 via-pink-400 to-indigo-500 rounded-2xl shadow-2xl p-8 flex flex-col items-center relative border-0">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-gradient-to-br from-purple-700 to-pink-400 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg border-4 border-white">3</div>
            <div className="w-20 h-20 flex items-center justify-center mb-4 mt-6 bg-white/20 rounded-full shadow-lg">
              <FaTrophy className="text-white text-3xl" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Compete & Win</h3>
            <p className="text-pink-100 text-center">Answer questions, climb the leaderboard, and win exciting rewards!</p>
          </div>
        </div>
      </section>

      {/* App Features Section */}
      <section className="w-full py-20 px-4 bg-gradient-to-br from-sky-400 via-blue-400 to-blue-600 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          {/* Left: Features List */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Feature List */}
            {[
              {
                icon: <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/></svg>,
                title: 'Instant Quiz Rewards',
                desc: 'Win rewards instantly after every quiz battle!'
              },
              {
                icon: <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 9V7a5 5 0 00-10 0v2"/><rect width="20" height="12" x="2" y="9" rx="2"/><path d="M7 19a2 2 0 002 2h6a2 2 0 002-2"/></svg>,
                title: 'Lowest Entry Fees',
                desc: 'Join quiz contests starting at just ₹2.'
              },
              {
                icon: <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/></svg>,
                title: 'Refer & Earn',
                desc: 'Get bonus for every successful referral.'
              },
              {
                icon: <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 9V7a5 5 0 00-10 0v2"/><rect width="20" height="12" x="2" y="9" rx="2"/><path d="M7 19a2 2 0 002 2h6a2 2 0 002-2"/></svg>,
                title: 'Instant Withdrawals',
                desc: 'Enjoy instant cash withdrawals after verification.'
              },
              {
                icon: <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>,
                title: 'Live Leaderboards',
                desc: 'Track your progress in real-time.'
              },
              {
                icon: <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/></svg>,
                title: 'Study Groups',
                desc: 'Learn and compete with friends in groups.'
              },
            ].map((f, i) => (
              <div key={i} className="flex items-center bg-white/10 border border-white/20 rounded-2xl p-5 shadow-lg backdrop-blur-md">
                <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-sky-400 rounded-full p-3 mr-4">
                  {f.icon}
                </div>
                <div>
                  <div className="text-lg font-bold text-white mb-1">{f.title}</div>
                  <div className="text-white/80 text-sm">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Right: App Image and QR */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-72 h-96 bg-white rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden mb-6">
              {/* Placeholder for app screenshot, replace src with your app image */}
              <img src="https://i.imgur.com/8Km9tLL.png" alt="App Screenshot" className="object-contain w-full h-full" />
            </div>
            <div className="bg-white rounded-xl shadow-lg px-6 py-4 flex items-center gap-4">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=https://edubattle.app" alt="QR Code" className="w-16 h-16" />
              <div>
                <div className="font-bold text-blue-700">Scan this QR to download</div>
                <div className="text-gray-700 text-sm">EduBattle app</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Educational Games Section */}
      <section id="games" className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center mb-12">
          <div className="flex items-center w-full justify-center mb-2">
            <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-4" />
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 text-center">Educational Games</h2>
            <div className="h-1 w-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full ml-4" />
          </div>
          <p className="text-gray-500 text-lg text-center max-w-2xl">Play fun, skill-based educational games and improve your knowledge while competing with others!</p>
        </div>
        <div className="w-full overflow-x-auto pb-4">
          <div className="flex space-x-8 min-w-[700px] md:min-w-0">
            {educationalGames.map((game, idx) => (
              <div
                key={game.name}
                className="flex-shrink-0 w-48 h-64 bg-white rounded-2xl shadow-xl border border-blue-100 hover:border-blue-400 transition-all duration-300 flex flex-col items-center justify-between group cursor-pointer relative hover:scale-105"
                style={{ boxShadow: '0 6px 24px 0 rgba(80, 112, 255, 0.08)' }}
              >
                <div className="w-full h-32 flex items-center justify-center rounded-t-2xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
                  <div className={`${game.color} rounded-full p-5 shadow-lg mt-4`}>
                    <game.icon className="text-4xl text-white drop-shadow" />
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center px-4">
                  <h3 className="text-lg font-bold text-gray-800 mt-4 mb-2 text-center">{game.name}</h3>
                  <p className="text-gray-500 text-sm text-center mb-2">{game.description}</p>
                </div>
                <div className="w-full px-4 pb-4">
                  <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-2 rounded-xl shadow hover:from-blue-600 hover:to-purple-600 transition-all duration-200">Play Now</button>
                </div>
              </div>
            ))}
            {/* View More Cards */}
            <div className="flex-shrink-0 w-48 h-64 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-2xl shadow-xl border border-blue-100 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-all duration-300">
              <div className="flex flex-col items-center justify-center h-full w-full">
                <span className="text-2xl font-bold text-blue-600 mb-2">View More</span>
                <span className="text-gray-500">Educational Games</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="w-full py-20 px-4 bg-gradient-to-br from-blue-400 via-sky-400 to-blue-600 relative">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          {/* Left: Mascot or App Image */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-72 h-72 bg-white rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden">
              {/* Placeholder mascot illustration, replace with your app screenshot if desired */}
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-56 h-56">
                <ellipse cx="100" cy="170" rx="60" ry="18" fill="#e0e7ef" />
                <circle cx="100" cy="100" r="60" fill="#fff" />
                <ellipse cx="100" cy="110" rx="40" ry="50" fill="#60a5fa" />
                <ellipse cx="100" cy="110" rx="30" ry="40" fill="#fff" />
                <circle cx="100" cy="100" r="18" fill="#2563eb" />
                <ellipse cx="100" cy="120" rx="12" ry="6" fill="#2563eb" />
                <ellipse cx="100" cy="120" rx="8" ry="3" fill="#fff" />
                <ellipse cx="90" cy="95" rx="3" ry="5" fill="#fff" />
                <ellipse cx="110" cy="95" rx="3" ry="5" fill="#fff" />
              </svg>
            </div>
          </div>
          {/* Right: About Text */}
          <div className="flex-1 text-white">
            <div className="flex items-center mb-4">
              <div className="h-1 w-12 bg-white/60 rounded-full mr-4" />
              <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center md:text-left">About EduBattle</h2>
              <div className="h-1 w-12 bg-white/60 rounded-full ml-4" />
            </div>
            <div className="text-lg font-semibold mb-4 text-white/90">India's Premium Educational Gaming Platform</div>
            <div className="text-white/90 space-y-4 text-base md:text-lg">
              <p><span className="font-bold text-white">EduBattle</span> is one of the fastest-growing <span className="font-bold text-yellow-200">Educational Gaming Platforms</span> in India, offering a unique blend of <span className="font-bold text-yellow-200">Battle Quizzes</span>, <span className="font-bold text-yellow-200">Social Learning</span>, and <span className="font-bold text-yellow-200">Skill-based Educational Games</span>. Join thousands of students and compete, learn, and win exciting rewards every day!</p>
              <p>With <span className="font-bold text-yellow-200">live quizzes</span>, <span className="font-bold text-yellow-200">study groups</span>, and <span className="font-bold text-yellow-200">real-time leaderboards</span>, EduBattle makes learning fun, interactive, and rewarding. Whether you love <span className="font-bold text-yellow-200">Math, Science, English, or GK</span>, there's something for everyone.</p>
              <p>Start your journey to becoming a <span className="font-bold text-yellow-200">Quiz Champion</span> and connect with a vibrant community of learners across India!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Battle Quiz Section */}
      <section id="battles" className="container mx-auto px-4 py-20 bg-gradient-to-r from-green-200 to-emerald-300 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border-2 border-green-400 rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 border-2 border-emerald-400 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-teal-400 rounded-full"></div>
        </div>

        <div className="relative z-10">
          <h2 className="text-5xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent animate-gradient">
              Live Battle Quiz
            </span>
          </h2>
          
          {/* Live indicator */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold animate-pulse shadow-lg">
              <span className="w-2 h-2 bg-white rounded-full mr-2 animate-ping"></span>
              🔴 LIVE NOW - Join the Battle!
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {battleQuizzes.map((quiz, index) => (
              <div 
                key={quiz.name} 
                className="group bg-white backdrop-blur-md rounded-2xl p-8 text-center hover-lift cursor-pointer border border-green-300 hover:border-green-400 relative overflow-hidden shadow-lg hover:shadow-2xl"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Live indicator */}
                <div className="absolute top-4 left-4 flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                  <span className="text-red-500 text-xs font-semibold ml-1">LIVE</span>
                </div>

                {/* Prize badge */}
                <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                  ₹{quiz.prize}
                </div>

                <div className={`${quiz.color} text-white p-6 rounded-full w-20 h-20 mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-2xl`}>
                  <quiz.icon className="text-3xl" />
                </div>
                
                <h3 className="text-gray-800 font-bold text-lg mb-3 group-hover:text-green-600 transition-colors duration-300">{quiz.name}</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Participants:</span>
                    <span className="text-green-600 font-bold">{quiz.participants}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Prize Pool:</span>
                    <span className="text-orange-600 font-bold">{quiz.prize}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Time Left:</span>
                    <span className="text-red-500 font-bold">2:30</span>
                  </div>
                </div>

                {/* Join button */}
                <button className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform group-hover:scale-105 hover:shadow-lg group-hover:animate-pulse-glow">
                  Join Battle
                </button>

                {/* Progress ring */}
                <div className="absolute bottom-2 right-2 w-12 h-12">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-gray-200" stroke="currentColor" strokeWidth="2" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path className="text-green-500" stroke="currentColor" strokeWidth="2" strokeDasharray="75, 100" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-green-600">75%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Learning Section */}
      <section id="social" className="container mx-auto px-4 py-20">
        <h2 className="text-5xl font-bold text-center mb-16">
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
            Social Learning
          </span>
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {socialFeatures.map((feature) => (
            <div key={feature.name} className="bg-white backdrop-blur-md rounded-2xl p-8 text-center hover:shadow-2xl transition duration-300 cursor-pointer group border border-gray-200 hover:border-purple-300 transform hover:scale-105">
              <div className={`${feature.color} text-white p-4 rounded-full w-16 h-16 mx-auto mb-6 group-hover:scale-110 transition duration-300 shadow-lg`}>
                <feature.icon className="text-2xl" />
              </div>
              <h3 className="text-gray-800 font-semibold text-lg">{feature.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-r from-slate-100 to-blue-50">
        <div className="flex flex-col items-center mb-12">
          <div className="flex items-center w-full justify-center mb-2">
            <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-4" />
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 text-center">Reviews & Ratings</h2>
            <div className="h-1 w-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full ml-4" />
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 mt-4">
            <span className="text-lg text-gray-700 font-semibold">App Rating <span className="text-blue-600 font-bold">4.8</span></span>
            <span className="text-gray-400 text-lg">|</span>
            <span className="text-lg text-gray-700 font-semibold">1,20,000+ ratings</span>
          </div>
          <div className="flex items-center mt-2 mb-4">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={`text-yellow-400 text-3xl ${i === 4 ? 'opacity-60' : ''}`}>★</span>
            ))}
          </div>
        </div>
        {/* Carousel logic */}
        {(() => {
          const testimonials = [
            {
              name: 'Rahul Sharma',
              location: 'Delhi',
              avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
              review: 'EduBattle made learning so much fun! I won ₹5000 in Math Battle and improved my scores significantly. The social learning features are amazing!',
              badge: 'WON ₹5,000+',
            },
            {
              name: 'Priya Patel',
              location: 'Gujarat',
              avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
              review: 'The Science Quiz battles are incredible! I have earned ₹8000+ and made friends with students from all over India. Best learning platform ever!',
              badge: 'WON ₹8,000+',
            },
            {
              name: 'Amit Kumar',
              location: 'Lucknow',
              avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
              review: 'Study groups feature helped me understand difficult concepts. The English Master game improved my vocabulary. Highly recommended!',
              badge: 'WON ₹2,000+',
            },
            {
              name: 'Sneha Singh',
              location: 'Mumbai',
              avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
              review: 'I love the live quizzes and the leaderboard. Competing with friends makes learning exciting and rewarding!',
              badge: 'TOP 1% STUDENT',
            },
            {
              name: 'Vikas Verma',
              location: 'Jaipur',
              avatar: 'https://randomuser.me/api/portraits/men/36.jpg',
              review: 'EduBattle is the best platform for competitive learning. The rewards and recognition keep me motivated!',
              badge: 'WON ₹3,500+',
            },
            {
              name: 'Ayesha Khan',
              location: 'Hyderabad',
              avatar: 'https://randomuser.me/api/portraits/women/50.jpg',
              review: 'The Math Battle is my favorite! I have improved my speed and accuracy a lot.',
              badge: 'MATH CHAMPION',
            },
            {
              name: 'Rohit Saini',
              location: 'Chandigarh',
              avatar: 'https://randomuser.me/api/portraits/men/60.jpg',
              review: 'Great for group studies and peer learning. The discussion forums are very helpful.',
              badge: 'STUDY GROUP LEADER',
            },
            {
              name: 'Meera Joshi',
              location: 'Pune',
              avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
              review: 'I love the Science Quiz and the instant feedback. Highly recommended for all students!',
              badge: 'SCIENCE STAR',
            },
          ];
          const [slide, setSlide] = useState(0);
          useEffect(() => {
            const timer = setInterval(() => {
              setSlide((prev) => (prev + 1) % testimonials.length);
            }, 4000);
            return () => clearInterval(timer);
          }, [testimonials.length]);
          const visible = 3;
          const start = slide;
          const end = (start + visible) % testimonials.length;
          let visibleTestimonials = [];
          if (end > start) {
            visibleTestimonials = testimonials.slice(start, end);
          } else {
            visibleTestimonials = testimonials.slice(start).concat(testimonials.slice(0, end));
          }
          return (
            <div className="relative w-full">
              <button
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border border-blue-200 rounded-full shadow p-2 z-10 hover:bg-blue-100 transition"
                onClick={() => setSlide((slide - 1 + testimonials.length) % testimonials.length)}
                aria-label="Previous"
                style={{ left: '-2rem' }}
              >
                <span className="text-2xl text-blue-500">&#8592;</span>
              </button>
              <div className="flex space-x-8 justify-center">
                {visibleTestimonials.map((t, idx) => (
                  <div key={idx} className="flex-shrink-0 w-80 bg-white rounded-2xl shadow-xl border border-blue-100 flex flex-col items-center p-8 relative hover:scale-105 transition-all duration-300">
                    <div className="flex items-center mb-4 w-full">
                      <img src={t.avatar} alt={t.name} className="w-14 h-14 rounded-full border-4 border-blue-200 object-cover mr-4" />
                      <div>
                        <div className="text-lg font-bold text-gray-800 leading-tight">{t.name}</div>
                        <div className="text-gray-500 text-sm">{t.location}</div>
                      </div>
                    </div>
                    <div className="text-gray-700 text-base mb-6 text-left w-full">"{t.review}"</div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold px-6 py-2 rounded-full shadow-lg border-2 border-white text-sm">{t.badge}</div>
                  </div>
                ))}
              </div>
              <button
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border border-blue-200 rounded-full shadow p-2 z-10 hover:bg-blue-100 transition"
                onClick={() => setSlide((slide + 1) % testimonials.length)}
                aria-label="Next"
                style={{ right: '-2rem' }}
              >
                <span className="text-2xl text-blue-500">&#8594;</span>
              </button>
              {/* Dots */}
              <div className="flex justify-center mt-8">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    className={`w-3 h-3 rounded-full mx-1 border-2 ${slide === idx ? 'bg-blue-500 border-blue-500' : 'bg-blue-100 border-blue-200'}`}
                    onClick={() => setSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          );
        })()}
      </section>

      {/* Top Contests Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-r from-orange-200 to-yellow-300">
        <h2 className="text-5xl font-bold text-center mb-16">
          <span className="bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent animate-gradient">
            Live Contests
          </span>
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {topContests.map((contest, index) => (
            <div key={index} className="bg-white backdrop-blur-md rounded-2xl p-8 border border-orange-300 shadow-xl hover:shadow-2xl transform hover:scale-105 transition duration-300">
              <div className="text-center">
                <h3 className="text-gray-800 font-bold text-2xl mb-4">{contest.game}</h3>
                <div className="text-3xl font-bold text-orange-500 mb-3">{contest.prize}</div>
                <div className="text-gray-600 text-sm mb-6">Total Prize Pool</div>
                <div className="flex justify-between text-gray-600 text-sm mb-6">
                  <span>{contest.participants} Students</span>
                  <span>Live Now</span>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-orange-500/25">
                  ₹{contest.entry}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 border-t border-gray-800 mt-20 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border border-blue-400 rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 border border-indigo-400 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-purple-400 rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-2xl mb-6 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">EduBattle</h3>
              <p className="text-gray-300 mb-6">India's Premier Educational Gaming Platform</p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-500 transition-colors duration-300">
                  <span className="text-lg">📘</span>
                </a>
                <a href="#" className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white hover:bg-green-500 transition-colors duration-300">
                  <span className="text-lg">📱</span>
                </a>
                <a href="#" className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-500 transition-colors duration-300">
                  <span className="text-lg">📺</span>
                </a>
                <a href="#" className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors duration-300">
                  <span className="text-lg">📷</span>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6 text-lg">Educational Games</h4>
              <ul className="space-y-3 text-gray-300">
                <li className="hover:text-blue-400 transition duration-300 cursor-pointer flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  Math Battle
                </li>
                <li className="hover:text-blue-400 transition duration-300 cursor-pointer flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  Science Quiz
                </li>
                <li className="hover:text-blue-400 transition duration-300 cursor-pointer flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  English Master
                </li>
                <li className="hover:text-blue-400 transition duration-300 cursor-pointer flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  History Quest
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6 text-lg">Social Learning</h4>
              <ul className="space-y-3 text-gray-300">
                <li className="hover:text-green-400 transition duration-300 cursor-pointer flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Study Groups
                </li>
                <li className="hover:text-green-400 transition duration-300 cursor-pointer flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Peer Learning
                </li>
                <li className="hover:text-green-400 transition duration-300 cursor-pointer flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Discussion Forums
                </li>
                <li className="hover:text-green-400 transition duration-300 cursor-pointer flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Study Buddies
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-6 text-lg">Download App</h4>
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition duration-300 shadow-lg hover:shadow-green-500/25 flex items-center justify-center">
                  <span className="mr-2">📱</span>
                  Download for Android
                </button>
                <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition duration-300 shadow-lg hover:shadow-blue-500/25 flex items-center justify-center">
                  <span className="mr-2">🍎</span>
                  Download on App Store
                </button>
              </div>
              
              {/* Newsletter signup */}
              <div className="mt-6">
                <h5 className="text-white font-semibold mb-3">Stay Updated</h5>
                <div className="flex">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="flex-1 px-4 py-2 rounded-l-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:border-blue-500"
                  />
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-500 transition-colors duration-300">
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left text-gray-400 mb-4 md:mb-0">
                <p>Learn, Compete, and Win with EduBattle - Your Educational Gaming Partner</p>
                <p className="mt-2">Copyright © 2024 EduBattle Educational Platform</p>
              </div>
              <div className="flex space-x-6 text-gray-400">
                <a href="#" className="hover:text-blue-400 transition-colors duration-300">Privacy Policy</a>
                <a href="#" className="hover:text-blue-400 transition-colors duration-300">Terms of Service</a>
                <a href="#" className="hover:text-blue-400 transition-colors duration-300">Contact Us</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 