'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/date-time-picker';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

export default function CreateLiveExam() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 0,
    spots: 0,
    entryFee: 0,
    startTime: new Date(),
    endTime: new Date(),
    questions: [] as Question[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create Live Exam</h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2">Title</label>
            <Input
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block mb-2">Duration (minutes)</label>
            <Input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleNumberChange}
              min="1"
              required
            />
          </div>

          <div>
            <label className="block mb-2">Total Spots</label>
            <Input
              type="number"
              name="spots"
              value={formData.spots}
              onChange={handleNumberChange}
              min="1"
              required
            />
          </div>

          <div>
            <label className="block mb-2">Entry Fee (₹)</label>
            <Input
              type="number"
              name="entryFee"
              value={formData.entryFee}
              onChange={handleNumberChange}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block mb-2">Start Time</label>
            <DateTimePicker
              value={formData.startTime}
              onChange={(date) => setFormData(prev => ({ ...prev, startTime: date }))}
            />
          </div>

          <div>
            <label className="block mb-2">End Time</label>
            <DateTimePicker
              value={formData.endTime}
              onChange={(date) => setFormData(prev => ({ ...prev, endTime: date }))}
            />
          </div>
        </div>

        <div>
          <label className="block mb-2">Description</label>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            required
          />
        </div>

        <div className="border p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Add Questions</h2>
          
          <div className="space-y-4 mb-4">
            <div>
              <label className="block mb-2">Question</label>
              <Input
                value={newQuestion.question}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Enter question"
              />
            </div>

            <div className="space-y-2">
              <label className="block mb-2">Options</label>
              {newQuestion.options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...newQuestion.options];
                      newOptions[index] = e.target.value;
                      setNewQuestion(prev => ({ ...prev, options: newOptions }));
                    }}
                    placeholder={`Option ${index + 1}`}
                  />
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={newQuestion.correctAnswer === index}
                    onChange={() => setNewQuestion(prev => ({ ...prev, correctAnswer: index }))}
                  />
                </div>
              ))}
            </div>

            <Button type="button" onClick={handleAddQuestion}>
              Add Question
            </Button>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Added Questions ({formData.questions.length})</h3>
            {formData.questions.map((q, index) => (
              <div key={index} className="border p-2 rounded mb-2">
                <p className="font-medium">{q.question}</p>
                <ul className="ml-4">
                  {q.options.map((opt, i) => (
                    <li key={i} className={i === q.correctAnswer ? 'text-green-600' : ''}>
                      {opt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/dashboard')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || formData.questions.length === 0}>
            {loading ? 'Creating...' : 'Create Exam'}
          </Button>
        </div>
      </form>
    </div>
  );
} 