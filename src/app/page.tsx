'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FaDownload, FaQrcode, FaStar, FaTrophy, FaUsers, FaShieldAlt, FaGift, FaDice, FaGamepad, 
  FaGraduationCap, FaBook, FaBrain, FaUsersCog, FaLightbulb, FaRocket, FaMedal, FaGlobe, 
  FaPuzzlePiece, FaComments, FaUserFriends, FaClock, FaBell, FaEye, FaMoneyBillWave,
  FaChartLine, FaCalendarAlt, FaMobile, FaDesktop, FaUserSecret
} from 'react-icons/fa';

export default function HomePage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [testimonialSlide, setTestimonialSlide] = useState(0);
  const [phoneSlide, setPhoneSlide] = useState(0);

  // Hero slides
  const heroSlides = [
    {
      bg: 'bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800',
      headline: 'India\'s #1 Educational Platform',
      sub: 'Learn, Compete & Excel!',
      description: 'Join thousands of students in live exams, practice tests, and educational competitions. Improve your knowledge while earning rewards!',
      cta: 'Start Learning',
      ctaColor: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      icon: FaGraduationCap,
      stats: '1M+ Students Learning Daily'
    },
    {
      bg: 'bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800',
      headline: 'Live Competitive Exams',
      sub: 'Test Your Knowledge & Win!',
      description: 'Participate in live exams with real-time leaderboards. Challenge yourself and compete with students nationwide!',
      cta: 'Join Exam',
      ctaColor: 'bg-gradient-to-r from-green-400 to-teal-500',
      icon: FaBook,
      stats: '50,000+ Daily Participants'
    },
    {
      bg: 'bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800',
      headline: 'Practice & Improve',
      sub: 'Master Every Subject!',
      description: 'Access unlimited practice tests, study materials, and expert guidance. Track your progress and achieve academic excellence!',
      cta: 'Start Practice',
      ctaColor: 'bg-gradient-to-r from-purple-400 to-pink-500',
      icon: FaBrain,
      stats: '95% Success Rate'
    }
  ];

  // Features data
  const features = [
    {
      icon: FaClock,
      title: 'Live Exams',
      description: 'Join live competitive exams with real-time leaderboards and instant results',
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      icon: FaBook,
      title: 'Practice Exams',
      description: 'Practice with unlimited mock tests and improve your performance',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      icon: FaUsers,
      title: 'Social Learning',
      description: 'Connect with friends, join study groups, and learn together',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      icon: FaGamepad,
      title: 'Battle Quiz',
      description: '1v1 quiz battles with real money prizes and instant payouts',
      color: 'from-purple-500 to-violet-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      icon: FaCalendarAlt,
      title: 'Timetable',
      description: 'Organize your study schedule with smart timetable features',
      color: 'from-orange-500 to-yellow-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      icon: FaBell,
      title: 'Exam Notifications',
      description: 'Get instant notifications about upcoming exams and competitions',
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    {
      icon: FaUserSecret,
      title: 'Who\'s The Spy',
      description: 'Play the word guessing game and win money for longer words',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    },
    {
      icon: FaMoneyBillWave,
      title: 'Real Money Rewards',
      description: 'Win real money in every game and withdraw instantly',
      color: 'from-yellow-500 to-amber-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    }
  ];

  // Stats data
  const stats = [
    { number: '1M+', label: 'Active Students', icon: FaUsers },
    { number: '₹50Cr+', label: 'Prize Money Won', icon: FaMoneyBillWave },
    { number: '10K+', label: 'Daily Winners', icon: FaTrophy },
    { number: '4.9★', label: 'App Rating', icon: FaStar }
  ];

  // Testimonials
  const testimonials = [
    {
      name: 'Priya Sharma',
      location: 'Delhi',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      review: 'I won ₹15,000 in just one week! YottaScore changed my life completely.',
      amount: '₹15,000 Won',
      rating: 5
    },
    {
      name: 'Rahul Kumar',
      location: 'Mumbai',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      review: 'The live exams are amazing! I improved my rank and earned money too.',
      amount: '₹8,500 Won',
      rating: 5
    },
    {
      name: 'Sneha Patel',
      location: 'Gujarat',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      review: 'Spy game is my favorite! I earn ₹200-500 daily just by playing.',
      amount: '₹12,000 Won',
      rating: 5
    },
    {
      name: 'Amit Singh',
      location: 'Pune',
      avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
      review: 'Best educational platform! I cleared my competitive exams with YottaScore.',
      amount: '₹25,000 Won',
      rating: 5
    },
    {
      name: 'Kavya Reddy',
      location: 'Hyderabad',
      avatar: 'https://randomuser.me/api/portraits/women/50.jpg',
      review: 'Practice tests helped me score 95% in my board exams. Thank you YottaScore!',
      amount: '₹18,000 Won',
      rating: 5
    },
    {
      name: 'Vikram Joshi',
      location: 'Bangalore',
      avatar: 'https://randomuser.me/api/portraits/men/60.jpg',
      review: 'Daily quizzes improved my speed and accuracy. Now I\'m a top performer!',
      amount: '₹22,000 Won',
      rating: 5
    },
    {
      name: 'Meera Gupta',
      location: 'Kolkata',
      avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
      review: 'Social learning features are amazing. I made friends and learned together!',
      amount: '₹14,500 Won',
      rating: 5
    },
    {
      name: 'Arjun Verma',
      location: 'Chennai',
      avatar: 'https://randomuser.me/api/portraits/men/36.jpg',
      review: 'Timetable feature helped me organize my studies perfectly. Highly recommended!',
      amount: '₹16,800 Won',
      rating: 5
    }
  ];

  // Auto-rotate hero slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialSlide((prev) => (prev + 1) % Math.ceil(testimonials.length / 3));
    }, 4000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  // Auto-rotate phone screens
  useEffect(() => {
    const timer = setInterval(() => {
      setPhoneSlide((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-purple-50">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <FaGraduationCap className="text-white text-xl" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                YottaScore
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition duration-300"
              >
                Login
              </Link>
              <Link 
                href="/register" 
                className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-2 rounded-full font-semibold hover:from-green-600 hover:to-teal-600 transition duration-300"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="h-20"></div>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
        {/* Enhanced Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          
          {/* Animated blobs */}
          <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-gradient-to-r from-pink-400 to-red-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse" style={{animationDelay: '4s'}}></div>
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center h-full">
              {/* Left Side - Content */}
              <div className="text-center lg:text-left">
                {/* Educational Badge */}
                <div className="inline-flex items-center bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-full text-lg font-bold mb-8 shadow-2xl border border-white/30 animate-pulse">
                  <span className="w-3 h-3 bg-white rounded-full mr-3 animate-ping"></span>
                  <FaGraduationCap className="mr-3 text-yellow-300" />
                  🎓 LIVE - India's #1 Educational Platform
        </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 md:mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-white via-blue-200 to-indigo-200 bg-clip-text text-transparent drop-shadow-2xl">
                    {heroSlides[currentSlide].headline}
                  </span>
                </h1>
                
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4 drop-shadow-lg">
                  {heroSlides[currentSlide].sub}
                </p>
                
                <p className="text-base sm:text-lg text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  {heroSlides[currentSlide].description}
                </p>

                {/* Educational Stats Cards */}
                <div className="flex flex-wrap gap-3 md:gap-4 mb-6 justify-center lg:justify-start">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 backdrop-blur-sm px-4 md:px-6 py-2 md:py-3 rounded-xl border border-white/30 shadow-2xl transform hover:scale-105 transition-all duration-300">
                    <span className="text-white font-bold text-sm md:text-lg">{heroSlides[currentSlide].stats}</span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-4 md:px-6 py-2 md:py-3 rounded-xl border border-white/30 shadow-2xl hover:bg-white/30 transition-all duration-300">
                    <span className="text-white font-bold text-sm md:text-lg">📚 4.9/5</span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-4 md:px-6 py-2 md:py-3 rounded-xl border border-white/30 shadow-2xl hover:bg-white/30 transition-all duration-300">
                    <span className="text-white font-bold text-sm md:text-lg">🎓 1M+</span>
                  </div>
                </div>


                {/* Educational Trust Indicators */}
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-white/90 justify-center lg:justify-start">
                  <div className="flex items-center gap-2">
                    <FaShieldAlt className="text-green-400 text-base md:text-lg" />
                    <span className="font-semibold text-xs md:text-sm">100% Secure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaGraduationCap className="text-blue-400 text-base md:text-lg" />
                    <span className="font-semibold text-xs md:text-sm">Expert Teachers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaUsers className="text-indigo-400 text-base md:text-lg" />
                    <span className="font-semibold text-xs md:text-sm">1M+ Students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaTrophy className="text-yellow-400 text-base md:text-lg" />
                    <span className="font-semibold text-xs md:text-sm">Academic Excellence</span>
                  </div>
                </div>
          </div>

              {/* Right Side - Visual */}
              <div className="relative">
                {/* Main Visual Container */}
                <div className="relative w-full h-96 lg:h-[500px]">
                  {/* Phone Mockup */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-96 bg-gray-900 rounded-3xl shadow-2xl border-4 border-white overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <div className="text-center text-white">
                        <FaGraduationCap className="text-6xl mb-4 mx-auto" />
                        <h3 className="text-xl font-bold">YottaScore</h3>
                        <p className="text-sm opacity-90">Win Real Money!</p>
            </div>
          </div>
        </div>

                  {/* Floating Elements */}
                  <div className="absolute top-10 left-10 w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <FaTrophy className="text-white text-xl" />
                  </div>
                  
                  <div className="absolute top-20 right-10 w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce" style={{animationDelay: '1s'}}>
                    <FaMoneyBillWave className="text-white text-lg" />
        </div>
                  
                  <div className="absolute bottom-20 left-16 w-14 h-14 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-bounce" style={{animationDelay: '2s'}}>
                    <FaGamepad className="text-white text-lg" />
        </div>

                  <div className="absolute bottom-10 right-16 w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg animate-bounce" style={{animationDelay: '3s'}}>
                    <FaStar className="text-white" />
            </div>
          </div>

                {/* Background Decoration */}
                <div className="absolute inset-0 -z-10">
                  <div className="w-80 h-80 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full opacity-20 blur-3xl"></div>
            </div>
          </div>
            </div>

          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
                </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center text-gray-800 transform hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-2xl">
                  <stat.icon className="text-2xl md:text-3xl text-white" />
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-2 md:mb-3 text-gray-800">{stat.number}</div>
                <div className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Awesome Features Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Awesome Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the power of YottaScore with our innovative features designed for modern students
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12 items-center">
            {/* Left Features */}
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">P</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Custom Shortcuts</h3>
                  <p className="text-gray-600">Create personalized shortcuts for quick access to your favorite features and boost your productivity.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">9</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Secure Integration</h3>
                  <p className="text-gray-600">Bank-level security with seamless integration to keep your data safe while you focus on learning.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Free Live Chat</h3>
                  <p className="text-gray-600">Get instant help with our 24/7 live chat support. No waiting, no queues, just immediate assistance.</p>
                </div>
              </div>
            </div>

            {/* Center - Phone Mockups */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Main Phone with Sliding Screens */}
                <div className="relative z-10 w-64 h-96 bg-gray-900 rounded-3xl shadow-2xl border-4 border-white overflow-hidden transform rotate-3">
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 relative overflow-hidden">
                    {/* Screen 1 - Dashboard */}
                    <div className={`absolute inset-0 transition-transform duration-500 ease-in-out ${phoneSlide === 0 ? 'translate-x-0' : '-translate-x-full'}`}>
                      <div className="p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm">←</span>
                            </div>
                            <div>
                              <h4 className="text-white font-bold text-sm">Kyle Ortega</h4>
                              <p className="text-white/70 text-xs">Total balance</p>
                            </div>
                          </div>
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">⋯</span>
                          </div>
                        </div>

                        {/* Balance */}
                        <div className="text-center mb-6">
                          <div className="text-3xl font-bold text-white mb-2">≈ 1,008</div>
                          <button className="bg-white text-purple-600 px-4 py-2 rounded-full text-sm font-bold">
                            + Add Money
                          </button>
                        </div>

                        {/* Crypto Options */}
                        <div className="flex space-x-2 mb-6">
                          <button className="bg-white/20 text-white px-3 py-2 rounded-lg text-xs">BTC</button>
                          <button className="bg-white/20 text-white px-3 py-2 rounded-lg text-xs">XRP</button>
                          <button className="bg-blue-500 text-white px-3 py-2 rounded-lg text-xs flex items-center">
                            <span className="mr-1">🌊</span> LIB
                          </button>
                          <button className="bg-white/20 text-white px-3 py-2 rounded-lg text-xs">LTC</button>
                          <button className="bg-white/20 text-white px-3 py-2 rounded-lg text-xs">XPM</button>
                        </div>

                        {/* About Section */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-4">
                          <h5 className="text-white font-bold text-sm mb-2">About Naxos</h5>
                          <p className="text-white/80 text-xs">Facebook has finally revealed the details of its cryptocurrency, Libra...</p>
                          <div className="text-center mt-2">
                            <span className="text-white/60 text-xs">▼</span>
                          </div>
                        </div>

                        {/* Transactions */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                          <h5 className="text-white font-bold text-sm mb-3">Transactions with friends</h5>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-white/20 rounded-full"></div>
                                <span className="text-white text-xs">Jordan Woods</span>
                              </div>
                              <div className="text-right">
                                <div className="text-white text-xs">≈ 3,192</div>
                                <div className="text-white/60 text-xs">24 transactions</div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-white/20 rounded-full"></div>
                                <span className="text-white text-xs">Lizzie West</span>
                              </div>
                              <div className="text-right">
                                <div className="text-white text-xs">≈ 2,726</div>
                                <div className="text-white/60 text-xs">22 transactions</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Screen 2 - Analytics */}
                    <div className={`absolute inset-0 transition-transform duration-500 ease-in-out ${phoneSlide === 1 ? 'translate-x-0' : phoneSlide === 0 ? 'translate-x-full' : '-translate-x-full'}`}>
                      <div className="p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm">←</span>
                            </div>
                            <div>
                              <h4 className="text-white font-bold text-sm">Analytics</h4>
                              <p className="text-white/70 text-xs">Performance Overview</p>
                            </div>
                          </div>
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">📊</span>
                          </div>
                        </div>

                        {/* Chart */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
                          <h5 className="text-white font-bold text-sm mb-3">Earnings Trend</h5>
                          <div className="h-24 bg-gradient-to-r from-green-400 to-blue-400 rounded flex items-end justify-center">
                            <div className="text-white text-xs">📈 +15% this week</div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                            <div className="text-white text-xs">Total Earnings</div>
                            <div className="text-white font-bold text-lg">₹2,450</div>
                          </div>
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                            <div className="text-white text-xs">This Month</div>
                            <div className="text-white font-bold text-lg">₹890</div>
                          </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                          <h5 className="text-white font-bold text-sm mb-3">Recent Activity</h5>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-white text-xs">Math Quiz</span>
                              <span className="text-green-400 text-xs">+₹50</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-white text-xs">Science Test</span>
                              <span className="text-green-400 text-xs">+₹75</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-white text-xs">GK Challenge</span>
                              <span className="text-green-400 text-xs">+₹30</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Screen 3 - Live Exams */}
                    <div className={`absolute inset-0 transition-transform duration-500 ease-in-out ${phoneSlide === 2 ? 'translate-x-0' : phoneSlide === 1 ? 'translate-x-full' : '-translate-x-full'}`}>
                      <div className="p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm">←</span>
                            </div>
                            <div>
                              <h4 className="text-white font-bold text-sm">Live Exams</h4>
                              <p className="text-white/70 text-xs">Join Now & Win</p>
                            </div>
                          </div>
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">⚡</span>
                          </div>
                        </div>

                        {/* Live Exam Card */}
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-bold text-sm">LIVE NOW</span>
                            <span className="text-white text-xs">2,450 students</span>
                          </div>
                          <h5 className="text-white font-bold text-lg mb-1">Math Master Challenge</h5>
                          <p className="text-white/90 text-xs mb-3">Win ₹500 for top 10</p>
                          <button className="bg-white text-orange-500 px-4 py-2 rounded-full text-sm font-bold w-full">
                            Join Exam
                          </button>
                        </div>

                        {/* Upcoming Exams */}
                        <div className="space-y-3">
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h6 className="text-white font-bold text-sm">Science Quiz</h6>
                              <span className="text-white text-xs">10:30 AM</span>
                            </div>
                            <p className="text-white/80 text-xs mb-2">Prize: ₹300</p>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-white text-xs">1,200 registered</span>
                            </div>
                          </div>

                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h6 className="text-white font-bold text-sm">GK Battle</h6>
                              <span className="text-white text-xs">2:00 PM</span>
                            </div>
                            <p className="text-white/80 text-xs mb-2">Prize: ₹200</p>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                              <span className="text-white text-xs">800 registered</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Screen 4 - Profile */}
                    <div className={`absolute inset-0 transition-transform duration-500 ease-in-out ${phoneSlide === 3 ? 'translate-x-0' : phoneSlide === 2 ? 'translate-x-full' : '-translate-x-full'}`}>
                      <div className="p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm">←</span>
                            </div>
                            <div>
                              <h4 className="text-white font-bold text-sm">Profile</h4>
                              <p className="text-white/70 text-xs">Your Stats</p>
                            </div>
                          </div>
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">👤</span>
                          </div>
                        </div>

                        {/* Profile Info */}
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                            <span className="text-white text-2xl">👨‍🎓</span>
                          </div>
                          <h5 className="text-white font-bold text-lg">Kyle Ortega</h5>
                          <p className="text-white/70 text-sm">Rank #47</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                            <div className="text-white font-bold text-lg">156</div>
                            <div className="text-white/70 text-xs">Exams Taken</div>
                          </div>
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                            <div className="text-white font-bold text-lg">89%</div>
                            <div className="text-white/70 text-xs">Accuracy</div>
                          </div>
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                            <div className="text-white font-bold text-lg">₹2,450</div>
                            <div className="text-white/70 text-xs">Total Earned</div>
                          </div>
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                            <div className="text-white font-bold text-lg">12</div>
                            <div className="text-white/70 text-xs">Wins</div>
                          </div>
                        </div>

                        {/* Achievements */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                          <h6 className="text-white font-bold text-sm mb-3">Recent Achievements</h6>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-yellow-400 text-sm">🏆</span>
                              <span className="text-white text-xs">Math Master</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-400 text-sm">⚡</span>
                              <span className="text-white text-xs">Speed Demon</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-green-400 text-sm">🎯</span>
                              <span className="text-white text-xs">Perfect Score</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Background Phone */}
                <div className="absolute -top-4 -left-8 w-64 h-96 bg-gray-900 rounded-3xl shadow-2xl border-4 border-white overflow-hidden transform -rotate-3">
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600">
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">←</span>
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-sm">Nixos commiss</h4>
                            <p className="text-white/70 text-xs">≈ 2,786</p>
                          </div>
                        </div>
                      </div>

                      {/* Graph */}
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-4">
                        <div className="h-20 bg-gradient-to-r from-blue-400 to-purple-400 rounded flex items-end justify-center">
                          <div className="text-white text-xs">0-3k</div>
                        </div>
                      </div>

                      {/* Navigation */}
                      <div className="flex space-x-4 mb-4">
                        <button className="bg-white/20 text-white px-3 py-1 rounded text-xs">Daily</button>
                        <button className="bg-white/20 text-white px-3 py-1 rounded text-xs">W</button>
                      </div>

                      {/* Transactions List */}
                      <div className="space-y-2">
                        <div className="text-white text-xs">September (17 transactions)</div>
                        <div className="text-white text-xs">August (13 transactions)</div>
                        <div className="text-white text-xs">July (25 transactions)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Features */}
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white rounded"></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Social Share</h3>
                  <p className="text-gray-600">Share your achievements and progress with friends. Build a community of learners and stay motivated together.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white rounded"></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Merge Files</h3>
                  <p className="text-gray-600">Combine multiple study materials and resources into organized collections for efficient learning.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">b</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Action Reminder</h3>
                  <p className="text-gray-600">Never miss important deadlines with smart reminders and notifications tailored to your study schedule.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section className="py-20 bg-black relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 md:mb-6 drop-shadow-2xl">
                Download YottaScore App
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-blue-100 mb-6 md:mb-8 max-w-3xl mx-auto px-4">
                Join 1M+ students earning money while learning! Get instant access to live exams, practice tests, and educational games.
              </p>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 text-white/90 mb-8 md:mb-12">
                <div className="flex items-center gap-2">
                  <FaShieldAlt className="text-green-400 text-lg md:text-xl" />
                  <span className="font-semibold text-sm md:text-base">100% Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaUsers className="text-blue-400 text-lg md:text-xl" />
                  <span className="font-semibold text-sm md:text-base">1M+ Students</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaStar className="text-yellow-400 text-lg md:text-xl" />
                  <span className="font-semibold text-sm md:text-base">4.9★ Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaMoneyBillWave className="text-green-400 text-lg md:text-xl" />
                  <span className="font-semibold text-sm md:text-base">Instant Rewards</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl md:rounded-3xl p-6 md:p-12 shadow-2xl border border-white/20">
              <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
                {/* Left Side - Phone Input */}
                <div className="space-y-6 md:space-y-8">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4">Get App Link</h3>
                    <p className="text-blue-100 text-base md:text-lg mb-4 md:mb-6">Enter your mobile number to receive the download link instantly</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                      <div className="flex-1">
                        <div className="flex">
                          <span className="bg-white/20 backdrop-blur-sm text-white px-4 md:px-6 py-3 md:py-4 rounded-l-xl border border-white/30 flex items-center font-semibold text-sm md:text-lg">+91</span>
                          <input
                            type="tel"
                            placeholder="Enter Mobile Number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="flex-1 px-4 md:px-6 py-3 md:py-4 rounded-r-xl border border-white/30 bg-white/10 backdrop-blur-sm text-white placeholder-white/70 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-200 text-sm md:text-lg"
                          />
                        </div>
                      </div>
                      <button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-sm md:text-lg shadow-2xl hover:shadow-yellow-500/50 hover:scale-105 transition-all duration-300 flex items-center justify-center">
                        <FaDownload className="mr-2 md:mr-3 text-lg md:text-xl" />
                        Send Link
                      </button>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <p className="text-white/80 text-sm">
                        <FaShieldAlt className="inline mr-2 text-green-400" />
                        Your number is secure and will only be used to send the app link
                      </p>
            </div>
          </div>
        </div>

                {/* Right Side - Download Options */}
                <div className="space-y-6 md:space-y-8">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4">Download Options</h3>
                    <p className="text-blue-100 text-base md:text-lg">Choose your preferred way to access YottaScore</p>
                  </div>
                  
                  <div className="space-y-6 md:space-y-8">
                    {/* App Store Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
                      <div className="text-center group cursor-pointer">
                        <div className="w-28 md:w-32 h-14 md:h-16 bg-black border-2 border-white/30 rounded-xl shadow-2xl flex items-center justify-center mb-3 mx-auto group-hover:scale-105 transition-all duration-300">
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                            alt="Download on the App Store"
                            className="h-8 md:h-10 w-auto"
                          />
                        </div>
                      </div>

                      <div className="text-center group cursor-pointer">
                        <div className="w-28 md:w-32 h-14 md:h-16 bg-black border-2 border-white/30 rounded-xl shadow-2xl flex items-center justify-center mb-3 mx-auto group-hover:scale-105 transition-all duration-300">
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                            alt="Get it on Google Play"
                            className="h-8 md:h-10 w-auto"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Other Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      <div className="text-center group cursor-pointer">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-2xl flex items-center justify-center mb-3 md:mb-4 mx-auto group-hover:scale-110 transition-all duration-300">
                          <FaQrcode className="text-2xl md:text-3xl text-white" />
                        </div>
                        <h4 className="text-base md:text-lg font-bold text-white mb-1 md:mb-2">Scan QR Code</h4>
                        <p className="text-blue-100 text-xs md:text-sm">Quick Download</p>
                      </div>

                      <div className="text-center group cursor-pointer">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-2xl flex items-center justify-center mb-3 md:mb-4 mx-auto group-hover:scale-110 transition-all duration-300">
                          <FaDesktop className="text-2xl md:text-3xl text-white" />
                        </div>
                        <h4 className="text-base md:text-lg font-bold text-white mb-1 md:mb-2">Web Platform</h4>
                        <p className="text-blue-100 text-xs md:text-sm">Browser Access</p>
                      </div>
                    </div>
            </div>
          </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-gray-800 mb-4">
                Why Choose YottaScore?
          </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                India's most trusted educational gaming platform with real money rewards
              </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`${feature.bgColor} ${feature.borderColor} border-2 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer`}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
                </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 md:mb-6 drop-shadow-2xl">
                See YottaScore in Action
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-blue-100 mb-6 md:mb-8 max-w-3xl mx-auto px-4">
                Watch how students are earning money while learning with our educational platform
              </p>
            </div>
                
            {/* Video Container */}
            <div className="relative bg-black rounded-3xl shadow-2xl overflow-hidden border-4 border-white/20">
              <div className="aspect-video w-full">
                {/* Video Placeholder - Replace with actual video */}
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center relative">
                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300 group">
                      <svg className="w-12 h-12 text-white ml-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  </div>
                  
                  {/* Video Overlay Text */}
                  <div className="absolute bottom-8 left-8 text-white">
                    <h3 className="text-2xl font-bold mb-2">YottaScore Demo Video</h3>
                    <p className="text-white/80">See how students earn money while learning</p>
                  </div>
                  
                  {/* Duration Badge */}
                  <div className="absolute top-8 right-8 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold">
                    2:30
                  </div>
                </div>
                  </div>
                </div>

            {/* Video Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mt-12 md:mt-16">
              <div className="text-center text-white">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <FaGraduationCap className="text-xl sm:text-2xl text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">Live Exams</h3>
                <p className="text-blue-100 text-sm sm:text-base">Real-time competitive exams with instant results</p>
              </div>
              
              <div className="text-center text-white">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <FaMoneyBillWave className="text-xl sm:text-2xl text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">Instant Rewards</h3>
                <p className="text-blue-100 text-sm sm:text-base">Win real money for every correct answer</p>
              </div>
              
              <div className="text-center text-white sm:col-span-2 lg:col-span-1">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <FaUsers className="text-xl sm:text-2xl text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">Social Learning</h3>
                <p className="text-blue-100 text-sm sm:text-base">Connect with friends and learn together</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-3 md:mb-4">
              Success Stories
            </h2>
            <p className="text-lg md:text-xl text-gray-600 px-4">
              Real students earning real money
            </p>
          </div>

          {/* Slider Container */}
          <div className="relative overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${testimonialSlide * 100}%)` }}
            >
              {Array.from({ length: Math.ceil(testimonials.length / 3) }).map((_, slideIndex) => (
                <div key={slideIndex} className="w-full flex-shrink-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {testimonials.slice(slideIndex * 3, (slideIndex + 1) * 3).map((testimonial, index) => (
                      <div key={index} className="bg-white rounded-2xl p-6 md:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                        <div className="flex items-center mb-4 md:mb-6">
                          <img 
                            src={testimonial.avatar} 
                            alt={testimonial.name}
                            className="w-12 h-12 md:w-16 md:h-16 rounded-full border-4 border-blue-200"
                          />
                          <div className="ml-3 md:ml-4">
                            <h4 className="text-base md:text-lg font-bold text-gray-800">{testimonial.name}</h4>
                            <p className="text-sm md:text-base text-gray-600">{testimonial.location}</p>
                            <div className="flex items-center mt-1">
                              {[...Array(testimonial.rating)].map((_, i) => (
                                <FaStar key={i} className="text-yellow-400 text-xs md:text-sm" />
            ))}
          </div>
        </div>
                        </div>
                        <p className="text-gray-700 mb-3 md:mb-4 italic text-sm md:text-base">"{testimonial.review}"</p>
                        <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 md:px-4 py-2 rounded-full text-center font-bold text-sm md:text-base">
                          {testimonial.amount}
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
                ))}
              </div>
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center mt-6 md:mt-8 space-x-2 md:space-x-3">
            {Array.from({ length: Math.ceil(testimonials.length / 3) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setTestimonialSlide(index)}
                className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-300 ${
                  testimonialSlide === index 
                    ? 'bg-blue-600 scale-125' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                  />
                ))}
              </div>
            </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6">
            Ready to Start Earning?
        </h2>
          <p className="text-lg md:text-xl text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto px-4">
            Join thousands of students who are already earning money while learning. Download the app now and start your journey!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <button className="bg-white text-blue-600 px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-base md:text-lg hover:bg-gray-100 transition duration-300 shadow-lg">
              Download for Android
            </button>
            <button className="bg-white text-purple-600 px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-base md:text-lg hover:bg-gray-100 transition duration-300 shadow-lg">
              Download for iOS
            </button>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-2 mb-3 md:mb-4">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <FaGraduationCap className="text-white text-sm md:text-base" />
                </div>
                <h3 className="text-lg md:text-xl font-bold">YottaScore</h3>
              </div>
              <p className="text-gray-400 mb-3 md:mb-4 text-sm md:text-base">
                India's #1 Educational Gaming Platform
              </p>
              <div className="flex space-x-3 md:space-x-4">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-xs md:text-sm">📘</span>
                </div>
                <div className="w-6 h-6 md:w-8 md:h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-xs md:text-sm">📱</span>
                </div>
                <div className="w-6 h-6 md:w-8 md:h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-xs md:text-sm">📺</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-3 md:mb-4 text-sm md:text-base">Features</h4>
              <ul className="space-y-1 md:space-y-2 text-gray-400 text-sm md:text-base">
                <li>Live Exams</li>
                <li>Battle Quiz</li>
                <li>Practice Tests</li>
                <li>Social Learning</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3 md:mb-4 text-sm md:text-base">Games</h4>
              <ul className="space-y-1 md:space-y-2 text-gray-400 text-sm md:text-base">
                <li>Who's The Spy</li>
                <li>Math Battle</li>
                <li>Science Quiz</li>
                <li>GK Challenge</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3 md:mb-4 text-sm md:text-base">Support</h4>
              <ul className="space-y-1 md:space-y-2 text-gray-400 text-sm md:text-base">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 md:mt-8 pt-6 md:pt-8 text-center text-gray-400">
            <p className="text-sm md:text-base">&copy; 2024 YottaScore. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 