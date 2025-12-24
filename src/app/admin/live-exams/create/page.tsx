'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import * as XLSX from 'xlsx';
import { 
  Clock, 
  Users, 
  DollarSign, 
  Calendar, 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Trophy,
  Target,
  Zap,
  BookOpen,
  GraduationCap,
  Tag,
  Upload,
  Download,
  FileSpreadsheet
} from 'lucide-react';

interface Question {
  question: string;
  type: "MCQ" | "TRUE_FALSE";
  options: string[];
  correctAnswer: number;
}

// Predefined categories
const CATEGORIES = [
  // Academic Subjects
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Hindi',
  'History',
  'Geography',
  'Economics',
  'Computer Science',
  'General Knowledge',
  'Reasoning',
  'Current Affairs',
  'Literature',
  'Science',
  
  // Competitive Exams
  'JEE Main',
  'JEE Advanced',
  'NEET',
  'UPSC',
  'Banking',
  'SSC',
  'CAT',
  'GATE',
  'CLAT',
  'AIIMS',
  'BITSAT',
  'VITEEE',
  'COMEDK',
  
  // School Levels
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
  
  // Exam Types
  'Practice Test',
  'Mock Exam',
  'Competitive Exam',
  'Quiz Competition',
  'Olympiad',
  'Scholarship Test',
  'Entrance Exam',
  'Assessment Test',
  'Daily Quiz',
  'Weekly Test',
  'Monthly Assessment',
  
  // Other Categories
  'Aptitude',
  'Logical Reasoning',
  'Verbal Ability',
  'Quantitative Aptitude',
  'Data Interpretation',
  'Programming',
  'Digital Marketing',
  'Finance',
  'Business',
  'Other'
];

export default function CreateLiveExam() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    category: '',
    imageUrl: '',
    duration: 0,
    spots: 0,
    entryFee: 0,
    startTime: new Date(),
    endTime: new Date(),
    questions: [] as Question[],
  });

  // Bulk import states
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [importedQuestions, setImportedQuestions] = useState<Question[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Question Bank import states
  const [categories, setCategories] = useState<Array<{ id: string; name: string; _count: { questions: number } }>>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageUploading, setImageUploading] = useState(false);

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
      setImportError("Please select a category");
      return;
    }

    if (questionCount < 1 || questionCount > 100) {
      setImportError("Please enter a valid number of questions (1-100)");
      return;
    }

    setLoadingQuestions(true);
    setImportError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setImportError("Not authenticated");
        return;
      }

      // Fetch questions from question bank
      const res = await fetch(`/api/admin/question-bank?categoryId=${selectedCategoryId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        setImportError("Failed to fetch questions from question bank");
        return;
      }

      const questionBankItems = await res.json();

      if (questionBankItems.length === 0) {
        setImportError("No questions found in the selected category");
        return;
      }

      // Shuffle and select random questions
      const shuffled = [...questionBankItems].sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, Math.min(questionCount, questionBankItems.length));

      // Convert QuestionBankItem format to Live Exam Question format
      const convertedQuestions: Question[] = selectedQuestions.map((q: any) => {
        const options = Array.isArray(q.options) ? q.options : [];
        // Ensure we have at least 2 options, pad with empty strings if needed
        const paddedOptions = [...options];
        while (paddedOptions.length < 4) {
          paddedOptions.push('');
        }
        
        return {
          question: q.text || "",
          type: "MCQ" as "MCQ" | "TRUE_FALSE", // Question Bank items are always MCQ
          options: paddedOptions.slice(0, 4).filter(opt => opt !== ''), // Remove empty options
          correctAnswer: q.correct !== undefined && q.correct !== null ? q.correct : 0
        };
      }).filter(q => q.options.length >= 2); // Only keep questions with at least 2 options

      if (convertedQuestions.length === 0) {
        setImportError("No valid questions could be converted. Please check the question format.");
        return;
      }

      // Ask user if they want to append or replace
      const shouldAppend = formData.questions.length > 0 && 
        window.confirm(`You have ${formData.questions.length} existing question(s). Do you want to add these ${convertedQuestions.length} questions from Question Bank? (Click OK to append, Cancel to replace)`);
      
      if (shouldAppend) {
        setFormData(prev => ({
          ...prev,
          questions: [...prev.questions, ...convertedQuestions]
        }));
        setImportError(null);
        alert(`Successfully added ${convertedQuestions.length} questions from Question Bank! Total: ${formData.questions.length + convertedQuestions.length}`);
      } else {
        setFormData(prev => ({
          ...prev,
          questions: convertedQuestions
        }));
        setImportError(null);
        alert(`Successfully imported ${convertedQuestions.length} questions from Question Bank!`);
      }
    } catch (err: any) {
      setImportError(err.message || "Failed to import questions from Question Bank");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!formData.category) {
      alert('Please select a category');
      setLoading(false);
      return;
    }

    try {
      const requestData = {
        ...formData,
        startTime: formData.startTime.toISOString(),
        endTime: formData.endTime.toISOString(),
      };
      
      console.log('🚀 Sending live exam data:', {
        title: requestData.title,
        imageUrl: requestData.imageUrl,
        hasImageUrl: !!requestData.imageUrl,
        formDataImageUrl: formData.imageUrl
      });
      
      const response = await fetch('/api/admin/live-exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create live exam');
      }

      router.push('/admin/dashboard');
    } catch (error) {
      console.error('Error creating live exam:', error);
      alert(error instanceof Error ? error.message : 'Failed to create live exam');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const handleCategoryChange = (category: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: value,
    }));
  };

  const [newQuestion, setNewQuestion] = useState({
    question: '',
    type: 'MCQ' as "MCQ" | "TRUE_FALSE",
    options: ['', '', '', ''],
    correctAnswer: 0,
  });

  // Update options when question type changes
  const handleQuestionTypeChange = (type: "MCQ" | "TRUE_FALSE") => {
    setNewQuestion(prev => ({
      ...prev,
      type,
      options: type === "TRUE_FALSE" ? ["True", "False"] : ['', '', '', ''],
      correctAnswer: 0
    }));
  };

  const handleAddQuestion = () => {
    if (!newQuestion.question || newQuestion.options.some(opt => !opt)) {
      alert('Please fill in all question fields');
      return;
    }

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { ...newQuestion }],
    }));

    setNewQuestion({
      question: '',
      type: 'MCQ' as "MCQ" | "TRUE_FALSE",
      options: ['', '', '', ''],
      correctAnswer: 0,
    });
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  // Bulk import functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel' ||
          file.name.endsWith('.xlsx') || 
          file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setImportError(null);
        parseExcelFile(file);
      } else {
        setImportError('Please select a valid Excel file (.xlsx or .xls)');
        setSelectedFile(null);
      }
    }
  };

  const parseExcelFile = (file: File) => {
    setImportLoading(true);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const importedQuestions: Question[] = [];
        
        // Skip header row and process data
        // Expected format: Question, Type (MCQ/TRUE_FALSE), Option1, Option2, Option3, Option4, CorrectAnswer (0-3)
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (row && row.length >= 6) {
            const questionText = row[0]?.toString().trim() || '';
            const questionType = (row[1]?.toString().trim().toUpperCase() === 'TRUE_FALSE') ? 'TRUE_FALSE' : 'MCQ';
            const option1 = row[2]?.toString().trim() || '';
            const option2 = row[3]?.toString().trim() || '';
            const option3 = row[4]?.toString().trim() || '';
            const option4 = row[5]?.toString().trim() || '';
            const correctAnswer = row[6] !== undefined ? parseInt(row[6].toString()) : 0;

            // Validate required fields
            if (!questionText) {
              continue; // Skip empty questions
            }

            // For MCQ, ensure we have at least 2 options
            if (questionType === 'MCQ' && (!option1 || !option2)) {
              continue; // Skip invalid MCQ questions
            }

            // For TRUE_FALSE, set standard options
            const options = questionType === 'TRUE_FALSE' 
              ? ['True', 'False']
              : [option1, option2, option3, option4].filter(opt => opt); // Filter out empty options

            if (options.length < 2) {
              continue; // Skip questions with less than 2 options
            }

            // Validate correct answer index
            const validCorrectAnswer = Math.max(0, Math.min(correctAnswer, options.length - 1));

            const question: Question = {
              question: questionText,
              type: questionType as "MCQ" | "TRUE_FALSE",
              options: options,
              correctAnswer: validCorrectAnswer
            };

            importedQuestions.push(question);
          }
        }

        if (importedQuestions.length > 0) {
          setImportedQuestions(importedQuestions);
          setImportError(null);
        } else {
          setImportError('No valid questions found in the Excel file. Please check the format.');
          setImportedQuestions([]);
        }
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        setImportError('Error reading Excel file. Please check the format and try again.');
        setImportedQuestions([]);
      } finally {
        setImportLoading(false);
      }
    };

    reader.onerror = () => {
      setImportError('Failed to read the file. Please try again.');
      setImportLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const addImportedQuestions = () => {
    if (importedQuestions.length > 0) {
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, ...importedQuestions]
      }));
      setImportedQuestions([]);
      setSelectedFile(null);
      setShowBulkImport(false);
      setImportError(null);
    }
  };

  const downloadTemplate = () => {
    // Create Excel template with sample data
    const templateData = [
      ['Question', 'Type', 'Option1', 'Option2', 'Option3', 'Option4', 'CorrectAnswer'],
      ['What is 2 + 2?', 'MCQ', '3', '4', '5', '6', '1'],
      ['The capital of India is New Delhi.', 'TRUE_FALSE', 'True', 'False', '', '', '0'],
      ['Which is the largest planet?', 'MCQ', 'Earth', 'Mars', 'Jupiter', 'Saturn', '2'],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 50 }, // Question
      { wch: 12 }, // Type
      { wch: 20 }, // Option1
      { wch: 20 }, // Option2
      { wch: 20 }, // Option3
      { wch: 20 }, // Option4
      { wch: 15 }, // CorrectAnswer
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');

    // Convert to Excel file and download
    XLSX.writeFile(workbook, 'live_exam_question_template.xlsx');
  };

  // Image upload handler
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setImageUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Upload-Token': token
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📸 Image upload successful:', {
          url: data.url,
          fileName: file.name,
          fileSize: file.size
        });
        
        if (!data.url || data.url.includes('localhost') || data.url.includes('yourdomain.com')) {
          console.error('⚠️ Invalid URL returned:', data.url);
          throw new Error('Received invalid upload URL. Please check server configuration.');
        }
        
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
        setImagePreview(data.url);
        setImageFile(file);
        console.log('✅ FormData updated with imageUrl:', data.url);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Upload error response:', {
          status: response.status,
          error: errorData
        });
        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full -translate-y-36 translate-x-36"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full translate-y-48 -translate-x-48"></div>
        
        <div className="relative z-10 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Navigation */}
            <div className="flex items-center space-x-4 mb-8">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/dashboard')}
                className="rounded-full border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>

            {/* Page Header */}
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Create Live Exam</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Set up an exciting live competition for students with real-time questions and instant rewards
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Category Selection Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <Tag className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Exam Categories</h2>
                  <p className="text-gray-600">Select the category for better organization</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Category</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <BookOpen className="h-5 w-5 text-blue-500" />
                    </div>
                    <select
                      value={formData.category}
                      onChange={(e) => handleCategoryChange('category', e.target.value)}
                      className="w-full pl-12 h-12 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Select Category</option>
                      {CATEGORIES.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Categories Display */}
              {(formData.category) && (
                <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Selected Category:</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.category && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        📚 {formData.category}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Exam Logo Upload Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Exam Logo</h2>
                  <p className="text-gray-600">Upload an image to represent your exam (optional)</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Image Upload Area */}
                <div className="flex items-center justify-center">
                  <div className="w-full max-w-md">
                    {!imagePreview ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors duration-200">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Upload className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Exam Logo</h3>
                        <p className="text-gray-600 mb-4">PNG, JPG, or JPEG up to 5MB</p>
                        <label className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer">
                          <Upload className="w-5 h-5 mr-2" />
                          Choose Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            disabled={imageUploading}
                          />
                        </label>
                        {imageUploading && (
                          <div className="mt-4 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            <span className="ml-2 text-sm text-gray-600">Uploading...</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="w-full h-48 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl overflow-hidden border-2 border-gray-200">
                          <img
                            src={imagePreview}
                            alt="Exam logo preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <div className="mt-3 text-center">
                          <p className="text-sm text-gray-600">Image uploaded successfully</p>
                          <button
                            type="button"
                            onClick={() => {
                              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                              fileInput?.click();
                            }}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Change Image
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Image Guidelines */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Image Guidelines
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Recommended size: 400x400 pixels or larger</li>
                    <li>• Supported formats: PNG, JPG, JPEG</li>
                    <li>• Maximum file size: 5MB</li>
                    <li>• Square images work best for logos</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Basic Information Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
                  <p className="text-gray-600">Set up the exam details and schedule</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Exam Title</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FileText className="h-5 w-5 text-blue-500" />
                      </div>
                      <Input
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="pl-12 h-12 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                        placeholder="Enter exam title"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Description</label>
                    <div className="relative">
                      <div className="absolute top-4 left-4 flex items-center pointer-events-none">
                        <FileText className="h-5 w-5 text-purple-500" />
                      </div>
                      <Textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="pl-12 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl resize-none"
                        placeholder="Describe the exam content and rules..."
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Instructions</label>
                    <div className="relative">
                      <div className="absolute top-4 left-4 flex items-center pointer-events-none">
                        <BookOpen className="h-5 w-5 text-green-500" />
                      </div>
                      <Textarea
                        name="instructions"
                        value={formData.instructions}
                        onChange={handleChange}
                        rows={4}
                        className="pl-12 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 focus:border-green-500 focus:ring-green-500 rounded-xl resize-none"
                        placeholder="Enter detailed instructions for students (e.g., exam rules, time limits, scoring criteria, etc.)..."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Duration (min)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Clock className="h-5 w-5 text-green-500" />
                        </div>
                        <Input
                          type="number"
                          name="duration"
                          value={formData.duration}
                          onChange={handleNumberChange}
                          min="1"
                          className="pl-12 h-12 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 focus:border-green-500 focus:ring-green-500 rounded-xl"
                          placeholder="30"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Total Spots</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Users className="h-5 w-5 text-orange-500" />
                        </div>
                        <Input
                          type="number"
                          name="spots"
                          value={formData.spots}
                          onChange={handleNumberChange}
                          min="1"
                          className="pl-12 h-12 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl"
                          placeholder="100"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Entry Fee (₹)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <DollarSign className="h-5 w-5 text-yellow-500" />
                      </div>
                      <Input
                        type="number"
                        name="entryFee"
                        value={formData.entryFee}
                        onChange={handleNumberChange}
                        min="0"
                        step="0.01"
                        className="pl-12 h-12 bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 focus:border-yellow-500 focus:ring-yellow-500 rounded-xl"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Start Time</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="pl-12">
                          <DateTimePicker
                            value={formData.startTime}
                            onChange={(date) => setFormData(prev => ({ ...prev, startTime: date || new Date() }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">End Time</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-purple-500" />
                        </div>
                        <div className="pl-12">
                          <DateTimePicker
                            value={formData.endTime}
                            onChange={(date) => setFormData(prev => ({ ...prev, endTime: date || new Date() }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Questions Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Exam Questions</h2>
                    <p className="text-gray-600">Add MCQ and True/False questions for the live exam</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">
                    {formData.questions.length} Questions Added
                  </span>
                </div>
              </div>

              {/* Question Bank Import Section */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-purple-200">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-2">
                    <BookOpen className="w-5 h-5 mr-2 text-purple-500" />
                    Import from Question Bank
                  </h3>
                  <p className="text-sm text-gray-600">Select a category and import questions directly from your Question Bank</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      placeholder="Enter number of questions"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={handleImportFromQuestionBank}
                      disabled={loadingQuestions || !selectedCategoryId || questionCount < 1}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingQuestions ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          <span>Import from Question Bank</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                {importError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-sm">{importError}</p>
                  </div>
                )}
              </div>

              {/* Bulk Import Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-8 border border-green-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileSpreadsheet className="w-5 h-5 mr-2 text-green-500" />
                    Bulk Import from Excel
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBulkImport(!showBulkImport)}
                    className="rounded-xl border-green-300 hover:border-green-500 hover:bg-green-50 text-green-700 transition-all duration-200"
                  >
                    {showBulkImport ? 'Hide Import' : 'Show Import'}
                  </Button>
                </div>

                {showBulkImport && (
                  <div className="space-y-6">
                    {/* Template Download */}
                    <div className="bg-white rounded-xl p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Download Template</h4>
                          <p className="text-sm text-gray-600">Download the Excel template to format your questions correctly</p>
                        </div>
                        <Button
                          type="button"
                          onClick={downloadTemplate}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Template
                        </Button>
                      </div>
                    </div>

                    {/* File Upload */}
                    <div className="bg-white rounded-xl p-4 border border-green-200">
                      <h4 className="font-semibold text-gray-900 mb-4">Upload Excel File</h4>
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-green-300 rounded-xl p-6 text-center hover:border-green-400 transition-colors duration-200">
                          <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="excel-upload"
                          />
                          <label htmlFor="excel-upload" className="cursor-pointer">
                            <Upload className="w-12 h-12 text-green-500 mx-auto mb-4" />
                            <p className="text-lg font-semibold text-gray-900 mb-2">
                              {selectedFile ? selectedFile.name : 'Click to upload Excel file'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Supports .xlsx and .xls files
                            </p>
                          </label>
                        </div>

                        {importError && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-red-600 text-sm">{importError}</p>
                          </div>
                        )}

                        {importLoading && (
                          <div className="flex items-center justify-center p-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent mr-3"></div>
                            <span className="text-green-700">Processing Excel file...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Imported Questions Preview */}
                    {importedQuestions.length > 0 && (
                      <div className="bg-white rounded-xl p-4 border border-green-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-900">
                            Preview ({importedQuestions.length} questions)
                          </h4>
                          <Button
                            type="button"
                            onClick={addImportedQuestions}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add All Questions
                          </Button>
                        </div>

                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {importedQuestions.slice(0, 5).map((q, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="font-medium text-gray-900 mb-2">{q.question}</p>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {q.options.map((opt, i) => (
                                  <div
                                    key={i}
                                    className={`p-2 rounded ${
                                      i === q.correctAnswer
                                        ? 'bg-green-100 text-green-700 border border-green-300'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + i)}. {opt}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          {importedQuestions.length > 5 && (
                            <p className="text-sm text-gray-500 text-center">
                              ... and {importedQuestions.length - 5} more questions
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Add New Question */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-blue-500" />
                  Add New Question
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Question Text</label>
                    <Textarea
                      value={newQuestion.question}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                      placeholder="Enter your question here..."
                      rows={3}
                      className="bg-white border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Question Type</label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => handleQuestionTypeChange("MCQ")}
                        className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 border-2 ${
                          newQuestion.type === "MCQ"
                            ? 'bg-blue-100 text-blue-700 border-blue-500'
                            : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center">
                            {newQuestion.type === "MCQ" && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <span>Multiple Choice (MCQ)</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuestionTypeChange("TRUE_FALSE")}
                        className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 border-2 ${
                          newQuestion.type === "TRUE_FALSE"
                            ? 'bg-green-100 text-green-700 border-green-500'
                            : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center">
                            {newQuestion.type === "TRUE_FALSE" && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                          <span>True/False</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      {newQuestion.type === "TRUE_FALSE" ? "Answer" : "Answer Options"}
                    </label>
                    <div className="space-y-3">
                      {newQuestion.type === "TRUE_FALSE" ? (
                        // True/False options
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => setNewQuestion(prev => ({ ...prev, correctAnswer: 0 }))}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                              newQuestion.correctAnswer === 0
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-center space-x-2">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                newQuestion.correctAnswer === 0 
                                  ? 'border-green-500 bg-green-500' 
                                  : 'border-gray-400'
                              }`}>
                                {newQuestion.correctAnswer === 0 && (
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                              </div>
                              <span className="font-medium">True</span>
                              {newQuestion.correctAnswer === 0 && (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              )}
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewQuestion(prev => ({ ...prev, correctAnswer: 1 }))}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                              newQuestion.correctAnswer === 1
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-center space-x-2">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                newQuestion.correctAnswer === 1 
                                  ? 'border-green-500 bg-green-500' 
                                  : 'border-gray-400'
                              }`}>
                                {newQuestion.correctAnswer === 1 && (
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                              </div>
                              <span className="font-medium">False</span>
                              {newQuestion.correctAnswer === 1 && (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              )}
                            </div>
                          </button>
                        </div>
                      ) : (
                        // MCQ options
                        newQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="relative flex-1">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <div className={`w-4 h-4 rounded-full border-2 ${
                                  newQuestion.correctAnswer === index 
                                    ? 'border-green-500 bg-green-500' 
                                    : 'border-gray-300'
                                } flex items-center justify-center`}>
                                  {newQuestion.correctAnswer === index && (
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  )}
                                </div>
                              </div>
                              <Input
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...newQuestion.options];
                                  newOptions[index] = e.target.value;
                                  setNewQuestion(prev => ({ ...prev, options: newOptions }));
                                }}
                                placeholder={`Option ${index + 1}`}
                                className="pl-12 h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setNewQuestion(prev => ({ ...prev, correctAnswer: index }))}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                newQuestion.correctAnswer === index
                                  ? 'bg-green-100 text-green-700 border border-green-300'
                                  : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                              }`}
                            >
                              {newQuestion.correctAnswer === index ? 'Correct' : 'Mark Correct'}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleAddQuestion}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl h-12 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Question
                  </Button>
                </div>
              </div>

              {/* Added Questions */}
              {formData.questions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                    Added Questions ({formData.questions.length})
                  </h3>
                  <div className="space-y-4">
                    {formData.questions.map((q, index) => (
                      <div key={index} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{q.question}</h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  q.type === "TRUE_FALSE" 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {q.type === "TRUE_FALSE" ? "True/False" : "MCQ"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeQuestion(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className={q.type === "TRUE_FALSE" ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 gap-3"}>
                          {q.options.map((opt, i) => (
                            <div
                              key={i}
                              className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                                i === q.correctAnswer
                                  ? 'border-green-300 bg-green-50 text-green-700'
                                  : 'border-gray-200 bg-gray-50 text-gray-600'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                  i === q.correctAnswer 
                                    ? 'border-green-500 bg-green-500' 
                                    : 'border-gray-400'
                                }`}>
                                  {i === q.correctAnswer && (
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  )}
                                </div>
                                <span className="text-sm font-medium">{opt}</span>
                                {i === q.correctAnswer && (
                                  <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/dashboard')}
                disabled={loading}
                className="px-8 py-3 rounded-xl border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 h-12"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || formData.questions.length === 0}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Creating Exam...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Trophy className="w-5 h-5 mr-2" />
                    Create Live Exam
                  </div>
                )}
              </Button>
            </div>

            {/* Validation Message */}
            {formData.questions.length === 0 && (
              <div className="flex items-center justify-center space-x-2 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-700 font-medium">
                  Please add at least one question to create the exam
                </span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
} 