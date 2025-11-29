"use client";

import React, { useState, useEffect } from "react";

interface QuestionCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  isActive: boolean;
  _count: {
    questions: number;
    battleQuizzes: number;
  };
}

interface QuestionBankItem {
  id: string;
  text: string;
  options: string[];
  correct: number;
  explanation: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  category: {
    id: string;
    name: string;
    color: string;
  };
}

export default function QuestionBankPage() {
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'categories' | 'questions'>('categories');
  
  // Category form state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    color: "#3B82F6"
  });
  const [creatingCategory, setCreatingCategory] = useState(false);
  
  // Question form state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    text: "",
    options: ["", "", "", ""],
    correct: 0,
    explanation: "",
    difficulty: "MEDIUM" as 'EASY' | 'MEDIUM' | 'HARD',
    tags: [] as string[],
    categoryId: ""
  });
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  
  // Bulk import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importForm, setImportForm] = useState({
    categoryId: "",
    difficulty: "MEDIUM" as 'EASY' | 'MEDIUM' | 'HARD',
    file: null as File | null
  });
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  
  // Auto-generate state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    topic: "",
    categoryId: "",
    difficulty: "MEDIUM" as 'EASY' | 'MEDIUM' | 'HARD',
    count: 5,
    provider: "template" as 'openai' | 'gemini' | 'template'
  });
  const [generating, setGenerating] = useState(false);
  const [generateResults, setGenerateResults] = useState<any>(null);
  const [generationProgress, setGenerationProgress] = useState<{current: number, total: number} | null>(null);
  
  // Excel generation state
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelForm, setExcelForm] = useState({
    topic: "",
    categoryId: "",
    difficulty: "MEDIUM" as 'EASY' | 'MEDIUM' | 'HARD',
    count: 1000,
    saveToDatabase: false
  });
  const [generatingExcel, setGeneratingExcel] = useState(false);
  const [excelProgress, setExcelProgress] = useState<{current: number, total: number} | null>(null);
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/question-categories", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (data.length > 0 && !questionForm.categoryId) {
          setQuestionForm(prev => ({ ...prev, categoryId: data[0].id }));
        }
      } else {
        setError("Failed to fetch categories");
      }
    } catch (err) {
      setError("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (categoryId?: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const url = categoryId 
        ? `/api/admin/question-bank?categoryId=${categoryId}`
        : "/api/admin/question-bank";

      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (err) {
      console.error("Failed to fetch questions:", err);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCategory(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const res = await fetch("/api/admin/question-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(categoryForm),
      });

      if (res.ok) {
        setSuccess("Category created successfully!");
        setShowCategoryModal(false);
        setCategoryForm({ name: "", description: "", color: "#3B82F6" });
        fetchCategories();
      } else {
        const data = await res.json();
        setError(data.message || "Failed to create category");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create category");
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingQuestion(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const res = await fetch("/api/admin/question-bank", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(questionForm),
      });

      if (res.ok) {
        setSuccess("Question added successfully!");
        setShowQuestionModal(false);
        setQuestionForm({
          text: "",
          options: ["", "", "", ""],
          correct: 0,
          explanation: "",
          difficulty: "MEDIUM",
          tags: [],
          categoryId: categories[0]?.id || ""
        });
        fetchQuestions(questionForm.categoryId);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to add question");
      }
    } catch (err: any) {
      setError(err.message || "Failed to add question");
    } finally {
      setCreatingQuestion(false);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = value;
    setQuestionForm(prev => ({ ...prev, options: newOptions }));
  };

  const handleAddTag = (tag: string) => {
    if (tag && !questionForm.tags.includes(tag)) {
      setQuestionForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setQuestionForm(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(tag => tag !== tagToRemove) 
    }));
  };

  const handleExcelGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingExcel(true);
    setError("");
    setSuccess("");
    setExcelProgress(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Not authenticated");
        return;
      }

      if (!excelForm.topic.trim()) {
        setError("Please enter a topic");
        return;
      }

      // Show progress (estimate based on count)
      setExcelProgress({ current: 0, total: excelForm.count });
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExcelProgress(prev => {
          if (!prev) return null;
          // Estimate: 50 questions per batch, ~2 seconds per batch
          const estimatedComplete = Math.min(
            prev.current + Math.floor(prev.total / 20),
            prev.total * 0.95
          );
          return { ...prev, current: estimatedComplete };
        });
      }, 2000);

      const res = await fetch("/api/admin/question-bank/generate-excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: excelForm.topic.trim(),
          categoryId: excelForm.categoryId,
          difficulty: excelForm.difficulty,
          count: excelForm.count,
          saveToDatabase: excelForm.saveToDatabase
        }),
      });

      clearInterval(progressInterval);
      setExcelProgress(null);

      if (res.ok && res.headers.get('content-type')?.includes('spreadsheet')) {
        // Download Excel file
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        // Get filename from Content-Disposition header
        const contentDisposition = res.headers.get('content-disposition');
        let filename = 'questions.xlsx';
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setSuccess(`✅ Excel file downloaded successfully! ${excelForm.count} questions generated with Gemini AI.`);
        setExcelForm(prev => ({ ...prev, topic: "" }));
        
        if (excelForm.saveToDatabase) {
          fetchQuestions(excelForm.categoryId);
        }
        
        // Close modal after 3 seconds
        setTimeout(() => {
          setShowExcelModal(false);
        }, 3000);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to generate Excel' }));
        setError(errorData.message || errorData.error || "Failed to generate Excel file");
      }
    } catch (err: any) {
      setExcelProgress(null);
      setError(err.message || "Failed to generate Excel file");
    } finally {
      setGeneratingExcel(false);
    }
  };

  const handleAutoGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError("");
    setSuccess("");
    setGenerateResults(null);
    setGenerationProgress(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Not authenticated");
        return;
      }

      if (!generateForm.topic.trim()) {
        setError("Please enter a topic");
        return;
      }

      // For large batches, show progress simulation
      if (generateForm.count >= 100) {
        setGenerationProgress({ current: 0, total: generateForm.count });
        // Simulate progress (actual progress will come from server)
        const progressInterval = setInterval(() => {
          setGenerationProgress(prev => {
            if (!prev) return null;
            const newCurrent = Math.min(prev.current + 10, prev.total * 0.95);
            return { ...prev, current: newCurrent };
          });
        }, 500);
        
        // Clear interval after request completes
        setTimeout(() => clearInterval(progressInterval), 60000);
      }

      // Use bulk endpoint for 100+ questions
      const endpoint = generateForm.count >= 100 
        ? "/api/admin/question-bank/bulk-generate"
        : "/api/admin/question-bank/generate";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: generateForm.topic.trim(),
          categoryId: generateForm.categoryId,
          difficulty: generateForm.difficulty,
          count: generateForm.count,
          provider: generateForm.count >= 100 ? 'template' : generateForm.provider
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setGenerationProgress(null);
        setSuccess(`✅ ${data.message}`);
        setGenerateResults(data);
        setGenerateForm(prev => ({ ...prev, topic: "" }));
        // Refresh questions list
        fetchQuestions(generateForm.categoryId);
        // Close modal after 3-5 seconds (longer for large batches)
        const closeDelay = generateForm.count >= 100 ? 5000 : 3000;
        setTimeout(() => {
          setShowGenerateModal(false);
          setGenerateResults(null);
        }, closeDelay);
      } else {
        setGenerationProgress(null);
        setError(data.message || data.error || "Failed to generate questions");
      }
    } catch (err: any) {
      setGenerationProgress(null);
      setError(err.message || "Failed to generate questions");
    } finally {
      setGenerating(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch("/api/admin/question-bank/template", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'question-bank-template.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSuccess("Template downloaded successfully!");
      } else {
        setError("Failed to download template");
      }
    } catch (err) {
      setError("Failed to download template");
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImporting(true);
    setError("");
    setSuccess("");
    setImportResults(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Not authenticated");
        return;
      }

      if (!importForm.file || !importForm.categoryId) {
        setError("Please select a file and category");
        setImporting(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', importForm.file);
      formData.append('categoryId', importForm.categoryId);
      formData.append('difficulty', importForm.difficulty);

      const res = await fetch("/api/admin/question-bank/bulk-import", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(data.message);
        setImportResults(data.results);
        setShowImportModal(false);
        setImportForm({
          categoryId: categories[0]?.id || "",
          difficulty: "MEDIUM",
          file: null
        });
        
        // Refresh questions list
        fetchQuestions(importForm.categoryId);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to import questions");
      }
    } catch (err: any) {
      setError(err.message || "Failed to import questions");
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!validTypes.includes(file.type)) {
        setError("Please select a valid Excel or CSV file");
        return;
      }
      
      setImportForm(prev => ({ ...prev, file }));
      setError("");
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
        <h1 className="text-2xl font-bold">Question Bank</h1>
        <div className="flex space-x-2">
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
            onClick={downloadTemplate}
          >
            Download Template
          </button>
          <button
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors"
            onClick={() => setShowImportModal(true)}
          >
            Bulk Import
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            onClick={() => setShowCategoryModal(true)}
          >
            Add Category
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            onClick={() => setShowQuestionModal(true)}
          >
            Add Question
          </button>
          <button
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center gap-2"
            onClick={() => {
              if (categories.length > 0) {
                setGenerateForm(prev => ({ 
                  ...prev, 
                  categoryId: prev.categoryId || categories[0].id 
                }));
                setShowGenerateModal(true);
              } else {
                setError("Please create a category first");
              }
            }}
          >
            <span>✨</span>
            Auto Generate Questions
          </button>
          <button
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center gap-2 font-semibold"
            onClick={() => {
              if (categories.length > 0) {
                setGenerateForm(prev => ({ 
                  ...prev, 
                  categoryId: prev.categoryId || categories[0].id,
                  count: 1000
                }));
                setShowGenerateModal(true);
              } else {
                setError("Please create a category first");
              }
            }}
          >
            <span>🚀</span>
            Generate 1000 Questions (Bulk)
          </button>
          <button
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center gap-2 font-semibold shadow-lg"
            onClick={() => {
              if (categories.length > 0) {
                setExcelForm(prev => ({ 
                  ...prev, 
                  categoryId: prev.categoryId || categories[0].id,
                  count: 1000
                }));
                setShowExcelModal(true);
              } else {
                setError("Please create a category first");
              }
            }}
          >
            <span>📊</span>
            Generate Excel (Gemini AI) - 1000 Questions
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

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
            activeTab === 'categories' 
              ? 'bg-blue-700 text-white shadow' 
              : 'bg-gray-100 text-gray-600 hover:bg-blue-100'
          }`}
          onClick={() => setActiveTab('categories')}
        >
          Categories ({categories.length})
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
            activeTab === 'questions' 
              ? 'bg-blue-700 text-white shadow' 
              : 'bg-gray-100 text-gray-600 hover:bg-blue-100'
          }`}
          onClick={() => {
            setActiveTab('questions');
            fetchQuestions();
          }}
        >
          Questions ({questions.length})
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Question Categories</h2>
          </div>
          
          {categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
              <p className="text-gray-500">Create your first category to start organizing questions!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {categories.map((category: QuestionCategory) => (
                <div key={category.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-gray-600">{category.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{category._count.questions} Questions</span>
                          <span>{category._count.battleQuizzes} Quizzes</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        onClick={() => {
                          setActiveTab('questions');
                          fetchQuestions(category.id);
                        }}
                      >
                        View Questions
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
          </div>
          
          {questions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
              <p className="text-gray-500">Add questions to your categories to start building quizzes!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {questions.map((question: QuestionBankItem) => (
                <div key={question.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: question.category.color }}
                        ></div>
                        <span className="text-sm font-medium text-gray-600">{question.category.name}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          question.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                          question.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.difficulty}
                        </span>
                      </div>
                      <p className="text-gray-900 mb-3">{question.text}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                        {question.options.map((option: string, index: number) => (
                          <div 
                            key={index}
                            className={`p-2 rounded text-sm ${
                              index === question.correct 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-gray-50 text-gray-700'
                            }`}
                          >
                            {String.fromCharCode(65 + index)}. {option}
                          </div>
                        ))}
                      </div>
                      {question.explanation && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Explanation:</strong> {question.explanation}
                        </p>
                      )}
                      {question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {question.tags.map((tag: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category Creation Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Category</h2>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={categoryForm.name}
                  onChange={e => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  value={categoryForm.description}
                  onChange={e => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <input
                  type="color"
                  className="w-full h-10 border rounded"
                  value={categoryForm.color}
                  onChange={e => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  className="px-4 py-2 rounded border" 
                  onClick={() => setShowCategoryModal(false)}
                  disabled={creatingCategory}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700" 
                  disabled={creatingCategory}
                >
                  {creatingCategory ? "Creating..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Creation Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Add New Question</h2>
            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={questionForm.categoryId}
                  onChange={e => setQuestionForm(prev => ({ ...prev, categoryId: e.target.value }))}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Question Text</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  value={questionForm.text}
                  onChange={e => setQuestionForm(prev => ({ ...prev, text: e.target.value }))}
                  required
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Options</label>
                {questionForm.options.map((option: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="radio"
                      name="correct"
                      checked={questionForm.correct === index}
                      onChange={() => setQuestionForm(prev => ({ ...prev, correct: index }))}
                      className="mr-2"
                    />
                    <input
                      type="text"
                      className="flex-1 border rounded px-3 py-2"
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={e => handleOptionChange(index, e.target.value)}
                      required
                    />
                  </div>
                ))}
                <span className="text-xs text-gray-500">Select the correct answer</span>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Explanation (Optional)</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  value={questionForm.explanation}
                  onChange={e => setQuestionForm(prev => ({ ...prev, explanation: e.target.value }))}
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Difficulty</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={questionForm.difficulty}
                  onChange={e => setQuestionForm(prev => ({ ...prev, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' }))}
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tags (Optional)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {questionForm.tags.map((tag: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded flex items-center">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-blue-500 hover:text-blue-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    className="flex-1 border rounded px-3 py-2"
                    placeholder="Add a tag"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        handleAddTag(input.value.trim());
                        input.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      handleAddTag(input.value.trim());
                      input.value = '';
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  className="px-4 py-2 rounded border" 
                  onClick={() => setShowQuestionModal(false)}
                  disabled={creatingQuestion}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" 
                  disabled={creatingQuestion}
                >
                  {creatingQuestion ? "Adding..." : "Add Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">Bulk Import Questions</h2>
            <form onSubmit={handleBulkImport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={importForm.categoryId}
                  onChange={e => setImportForm(prev => ({ ...prev, categoryId: e.target.value }))}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Difficulty</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={importForm.difficulty}
                  onChange={e => setImportForm(prev => ({ ...prev, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' }))}
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Excel/CSV File</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Download the template first to see the required format
                </p>
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  className="px-4 py-2 rounded border" 
                  onClick={() => setShowImportModal(false)}
                  disabled={importing}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700" 
                  disabled={importing}
                >
                  {importing ? "Importing..." : "Import Questions"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Results */}
      {importResults && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Import Results</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-100 p-3 rounded">
                  <div className="text-2xl font-bold text-blue-600">{importResults.total}</div>
                  <div className="text-sm text-blue-700">Total</div>
                </div>
                <div className="bg-green-100 p-3 rounded">
                  <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                  <div className="text-sm text-green-700">Success</div>
                </div>
                <div className="bg-red-100 p-3 rounded">
                  <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
              </div>
              
              {importResults.errors.length > 0 && (
                <div>
                  <h3 className="font-semibold text-red-600 mb-2">Errors:</h3>
                  <div className="bg-red-50 p-3 rounded max-h-40 overflow-y-auto">
                    {importResults.errors.map((error: string, index: number) => (
                      <div key={index} className="text-sm text-red-700 mb-1">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => setImportResults(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Generate Questions Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>✨</span>
              Auto Generate Questions with AI
            </h2>
            <form onSubmit={handleAutoGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={generateForm.categoryId}
                  onChange={e => setGenerateForm(prev => ({ ...prev, categoryId: e.target.value }))}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Topic/Subject *</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., Python Programming, History of India, Basic Math"
                  value={generateForm.topic}
                  onChange={e => setGenerateForm(prev => ({ ...prev, topic: e.target.value }))}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the topic or subject for which you want questions generated
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Difficulty</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={generateForm.difficulty}
                    onChange={e => setGenerateForm(prev => ({ ...prev, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' }))}
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Number of Questions</label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    min="1"
                    max="10000"
                    value={generateForm.count}
                    onChange={e => setGenerateForm(prev => ({ ...prev, count: Math.max(1, Math.min(10000, parseInt(e.target.value) || 5)) }))}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {generateForm.count > 100 
                      ? `⚠️ Large batch: ${generateForm.count} questions (will take time)` 
                      : generateForm.count === 1000
                      ? '🚀 Bulk mode: 1000 questions'
                      : '1-10,000 questions'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Generation Method</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={generateForm.provider}
                  onChange={e => setGenerateForm(prev => ({ ...prev, provider: e.target.value as 'openai' | 'gemini' | 'template' }))}
                >
                  <option value="template">🆓 Template-Based (FREE - Limited Variety)</option>
                  <option value="gemini">🤖 Google Gemini (FREE - Real AI Questions) ⭐ Recommended</option>
                  <option value="openai">💎 OpenAI GPT-3.5 (Paid - Best Quality)</option>
                </select>
                <div className="mt-2 space-y-1">
                  {generateForm.provider === 'template' && (
                    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      ⚠️ <strong>Note:</strong> Template-based questions are pre-defined and will repeat. 
                      Same 10-15 base questions will be repeated {generateForm.count} times with variations.
                      For better quality, use AI generation.
                    </div>
                  )}
                  {generateForm.provider === 'gemini' && (
                    <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                      ✅ <strong>Best Choice!</strong> Free tier available. Real, unique AI-generated questions.
                      Get free API key: https://makersuite.google.com/app/apikey
                    </div>
                  )}
                  {generateForm.provider === 'openai' && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      💰 Paid option. High quality questions. Cost: ~₹0.16 per question.
                      Get API key: https://platform.openai.com/api-keys
                    </div>
                  )}
                </div>
              </div>

              {generationProgress && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-blue-800 font-medium">
                      Generating questions...
                    </p>
                    <span className="text-blue-600 font-semibold">
                      {generationProgress.current}/{generationProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    {Math.round((generationProgress.current / generationProgress.total) * 100)}% complete
                  </p>
                </div>
              )}

              {generateResults && !generationProgress && (
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-800 font-medium">
                    ✅ Successfully generated {generateResults.saved} questions!
                  </p>
                  {generateResults.generated > generateResults.saved && (
                    <p className="text-sm text-green-600 mt-1">
                      Note: {generateResults.generated - generateResults.saved} questions could not be saved
                    </p>
                  )}
                  <p className="text-xs text-green-600 mt-2">
                    {generateResults.method === 'template-bulk' && '🚀 Generated using FREE template-based method'}
                  </p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  className="flex-1 px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400"
                  onClick={() => {
                    setShowGenerateModal(false);
                    setGenerateForm({
                      topic: "",
                      categoryId: categories[0]?.id || "",
                      difficulty: "MEDIUM",
                      count: 5,
                      provider: "openai"
                    });
                    setGenerateResults(null);
                  }}
                  disabled={generating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
                  disabled={generating}
                >
                  {generating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Generating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>✨</span>
                      Generate Questions
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Generation Modal */}
      {showExcelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>📊</span>
              Generate Excel File with Gemini AI
            </h2>
            <form onSubmit={handleExcelGenerate} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800">
                  <strong>✨ Using Gemini AI:</strong> Real, unique questions generated with Google Gemini AI.
                  Questions will be exported directly to Excel file - ready for quiz import!
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={excelForm.categoryId}
                  onChange={e => setExcelForm(prev => ({ ...prev, categoryId: e.target.value }))}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Topic/Subject *</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., Python Programming, History of India, Basic Math"
                  value={excelForm.topic}
                  onChange={e => setExcelForm(prev => ({ ...prev, topic: e.target.value }))}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the topic for which you want questions generated with AI
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Difficulty</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={excelForm.difficulty}
                    onChange={e => setExcelForm(prev => ({ ...prev, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' }))}
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Number of Questions</label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    min="1"
                    max="1000"
                    value={excelForm.count}
                    onChange={e => setExcelForm(prev => ({ ...prev, count: Math.max(1, Math.min(1000, parseInt(e.target.value) || 1000)) }))}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">1-1000 questions</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="saveToDb"
                  checked={excelForm.saveToDatabase}
                  onChange={e => setExcelForm(prev => ({ ...prev, saveToDatabase: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="saveToDb" className="text-sm text-gray-700">
                  Also save questions to Question Bank database
                </label>
              </div>

              {excelProgress && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-blue-800 font-medium">
                      Generating questions with Gemini AI...
                    </p>
                    <span className="text-blue-600 font-semibold">
                      {excelProgress.current}/{excelProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(excelProgress.current / excelProgress.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    {Math.round((excelProgress.current / excelProgress.total) * 100)}% complete - This may take a few minutes
                  </p>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> Large batches (500+) may take 5-10 minutes due to Gemini API rate limits.
                  Please keep this window open while generating.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  className="flex-1 px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400"
                  onClick={() => {
                    setShowExcelModal(false);
                    setExcelForm({
                      topic: "",
                      categoryId: categories[0]?.id || "",
                      difficulty: "MEDIUM",
                      count: 1000,
                      saveToDatabase: false
                    });
                    setExcelProgress(null);
                  }}
                  disabled={generatingExcel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
                  disabled={generatingExcel}
                >
                  {generatingExcel ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Generating Excel...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>📊</span>
                      Generate & Download Excel
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 