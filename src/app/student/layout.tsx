'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, Search, PlusSquare, Heart, User, Users, Bell, BookOpen, Calendar, Wallet, Trophy, MessageCircle, Zap, Gift, FileText, Eye } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { NotificationContainer } from '@/components/NotificationToast';
import MessageNotification from '@/components/MessageNotification';

const studentLinks = [
  { name: 'Dashboard', href: '/student/dashboard', icon: Home },
  { name: 'Books Marketplace', href: '/books', icon: BookOpen },
  { name: 'My Book Listings', href: '/books/my-listings', icon: BookOpen },
  { name: 'Live Exams', href: '/student/live-exams', icon: BookOpen },
  { name: 'Practice Exams', href: '/student/practice-exams', icon: Trophy },
  { name: 'Battle Quiz', href: '/student/battle-quiz', icon: Zap },
  { name: 'Spy Game', href: '/spy-game', icon: Eye },
  { name: 'Weekly Leaderboard', href: '/student/weekly-leaderboard', icon: Trophy },
  { name: 'Exam Notifications', href: '/student/notifications', icon: Bell },
  { name: 'Push Notifications', href: '/student/notifications/push', icon: Bell },
  { name: 'My Exams', href: '/student/my-exams', icon: FileText },
  { name: 'Wallet', href: '/student/wallet', icon: Wallet },
  { name: 'Refer & Earn', href: '/student/referral', icon: Gift },
  { name: 'Timetable', href: '/student/timetable', icon: Calendar },
  { name: 'Support', href: '/student/support', icon: MessageCircle },
  // Social Media Features
  { name: 'Social Feed', href: '/student/feed', icon: Home },
  { name: 'Profile', href: '/student/profile', icon: User },
  { name: 'Search', href: '/student/search', icon: Search },
  { name: 'Groups', href: '/student/groups', icon: Users },
  { name: 'Follow Requests', href: '/student/follow-requests', icon: Heart },
  // Add more student links here if needed
];

// Social navigation items for bottom bar
const socialNavItems = [
  { name: 'Feed', href: '/student/feed', icon: Home },
  { name: 'Search', href: '/student/search', icon: Search },
  { name: 'Messages', href: '/student/messages', icon: MessageCircle },
  { name: 'Groups', href: '/student/groups', icon: Users },
  { name: 'Profile', href: '/student/profile', icon: User },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Check if current page is a social feature
  const isSocialPage = pathname.startsWith('/student/feed') || 
                      pathname.startsWith('/student/search') || 
                      pathname.startsWith('/student/groups') || 
                      pathname.startsWith('/student/profile') ||
                      pathname.startsWith('/student/follow-requests') ||
                      pathname.startsWith('/student/messages');

  const { socket, isConnected } = useSocket();
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    // Register user with socket when component mounts
    const token = localStorage.getItem('token');
    if (token && socket && isConnected) {
      try {
        // Decode JWT to get user ID (you might want to store this in a more accessible way)
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.userId) {
          socket.emit('register_user', payload.userId);
          
          // Fetch unread notification count when user comes online
          fetchUnreadNotificationCount();
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, [socket, isConnected]);

  const fetchUnreadNotificationCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/student/notifications?unreadOnly=true', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadNotificationCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
    }
  };

  // Listen for real-time notification updates
  useEffect(() => {
    const handleNotificationReceived = (event: CustomEvent) => {
      if (event.detail.type === 'admin_notification') {
        setUnreadNotificationCount(prev => prev + event.detail.count);
      }
    };

    window.addEventListener('notificationReceived', handleNotificationReceived as EventListener);
    
    return () => {
      window.removeEventListener('notificationReceived', handleNotificationReceived as EventListener);
    };
  }, []);

  const addNotification = (notification: any) => {
    setNotifications(prev => [...prev, notification]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContainer>
      <div className="min-h-screen bg-gray-50">
        <MessageNotification />
        {isSocialPage ? (
          // Instagram-like layout for social pages
          <div className="max-w-md mx-auto bg-white min-h-screen relative">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900">ExamIndia</h1>
                <div className="flex items-center space-x-3">
                  <Link href="/student/follow-requests" className="relative">
                    <Heart className="w-6 h-6 text-gray-700" />
                    {/* Notification badge */}
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                  </Link>
                  <Link href="/student/dashboard">
                    <BookOpen className="w-6 h-6 text-gray-700" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <main className="pb-16">{children}</main>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 px-4 py-2">
              <div className="flex items-center justify-around">
                {socialNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                        isActive
                          ? 'text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <IconComponent className="w-6 h-6 mb-1" />
                      <span className="text-xs">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          // Original layout for non-social pages
          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-md min-h-screen">
              <div className="p-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Student Portal</h2>
                <nav>
                  <ul className="space-y-2">
                    {studentLinks.map((link) => {
                      const isActive = pathname === link.href;
                      const IconComponent = link.icon;
                      return (
                        <li key={link.href}>
                                                     <Link
                             href={link.href}
                             className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors relative ${
                               isActive
                                 ? 'bg-blue-700 text-white'
                                 : 'text-gray-600 hover:bg-gray-100'
                             }`}
                           >
                             <IconComponent className="w-5 h-5" />
                             <span>{link.name}</span>
                             
                             {/* Notification badge for Push Notifications */}
                             {link.name === 'Push Notifications' && unreadNotificationCount > 0 && (
                               <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                 {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                               </span>
                             )}
                           </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <main className="p-6">{children}</main>
            </div>
          </div>
        )}
      </div>
    </NotificationContainer>
  );
} 