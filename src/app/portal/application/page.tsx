'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { TRACKS, getTrackLabel } from '@/lib/tracks';
import type { 
  Application, 
  ApplicationQuestions, 
  QuestionField, 
  ApplicationTrack,
  PortalDashboard 
} from '@/types/recruitment';

const AUTOSAVE_DELAY = 1500; // 1.5 seconds after typing stops

export default function ApplicationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<PortalDashboard | null>(null);
  const [questions, setQuestions] = useState<QuestionField[]>([]);
  const [track, setTrack] = useState<ApplicationTrack | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingAnswersRef = useRef<Record<string, any>>({});
  const pendingFilesRef = useRef<Record<string, string>>({});
  const hasChangesRef = useRef(false);

  // Keep ref in sync for beforeunload handler
  useEffect(() => {
    hasChangesRef.current = hasChanges;
  }, [hasChanges]);

  useEffect(() => {
    loadData();
    
    // Warn user before leaving with unsaved changes
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChangesRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []); // Empty dependency array - only run on mount

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/portal/dashboard');
      if (!res.ok) throw new Error('Failed to load');
      const data: PortalDashboard = await res.json();
      setDashboard(data);
      
      if (data.application) {
        setTrack(data.application.track);
        setAnswers(data.application.answers || {});
        setFiles(data.application.files || {});
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async (selectedTrack: ApplicationTrack) => {
    if (!dashboard?.activeCycle) return;
    
    try {
      // For now we'll use a simpler approach - questions will be loaded per track
      // This would typically come from the API
      const res = await fetch(`/api/portal/questions?cycleId=${dashboard.activeCycle._id}&track=${selectedTrack}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.fields || []);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  useEffect(() => {
    if (track) {
      loadQuestions(track);
    }
  }, [track, dashboard]);

  // Keep refs in sync with state for autosave
  useEffect(() => {
    pendingAnswersRef.current = answers;
    pendingFilesRef.current = files;
  }, [answers, files]);

  const handleAnswerChange = (key: string, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setIsTyping(true);
    setSaveError(null);
    
    // Clear typing indicator after brief delay
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 500);
    
    // Schedule autosave after typing stops
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(() => {
      performAutosave();
    }, AUTOSAVE_DELAY);
  };

  // Immediate save on blur (when user clicks away from field)
  const handleFieldBlur = () => {
    if (hasChanges && !saving) {
      // Clear pending autosave and save immediately
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      performAutosave();
    }
  };

  const performAutosave = async () => {
    if (!track || !dashboard?.activeCycle) return;
    
    // Use refs to get latest values
    const currentAnswers = pendingAnswersRef.current;
    const currentFiles = pendingFilesRef.current;
    
    try {
      setSaving(true);
      setIsTyping(false);
      setSaveError(null);
      
      // Use PUT to update existing application draft
      const res = await fetch('/api/portal/application', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleId: dashboard.activeCycle._id,
          track,
          answers: currentAnswers,
          files: currentFiles,
        }),
      });
      
      if (res.ok) {
        setLastSaved(new Date());
        setHasChanges(false);
      } else {
        const error = await res.json();
        setSaveError(error.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Autosave error:', error);
      setSaveError('Connection error - will retry');
      // Retry after 5 seconds on network error
      autosaveTimerRef.current = setTimeout(() => {
        performAutosave();
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  // Legacy handler for manual save button
  const handleAutosave = useCallback(async () => {
    await performAutosave();
  }, [track, dashboard]);

  const handleSubmit = async () => {
    if (!track || !dashboard?.activeCycle) return;
    
    // Validate required fields - check both answers and files based on field type
    const missingFields = questions
      .filter(q => {
        if (!q.required) return false;
        // For file fields, check the files object
        if (q.type === 'file') {
          return !files[q.key];
        }
        // For all other fields, check answers
        return !answers[q.key];
      })
      .map(q => q.label);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }
    
    // Validate word limits
    const overLimitFields = questions
      .filter(q => {
        if (!q.wordLimit) return false;
        const value = answers[q.key] || '';
        const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
        return wordCount > q.wordLimit;
      })
      .map(q => q.label);
    
    if (overLimitFields.length > 0) {
      toast.error(`Word limit exceeded for: ${overLimitFields.join(', ')}`);
      return;
    }
    
    if (!confirm('Are you sure you want to submit? You cannot edit after submission.')) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Save first using PUT to update existing draft
      await fetch('/api/portal/application', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleId: dashboard.activeCycle._id,
          track,
          answers,
          files,
        }),
      });
      
      // Then submit
      const res = await fetch('/api/portal/application/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleId: dashboard.activeCycle._id,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit');
      }
      
      toast.success('Application submitted successfully!');
      router.push('/portal');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (key: string, file: File, fileType: string = 'other') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', key);
    formData.append('fileType', fileType);
    
    // Set uploading state for this field
    setUploadingFiles(prev => ({ ...prev, [key]: true }));
    
    try {
      const res = await fetch('/api/portal/application/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to upload file');
      }
      
      const data = await res.json();
      
      // Update ref FIRST before state, so autosave has the latest value
      const updatedFiles = { ...pendingFilesRef.current, [key]: data.url };
      pendingFilesRef.current = updatedFiles;
      
      // Then update state
      setFiles(updatedFiles);
      setHasChanges(true);
      toast.success(`${file.name} uploaded successfully`);
      
      // Trigger autosave after successful upload
      performAutosave();
    } catch (error) {
      console.error('File upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      // Clear uploading state
      setUploadingFiles(prev => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!dashboard?.activeCycle) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-md p-8 text-center">
        <ExclamationCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Active Recruitment</h2>
        <p className="text-gray-600">Applications are not open at this time.</p>
      </div>
    );
  }

  // Check if already submitted
  if (dashboard.application && !['not_started', 'draft'].includes(dashboard.application.stage)) {
    // Build a map of field keys to labels from questions
    const fieldLabels: Record<string, string> = {};
    if (dashboard.questions) {
      for (const questionSet of dashboard.questions) {
        if (questionSet.track === dashboard.application.track || questionSet.track === 'both') {
          for (const field of questionSet.fields || []) {
            fieldLabels[field.key] = field.label;
          }
        }
      }
    }
    
    // Helper to get label for a key
    const getLabel = (key: string) => fieldLabels[key] || key.replace(/_/g, ' ');
    
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Application Submitted</h2>
          </div>
          <p className="text-gray-600">
            Your application was submitted on{' '}
            {new Date(dashboard.application.submittedAt!).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Your Answers</h3>
          <div className="space-y-4">
            {Object.entries(dashboard.application.answers).map(([key, value]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">{getLabel(key)}</p>
                <p className="text-gray-900 whitespace-pre-wrap break-words">
                  {typeof value === 'string' ? value : JSON.stringify(value)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Uploaded Files Section */}
        {dashboard.application.files && Object.keys(dashboard.application.files).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Your Uploaded Files</h3>
            <div className="space-y-4">
              {Object.entries(dashboard.application.files).map(([key, url]) => {
                const fileName = url.split('/').pop() || 'File';
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                const isPdf = /\.pdf$/i.test(url);
                
                return (
                  <div key={key} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-2">{getLabel(key)}</p>
                    
                    {isImage ? (
                      <div className="space-y-2">
                        <img 
                          src={url} 
                          alt={key} 
                          className="max-w-xs max-h-48 rounded-lg border border-gray-200 object-cover"
                        />
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          📷 View full image
                        </a>
                      </div>
                    ) : isPdf ? (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">📄</span>
                        </div>
                        <div>
                          <p className="text-gray-900 text-sm font-medium">{fileName}</p>
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View PDF
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">📎</span>
                        </div>
                        <div>
                          <p className="text-gray-900 text-sm font-medium">{fileName}</p>
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Download file
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Track selection
  if (!track) {
    return (
      <div className="max-w-3xl mx-auto" style={{ color: '#111827' }}>
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#111827' }}>Choose Your Track</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TRACKS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTrack(t.value)}
              className={`bg-white rounded-xl border border-gray-200 shadow-md p-6 text-left ${t.accentColor} hover:shadow-lg transition-all`}
            >
              <div className={`w-12 h-12 ${t.color} rounded-lg flex items-center justify-center mb-4`}>
                <span className="text-2xl">{t.icon}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#111827' }}>{t.label}</h3>
              <p className="text-sm text-gray-600">
                {t.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTrack(null)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getTrackLabel(track)} Application
            </h1>
            <p className="text-sm text-gray-500">
              {dashboard.activeCycle.name}
            </p>
          </div>
        </div>
        
        {/* Save Status */}
        <div className="flex items-center gap-2 text-sm">
          {isTyping ? (
            <>
              <span className="flex gap-0.5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
              <span className="text-gray-500">Typing...</span>
            </>
          ) : saving ? (
            <>
              <CloudArrowUpIcon className="w-4 h-4 text-blue-600 animate-pulse" />
              <span className="text-blue-600">Saving...</span>
            </>
          ) : saveError ? (
            <>
              <ExclamationCircleIcon className="w-4 h-4 text-amber-500" />
              <span className="text-amber-600">{saveError}</span>
            </>
          ) : lastSaved ? (
            <>
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
              <span className="text-green-600">
                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </>
          ) : hasChanges ? (
            <>
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              <span className="text-yellow-600">Unsaved changes</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Application Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 space-y-6">
        {questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Loading questions...</p>
          </div>
        ) : (
          questions.map((field) => (
            <div key={field.key} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {field.helpText && (
                <p className="text-sm text-gray-500">{field.helpText}</p>
              )}

              {/* Text Input */}
              {field.type === 'text' && (
                <div>
                  <input
                    type="text"
                    value={answers[field.key] || ''}
                    onChange={(e) => handleAnswerChange(field.key, e.target.value)}
                    onBlur={handleFieldBlur}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                  {field.wordLimit && (() => {
                    const wordCount = (answers[field.key] || '').trim().split(/\s+/).filter(Boolean).length;
                    const isOver = wordCount > field.wordLimit;
                    return (
                      <p className={`text-xs mt-1 text-right ${isOver ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        {wordCount} / {field.wordLimit} words{isOver ? ' (over limit)' : ''}
                      </p>
                    );
                  })()}
                </div>
              )}

              {/* Textarea */}
              {field.type === 'textarea' && (
                <div>
                  <textarea
                    value={answers[field.key] || ''}
                    onChange={(e) => handleAnswerChange(field.key, e.target.value)}
                    onBlur={handleFieldBlur}
                    placeholder={field.placeholder}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                  {field.wordLimit && (() => {
                    const wordCount = (answers[field.key] || '').trim().split(/\s+/).filter(Boolean).length;
                    const isOver = wordCount > field.wordLimit;
                    return (
                      <p className={`text-xs mt-1 text-right ${isOver ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        {wordCount} / {field.wordLimit} words{isOver ? ' (over limit)' : ''}
                      </p>
                    );
                  })()}
                </div>
              )}

              {/* Select */}
              {field.type === 'select' && (
                <select
                  value={answers[field.key] || ''}
                  onChange={(e) => handleAnswerChange(field.key, e.target.value)}
                  onBlur={handleFieldBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {/* Multi-select */}
              {field.type === 'multiselect' && (
                <div className="space-y-2">
                  {field.options?.map((opt) => (
                    <label key={opt} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={(answers[field.key] || []).includes(opt)}
                        onChange={(e) => {
                          const current = answers[field.key] || [];
                          const updated = e.target.checked
                            ? [...current, opt]
                            : current.filter((v: string) => v !== opt);
                          handleAnswerChange(field.key, updated);
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* File Upload */}
              {field.type === 'file' && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  {uploadingFiles[field.key] ? (
                    <div className="flex items-center justify-center gap-3 py-2">
                      <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      <span className="text-sm text-gray-600">Uploading...</span>
                    </div>
                  ) : files[field.key] ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">📄 {files[field.key].split('/').pop()}</span>
                      <button
                        onClick={() => {
                          // Update ref FIRST before state
                          const updatedFiles = { ...pendingFilesRef.current };
                          delete updatedFiles[field.key];
                          pendingFilesRef.current = updatedFiles;
                          
                          setFiles(updatedFiles);
                          setHasChanges(true);
                          performAutosave();
                        }}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block text-center">
                      <input
                        type="file"
                        accept={field.accept}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(field.key, file, field.fileKind || 'other');
                        }}
                        className="hidden"
                      />
                      <p className="text-sm text-gray-500">
                        Click to upload {field.fileKind || 'file'}
                      </p>
                      {field.accept && (
                        <p className="text-xs text-gray-400 mt-1">
                          Accepted: {field.accept}
                        </p>
                      )}
                    </label>
                  )}
                </div>
              )}

              {/* URL */}
              {field.type === 'url' && (
                <input
                  type="url"
                  value={answers[field.key] || ''}
                  onChange={(e) => handleAnswerChange(field.key, e.target.value)}
                  onBlur={handleFieldBlur}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              )}

              {/* Email */}
              {field.type === 'email' && (
                <input
                  type="email"
                  value={answers[field.key] || ''}
                  onChange={(e) => handleAnswerChange(field.key, e.target.value)}
                  onBlur={handleFieldBlur}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              )}

              {/* Phone */}
              {field.type === 'phone' && (
                <input
                  type="tel"
                  value={answers[field.key] || ''}
                  onChange={(e) => handleAnswerChange(field.key, e.target.value)}
                  onBlur={handleFieldBlur}
                  placeholder="(555) 555-5555"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              )}

              {/* Number */}
              {field.type === 'number' && (
                <input
                  type="number"
                  value={answers[field.key] || ''}
                  onChange={(e) => handleAnswerChange(field.key, e.target.value)}
                  onBlur={handleFieldBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              )}

              {/* Date */}
              {field.type === 'date' && (
                <input
                  type="date"
                  value={answers[field.key] || ''}
                  onChange={(e) => handleAnswerChange(field.key, e.target.value)}
                  onBlur={handleFieldBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              )}

              {/* Checkbox */}
              {field.type === 'checkbox' && (
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={answers[field.key] || false}
                    onChange={(e) => handleAnswerChange(field.key, e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded mt-0.5"
                  />
                  <span className="text-sm text-gray-700">{field.label}</span>
                </label>
              )}
            </div>
          ))
        )}

        {questions.length > 0 && (
          <div className="pt-6 border-t flex justify-end gap-3">
            <button
              onClick={handleAutosave}
              disabled={saving || !hasChanges}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
