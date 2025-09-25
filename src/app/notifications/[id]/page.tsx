"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function NotificationDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/student/exam-notifications/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotification(data);
        } else {
          alert("Failed to fetch notification details.");
          router.push("/notifications");
        }
      } catch (e) {
        alert("An error occurred.");
        router.push("/notifications");
      } finally {
        setLoading(false);
      }
    };
    fetchNotification();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">Loading...</div>
    );
  }

  if (!notification) {
    return (
      <div className="p-6 text-center text-gray-500">Notification not found.</div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-700 hover:underline flex items-center gap-2"
        >
          ← Back to Notifications
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-start space-x-6 mb-6">
          {notification.logoUrl && (
            <div className="flex-shrink-0">
              <img
                src={notification.logoUrl}
                alt={`${notification.title} logo`}
                className="w-24 h-24 object-contain rounded-lg border border-gray-200 bg-white p-3"
              />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-4">{notification.title}</h1>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-600 mb-1">Year</div>
            <div className="font-medium">{notification.year}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-600 mb-1">Month</div>
            <div className="font-medium">{notification.month}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-600 mb-1">Last Date to Apply</div>
            <div className="font-medium">{new Date(notification.applyLastDate).toLocaleDateString()}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-600 mb-1">Status</div>
            <div className="font-medium">
              {new Date(notification.applyLastDate) > new Date() ? (
                <span className="text-green-600">Open for Applications</span>
              ) : (
                <span className="text-red-600">Closed</span>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Description</h2>
          <div className="prose max-w-none">
            {notification.description.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4 text-gray-700">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <a
            href={notification.applyLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-6 py-3 rounded-lg text-white font-medium ${
              new Date(notification.applyLastDate) > new Date()
                ? 'bg-blue-700 hover:bg-blue-800'
                : 'bg-gray-400 cursor-not-allowed'
            } transition`}
          >
            {new Date(notification.applyLastDate) > new Date()
              ? 'Apply Now'
              : 'Applications Closed'}
          </a>
        </div>
      </div>
    </div>
  );
} 