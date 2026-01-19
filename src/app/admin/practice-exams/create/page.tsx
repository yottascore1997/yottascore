"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from 'xlsx';

interface Question {
  text: string;
  options: string[];
  correct: number | null;
  marks: number;
}

export default function CreatePracticeExamPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    instructions: "",
    category: "",
    subcategory: "",
    startTime: "",
    endTime: "",
    duration: 30,
    spots: 10,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [categoryLogoFile, setCategoryLogoFile] = useState<File | null>(null);
  const [categoryLogoPreview, setCategoryLogoPreview] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'questions'>('details');
  const [categories, setCategories] = useState<Array<{ id: string; name: string; _count: { questions: number } }>>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

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
        if (data.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const handleImportFromQuestionBank = async () => {
    if (!selectedCategoryId) {
      setError("Please select a category");
      return;
    }

    if (questionCount < 1 || questionCount > 100) {
      setError("Please enter a valid number of questions (1-100)");
      return;
    }

    setLoadingQuestions(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Not authenticated");
        return;
      }

      // Fetch questions from question bank
      const res = await fetch(`/api/admin/question-bank?categoryId=${selectedCategoryId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        setError("Failed to fetch questions from question bank");
        return;
      }

      const questionBankItems = await res.json();

      if (questionBankItems.length === 0) {
        setError("No questions found in the selected category");
        return;
      }

      // Shuffle and select random questions
      const shuffled = [...questionBankItems].sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, Math.min(questionCount, questionBankItems.length));

      // Convert QuestionBankItem format to Practice Exam Question format
      const convertedQuestions: Question[] = selectedQuestions.map((q: any) => ({
        text: q.text || "",
        options: Array.isArray(q.options) ? q.options : [],
        correct: q.correct !== undefined && q.correct !== null ? q.correct : null,
        marks: 1
      }));

      // Ask user if they want to append or replace
      const shouldAppend = questions.length > 0 && 
        window.confirm(`You have ${questions.length} existing question(s). Do you want to add these ${convertedQuestions.length} questions from Question Bank? (Click OK to append, Cancel to replace)`);
      
      if (shouldAppend) {
        setQuestions([...questions, ...convertedQuestions]);
        setSuccess(`Successfully added ${convertedQuestions.length} questions from Question Bank! Total: ${questions.length + convertedQuestions.length}`);
      } else {
        setQuestions(convertedQuestions);
        setSuccess(`Successfully imported ${convertedQuestions.length} questions from Question Bank!`);
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to import questions from Question Bank");
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { text: "", options: ["", "", "", ""], correct: null, marks: 0 },
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

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCategoryLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCategoryLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExcelImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const importedQuestions: Question[] = [];
        const errors: string[] = [];
        
        // Skip header row and process data
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row || row.length < 6) {
            errors.push(`Row ${i + 1}: Insufficient columns. Expected at least 6 columns.`);
            continue;
          }

          const questionText = (row[0] || "").toString().trim();
          const option1 = (row[1] || "").toString().trim();
          const option2 = (row[2] || "").toString().trim();
          const option3 = (row[3] || "").toString().trim();
          const option4 = (row[4] || "").toString().trim();
          const correctAnswerInput = row[5];
          const marks = row[6] ? Number(row[6]) : 1;

          // Validate required fields
          if (!questionText) {
            errors.push(`Row ${i + 1}: Question text is required`);
            continue;
          }

          // Prepare options array (always 4 elements, empty strings for missing options)
          const allOptions = [option1, option2, option3, option4];
          
          // Validate we have at least 2 non-empty options
          const validOptionsCount = allOptions.filter(opt => opt && opt.length > 0).length;
          if (validOptionsCount < 2) {
            errors.push(`Row ${i + 1}: At least 2 options are required`);
            continue;
          }

          // Validate correct answer (Excel uses 1-based indexing, we convert to 0-based)
          let correctAnswer: number | null = null;
          if (correctAnswerInput !== undefined && correctAnswerInput !== null && correctAnswerInput !== '') {
            const correctIndex = Number(correctAnswerInput);
            if (isNaN(correctIndex)) {
              errors.push(`Row ${i + 1}: Correct answer must be a number`);
              continue;
            }
            const zeroBasedIndex = correctIndex - 1; // Convert 1-based to 0-based
            if (zeroBasedIndex < 0 || zeroBasedIndex > 3) {
              errors.push(`Row ${i + 1}: Correct answer must be between 1 and 4`);
              continue;
            }
            // Validate that the selected option is not empty
            if (!allOptions[zeroBasedIndex] || allOptions[zeroBasedIndex].length === 0) {
              errors.push(`Row ${i + 1}: The selected correct answer option (${correctIndex}) is empty`);
              continue;
            }
            correctAnswer = zeroBasedIndex;
          }

          // Validate marks
          const validMarks = marks > 0 ? marks : 1;

          const question: Question = {
            text: questionText,
            options: allOptions, // Always 4 elements (with empty strings if needed)
            correct: correctAnswer,
            marks: validMarks
          };
          importedQuestions.push(question);
        }

        if (importedQuestions.length > 0) {
          // Ask user if they want to append or replace
          const shouldAppend = questions.length > 0 && 
            window.confirm(`You have ${questions.length} existing question(s). Do you want to add these ${importedQuestions.length} imported questions to them? (Click OK to append, Cancel to replace)`);
          
          if (shouldAppend) {
            setQuestions([...questions, ...importedQuestions]);
            setSuccess(`Successfully added ${importedQuestions.length} questions! Total: ${questions.length + importedQuestions.length}`);
          } else {
            setQuestions(importedQuestions);
            setSuccess(`Successfully imported ${importedQuestions.length} questions from Excel!`);
          }
          
          if (errors.length > 0) {
            const errorMsg = `Imported ${importedQuestions.length} questions, but ${errors.length} row(s) had errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more errors` : ''}`;
            console.warn('Import errors:', errors);
            setError(errorMsg);
            setTimeout(() => setError(null), 8000);
          } else {
            setTimeout(() => setSuccess(null), 3000);
          }
        } else {
          const errorMsg = errors.length > 0 
            ? `No valid questions found. Errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more errors` : ''}`
            : "No valid questions found in Excel file. Please check the format.";
          setError(errorMsg);
          setTimeout(() => setError(null), 8000);
        }
      } catch (err) {
        console.error('Excel import error:', err);
        setError(`Error reading Excel file: ${err instanceof Error ? err.message : 'Please check the format and try again.'}`);
        setTimeout(() => setError(null), 5000);
      }
    };
    
    reader.onerror = () => {
      setError("Failed to read the file. Please try again.");
      setTimeout(() => setError(null), 3000);
    };
    
    reader.readAsArrayBuffer(file);
  };

  const downloadExcelTemplate = () => {
    const template = [
      ['Question', 'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Correct Option (1-4)', 'Marks'],
      ['What is the capital of India?', 'Mumbai', 'Delhi', 'Kolkata', 'Chennai', '2', '2'],
      ['Which planet is closest to the Sun?', 'Venus', 'Mercury', 'Earth', 'Mars', '2', '1']
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "practice_exam_template.xlsx");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("instructions", form.instructions);
      formData.append("category", form.category);
      formData.append("subcategory", form.subcategory);
      formData.append("startTime", form.startTime);
      formData.append("endTime", form.endTime);
      formData.append("duration", form.duration.toString());
      formData.append("spots", form.spots.toString());
      formData.append("questions", JSON.stringify(questions));
      
      if (logoFile) {
        formData.append("logo", logoFile);
      }
      
      if (categoryLogoFile) {
        formData.append("categoryLogo", categoryLogoFile);
      }
      
      const res = await fetch("/api/admin/practice-exams", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create exam");
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      setSuccess("Practice exam created successfully!");
      setTimeout(() => {
        router.push(`/admin/practice-exams/${data.id}/edit`);
      }, 1500);
    } catch (err) {
      setError("Failed to create exam");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Create Practice Exam</h1>
              <p className="text-gray-600 mt-2">Design and configure your practice exam with questions and instructions</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={downloadExcelTemplate}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download Template</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'details'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Exam Details</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'questions'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Questions ({questions.length})</span>
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Exam Details Tab */}
          {activeTab === 'details' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Exam Title</label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter exam title..."
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      rows={3}
                      placeholder="Enter exam description..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Instructions</label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      rows={4}
                      placeholder="Enter exam instructions for students..."
                      value={form.instructions}
                      onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                      <input
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="e.g., Science"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Subcategory</label>
                      <input
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="e.g., Physics"
                        value={form.subcategory}
                        onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Logo Uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Category Logo</label>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCategoryLogoChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                        {categoryLogoPreview && (
                          <div className="w-16 h-16 border-2 border-gray-300 rounded-lg overflow-hidden">
                            <img
                              src={categoryLogoPreview}
                              alt="Category logo preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Upload a logo for the category (optional)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Subcategory Logo</label>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                        {logoPreview && (
                          <div className="w-16 h-16 border-2 border-gray-300 rounded-lg overflow-hidden">
                            <img
                              src={logoPreview}
                              alt="Subcategory logo preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Upload a logo for the subcategory (optional)</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                      <input
                        type="datetime-local"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={form.startTime}
                        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                      <input
                        type="datetime-local"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={form.endTime}
                        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (minutes)</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={form.duration}
                        onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                        min={1}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Available Spots</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={form.spots}
                        onChange={(e) => setForm({ ...form, spots: Number(e.target.value) })}
                        min={1}
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">Quick Tips</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Set clear instructions to help students understand the exam format</li>
                      <li>• Choose appropriate duration based on question count</li>
                      <li>• Set end time if you want to limit exam availability</li>
                      <li>• Use descriptive categories for better organization</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Questions Tab */}
          {activeTab === 'questions' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              {/* Question Bank Import Section */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 mb-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Import Questions from Question Bank</h3>
                  <p className="text-gray-600 text-sm">Select a category and import questions directly from your Question Bank</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Questions</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      placeholder="Enter number of questions"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleImportFromQuestionBank}
                      disabled={loadingQuestions || !selectedCategoryId || questionCount < 1}
                      className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingQuestions ? (
                        <>
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span>Import from Question Bank</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Excel Import Section */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Import Questions from Excel</h3>
                    <p className="text-gray-600 text-sm">Upload an Excel file with questions to quickly add multiple questions</p>
                  </div>
                  <div className="flex space-x-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelImport}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Import Excel</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-800">Question {idx + 1}</h4>
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 transition-colors p-2"
                        onClick={() => handleRemoveQuestion(idx)}
                        title="Remove question"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Question Text</label>
                        <textarea
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                          rows={2}
                          placeholder="Enter your question..."
                          value={q.text}
                          onChange={(e) => handleQuestionChange(idx, { text: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx}>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Option {oIdx + 1}
                            </label>
                            <input
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder={`Option ${oIdx + 1}...`}
                              value={opt}
                              onChange={(e) => handleOptionChange(idx, oIdx, e.target.value)}
                              required
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Correct Answer</label>
                        <select
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Marks</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter marks for this question..."
                          value={q.marks}
                          onChange={(e) => handleQuestionChange(idx, { marks: Number(e.target.value) })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {questions.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No questions added yet</h3>
                    <p className="text-gray-500 mb-4">Start by adding questions manually, importing from Question Bank, or importing from Excel</p>
                  </div>
                )}
              </div>
              
              <button
                type="button"
                className="mt-6 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                onClick={handleAddQuestion}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Question</span>
              </button>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700 font-medium">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-700 font-medium">{success}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Ready to Create Exam</h3>
                <p className="text-gray-600 text-sm">
                  {questions.length} questions • {questions.reduce((total, q) => total + q.marks, 0)} total marks • {form.duration} minutes • {form.spots} spots
                </p>
              </div>
              <button
                type="submit"
                disabled={loading || questions.length === 0}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Create Practice Exam</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 