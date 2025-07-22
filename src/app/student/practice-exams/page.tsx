"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface PracticeExam {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  spots: number;
  spotsLeft: number;
  startTime: string;
  endTime?: string;
  attempted: boolean;
}

export default function StudentPracticeExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<PracticeExam[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/student/practice-exams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExams(data);
        const cats = Array.from(new Set(data.map((e: PracticeExam) => e.category))) as string[];
        setCategories(cats);
        setSelectedCategory(cats[0] || "");
      }
    } catch (e) {
      setExams([]);
      setCategories([]);
      setSelectedCategory("");
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = exams.filter((e) => e.category === selectedCategory);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Choose Your Practice Exam</h1>
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap ${
              selectedCategory === cat
                ? "bg-blue-800 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-blue-100"
            }`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : filteredExams.length === 0 ? (
        <div className="text-center text-gray-500">No exams found for this category.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-xl shadow p-6 flex flex-col items-center"
            >
              <div className="text-lg font-bold mb-2">{exam.subcategory}</div>
              <div className="text-sm text-gray-600 mb-2">{exam.title}</div>
              <div className="text-xs text-gray-500 mb-2">
                Spots left: {exam.spotsLeft} / {exam.spots}
              </div>
              <button
                className={`mt-2 px-4 py-2 rounded font-semibold w-full transition-colors ${
                  exam.attempted
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-700 text-white hover:bg-blue-800"
                }`}
                disabled={exam.attempted}
                onClick={() => router.push(`/student/practice-exams/${exam.id}`)}
              >
                {exam.attempted ? "Already Attempted" : "Attempt"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 