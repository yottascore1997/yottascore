"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  description: string;
  year: number;
  month: number;
  applyLastDate: string;
  applyLink: string;
  logoUrl?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/student/exam-notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (e) {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const groupedNotifications = notifications.reduce((acc, n) => {
    const key = `${n.year}-${n.month}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(n);
    return acc;
  }, {} as Record<string, Notification[]>);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Exam Notifications</h1>
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center text-gray-500">No notifications found.</div>
      ) : (
        Object.entries(groupedNotifications).map(([key, ns]) => (
          <div key={key} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{key}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ns.map((n) => (
                <div key={n.id} className="bg-white rounded shadow p-4 flex flex-col gap-2">
                  <div className="flex items-start space-x-3">
                    {n.logoUrl && (
                      <div className="flex-shrink-0">
                        <img
                          src={n.logoUrl}
                          alt={`${n.title} logo`}
                          className="w-12 h-12 object-contain rounded border border-gray-200 bg-white p-1"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <Link 
                        href={`/student/notifications/${n.id}`}
                        className="font-bold text-lg mb-1 hover:text-blue-700 transition block"
                      >
                        {n.title}
                      </Link>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">Apply Last Date: {new Date(n.applyLastDate).toLocaleDateString()}</div>
                  <div className="text-sm text-gray-700 line-clamp-2 mb-2">
                    {n.description}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Link
                      href={`/student/notifications/${n.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      View Details
                    </Link>
                    <a
                      href={n.applyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:underline ml-auto"
                    >
                      Apply Now
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
} 