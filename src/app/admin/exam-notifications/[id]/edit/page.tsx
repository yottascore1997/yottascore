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
}

export default function EditExamNotificationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [applyLastDate, setApplyLastDate] = useState("");
  const [applyLink, setApplyLink] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/admin/exam-notifications/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotification(data);
          setTitle(data.title);
          setDescription(data.description);
          setYear(data.year);
          setMonth(data.month);
          setApplyLastDate(data.applyLastDate);
          setApplyLink(data.applyLink);
        } else {
          alert("Failed to fetch notification.");
          router.push("/admin/exam-notifications");
        }
      } catch (e) {
        alert("An error occurred.");
        router.push("/admin/exam-notifications");
      }
    };
    fetchNotification();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/exam-notifications/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, year, month, applyLastDate, applyLink }),
      });
      if (res.ok) {
        router.push("/admin/exam-notifications");
      } else {
        alert("Failed to update notification.");
      }
    } catch (e) {
      alert("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!notification) {
    return <div className="p-6 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Exam Notification</h1>
      <form onSubmit={handleSubmit} className="max-w-md">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded h-32"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Month</label>
          <input
            type="number"
            min="1"
            max="12"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Apply Last Date</label>
          <input
            type="date"
            value={applyLastDate}
            onChange={(e) => setApplyLastDate(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Apply Link</label>
          <input
            type="url"
            value={applyLink}
            onChange={(e) => setApplyLink(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Notification"}
        </button>
      </form>
    </div>
  );
} 