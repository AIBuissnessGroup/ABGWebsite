'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSession, signIn } from 'next-auth/react';

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
      const submissionData = {
        applicantName: applicantInfo.name,
        applicantEmail: applicantInfo.email,
        applicantPhone: applicantInfo.phone,
        responses: Object.entries(responses).map(([questionId, value]) => ({
          questionId,
          value
        }))
      };

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

    switch (question.type) {
      case 'TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'URL':
        return (
          <input
            type={question.type === 'EMAIL' ? 'email' : question.type === 'PHONE' ? 'tel' : question.type === 'URL' ? 'url' : 'text'}
            value={value}
            onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
            className="w-full border border-white/20 rounded-lg px-4 py-3 bg-white/10 backdrop-blur-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
            placeholder={`Enter your ${question.title.toLowerCase()}`}
            required={question.required}
            minLength={question.minLength}
            maxLength={question.maxLength}
            pattern={question.pattern}
          />
        );

      case 'TEXTAREA':
        return (
          <textarea
            value={value}
            onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
            className="w-full border border-white/20 rounded-lg px-4 py-3 bg-white/10 backdrop-blur-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
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
            value={value}
            onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
            className="w-full border border-white/20 rounded-lg px-4 py-3 bg-white/10 backdrop-blur-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
            placeholder={`Enter ${question.title.toLowerCase()}`}
            required={question.required}
          />
        );

      case 'DATE':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
            className="w-full border border-white/20 rounded-lg px-4 py-3 bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            required={question.required}
          />
        );

      case 'SELECT':
        return (
          <select
            value={value}
            onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
            className="w-full border border-white/20 rounded-lg px-4 py-3 bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            required={question.required}
          >
            <option value="">Select an option</option>
            {question.options?.map((option, index) => (
              <option key={index} value={option} className="text-black">
                {option}
              </option>
            ))}
          </select>
        );

      case 'RADIO':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center text-white">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
                  className="mr-3 text-white"
                  required={question.required}
                />
                {option}
              </label>
            ))}
          </div>
        );

      case 'CHECKBOX':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
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
                {option}
              </label>
            ))}
          </div>
        );

      case 'BOOLEAN':
        return (
          <div className="flex items-center space-x-6">
            <label className="flex items-center text-white">
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
            <label className="flex items-center text-white">
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
              onChange={(e) => {
                // For now, just store the file name
                // In a real implementation, you'd upload to a file service
                const file = e.target.files?.[0];
                if (file) {
                  setResponses({...responses, [question.id]: file.name});
                }
              }}
              className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white/20 file:text-white hover:file:bg-white/30"
              required={question.required}
            />
            <p className="text-xs text-white/70 mt-1">
              Note: File upload functionality is not yet implemented. Please include file details in your response.
            </p>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setResponses({...responses, [question.id]: e.target.value})}
            className="w-full border border-white/20 rounded-lg px-4 py-3 bg-white/10 backdrop-blur-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
            placeholder={`Enter your ${question.title.toLowerCase()}`}
            required={question.required}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00274c] to-[#5e6472] flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">Loading form...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00274c] to-[#5e6472] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Form Not Available</h1>
          <p className="text-white/80">{error}</p>
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

  // Check if authentication is required and user is not authenticated
  if (form.requireAuth && (status === 'loading')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00274c] to-[#5e6472] flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">Checking authentication...</div>
      </div>
    );
  }

  if (form.requireAuth && (!session?.user?.email || !session.user.email.endsWith('@umich.edu'))) {
    return (
      <div 
        className="min-h-screen bg-gradient-to-br from-[#00274c] to-[#5e6472] py-12 px-4"
        style={{ 
          backgroundColor: form.backgroundColor,
          color: form.textColor 
        }}
      >
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 text-center"
          >
            <div className="text-4xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
            <p className="text-white/80 mb-6">
              This form requires you to sign in with your University of Michigan Google account.
            </p>
            <p className="text-white/60 text-sm mb-6">
              Your UMich email will be automatically used for your application.
            </p>
            <button
              onClick={handleGoogleSignIn}
              className="w-full bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with UMich Google
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-[#00274c] to-[#5e6472] py-12 px-4"
      style={{ 
        backgroundColor: form.backgroundColor,
        color: form.textColor 
      }}
    >
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20"
        >
          {/* Form Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">{form.title}</h1>
            {form.description && (
              <p className="text-white/80 text-lg">{form.description}</p>
            )}
            
            <div className="flex items-center justify-center gap-4 mt-4 text-sm text-white/70">
              <span>Category: {form.category}</span>
              {form.deadline && (
                <span>Deadline: {new Date(form.deadline).toLocaleDateString()}</span>
              )}
              {form.requireAuth && (
                <span className="bg-green-500/20 px-2 py-1 rounded text-green-300">✓ Authenticated</span>
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
            {/* Applicant Information */}
            <div className="border-b border-white/20 pb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Your Information</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={applicantInfo.name}
                    onChange={(e) => setApplicantInfo({...applicantInfo, name: e.target.value})}
                    className="w-full border border-white/20 rounded-lg px-4 py-3 bg-white/10 backdrop-blur-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                    placeholder="Enter your full name"
                    required
                    disabled={!!(form.requireAuth && session?.user?.name)}
                  />
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">
                    Email Address <span className="text-red-400">*</span>
                    {form.requireAuth && <span className="text-green-300 text-sm ml-2">(Auto-filled)</span>}
                  </label>
                  <input
                    type="email"
                    value={applicantInfo.email}
                    onChange={(e) => setApplicantInfo({...applicantInfo, email: e.target.value})}
                    className="w-full border border-white/20 rounded-lg px-4 py-3 bg-white/10 backdrop-blur-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                    placeholder="Enter your email"
                    required
                    disabled={form.requireAuth}
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-white font-medium mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={applicantInfo.phone}
                  onChange={(e) => setApplicantInfo({...applicantInfo, phone: e.target.value})}
                  className="w-full border border-white/20 rounded-lg px-4 py-3 bg-white/10 backdrop-blur-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Form Questions */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Application Questions</h2>
              
              {form.questions
                .sort((a, b) => a.order - b.order)
                .map((question) => (
                  <div key={question.id} className="space-y-2">
                    <label className="block text-white font-medium">
                      {question.title}
                      {question.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    
                    {question.description && (
                      <p className="text-white/70 text-sm">{question.description}</p>
                    )}
                    
                    {renderQuestion(question)}
                  </div>
                ))}
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-white/20">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-lg px-6 py-4 text-white font-medium transition-all duration-300 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
} 