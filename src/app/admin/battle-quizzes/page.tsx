"use client";

import React, { useState, useEffect } from "react";

interface QuestionCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  _count: {
    questions: number;
    battleQuizzes: number;
  };
}

interface BattleQuiz {
  id: string;
  title: string;
  description: string;
  entryAmount: number;
  categoryId: string;
  questionCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    color: string;
  };
  _count: {
    participants: number;
    winners: number;
    questions: number;
  };
}

export default function AdminBattleQuizzes() {
  const [showModal, setShowModal] = useState(false);
  const [quizzes, setQuizzes] = useState<BattleQuiz[]>([]);
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    description: "",
    entryAmount: "",
    categoryId: "",
    questionCount: 10
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch existing quizzes and categories
  useEffect(() => {
    fetchQuizzes();
    fetchCategories();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/battle-quiz", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
      } else {
        setError("Failed to fetch quizzes");
      }
    } catch (err) {
      setError("Failed to fetch quizzes");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch("/api/admin/question-categories", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (data.length > 0 && !form.categoryId) {
          setForm(prev => ({ ...prev, categoryId: data[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Not authenticated");
        setCreating(false);
        return;
      }

      const res = await fetch("/api/admin/battle-quiz", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          entryAmount: parseFloat(form.entryAmount),
          categoryId: form.categoryId,
          questionCount: form.questionCount
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setSuccess(`Quiz created successfully with ${data.questionsAdded} questions!`);
        setShowModal(false);
        setForm({ 
          title: "", 
          description: "", 
          entryAmount: "", 
          categoryId: categories[0]?.id || "",
          questionCount: 10
        });
        
        // Refresh the quiz list
        fetchQuizzes();
      } else {
        const data = await res.json();
        setError(data.message || "Failed to create quiz");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create quiz");
    } finally {
      setCreating(false);
    }
  };

  const toggleQuizStatus = async (quizId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/admin/battle-quiz/${quizId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          isActive: !currentStatus
        })
      });

      if (res.ok) {
        fetchQuizzes(); // Refresh the list
      }
    } catch (err) {
      console.error("Failed to toggle quiz status:", err);
    }
  };

  const deleteQuiz = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/admin/battle-quiz/${quizId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        setSuccess("Quiz deleted successfully!");
        fetchQuizzes(); // Refresh the list
      }
    } catch (err) {
      console.error("Failed to delete quiz:", err);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Battle Quizzes</h1>
        <div className="flex space-x-2">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            onClick={() => window.location.href = '/admin/question-bank'}
          >
            Manage Question Bank
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            onClick={() => setShowModal(true)}
          >
            Create New Quiz
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Quiz List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Created Quizzes</h2>
        </div>
        
        {quizzes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes created yet</h3>
            <p className="text-gray-500">Create your first battle quiz to get started!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        quiz.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {quiz.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {quiz.category && (
                        <div className="flex items-center space-x-1">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: quiz.category.color }}
                          ></div>
                          <span className="text-sm text-gray-600">{quiz.category.name}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{quiz.description}</p>
                    <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                      <span>Entry: ₹{quiz.entryAmount}</span>
                      <span>{quiz.questionCount} Questions</span>
                      <span>{quiz._count.participants} Participants</span>
                      <span>{quiz._count.winners} Winners</span>
                      <span>Created: {new Date(quiz.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleQuizStatus(quiz.id, quiz.isActive)}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        quiz.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {quiz.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      onClick={() => deleteQuiz(quiz.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                    <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for creating quiz */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
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
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={form.categoryId}
                  onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category._count.questions} questions)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Number of Questions</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  value={form.questionCount}
                  onChange={e => setForm(f => ({ ...f, questionCount: parseInt(e.target.value) || 10 }))}
                  required
                  min={1}
                  max={50}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Questions will be randomly selected from the chosen category
                </p>
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  type="button" 
                  className="px-4 py-2 rounded border" 
                  onClick={() => setShowModal(false)} 
                  disabled={creating}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" 
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Quiz"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 