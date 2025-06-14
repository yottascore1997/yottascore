"use client";

import { useState, useEffect } from "react";

const PAGE_SIZE = 10;

export default function QuestionBank() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    marks: 1,
    category: "General",
  });
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch questions from API
  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        search,
      });
      const res = await fetch(`/api/admin/questions?${params}`);
      const data = await res.json();
      setQuestions(data.questions);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setLoading(false);
    }
    fetchQuestions();
  }, [page, search]);

  // Handle Add Question
  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: form.question,
        options: form.options,
        correctAnswer: form.correctAnswer,
        marks: form.marks,
        category: form.category,
      }),
    });
    setAdding(false);
    if (res.ok) {
      setShowModal(false);
      setForm({ question: "", options: ["", "", "", ""], correctAnswer: 0, marks: 1, category: "General" });
      setPage(1); // Go to first page to see new question
      // Refetch questions
      const params = new URLSearchParams({
        page: "1",
        pageSize: String(PAGE_SIZE),
        search,
      });
      const data = await (await fetch(`/api/admin/questions?${params}`)).json();
      setQuestions(data.questions);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } else {
      alert("Failed to add question");
    }
  }

  // Handle Delete Question
  async function handleDeleteQuestion(id: number) {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/admin/questions?id=${id}`, {
      method: "DELETE",
    });
    setDeletingId(null);
    if (res.ok) {
      // Refetch questions
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        search,
      });
      const data = await (await fetch(`/api/admin/questions?${params}`)).json();
      setQuestions(data.questions);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } else {
      alert("Failed to delete question");
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Question Bank</h1>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="border rounded px-3 py-2 text-sm w-64"
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm" onClick={() => setPage(1)}>Search</button>
        </div>
        <div className="flex gap-2 items-center">
          <label className="border px-3 py-2 rounded cursor-pointer text-sm bg-white">
            Choose file
            <input
              type="file"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <span className="text-sm text-gray-500">{file ? file.name : "No file chosen"}</span>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm flex items-center gap-1"
            onClick={() => setShowModal(true)}
          >
            <span className="text-lg font-bold">+</span> Add Question
          </button>
        </div>
      </div>
      <div className="overflow-x-auto bg-white rounded shadow min-h-[300px]">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2"><input type="checkbox" /></th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">No questions found.</td>
                </tr>
              ) : (
                questions.map((q: any) => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2"><input type="checkbox" /></td>
                    <td className="px-4 py-2">{q.question}</td>
                    <td className="px-4 py-2">{q.category || "General"}</td>
                    <td className="px-4 py-2">{q.marks}</td>
                    <td className="px-4 py-2">
                      <button className="text-blue-600 hover:underline mr-2">Edit</button>
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => handleDeleteQuestion(q.id)}
                        disabled={deletingId === q.id}
                      >
                        {deletingId === q.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      {/* Pagination */}
      <div className="flex justify-end mt-4 gap-2">
        <button
          className="px-3 py-1 rounded border text-sm disabled:opacity-50"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={`px-3 py-1 rounded border text-sm ${page === i + 1 ? 'bg-blue-600 text-white' : ''}`}
            onClick={() => setPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        <button
          className="px-3 py-1 rounded border text-sm disabled:opacity-50"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
      {/* Add Question Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6 relative">
            <h2 className="text-xl font-semibold mb-4">Add New Question</h2>
            <form className="space-y-4" onSubmit={handleAddQuestion}>
              <div>
                <label className="block text-sm font-medium mb-1">Question</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                  value={form.question}
                  onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Options</label>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct"
                        checked={form.correctAnswer === i}
                        onChange={() => setForm(f => ({ ...f, correctAnswer: i }))}
                      />
                      <input
                        className="border rounded px-2 py-1 flex-1"
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={e => {
                          const newOpts = [...form.options];
                          newOpts[i] = e.target.value;
                          setForm(f => ({ ...f, options: newOpts }));
                        }}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Marks</label>
                <input
                  type="number"
                  className="w-20 border rounded px-2 py-1"
                  value={form.marks}
                  min={1}
                  onChange={e => setForm(f => ({ ...f, marks: Number(e.target.value) }))}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="px-4 py-2 rounded border" onClick={() => setShowModal(false)} disabled={adding}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" disabled={adding}>
                  {adding ? "Adding..." : "Add Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 