"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Question {
  text: string;
  options: string[];
  correct: number | null;
}

export default function CreatePracticeExamPage() {
  const router = useRouter();
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/practice-exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, questions }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create exam");
        setLoading(false);
        return;
      }
      const data = await res.json();
      router.push(`/admin/practice-exams/${data.id}/edit`);
    } catch (err) {
      setError("Failed to create exam");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create Practice Exam</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
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
        <div>
          <label className="block font-semibold mb-2">Questions</label>
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={idx} className="border rounded p-4 relative">
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
            className="mt-4 px-4 py-2 rounded bg-primary text-blue hover:bg-primary-dark"
            onClick={handleAddQuestion}
          >
            Add Question
          </button>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <button
          type="submit"
          className="w-full py-2 rounded bg-primary text-blue font-semibold hover:bg-primary-dark"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Practice Exam"}
        </button>
      </form>
    </div>
  );
} 