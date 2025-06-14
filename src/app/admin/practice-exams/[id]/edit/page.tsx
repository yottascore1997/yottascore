"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface Question {
  id?: string;
  text: string;
  options: string[];
  correct: number | null;
}

export default function EditPracticeExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    startTime: "",
    endTime: "",
    duration: 30,
    spots: 10,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) return;
    fetchExam();
  }, [examId]);

  const fetchExam = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/practice-exams/${examId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch exam");
      const data = await res.json();
      setForm({
        title: data.title || "",
        description: data.description || "",
        category: data.category || "",
        subcategory: data.subcategory || "",
        startTime: data.startTime ? data.startTime.slice(0, 16) : "",
        endTime: data.endTime ? data.endTime.slice(0, 16) : "",
        duration: data.duration,
        spots: data.spots,
      });
      setQuestions(
        (data.questions || []).map((q: any) => ({
          id: q.id,
          text: q.text,
          options: q.options || ["", "", "", ""],
          correct: typeof q.correct === "number" ? q.correct : null,
        }))
      );
    } catch (e) {
      setError("Failed to fetch exam");
    } finally {
      setLoading(false);
    }
  };

  const handleExamSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/practice-exams/${examId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to update exam");
      setSuccess("Exam updated successfully");
    } catch (e) {
      setError("Failed to update exam");
    } finally {
      setSaving(false);
    }
  };

  // Question CRUD handlers (add, edit, delete)
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { text: "", options: ["", "", "", ""], correct: null },
    ]);
  };
  const handleQuestionChange = (idx: number, q: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((question, i) => (i === idx ? { ...question, ...q } : question))
    );
  };
  const handleOptionChange = (qIdx: number, oIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.map((opt, j) => (j === oIdx ? value : opt)) }
          : q
      )
    );
  };
  const handleRemoveQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Save all questions (add/update/delete in bulk)
  const handleSaveQuestions = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/practice-exams/${examId}/questions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ questions }),
      });
      if (!res.ok) throw new Error("Failed to update questions");
      setSuccess("Questions updated successfully");
      fetchExam();
    } catch (e) {
      setError("Failed to update questions");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Practice Exam</h1>
      <form onSubmit={handleExamSave} className="space-y-6 mb-8">
        <div>
          <label className="block font-semibold mb-1">Title</label>
          <input
            className="w-full border rounded p-2"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Description</label>
          <textarea
            className="w-full border rounded p-2"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Category</label>
            <input
              className="w-full border rounded p-2"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Subcategory</label>
            <input
              className="w-full border rounded p-2"
              value={form.subcategory}
              onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Start Time</label>
            <input
              type="datetime-local"
              className="w-full border rounded p-2"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">End Time</label>
            <input
              type="datetime-local"
              className="w-full border rounded p-2"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Duration (minutes)</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
              min={1}
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Spots</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={form.spots}
              onChange={(e) => setForm({ ...form, spots: Number(e.target.value) })}
              min={1}
              required
            />
          </div>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
        <button
          type="submit"
          className="w-full py-2 rounded bg-blue-700 text-white font-semibold hover:bg-blue-800 transition"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Exam Info"}
        </button>
      </form>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">Questions</h2>
          <button
            type="button"
            className="px-4 py-2 rounded bg-blue-700 text-white hover:bg-blue-800 transition"
            onClick={handleAddQuestion}
          >
            Add Question
          </button>
        </div>
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={q.id || idx} className="border rounded p-4 relative">
              <button
                type="button"
                className="absolute top-2 right-2 text-red-500"
                onClick={() => handleRemoveQuestion(idx)}
                title="Remove question"
              >
                ×
              </button>
              <div className="mb-2">
                <label className="block font-semibold mb-1">Question</label>
                <input
                  className="w-full border rounded p-2"
                  value={q.text}
                  onChange={(e) => handleQuestionChange(idx, { text: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx}>
                    <label className="block text-xs mb-1">Option {oIdx + 1}</label>
                    <input
                      className="w-full border rounded p-2"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, oIdx, e.target.value)}
                      required
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs mb-1">Correct Option</label>
                <select
                  className="w-full border rounded p-2"
                  value={q.correct ?? ''}
                  onChange={(e) => handleQuestionChange(idx, { correct: e.target.value === '' ? null : Number(e.target.value) })}
                  required
                >
                  <option value="">Select correct option</option>
                  {q.options.map((_, oIdx) => (
                    <option key={oIdx} value={oIdx}>
                      Option {oIdx + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-4 w-full py-2 rounded bg-blue-700 text-white font-semibold hover:bg-blue-800 transition"
          onClick={handleSaveQuestions}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Questions"}
        </button>
      </div>
    </div>
  );
} 