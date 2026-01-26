'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { 
  StarIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useSession } from 'next-auth/react';
import { useAdminApi } from '@/hooks/useAdminApi';
import { useCycle } from '../layout';
import { AdminLoadingState } from '@/components/admin/ui';
import { TRACKS, getTrackLabel } from '@/lib/tracks';
import type { Application, ApplicationReview, ApplicationStage, ApplicationTrack, ReviewPhase, ReferralSignal, QuestionField, PhaseConfig, ScoringCategory } from '@/types/recruitment';

// Stage display labels
const STAGES: { value: ApplicationStage; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'interview_round1', label: 'Round 1 Interview' },
  { value: 'interview_round2', label: 'Round 2 Interview' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'waitlisted', label: 'Waitlisted' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

// Phase configuration - basic info (categories loaded from database)
type PhaseTab = 'application' | 'interview_round1' | 'interview_round2';

const PHASE_CONFIG: Record<PhaseTab, { 
  label: string; 
  icon: React.ReactNode;
  stages: ApplicationStage[];
}> = {
  application: {
    label: 'Application',
    icon: <DocumentTextIcon className="w-4 h-4" />,
    stages: ['submitted', 'under_review'],
  },
  interview_round1: {
    label: 'Round 1',
    icon: <ChatBubbleLeftRightIcon className="w-4 h-4" />,
    stages: ['interview_round1'],
  },
  interview_round2: {
    label: 'Round 2',
    icon: <ChatBubbleLeftRightIcon className="w-4 h-4" />,
    stages: ['interview_round2'],
  },
};

// Default categories if none configured in database
const DEFAULT_CATEGORIES: ScoringCategory[] = [
  { key: 'overall', label: 'Overall', minScore: 1, maxScore: 5, weight: 1 },
];

interface ApplicantDetailResponse {
  application: Application;
  user?: { name?: string; email?: string };
  reviews?: ApplicationReview[];
  reviewSummary?: { reviewCount: number; avgScore: number };
}

interface AllReviews {
  reviews: (ApplicationReview & { reviewerName?: string })[];
  avgScores: Record<string, number>;
  totalReviews: number;
}

export default function CycleReviewsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const cycleId = params.cycleId as string;
  const preselectedApplicant = searchParams.get('applicant');
  const { cycle } = useCycle();
  const { get, post } = useAdminApi();
  
  // Phase state
  const [activePhase, setActivePhase] = useState<PhaseTab>('application');
  
  // Applications list uses a simpler type from the list API
  const [applications, setApplications] = useState<Array<{
    _id: string;
    name: string;
    email: string;
    track: string;
    stage: string;
    reviewCount?: number;
    averageScore?: number;
    headshot?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(preselectedApplicant);
  const [selectedApp, setSelectedApp] = useState<ApplicantDetailResponse | null>(null);
  const [allReviews, setAllReviews] = useState<AllReviews | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [questions, setQuestions] = useState<QuestionField[]>([]);
  const [phaseConfig, setPhaseConfig] = useState<PhaseConfig | null>(null);
  
  // My review form
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [questionNotes, setQuestionNotes] = useState<Record<string, string>>({});
  const [referralSignal, setReferralSignal] = useState<ReferralSignal>('neutral');
  const [saving, setSaving] = useState(false);
  const [filterStage, setFilterStage] = useState<ApplicationStage | ''>('');
  const [filterTrack, setFilterTrack] = useState<ApplicationTrack | ''>('');

  const currentPhaseConfig = PHASE_CONFIG[activePhase];
  // Get scoring categories from database config, fallback to defaults
  // Use useMemo to prevent unnecessary re-renders when phaseConfig reference changes but categories are the same
  const scoringCategories = useMemo(() => {
    return phaseConfig?.scoringCategories?.length 
      ? phaseConfig.scoringCategories 
      : DEFAULT_CATEGORIES;
  }, [phaseConfig?.scoringCategories]);
  // Check if phase is finalized
  const isFinalized = phaseConfig?.status === 'finalized';
  // Check if this is an interview phase
  const isInterviewPhase = activePhase === 'interview_round1' || activePhase === 'interview_round2';
  // Get interview questions for this phase - memoized to prevent flashing
  const interviewQuestions = useMemo(() => {
    return phaseConfig?.interviewQuestions || [];
  }, [phaseConfig?.interviewQuestions]);

  // Load phase config when phase changes
  const loadPhaseConfig = async () => {
    try {
      // When phase is specified, API returns a single config object (or 404 if not found)
      const trackParam = filterTrack ? `&track=${filterTrack}` : '';
      const response = await fetch(`/api/admin/recruitment/phase-configs?cycleId=${cycleId}&phase=${activePhase}${trackParam}`);
      if (response.ok) {
        const config = await response.json();
        console.log('Loaded phase config:', config);
        setPhaseConfig(config || null);
      } else {
        // Phase config doesn't exist yet - use defaults
        console.log('No phase config found, using defaults');
        setPhaseConfig(null);
      }
    } catch (error) {
      console.error('Error loading phase config:', error);
      setPhaseConfig(null);
    }
  };

  const loadApplications = async () => {
    try {
      setLoading(true);
      const stages = currentPhaseConfig.stages.join(',');
      const trackParam = filterTrack ? `&track=${filterTrack}` : '';
      const data = await get<Array<{
        _id: string;
        name: string;
        email: string;
        track: string;
        stage: string;
        reviewCount?: number;
        averageScore?: number;
      }>>(`/api/admin/recruitment/applications?cycleId=${cycleId}&stages=${stages}${trackParam}`);
      setApplications(data);
      if (selectedAppId && !data.find(a => a._id === selectedAppId)) {
        setSelectedAppId(null);
        setSelectedApp(null);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize phase configs on first load
  useEffect(() => {
    if (cycleId) {
      // Initialize phase configs if they don't exist, then load them
      post('/api/admin/recruitment/phase-configs', { cycleId, action: 'initialize' })
        .then(() => {
          loadApplications();
          loadPhaseConfig();
        })
        .catch(() => {
          // Load anyway even if init fails (already initialized)
          loadApplications();
          loadPhaseConfig();
        });
    }
  }, [cycleId]);

  // Reload when phase or track changes
  useEffect(() => {
    if (cycleId) {
      loadApplications();
      loadPhaseConfig();
    }
  }, [activePhase, filterTrack]);

  // Refresh phase config when window regains focus (in case it was unlocked on another page)
  // Only update if the status has actually changed to avoid unnecessary re-renders
  useEffect(() => {
    const handleFocus = async () => {
      if (cycleId) {
        try {
          const trackParam = filterTrack ? `&track=${filterTrack}` : '';
          const response = await fetch(`/api/admin/recruitment/phase-configs?cycleId=${cycleId}&phase=${activePhase}${trackParam}`);
          if (response.ok) {
            const config = await response.json();
            // Only update if status changed (e.g., unlocked) to avoid resetting UI state
            if (config?.status !== phaseConfig?.status) {
              console.log('Phase status changed, updating config');
              setPhaseConfig(config || null);
            }
          }
        } catch (error) {
          console.error('Error checking phase config on focus:', error);
        }
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [cycleId, activePhase, filterTrack, phaseConfig?.status]);

  useEffect(() => {
    if (selectedAppId) {
      loadSelectedApplication();
    }
  }, [selectedAppId, activePhase]);

  const loadSelectedApplication = async () => {
    if (!selectedAppId) return;
    
    try {
      setLoadingReviews(true);
      
      // Load application details and phase-specific reviews
      const [appData, reviewsData] = await Promise.all([
        get<ApplicantDetailResponse>(`/api/admin/recruitment/applications/${selectedAppId}`),
        get<AllReviews>(`/api/admin/recruitment/phase-reviews?applicationId=${selectedAppId}&phase=${activePhase}`),
      ]);
      
      setSelectedApp(appData);
      setAllReviews(reviewsData);
      
      // Load questions for this application's track
      if (appData?.application?.track) {
        try {
          // API returns an array of ApplicationQuestions objects, each with a fields array
          const questionsData = await get<Array<{ fields: QuestionField[] }>>(
            `/api/admin/recruitment/questions?cycleId=${cycleId}&track=${appData.application.track}`
          );
          // Flatten all fields from all question sets
          const allFields = questionsData?.flatMap(q => q.fields || []) || [];
          setQuestions(allFields);
        } catch (e) {
          console.error('Error loading questions:', e);
          setQuestions([]);
        }
      }
      
      // If user has a review for this phase, load it into the form
      const myReview = reviewsData?.reviews?.find(r => r.reviewerEmail === session?.user?.email);
      if (myReview) {
        setScores(myReview.scores || {});
        setNotes(myReview.notes || '');
        setQuestionNotes(myReview.questionNotes || {});
        setReferralSignal(myReview.referralSignal || 'neutral');
      } else {
        // Reset form for new review
        setScores({});
        setNotes('');
        setQuestionNotes({});
        setReferralSignal('neutral');
      }
    } catch (error) {
      console.error('Error loading application:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSaveReview = async () => {
    if (!selectedAppId) return;
    
    // Check if phase is finalized
    if (isFinalized) {
      alert('This phase has been finalized. Unlock the phase from the Rankings page to modify reviews.');
      return;
    }
    
    // Validate at least overall score
    if (!scores.overall) {
      alert('Please provide at least an overall score');
      return;
    }
    
    try {
      setSaving(true);
      await post('/api/admin/recruitment/phase-reviews', {
        applicationId: selectedAppId,
        cycleId,
        phase: activePhase,
        scores,
        notes,
        questionNotes: isInterviewPhase ? questionNotes : undefined,
        referralSignal,
      }, {
        successMessage: 'Review saved successfully',
      });
      
      // Just reload the reviews for this application, not the whole list
      const reviewsData = await get<AllReviews>(
        `/api/admin/recruitment/phase-reviews?applicationId=${selectedAppId}&phase=${activePhase}`
      );
      setAllReviews(reviewsData);
      
      // Update the review count in the applications list without reloading
      setApplications(prev => prev.map(app => 
        app._id === selectedAppId 
          ? { ...app, reviewCount: reviewsData.totalReviews, averageScore: reviewsData.avgScores?.overall }
          : app
      ));
    } catch (error) {
      console.error('Error saving review:', error);
    } finally {
      setSaving(false);
    }
  };

  const navigateApplication = (direction: 'prev' | 'next') => {
    if (!selectedAppId) return;
    const currentIndex = applications.findIndex(a => a._id === selectedAppId);
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < applications.length) {
      setSelectedAppId(applications[newIndex]._id!);
    }
  };

  // Stable handler for star clicks - prevents flickering
  const handleStarClick = useCallback((category: string, star: number) => {
    setScores(prev => ({ ...prev, [category]: star }));
  }, []);

  const renderStars = useCallback((category: ScoringCategory, currentScore: number) => {
    const starDescriptions = category.starDescriptions;
    const currentDescription = currentScore > 0 && starDescriptions?.[currentScore as 1|2|3|4|5];
    
    return (
      <div className="flex flex-col gap-1">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const description = starDescriptions?.[star as 1|2|3|4|5];
            return (
              <button
                key={`${category.key}-star-${star}`}
                type="button"
                onClick={() => handleStarClick(category.key, star)}
                title={description || `${star} star${star > 1 ? 's' : ''}`}
                className="p-0.5 transition-transform hover:scale-110"
              >
                {star <= currentScore ? (
                  <StarIconSolid className="w-6 h-6 text-yellow-400" />
                ) : (
                  <StarIcon className="w-6 h-6 text-gray-300 hover:text-yellow-300" />
                )}
              </button>
            );
          })}
        </div>
        {currentDescription && (
          <span className="text-xs text-amber-600 italic">{currentDescription}</span>
        )}
      </div>
    );
  }, [handleStarClick]);

  if (loading) {
    return <AdminLoadingState message="Loading applications..." />;
  }

  return (
    <div className="space-y-4">
      {/* Phase Tabs */}
      <div className="bg-white rounded-xl border p-1 inline-flex gap-1">
        {Object.entries(PHASE_CONFIG).map(([phase, config]) => (
          <button
            key={phase}
            onClick={() => {
              setActivePhase(phase as ReviewPhase);
              setSelectedAppId(null);
              setSelectedApp(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activePhase === phase 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      <div className="flex gap-6 h-[calc(100vh-260px)]">
        {/* Left Panel: Application List */}
        <div className="w-80 flex-shrink-0 flex flex-col bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900 mb-3">
              {currentPhaseConfig.label} - Applications
            </h3>
            <div className="space-y-2">
              <select
                value={filterTrack}
                onChange={(e) => setFilterTrack(e.target.value as ApplicationTrack | '')}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Tracks</option>
                {TRACKS.map((track) => (
                  <option key={track.value} value={track.value}>
                    {track.label}
                  </option>
                ))}
              </select>
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value as ApplicationStage | '')}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Stages</option>
                {currentPhaseConfig.stages.map((stage) => (
                  <option key={stage} value={stage}>
                    {STAGES.find(s => s.value === stage)?.label || stage}
                  </option>
                ))}
              </select>
            </div>
          </div>
        
          <div className="flex-1 overflow-y-auto divide-y">
            {applications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No applications in this stage
              </div>
            ) : (
              applications.map((app, index) => (
                <button
                  key={app._id}
                  onClick={() => setSelectedAppId(app._id!)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                    selectedAppId === app._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Number */}
                      <span className="text-sm font-mono text-gray-400 w-6 flex-shrink-0">
                        {index + 1}.
                      </span>
                      {/* Profile Image */}
                      {app.headshot ? (
                        <img 
                          src={app.headshot} 
                          alt={app.name || 'Applicant'}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-500 text-sm font-medium">
                            {(app.name || '?')[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {app.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {app.email}
                        </p>
                      </div>
                    </div>
                    {app.averageScore && (
                      <div className="flex items-center gap-1 text-sm">
                        <StarIconSolid className="w-4 h-4 text-yellow-400" />
                        <span>{app.averageScore.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      app.track === 'business' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {app.track}
                    </span>
                    <span className="text-xs text-gray-400">
                      {app.reviewCount || 0} reviews
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Review Form */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border overflow-hidden">
          {!selectedAppId ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select an application to review
            </div>
          ) : loadingReviews ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : selectedApp ? (
            <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-4">
                {(() => {
                  // Get headshot from selected application's files
                  const files = selectedApp.application?.files;
                  const headshot = files?.headshot || files?.photo || files?.profile_photo || files?.h;
                  
                  return headshot ? (
                    <img 
                      src={headshot} 
                      alt={selectedApp.user?.name || 'Applicant'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 text-sm font-medium">
                        {(selectedApp.user?.name || '?')[0].toUpperCase()}
                      </span>
                    </div>
                  );
                })()}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedApp.user?.name || 'Unknown'}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedApp.user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateApplication('prev')}
                  disabled={applications.findIndex(a => a._id === selectedAppId) === 0}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-500">
                  {applications.findIndex(a => a._id === selectedAppId) + 1} / {applications.length}
                </span>
                <button
                  onClick={() => navigateApplication('next')}
                  disabled={applications.findIndex(a => a._id === selectedAppId) === applications.length - 1}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Answers */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Application Answers</h4>
                  {Object.entries(selectedApp.application?.answers || {}).map(([key, value]) => {
                    // Find the matching question to get the full label
                    const question = questions.find(q => q.key === key);
                    const displayLabel = question?.label || key
                      .replace(/_/g, ' ')
                      .replace(/([a-z])([A-Z])/g, '$1 $2')
                      .split(' ')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                      .join(' ');
                    
                    return (
                      <div key={key} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <p className="text-base font-bold text-black mb-3">
                          {displayLabel}
                        </p>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                          {typeof value === 'string' 
                            ? value 
                            : Array.isArray(value) 
                              ? value.join(', ')
                              : JSON.stringify(value, null, 2)}
                        </p>
                      </div>
                    );
                  })}
                  
                  {Object.keys(selectedApp.application?.files || {}).length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Files</h5>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(selectedApp.application?.files || {}).map(([key, url]) => (
                          <a
                            key={key}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100"
                          >
                            📄 {key}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Review Form */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Your Review ({currentPhaseConfig.label})
                    </h4>
                    
                    {/* Scores - Categories from phase settings */}
                    <div className="space-y-3">
                      {scoringCategories.map((cat) => (
                        <div key={cat.key} className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-700">{cat.label}</span>
                            {cat.description && (
                              <span className="text-xs text-gray-400">{cat.description}</span>
                            )}
                          </div>
                          {renderStars(cat, scores[cat.key] || 0)}
                        </div>
                      ))}
                      {/* Always include overall if not already in categories */}
                      {!scoringCategories.some(c => c.key === 'overall') && (
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-sm font-medium text-gray-900">Overall</span>
                          {renderStars({ key: 'overall', label: 'Overall', minScore: 1, maxScore: 5, weight: 1 }, scores.overall || 0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Referral Signal - for tie-breaking */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Referral Signal
                    </label>
                    <div className="flex gap-2">
                      {[
                        { value: 'referral', label: '👍 Advocate', color: 'bg-green-100 text-green-700 border-green-300' },
                        { value: 'neutral', label: '👌 Neutral', color: 'bg-gray-100 text-gray-700 border-gray-300' },
                        { value: 'deferral', label: '👎 Oppose', color: 'bg-red-100 text-red-700 border-red-300' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setReferralSignal(opt.value as ReferralSignal)}
                          className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                            referralSignal === opt.value ? opt.color : 'bg-white border-gray-200 text-gray-600'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Used for tie-breaking in rankings</p>
                  </div>

                  {/* Interview Questions - Only show for interview phases with configured questions */}
                  {isInterviewPhase && interviewQuestions.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Interview Questions</h4>
                      <div className="space-y-4">
                        {interviewQuestions.map((q, idx) => (
                          <div key={q.key} className="bg-gray-50 rounded-lg p-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {idx + 1}. {q.question}
                            </label>
                            <textarea
                              value={questionNotes[q.key] || ''}
                              onChange={(e) => setQuestionNotes({ ...questionNotes, [q.key]: e.target.value })}
                              rows={3}
                              placeholder="Notes for this question..."
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isInterviewPhase && interviewQuestions.length > 0 ? 'Additional Notes' : 'Notes'}
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      placeholder={isInterviewPhase && interviewQuestions.length > 0 
                        ? "Any additional notes not covered by the questions above..." 
                        : "Add your thoughts about this applicant..."}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {/* Save Button */}
                  {(() => {
                    const hasExistingReview = allReviews?.reviews?.some(r => r.reviewerEmail === session?.user?.email);
                    return (
                      <>
                        {isFinalized && (
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                            🔒 This phase is finalized. Unlock from Rankings page to modify reviews.
                          </div>
                        )}
                        {hasExistingReview && !isFinalized && (
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                            ✓ You have already reviewed this applicant. You can update your review below.
                          </div>
                        )}
                        <button
                          onClick={handleSaveReview}
                          disabled={saving || isFinalized}
                          className={`w-full py-2.5 rounded-lg font-medium disabled:opacity-50 ${
                            isFinalized 
                              ? 'bg-gray-400 text-white cursor-not-allowed' 
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {saving ? 'Saving...' : isFinalized ? '🔒 Phase Finalized' : hasExistingReview ? 'Update Review' : 'Submit Review'}
                        </button>
                      </>
                    );
                  })()}

                  {/* Other Reviews */}
                  {allReviews && allReviews.reviews && allReviews.reviews.length > 0 && (
                    <div className="pt-4 border-t">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">
                        Team Reviews ({allReviews.totalReviews || 0})
                      </h5>
                      <div className="space-y-3">
                        {allReviews.reviews.map((review, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {review.reviewerName || review.reviewerEmail}
                              </span>
                              <div className="flex items-center gap-1">
                                <StarIconSolid className="w-4 h-4 text-yellow-400" />
                                <span className="text-sm">{review.scores.overall || 0}</span>
                              </div>
                            </div>
                            {/* Show question notes if this is an interview phase */}
                            {isInterviewPhase && review.questionNotes && Object.keys(review.questionNotes).length > 0 && (
                              <div className="space-y-2 mb-2">
                                {interviewQuestions.map((q, qIdx) => (
                                  review.questionNotes?.[q.key] ? (
                                    <div key={q.key} className="text-sm">
                                      <span className="font-medium text-gray-700">{qIdx + 1}. {q.question}</span>
                                      <p className="text-gray-600 mt-0.5 pl-4">{review.questionNotes[q.key]}</p>
                                    </div>
                                  ) : null
                                ))}
                              </div>
                            )}
                            {review.notes && (
                              <p className="text-sm text-gray-600">{review.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
