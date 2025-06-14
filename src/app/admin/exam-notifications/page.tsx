"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  year: number;
  month: number;
  applyLastDate: string;
}

export default function AdminExamNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/exam-notifications", {
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Exam Notifications</h1>
        <button
          className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition"
          onClick={() => router.push("/admin/exam-notifications/create")}
        >
          Create New Notification
        </button>
      </div>
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center text-gray-500">No notifications found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notifications.map((n) => (
            <div key={n.id} className="bg-white rounded shadow p-4 flex flex-col gap-2">
              <div className="font-bold text-lg mb-1">{n.title}</div>
              <div className="text-xs text-gray-500">{n.year} - {n.month}</div>
              <div className="text-xs text-gray-600">Apply Last Date: {new Date(n.applyLastDate).toLocaleDateString()}</div>
              <div className="flex gap-2 mt-2">
                <button
                  className="text-blue-700 hover:underline"
                  onClick={() => router.push(`/admin/exam-notifications/${n.id}/edit`)}
                >
                  Edit
                </button>
                <button
                  className="text-red-600 hover:underline"
                  onClick={async () => {
                    if (confirm("Delete this notification?")) {
                      const token = localStorage.getItem("token");
                      await fetch(`/api/admin/exam-notifications/${n.id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      fetchNotifications();
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 