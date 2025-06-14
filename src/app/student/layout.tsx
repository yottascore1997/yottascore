'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const studentLinks = [
  { name: 'Dashboard', href: '/student/dashboard', icon: '🏠' },
  { name: 'Wallet', href: '/student/wallet', icon: '💰' },
  // Add more student links here if needed
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r min-h-screen flex flex-col">
        <div className="h-16 flex items-center justify-center border-b">
          <span className="text-xl font-bold text-primary">Student Panel</span>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {studentLinks.map((link) => (
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
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
} 