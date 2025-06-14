'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const studentLinks = [
  { name: 'Dashboard', href: '/student/dashboard', icon: '🏠' },
  { name: 'Live Exams', href: '/student/live-exams', icon: '📝' },
  { name: 'Practice Exams', href: '/student/practice-exams', icon: '📚' },
  { name: 'Exam Notifications', href: '/student/notifications', icon: '🔔' },
  { name: 'My Attempts', href: '/student/attempts', icon: '📋' },
  { name: 'Wallet', href: '/student/wallet', icon: '💰' },
  // Add more student links here if needed
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-md min-h-screen">
          <div className="p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Student Portal</h2>
            <nav>
              <ul className="space-y-2">
                {studentLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-700 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span>{link.icon}</span>
                        <span>{link.name}</span>
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
    </div>
  );
} 