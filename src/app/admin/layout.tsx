'use client'
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sidebarLinks = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: '🏠' },
  { name: 'Students', href: '/admin/students', icon: '👥' },
  { name: 'Exams', href: '/admin/exams', icon: '📄' },
  { name: 'Assign Exams', href: '/admin/assign-exams', icon: '📝' },
  { name: 'Question Bank', href: '/admin/questions', icon: '❓' },
  { name: 'Battle Quizzes', href: '/admin/battle-quizzes', icon: '⚔️' },
  { name: 'Results', href: '/admin/results', icon: '📊' },
  { name: 'Referrals', href: '/admin/referrals', icon: '🔗' },
  { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
  { name: 'Practice Exams', href: '/admin/practice-exams', icon: '🧑‍💻' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r min-h-screen flex flex-col">
        <div className="h-16 flex items-center justify-center border-b">
          <span className="text-xl font-bold text-primary">Admin Panel</span>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center px-4 py-2 rounded-lg text-gray-700 hover:bg-primary hover:text-white transition-colors ${
                pathname === link.href ? 'bg-primary text-white' : ''
              }`}
            >
              <span className="mr-3 text-lg">{link.icon}</span>
              {link.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t flex items-center justify-between">
          <span className="font-medium text-gray-700">Mayur</span>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/auth/login';
            }}
            className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-sm"
          >
            Logout
          </button>
        </div>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
} 