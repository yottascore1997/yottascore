"use client";

import React, { useState } from "react";

interface MCQ {
  question: string;
  options: string[];
  correct: number;
}

export default function AdminBattleQuizzes() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    entryAmount: "",
    questions: [
      { question: "", options: ["", "", "", ""], correct: 0 } as MCQ
    ]
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAddQuestion = () => {
    setForm(f => ({
      ...f,
      questions: [...f.questions, { question: "", options: ["", "", "", ""], correct: 0 }]
    }));
  };

  const handleQuestionChange = (idx: number, value: string) => {
    const newQuestions = [...form.questions];
    newQuestions[idx].question = value;
    setForm(f => ({ ...f, questions: newQuestions }));
  };

  const handleOptionChange = (qIdx: number, optIdx: number, value: string) => {
    const newQuestions = [...form.questions];
    newQuestions[qIdx].options[optIdx] = value;
    setForm(f => ({ ...f, questions: newQuestions }));
  };

  const handleCorrectChange = (qIdx: number, correctIdx: number) => {
    const newQuestions = [...form.questions];
    newQuestions[qIdx].correct = correctIdx;
    setForm(f => ({ ...f, questions: newQuestions }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");
    try {
      // Create the quiz first
      const res = await fetch("/api/admin/battle-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          entryAmount: parseFloat(form.entryAmount),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to create quiz");
        setCreating(false);
        return;
      }
      const quiz = await res.json();
      // Now create the questions
      for (const q of form.questions) {
        await fetch(`/api/admin/battle-quiz/${quiz.id}/question`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(q),
        });
      }
      setSuccess("Quiz and questions created successfully!");
      setShowModal(false);
      setForm({ title: "", description: "", entryAmount: "", questions: [{ question: "", options: ["", "", "", ""], correct: 0 }] });
    } catch (err: any) {
      setError(err.message || "Failed to create quiz");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Battle Quizzes</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => setShowModal(true)}
        >
          Create New Quiz
        </button>
      </div>
      {/* Modal for creating quiz */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6 relative">
            <h2 className="text-xl font-semibold mb-4">Create New Battle Quiz</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Entry Amount (₹)</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  value={form.entryAmount}
                  onChange={e => setForm(f => ({ ...f, entryAmount: e.target.value }))}
                  required
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Questions</label>
                {form.questions.map((q, idx) => (
                  <div key={idx} className="mb-4 border rounded p-3">
                    <input
                      className="w-full border rounded px-3 py-2 mb-2"
                      value={q.question}
                      onChange={e => handleQuestionChange(idx, e.target.value)}
                      placeholder={`Question ${idx + 1}`}
                      required
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center">
                          <input
                            type="radio"
                            name={`correct-${idx}`}
                            checked={q.correct === oIdx}
                            onChange={() => handleCorrectChange(idx, oIdx)}
                            className="mr-2"
                          />
                          <input
                            className="border rounded px-2 py-1 flex-1"
                            placeholder={`Option ${oIdx + 1}`}
                            value={opt}
                            onChange={e => handleOptionChange(idx, oIdx, e.target.value)}
                            required
                          />
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">Select the correct answer</span>
                  </div>
                ))}
                <button type="button" className="text-blue-600 hover:underline mt-2" onClick={handleAddQuestion}>
                  Add Question
                </button>
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="px-4 py-2 rounded border" onClick={() => setShowModal(false)} disabled={creating}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" disabled={creating}>
                  {creating ? "Creating..." : "Create Quiz"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {success && <div className="text-green-600 mt-4">{success}</div>}
      {/* You can add a list of existing quizzes here */}
    </div>
  );
} 