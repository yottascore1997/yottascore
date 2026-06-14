'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Camera,
  Sparkles,
  BookOpen,
  Clock,
  MapPin,
  Languages,
  Target,
  User,
  Eye,
  BadgeCheck,
  ImagePlus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const EXAM_OPTIONS = ['Railway', 'SSC CGL', 'SSC CHSL', 'UPSC', 'Banking', 'Other'];
const LANG_OPTIONS = ['Hindi', 'English', 'Both'];
const STUDY_TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Night'];
const GENDER_OPTIONS = ['Male', 'Female', 'Transgender'];
const CITY_OPTIONS = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Other',
];

function profileCompletionPercent(state: {
  photos: string[];
  bio: string;
  examType: string;
  studyTimeSlot: string;
  gender: string;
  city: string;
  language: string;
  dateOfBirth: string;
}): number {
  let score = 0;
  if (state.photos.length > 0) score += 30;
  if (state.bio.trim().length >= 20) score += 15;
  else if (state.bio.trim()) score += 8;
  if (state.examType) score += 15;
  if (state.studyTimeSlot) score += 10;
  if (state.gender) score += 10;
  if (state.city) score += 10;
  if (state.language) score += 10;
  if (state.dateOfBirth) score += 10;
  return Math.min(100, score);
}

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">{children}</label>;
}

const selectClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100';

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
  const [user, setUser] = useState<{
    name?: string;
    profilePhoto?: string;
    emailVerified?: boolean;
  } | null>(null);

  const completion = useMemo(
    () =>
      profileCompletionPercent({
        photos,
        bio,
        examType,
        studyTimeSlot,
        gender,
        city,
        language,
        dateOfBirth,
      }),
    [photos, bio, examType, studyTimeSlot, gender, city, language, dateOfBirth]
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetch('/api/student/study-partner/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
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
    if (!token) throw new Error('No authentication token found');

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
      if (fileInputRef.current) fileInputRef.current.value = '';
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
    } catch {
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-50">
        <div className="mx-auto max-w-lg animate-pulse space-y-4 p-4 pt-6">
          <div className="h-32 rounded-2xl bg-white/80" />
          <div className="h-48 rounded-2xl bg-white/80" />
          <div className="h-64 rounded-2xl bg-white/80" />
        </div>
      </div>
    );
  }

  const displayPhoto = photos[0] || user?.profilePhoto;
  const completionLabel =
    completion >= 80 ? 'Looking great' : completion >= 50 ? 'Almost there' : 'Keep going';

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100/60 via-white to-slate-50 pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-3">
          <Link
            href="/student/study-partner"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">Study Partner</p>
            <h1 className="text-lg font-bold text-gray-900">My Profile</h1>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        {/* Hero */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-5 text-white shadow-lg shadow-indigo-200/50">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-white/40 bg-white/20 shadow-inner">
                {displayPhoto ? (
                  <img src={displayPhoto} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="h-10 w-10 text-white/70" />
                  </div>
                )}
              </div>
              {user?.emailVerified && (
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                  <BadgeCheck className="h-3.5 w-3.5 text-white" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-bold">{user?.name || 'Your profile'}</p>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-indigo-100">
                <Sparkles className="h-3.5 w-3.5" />
                {completionLabel}
              </p>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-indigo-100">
                  <span>Profile strength</span>
                  <span className="font-semibold text-white">{completion}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/25">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {(age !== null || gender || city || examType) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {age !== null && (
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
                  {age} yrs
                </span>
              )}
              {gender && (
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
                  {gender}
                </span>
              )}
              {city && (
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
                  {city}
                </span>
              )}
              {examType && (
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
                  {examType}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Photos */}
        <SectionCard
          title="Discovery photos"
          subtitle="Min 1, max 4. Pehli photo sabse pehle dikhegi."
          icon={Camera}
        >
          <div className="mb-3 grid grid-cols-2 gap-3">
            {[0, 1].map((idx) => {
              const url = photos[idx];
              const isUploading = uploadingIndex === idx;
              return (
                <div
                  key={idx}
                  className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition ${
                    idx === 0 ? 'col-span-2 aspect-[2/1]' : 'aspect-square'
                  } ${url ? 'border-transparent' : 'border-gray-200 bg-gray-50'}`}
                >
                  {url ? (
                    <>
                      <img src={url} alt={`Photo ${idx + 1}`} className="h-full w-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute left-2 top-2 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                          Main photo
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/70"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectFile(idx)}
                      disabled={isUploading}
                      className="flex h-full w-full flex-col items-center justify-center gap-1 text-gray-500 hover:bg-indigo-50/50 hover:text-indigo-600"
                    >
                      {isUploading ? (
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      ) : (
                        <>
                          <ImagePlus className="h-7 w-7" />
                          <span className="text-xs font-medium">{idx === 0 ? 'Add main photo' : 'Add photo'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[2, 3].map((idx) => {
              const url = photos[idx];
              const isUploading = uploadingIndex === idx;
              return (
                <div
                  key={idx}
                  className={`relative aspect-square overflow-hidden rounded-xl border-2 border-dashed ${
                    url ? 'border-transparent' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {url ? (
                    <>
                      <img src={url} alt={`Photo ${idx + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectFile(idx)}
                      disabled={isUploading}
                      className="flex h-full w-full flex-col items-center justify-center text-gray-400 hover:text-indigo-600"
                    >
                      {isUploading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      ) : (
                        <ImagePlus className="h-6 w-6" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </SectionCard>

        {/* About */}
        <SectionCard title="About you" subtitle="Short intro jo Discover par dikhega" icon={BookOpen}>
          <FieldLabel>Bio</FieldLabel>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Kis exam ki tayyari? Kaise padhte ho? Partner me kya dhundhte ho?"
            rows={4}
            maxLength={300}
            className="min-h-[100px] resize-none rounded-xl border-gray-200 bg-gray-50/80 focus:bg-white"
          />
          <p className="mt-1.5 text-right text-xs text-gray-400">{bio.length}/300</p>
        </SectionCard>

        {/* Study */}
        <SectionCard title="Study goals" subtitle="Partner ko tumhari prep samajh aaye" icon={Target}>
          <div className="space-y-4">
            <div>
              <FieldLabel>Exam / goal</FieldLabel>
              <select value={examType} onChange={(e) => setExamType(e.target.value)} className={selectClass}>
                <option value="">Select exam</option>
                {EXAM_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Goals (optional)</FieldLabel>
              <Input
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="e.g. Railway clear in 6 months"
                className="rounded-xl border-gray-200 bg-gray-50/80 focus:bg-white"
              />
            </div>
          </div>
        </SectionCard>

        {/* Schedule */}
        <SectionCard title="Study schedule" subtitle="Kab padhai karte ho" icon={Clock}>
          <div className="space-y-4">
            <div>
              <FieldLabel>Preferred slot</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {STUDY_TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setStudyTimeSlot(studyTimeSlot === slot ? '' : slot)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      studyTimeSlot === slot
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100'
                        : 'border-gray-200 bg-gray-50/80 text-gray-600 hover:border-indigo-200'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>From</FieldLabel>
                <Input
                  type="time"
                  value={studyTimeFrom}
                  onChange={(e) => setStudyTimeFrom(e.target.value)}
                  className="rounded-xl border-gray-200 bg-gray-50/80"
                />
              </div>
              <div>
                <FieldLabel>To</FieldLabel>
                <Input
                  type="time"
                  value={studyTimeTo}
                  onChange={(e) => setStudyTimeTo(e.target.value)}
                  className="rounded-xl border-gray-200 bg-gray-50/80"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Personal */}
        <SectionCard title="Personal details" icon={User}>
          <div className="space-y-4">
            <div>
              <FieldLabel>Gender</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {GENDER_OPTIONS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(gender === g ? '' : g)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      gender === g
                        ? 'border-indigo-500 bg-indigo-600 text-white'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-indigo-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Date of birth</FieldLabel>
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
                className="rounded-xl border-gray-200 bg-gray-50/80"
              />
              {age !== null && (
                <p className="mt-1.5 text-sm text-indigo-600 font-medium">Age: {age} years</p>
              )}
            </div>
            <div>
              <FieldLabel>Language</FieldLabel>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className={selectClass}>
                <option value="">Select language</option>
                {LANG_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>City</FieldLabel>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={`${selectClass} pl-9`}
                >
                  <option value="">Select city</option>
                  {CITY_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Visibility */}
        <SectionCard title="Discovery visibility" subtitle="Band karo to Discover me nahi dikhenge" icon={Eye}>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 transition ${
              isActive
                ? 'border-emerald-200 bg-emerald-50/80'
                : 'border-gray-200 bg-gray-50/80'
            }`}
          >
            <div className="flex items-center gap-3 text-left">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'
                }`}
              >
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Show me in discovery</p>
                <p className="text-xs text-gray-500">
                  {isActive ? 'Visible to other students' : 'Hidden from swipe feed'}
                </p>
              </div>
            </div>
            <div
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                isActive ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                  isActive ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </div>
          </button>
        </SectionCard>
      </div>

      {/* Sticky save */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200/80 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-xl border-gray-300 py-6"
            onClick={() => router.push('/student/study-partner')}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-6 font-semibold shadow-lg shadow-indigo-200/60 hover:from-indigo-700 hover:to-violet-700"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save profile
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
