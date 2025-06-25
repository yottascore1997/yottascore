"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface Question {
  id: string;
  text: string;
  options: string[];
  marks: number;
}

export default function PracticeExamAttemptPage() {
  const router = useRouter();
  const params = useParams();
  const examId = typeof params.examId === "string" ? params.examId : Array.isArray(params.examId) ? params.examId[0] : "";
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) return;
    const fetchQuestions = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }
      const res = await fetch(`/api/student/practice-exams/${examId}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        router.push(`/student/practice-exams/${examId}`);
        return;
      }
      const data = await res.json();
      setQuestions(data);
      setLoading(false);
    };
    fetchQuestions();
  }, [examId, router]);

  const handleOptionSelect = (qid: string, idx: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: idx }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/student/practice-exams/${examId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answers })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit");
        setSubmitting(false);
        return;
      }
      
      const data = await res.json();
      // Redirect to the beautiful result page
      router.push(data.redirectTo || `/student/practice-exams/${examId}/result`);
    } catch (err) {
      setError("Failed to submit");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading questions...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Attempt Practice Exam</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded shadow p-4 mb-4">
            <div className="font-semibold mb-2">
              Q{idx + 1}. {q.text}
            </div>
            <div className="grid grid-cols-1 gap-2">
              {q.options.map((opt, oIdx) => (
                <label key={oIdx} className={`flex items-center p-2 rounded cursor-pointer ${answers[q.id] === oIdx ? 'bg-blue-100 border-blue-500 border' : 'bg-gray-50 border border-gray-200'}`}>
                  <input
                    type="radio"
                    name={`q_${q.id}`}
                    value={oIdx}
                    checked={answers[q.id] === oIdx}
                    onChange={() => handleOptionSelect(q.id, oIdx)}
                    className="mr-2"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <button
          type="submit"
          className="w-full py-3 rounded bg-blue-700 text-white font-bold text-lg hover:bg-blue-800"
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Exam"}
        </button>
      </form>
    </div>
  );
} 