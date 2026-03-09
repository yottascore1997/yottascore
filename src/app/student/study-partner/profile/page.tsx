'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const EXAM_OPTIONS = ['Railway', 'SSC CGL', 'SSC CHSL', 'UPSC', 'Banking', 'Other'];
const LANG_OPTIONS = ['Hindi', 'English', 'Both'];
const STUDY_TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Night'];
const GENDER_OPTIONS = ['Male', 'Female', 'Transgender'];
const CITY_OPTIONS = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Other'];

export default function StudyPartnerProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState('');
  const [examType, setExamType] = useState('');
  const [goals, setGoals] = useState('');
  const [studyTimeFrom, setStudyTimeFrom] = useState('');
  const [studyTimeTo, setStudyTimeTo] = useState('');
  const [studyTimeSlot, setStudyTimeSlot] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [language, setLanguage] = useState('');
  const [city, setCity] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [user, setUser] = useState<{ name?: string; profilePhoto?: string; emailVerified?: boolean } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetch('/api/student/study-partner/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setBio(data.bio || '');
          setExamType(data.examType || '');
          setGoals(data.goals || '');
          setStudyTimeFrom(data.studyTimeFrom || '');
          setStudyTimeTo(data.studyTimeTo || '');
          setStudyTimeSlot(data.studyTimeSlot || '');
          setGender(data.gender || '');
          setDateOfBirth(data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : '');
          setAge(data.age ?? null);
          setLanguage(data.language || '');
          setCity(data.city || '');
          setSubjects(Array.isArray(data.subjects) ? data.subjects : []);
          setPhotos(Array.isArray(data.photos) ? data.photos : []);
          setIsActive(data.isActive !== false);
          setUser(data.user || null);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const uploadPhoto = async (file: File): Promise<string> => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Upload-Token': token,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to upload photo' }));
      throw new Error(err.error || 'Failed to upload photo');
    }
    const data = await res.json();
    return data.url as string;
  };

  const handleSelectFile = (index: number) => {
    setUploadingIndex(index);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadingIndex === null) return;
    try {
      const url = await uploadPhoto(file);
      setPhotos((prev) => {
        const copy = [...prev];
        copy[uploadingIndex] = url;
        return copy.slice(0, 4);
      });
    } catch (err) {
      alert((err as Error).message || 'Failed to upload photo');
    } finally {
      setUploadingIndex(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (photos.length === 0) {
      alert('Please upload at least 1 photo for Study Partner discovery.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch('/api/student/study-partner/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bio,
          examType: examType || undefined,
          goals: goals || undefined,
          studyTimeFrom: studyTimeFrom || undefined,
          studyTimeTo: studyTimeTo || undefined,
          studyTimeSlot: studyTimeSlot || undefined,
          gender: gender || undefined,
          dateOfBirth: dateOfBirth || undefined,
          language: language || undefined,
          city: city || undefined,
          subjects: subjects.length ? subjects : undefined,
          photos,
          isActive,
        }),
      });
      if (res.ok) router.push('/student/study-partner');
      else alert('Failed to save');
    } catch (_) {
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 pb-8">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/student/study-partner" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Study Partner Profile</h1>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-medium text-gray-800 mb-2 text-center">
          Study Partner Photos
        </h2>
        <p className="text-xs text-gray-500 mb-3 text-center">
          Max 4 photos. Kam se kam 1 photo zaroor upload karein. Ye Discover cards par dikhengi.
        </p>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {Array.from({ length: 4 }).map((_, idx) => {
            const url = photos[idx];
            return (
              <div
                key={idx}
                className="relative w-full pt-[100%] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
              >
                {url ? (
                  <>
                    <img
                      src={url}
                      alt={`Photo ${idx + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSelectFile(idx)}
                    className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 hover:bg-gray-200"
                  >
                    + Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Profile summary - show saved data */}
      {(age !== null || gender || studyTimeSlot || examType || language || city) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">Your profile</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {user?.name && <span className="px-2 py-1 bg-white rounded-md">{user.name}</span>}
            {age !== null && <span className="px-2 py-1 bg-white rounded-md">{age} yrs</span>}
            {gender && <span className="px-2 py-1 bg-white rounded-md">{gender}</span>}
            {city && <span className="px-2 py-1 bg-white rounded-md">{city}</span>}
            {studyTimeSlot && <span className="px-2 py-1 bg-white rounded-md">{studyTimeSlot}</span>}
            {examType && <span className="px-2 py-1 bg-white rounded-md">{examType}</span>}
            {language && <span className="px-2 py-1 bg-white rounded-md">{language}</span>}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Short intro: what you're preparing for, how you like to study..."
            rows={3}
            className="w-full rounded-lg border-gray-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam / Goal</label>
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="">Select</option>
            {EXAM_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Goals (optional)</label>
          <Input
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="e.g. Clear Railway in 6 months"
            className="rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Study time (preferred slot)</label>
          <select
            value={studyTimeSlot}
            onChange={(e) => setStudyTimeSlot(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="">Select</option>
            {STUDY_TIME_SLOTS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="">Select</option>
            {GENDER_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
          <Input
            type="date"
            value={dateOfBirth}
            onChange={(e) => {
              setDateOfBirth(e.target.value);
              if (e.target.value) {
                const dob = new Date(e.target.value);
                const today = new Date();
                let a = today.getFullYear() - dob.getFullYear();
                const m = today.getMonth() - dob.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) a--;
                setAge(a >= 0 ? a : null);
              } else setAge(null);
            }}
            className="rounded-lg"
          />
          {age !== null && <p className="text-xs text-gray-500 mt-1">Age: {age} years</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Study time from</label>
            <Input
              type="time"
              value={studyTimeFrom}
              onChange={(e) => setStudyTimeFrom(e.target.value)}
              className="rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Study time to</label>
            <Input
              type="time"
              value={studyTimeTo}
              onChange={(e) => setStudyTimeTo(e.target.value)}
              className="rounded-lg"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="">Select</option>
            {LANG_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="">Select city</option>
            {CITY_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="active" className="text-sm text-gray-700">Show me in discovery</label>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => router.push('/student/study-partner')}>
          Cancel
        </Button>
        <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
