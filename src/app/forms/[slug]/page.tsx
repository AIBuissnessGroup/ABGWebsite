'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSession, signIn, signOut } from 'next-auth/react';

interface Question {
  id: string;
  title: string;
  description?: string;
  type: string;
  required: boolean;
  order: number;
  options?: string[];
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

interface FormData {
  id: string;
  title: string;
  description?: string;
  category: string;
  isActive: boolean;
  deadline?: string;
  requireAuth: boolean;
  backgroundColor: string;
  textColor: string;
  questions: Question[];
  submissionCount: number;
  isAttendanceForm?: boolean;
}

export default function FormPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: session, status } = useSession();
  
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  // Geo / attendance state
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [geoError, setGeoError] = useState('');
  const [requestingGeo, setRequestingGeo] = useState(false);
  
  // Draft-related state
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [lastDraftSaved, setLastDraftSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  
  const [applicantInfo, setApplicantInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  const [responses, setResponses] = useState<Record<string, any>>({});

  // Auto-save timer ref
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadForm();
  }, [slug]);

  // Auto-fill email if user is authenticated
  useEffect(() => {
    if (session?.user?.email && form?.requireAuth) {
      setApplicantInfo(prev => ({
        ...prev,
        email: session.user.email || '',
        name: session.user.name || ''
      }));
    }
  }, [session, form]);

  // Load draft when form and session are ready
  useEffect(() => {
    if (form && session?.user?.email && !submitted) {
      loadDraft();
    }
  }, [form, session, submitted]);

  // Auto-request location for attendance forms when form loads
  useEffect(() => {
    if (form?.isAttendanceForm && coords.lat == null && coords.lng == null) {
      requestLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form?.isAttendanceForm]);

  // Geolocation request helper for attendance forms
  const requestLocation = () => {
    if (!form?.requireAuth && !form?.isAttendanceForm) return;
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation not supported by this browser.');
      return;
    }
    setRequestingGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoError('');
        setRequestingGeo(false);
      },
      (err) => {
        setGeoError(err.message || 'Failed to get your location.');
        setRequestingGeo(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Auto-save functionality
  useEffect(() => {
    if (!session?.user?.email || !form || submitted) return;

    // Clear existing timer
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    // Set new timer to save draft after 2 seconds of inactivity
    autoSaveTimer.current = setTimeout(() => {
      saveDraft();
    }, 2000);

    // Cleanup timer on unmount
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [applicantInfo, responses, session, form, submitted]);

  const loadForm = async () => {
    try {
      const res = await fetch(`/api/forms/${slug}`);
      if (res.ok) {
        const formData = await res.json();
        setForm(formData);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Form not found');
      }
    } catch (error) {
      console.error('Error loading form:', error);
      setError('Failed to load form');
    }
    setLoading(false);
  };

  const loadDraft = async () => {
    if (!session?.user?.email) return;
    
    setIsDraftLoading(true);
    try {
      const res = await fetch(`/api/forms/${slug}/draft`);
      if (res.ok) {
        const data = await res.json();
        if (data.draft) {
          // Load draft data
          setApplicantInfo(prev => ({
            name: data.draft.applicantName || prev.name,
            email: data.draft.applicantEmail || prev.email,
            phone: data.draft.applicantPhone || prev.phone
          }));
          setResponses(data.draft.responses || {});
          setLastDraftSaved(new Date(data.draft.updatedAt));
          setHasDraft(true);
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
    setIsDraftLoading(false);
  };

  const saveDraft = async () => {
    if (!session?.user?.email || !form || submitted || draftSaving) return;

    // Only save if there's actual content
    const hasContent = applicantInfo.name || applicantInfo.phone || 
                      Object.values(responses).some(val => val && val !== '');
    
    if (!hasContent) return;

    setDraftSaving(true);
    try {
      const res = await fetch(`/api/forms/${slug}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: applicantInfo.name,
          applicantEmail: applicantInfo.email,
          applicantPhone: applicantInfo.phone,
          responses
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLastDraftSaved(new Date(data.updatedAt));
        setHasDraft(true);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    }
    setDraftSaving(false);
  };

  const deleteDraft = async () => {
    if (!session?.user?.email) return;

    try {
      await fetch(`/api/forms/${slug}/draft`, {
        method: 'DELETE'
      });
      setHasDraft(false);
      setLastDraftSaved(null);
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { 
      callbackUrl: window.location.href,
      hd: 'umich.edu' // Restrict to UMich domain
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form) return;
    
    // Check authentication requirement
    if (form.requireAuth && (!session?.user?.email || !session.user.email.endsWith('@umich.edu'))) {
      setError('This form requires authentication with a University of Michigan email address.');
      return;
    }
    
    // Validate required fields
    const requiredQuestions = form.questions.filter(q => q.required);
    for (const question of requiredQuestions) {
      if (!responses[question.id] || responses[question.id] === '') {
        setError(`Please answer the required question: ${question.title}`);
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      const submissionData: any = {
        applicantName: applicantInfo.name,
        applicantEmail: applicantInfo.email,
        applicantPhone: applicantInfo.phone,
        responses: Object.entries(responses).map(([questionId, value]) => ({
          questionId,
          value
        }))
      };

      // Attach location if attendance form requires it
      if (form.isAttendanceForm) {
        if (coords.lat == null || coords.lng == null) {
          setSubmitting(false);
          setError('Location required to submit this attendance form. Please allow location access.');
          return;
        }
        submissionData.latitude = coords.lat;
        submissionData.longitude = coords.lng;
      }

      const res = await fetch(`/api/forms/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      if (res.ok) {
        setSubmitted(true);
        // Delete draft after successful submission
        await deleteDraft();
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Failed to submit application');
    }
    
    setSubmitting(false);
  };

  const renderQuestion = (question: Question) => {
    const value = responses[question.id] || '';

    // Debug logging for options
    if (question.type === 'SELECT' || question.type === 'RADIO' || question.type === 'CHECKBOX') {
      console.log('Question options debug:', {
        questionId: question.id,
        type: question.type,
        title: question.title,
        options: question.options,
        optionsType: typeof question.options,
        isArray: Array.isArray(question.options)
      });
    }

    // Dynamic color styling
    const textColorStyle = { color: form?.textColor || '#ffffff' };
    const labelColorStyle = { color: form?.textColor || '#ffffff' };
    const inputBaseClass = "w-full border border-white/20 rounded-lg px-4 py-3 bg-white/10 backdrop-blur-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30";

    switch (question.type) {
      case 'TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'URL':
        return (
          <input
            type={question.type === 'EMAIL' ? 'email' : question.type === 'PHONE' ? 'tel' : question.type === 'URL' ? 'url' : 'text'}
            className={inputBaseClass}
            onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
            style={textColorStyle}
            placeholder={`Enter your response here.`}
            required={question.required}
            minLength={question.minLength}
            maxLength={question.maxLength}
            pattern={question.pattern}
          />
        );

      case 'TEXTAREA':
        return (
          <textarea
            className={inputBaseClass}
            onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
            style={textColorStyle}
            placeholder={`Enter your ${question.title.toLowerCase()}`}
            rows={4}
            required={question.required}
            minLength={question.minLength}
            maxLength={question.maxLength}
          />
        );

      case 'NUMBER':
        return (
          <input
            type="number"
            className={inputBaseClass}
            onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
            style={textColorStyle}
            placeholder={`Enter ${question.title.toLowerCase()}`}
            required={question.required}
          />
        );

      case 'DATE':
        return (
          <input
            type="date"
            className={inputBaseClass}
            onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
            required={question.required}
          />
        );

      case 'SELECT':
        const selectOptions: string[] = Array.isArray(question.options) 
          ? question.options 
          : (question.options && typeof question.options === 'string' ? (question.options as string).split('\n').filter((opt: string) => opt.trim()) : []);
        return (
          <select
            className={inputBaseClass}
            style={textColorStyle}
            onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
            required={question.required}
          >
            <option value="">Select an option</option>
            {selectOptions.map((option: string, index: number) => (
              <option key={index} value={option} className="text-black">
                {option}
              </option>
            ))}
            {selectOptions.length === 0 && (
              <option value="" disabled className="text-black">No options available</option>
            )}
          </select>
        );

      case 'RADIO':
        const radioOptions: string[] = Array.isArray(question.options) 
          ? question.options 
          : (question.options && typeof question.options === 'string' ? (question.options as string).split('\n').filter((opt: string) => opt.trim()) : []);
        return (
          <div className="space-y-2">
            {radioOptions.map((option: string, index: number) => (
              <label key={index} className="flex items-center text-white">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
                  className="mr-3"
                  required={question.required}
                />
                <span className="text-white">{option}</span>
              </label>
            ))}
            {radioOptions.length === 0 && (
              <p className="text-white/70 text-sm opacity-70">No options available for this question.</p>
            )}
          </div>
        );

      case 'CHECKBOX':
        const checkboxOptions: string[] = Array.isArray(question.options) 
          ? question.options 
          : (question.options && typeof question.options === 'string' ? (question.options as string).split('\n').filter((opt: string) => opt.trim()) : []);
        return (
          <div className="space-y-2">
            {checkboxOptions.map((option: string, index: number) => (
              <label key={index} className="flex items-center text-white">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) ? value.includes(option) : false}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      setResponses({...responses, [question.id]: [...currentValues, option]});
                    } else {
                      setResponses({...responses, [question.id]: currentValues.filter(v => v !== option)});
                    }
                  }}
                  className="mr-3"
                />
                <span className="text-white">{option}</span>
              </label>
            ))}
            {checkboxOptions.length === 0 && (
              <p className="text-white/70 text-sm opacity-70">No options available for this question.</p>
            )}
          </div>
        );

      case 'BOOLEAN':
        return (
          <div className="flex items-center space-x-6">
            <label className="flex items-center" style={{ color: form?.textColor || '#ffffff' }}>
              <input
                type="radio"
                name={question.id}
                value="true"
                checked={value === 'true'}
                onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
                className="mr-2"
                required={question.required}
              />
              Yes
            </label>
            <label className="flex items-center" style={{ color: form?.textColor || '#ffffff' }}>
              <input
                type="radio"
                name={question.id}
                value="false"
                checked={value === 'false'}
                onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
                className="mr-2"
                required={question.required}
              />
              No
            </label>
          </div>
        );

      case 'FILE':
        return (
          <div className="text-white">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Check file size (5MB limit)
                  if (file.size > 5 * 1024 * 1024) {
                    alert('File size must be less than 5MB');
                    e.target.value = '';
                    return;
                  }
                  
                  // Convert file to base64 for storage
                  const reader = new FileReader();
                  reader.onload = () => {
                    const base64 = reader.result as string;
                    setResponses({
                      ...responses, 
                      [question.id]: {
                        fileName: file.name,
                        fileSize: file.size,
                        fileType: file.type,
                        fileData: base64
                      }
                    });
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white/20 file:text-white hover:file:bg-white/30"
              required={question.required}
            />
            <p className="text-xs text-white/70 mt-1">
              Max file size: 5MB. Supported formats: PDF, DOC, DOCX, TXT, JPG, JPEG, PNG, GIF
            </p>
            {responses[question.id] && typeof responses[question.id] === 'object' && (
              <p className="text-xs text-green-300 mt-2">
                ✓ {(responses[question.id] as any).fileName} ({Math.round((responses[question.id] as any).fileSize / 1024)}KB)
              </p>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
            style={textColorStyle}
            placeholder={`Enter your response here.`}
            required={question.required}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00274c]"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Form Not Found</h1>
          <p className="text-gray-600">The form you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  if (!form.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Form Closed</h1>
          <p className="text-gray-600">This form is no longer accepting submissions.</p>
        </div>
      </div>
    );
  }

  if (form.deadline && new Date() > new Date(form.deadline)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Deadline Passed</h1>
          <p className="text-gray-600">
            The submission deadline for this form was {new Date(form.deadline).toLocaleString()}.
          </p>
        </div>
      </div>
    );
  }

  // Check authentication requirement
  if (form.requireAuth && (!session?.user?.email || !session.user.email.endsWith('@umich.edu'))) {
    const callbackUrl = typeof window !== 'undefined' ? window.location.href : '';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00274c] to-[#1a2c45] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#00274c]/80 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Authentication Required</h1>
              <p className="text-[#BBBBBB] mb-6 leading-relaxed">
                This form requires you to sign in with your University of Michigan email address.
              </p>
              {!session?.user ? (
                <button
                  onClick={() => signIn('google', { callbackUrl })}
                  className="w-full bg-white hover:bg-gray-50 text-gray-900 font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign In with UMich Google
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-red-500/20 rounded-lg border border-red-500/30">
                    <p className="text-red-200 text-sm">
                      You are signed in as <span className="font-medium">{session.user.email}</span>, but this form requires a @umich.edu email address.
                    </p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="w-full bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
                  >
                    Sign Out & Try Different Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00274c] to-[#5e6472] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
            <div className="text-green-400 text-6xl mb-4">✓</div>
            <h1 className="text-2xl font-bold text-white mb-4">Application Submitted!</h1>
            <p className="text-white/80 mb-6">
              Thank you for your submission. We'll review your application and get back to you soon.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-lg px-6 py-3 text-white font-medium transition-all duration-300"
            >
              Return to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div 
      className="form-page min-h-screen bg-gradient-to-br from-[#00274c] to-[#5e6472] py-12 px-4"
      style={{ 
        backgroundColor: form.backgroundColor,
        color: form.textColor 
      }}
    >
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-white/20 shadow-2xl"
        >
          {/* Form Header */}
          <div className="text-center mb-8 pb-6 border-b border-white/10">
            <h1 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: form?.textColor || '#ffffff' }}>
              {form.title}
            </h1>
            
            {form.description && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 md:p-6 mb-6">
                <div className="text-sm md:text-base leading-relaxed space-y-3 text-left" style={{ color: form?.textColor || '#d1d5db' }}>
                  {form.description.split('\n').map((paragraph, index) => {
                    const trimmedParagraph = paragraph.trim();
                    if (!trimmedParagraph) {
                      return <div key={index} className="h-3" />; // Empty space for blank lines
                    }
                    return (
                      <p key={index} className="mb-2" style={{ color: form?.textColor || '#d1d5db' }}>
                        {trimmedParagraph}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-center gap-4 mt-6 text-sm flex-wrap">
              <span className="px-3 py-1 bg-white/10 rounded-full" style={{ color: form?.textColor || '#ffffff' }}>Category: {form.category}</span>
              {form.deadline && (
                <span className="px-3 py-1 bg-orange-500/20 rounded-full text-orange-200">⏰ Deadline: {new Date(form.deadline).toLocaleDateString()}</span>
              )}
              {form.requireAuth && (
                <span className="bg-green-500/20 px-3 py-1 rounded-full text-green-300">✓ Authenticated</span>
              )}
            </div>

            {/* Draft Status Indicator */}
            {session?.user?.email && (
              <div className="mt-4 text-center">
                {isDraftLoading && (
                  <div className="inline-flex items-center gap-2 text-sm text-blue-300">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-300"></div>
                    Loading draft...
                  </div>
                )}
                
                {draftSaving && (
                  <div className="inline-flex items-center gap-2 text-sm text-yellow-300">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-yellow-300"></div>
                    Saving draft...
                  </div>
                )}
                
                {!isDraftLoading && !draftSaving && lastDraftSaved && (
                  <div className="text-sm text-green-300">
                    💾 Draft saved {lastDraftSaved.toLocaleTimeString()}
                  </div>
                )}
                
                {!isDraftLoading && !draftSaving && hasDraft && !lastDraftSaved && (
                  <div className="text-sm text-blue-300">
                    📝 Draft loaded
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {Boolean(form.isAttendanceForm) && (
              <div className="border border-blue-400/30 bg-blue-900/30 rounded-lg p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-blue-100">
                    {coords.lat != null && coords.lng != null ? (
                      <span>Location captured ✓</span>
                    ) : requestingGeo ? (
                      <span>Requesting your location…</span>
                    ) : (
                      <span>Location required to submit this attendance form.</span>
                    )}
                    {geoError && <div className="text-red-200 mt-1">{geoError}</div>}
                  </div>
                  <button
                    type="button"
                    onClick={requestLocation}
                    className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm"
                    disabled={requestingGeo}
                  >
                    {coords.lat != null ? 'Refresh Location' : 'Share Location'}
                  </button>
                </div>
              </div>
            )}
            
            {/* Applicant Information */}
            <div className="bg-white/5 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-6 text-left flex items-center gap-2">
                👤 Your Information
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-medium mb-3">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={applicantInfo.name}
                    onChange={(e) => setApplicantInfo({...applicantInfo, name: e.target.value})}
                    className="w-full border border-white/20 rounded-lg px-4 py-3 bg-white/10 backdrop-blur-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                    style={{ color: form?.textColor || '#ffffff' }}
                    placeholder="Enter your full name"
                    required
                    disabled={!!(form.requireAuth && session?.user?.name)}
                  />
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-3">
                    Email Address <span className="text-red-400">*</span>
                    {form.requireAuth && <span className="text-green-300 text-sm ml-2">(Auto-filled)</span>}
                  </label>
                  <input
                    type="email"
                    value={applicantInfo.email}
                    onChange={(e) => setApplicantInfo({...applicantInfo, email: e.target.value})}
                    className="w-full border border-white/20 rounded-lg px-4 py-3 bg-white/10 backdrop-blur-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                    style={{ color: form?.textColor || '#ffffff' }}
                    placeholder="Enter your email"
                    required
                    disabled={form.requireAuth}
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-white font-medium mb-3">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={applicantInfo.phone}
                  onChange={(e) => setApplicantInfo({...applicantInfo, phone: e.target.value})}
                  className="w-full border border-white/20 rounded-lg px-4 py-3 bg-white/10 backdrop-blur-sm placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  style={{ color: form?.textColor || '#ffffff' }}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Form Questions */}
            <div className="bg-white/5 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6 text-left flex items-center gap-2">
                📝 Application Questions
              </h2>
              
              <div className="space-y-6">
                {form.questions
                  .sort((a, b) => a.order - b.order)
                  .map((question) => (
                    <div key={question.id} className="border border-white/10 rounded-lg p-4 bg-white/5">
                      <label className="block text-lg font-medium text-white mb-3">
                        {question.title}
                        {question.required && <span className="text-red-300 ml-1">*</span>}
                      </label>
                      {question.description && (
                        <p className="text-white/80 text-sm mb-4">
                          {question.description}
                        </p>
                      )}
                      {renderQuestion(question)}
                    </div>
                  ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 backdrop-blur-sm border border-blue-400/30 rounded-lg px-6 py-4 font-semibold text-lg transition-all duration-300 disabled:opacity-50 transform hover:scale-[1.02]"
                style={{ color: form?.textColor || '#ffffff' }}
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </div>
                ) : (
                  '🚀 Submit Application'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
} 