"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface PracticeExam {
  id: string;
  title: string;
  spots: number;
  spotsLeft: number;
  startTime: string;
  endTime?: string;
}

export default function AdminPracticeExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<PracticeExam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/practice-exams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExams(data);
      }
    } catch (e) {
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Practice Exams</h1>
        <button
          className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition"
          onClick={() => router.push("/admin/practice-exams/create")}
        >
          Create New Practice Exam
        </button>
      </div>
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : exams.length === 0 ? (
        <div className="text-center text-gray-500">No practice exams found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded shadow p-4">
              <h3 className="font-semibold text-lg">{exam.title}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                <div>
                  <span className="text-gray-500">Spots:</span>
                  <span className="ml-1">{exam.spotsLeft}/{exam.spots}</span>
                </div>
                <div>
                  <span className="text-gray-500">Start:</span>
                  <span className="ml-1">{new Date(exam.startTime).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">End:</span>
                  <span className="ml-1">{exam.endTime ? new Date(exam.endTime).toLocaleString() : '-'}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  className="text-primary hover:underline"
                  onClick={() => router.push(`/admin/practice-exams/${exam.id}/edit`)}
                >
                  Edit
                </button>
                <button
                  className="text-red-600 hover:underline"
                  onClick={async () => {
                    if (confirm("Delete this exam?")) {
                      const token = localStorage.getItem("token");
                      await fetch(`/api/admin/practice-exams/${exam.id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      fetchExams();
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