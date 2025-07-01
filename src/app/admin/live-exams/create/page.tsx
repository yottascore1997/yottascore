'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/date-time-picker';
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

  // Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageUploading, setImageUploading] = useState(false);

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
      const response = await fetch('/api/admin/live-exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          startTime: formData.startTime.toISOString(),
          endTime: formData.endTime.toISOString(),
        }),
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
    options: ['', '', '', ''],
    correctAnswer: 0,
  });

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

  const parseExcelFile = async (file: File) => {
    setImportLoading(true);
    setImportError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/question-bank/bulk-import', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to parse Excel file');
      }

      const data = await response.json();
      
      if (data.questions && data.questions.length > 0) {
        setImportedQuestions(data.questions);
      } else {
        setImportError('No valid questions found in the Excel file');
      }
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      setImportError(error instanceof Error ? error.message : 'Failed to parse Excel file');
    } finally {
      setImportLoading(false);
    }
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
    const csvContent = 'question,option1,option2,option3,option4,correctAnswer\nSample Question,Option A,Option B,Option C,Option D,0';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
        setImagePreview(data.url);
        setImageFile(file);
      } else {
        throw new Error('Failed to upload image');
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
                            onChange={(date) => setFormData(prev => ({ ...prev, startTime: date }))}
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
                            onChange={(date) => setFormData(prev => ({ ...prev, endTime: date }))}
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
                    <p className="text-gray-600">Add multiple choice questions for the live exam</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">
                    {formData.questions.length} Questions Added
                  </span>
                </div>
              </div>

              {/* Bulk Import Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-8 border border-green-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileSpreadsheet className="w-5 h-5 mr-2 text-green-500" />
                    Bulk Import Questions
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
                    <label className="block text-sm font-semibold text-gray-700 mb-4">Answer Options</label>
                    <div className="space-y-3">
                      {newQuestion.options.map((option, index) => (
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
                      ))}
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
                            <h4 className="font-semibold text-gray-900">{q.question}</h4>
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
                        <div className="grid grid-cols-2 gap-3">
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