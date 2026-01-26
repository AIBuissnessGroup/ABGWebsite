'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  UserCircleIcon,
  ClockIcon,
  MapPinIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import type { 
  ReviewPhase, 
  ApplicationReview, 
  ScoringCategory,
  ReferralSignal,
  ReviewRecommendation,
  PhaseReviewSummary,
} from '@/types/recruitment';

interface PhaseReviewPanelProps {
  applicationId: string;
  phase: ReviewPhase;
  cycleId?: string;
  // Optional - if provided, skip fetch and use these directly
  scoringCategories?: ScoringCategory[];
  existingReview?: ApplicationReview;
  interviewDetails?: {
    bookingId?: string;
    time?: string;
    location?: string;
    interviewers?: string[];
    completed?: boolean;
  };
  isFinalized?: boolean;
  onSave?: (review: Partial<ApplicationReview>) => Promise<void>;
  onReviewSaved?: () => void;
}

const PHASE_LABELS: Record<ReviewPhase, string> = {
  application: 'Application Review',
  interview_round1: 'Round 1 (Technical) Evaluation',
  interview_round2: 'Round 2 (Behavioral) Evaluation',
};

// Default scoring categories by phase
const DEFAULT_SCORING_CATEGORIES: Record<ReviewPhase, ScoringCategory[]> = {
  application: [
    { key: 'experience', label: 'Relevant Experience', weight: 1.5, minScore: 1, maxScore: 5, description: 'Quality and relevance of past experience' },
    { key: 'writing', label: 'Written Communication', weight: 1.0, minScore: 1, maxScore: 5, description: 'Clarity and quality of written responses' },
    { key: 'fit', label: 'Cultural Fit', weight: 1.2, minScore: 1, maxScore: 5, description: 'Alignment with ABG values and mission' },
    { key: 'potential', label: 'Growth Potential', weight: 1.0, minScore: 1, maxScore: 5, description: 'Potential for development and contribution' },
  ],
  interview_round1: [
    { key: 'technical', label: 'Technical Skills', weight: 1.5, minScore: 1, maxScore: 5, description: 'Demonstrated technical competency' },
    { key: 'problem_solving', label: 'Problem Solving', weight: 1.3, minScore: 1, maxScore: 5, description: 'Approach to problem-solving' },
    { key: 'communication', label: 'Communication', weight: 1.0, minScore: 1, maxScore: 5, description: 'Verbal communication skills' },
    { key: 'enthusiasm', label: 'Enthusiasm', weight: 0.8, minScore: 1, maxScore: 5, description: 'Interest and engagement level' },
  ],
  interview_round2: [
    { key: 'leadership', label: 'Leadership', weight: 1.5, minScore: 1, maxScore: 5, description: 'Leadership potential and experience' },
    { key: 'teamwork', label: 'Teamwork', weight: 1.2, minScore: 1, maxScore: 5, description: 'Ability to work in teams' },
    { key: 'culture', label: 'Culture Fit', weight: 1.3, minScore: 1, maxScore: 5, description: 'Alignment with organizational culture' },
    { key: 'motivation', label: 'Motivation', weight: 1.0, minScore: 1, maxScore: 5, description: 'Drive and career goals' },
  ],
};

export default function PhaseReviewPanel({
  applicationId,
  phase,
  cycleId,
  scoringCategories: propCategories,
  existingReview: propReview,
  interviewDetails: propInterviewDetails,
  isFinalized: propIsFinalized = false,
  onSave: propOnSave,
  onReviewSaved,
}: PhaseReviewPanelProps) {
  // State for fetched data
  const [fetchedData, setFetchedData] = useState<{
    scoringCategories: ScoringCategory[];
    existingReview?: ApplicationReview;
    interviewDetails?: any;
    summary?: PhaseReviewSummary;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [recommendation, setRecommendation] = useState<ReviewRecommendation | undefined>();
  const [referralSignal, setReferralSignal] = useState<ReferralSignal>('neutral');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine actual values (from props or fetched)
  const scoringCategories = propCategories || fetchedData?.scoringCategories || DEFAULT_SCORING_CATEGORIES[phase];
  const existingReview = propReview || fetchedData?.existingReview;
  const interviewDetails = propInterviewDetails || fetchedData?.interviewDetails;
  const isFinalized = propIsFinalized;

  // Fetch review data from API if cycleId is provided
  const fetchReviewData = useCallback(async () => {
    if (!cycleId || propCategories) return; // Skip if using props or no cycleId
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/recruitment/phase-reviews?applicationId=${applicationId}&phase=${phase}&cycleId=${cycleId}`);
      if (res.ok) {
        const data = await res.json();
        setFetchedData({
          scoringCategories: data.scoringCategories || DEFAULT_SCORING_CATEGORIES[phase],
          existingReview: data.reviews?.[0],
          interviewDetails: data.interviewDetails,
          summary: data.summary,
        });
      }
    } catch (err) {
      console.error('Error fetching review data:', err);
    } finally {
      setLoading(false);
    }
  }, [applicationId, phase, cycleId, propCategories]);

  useEffect(() => {
    fetchReviewData();
  }, [fetchReviewData]);

  // Initialize from existing review
  useEffect(() => {
    if (existingReview) {
      setScores(existingReview.scores || {});
      setNotes(existingReview.notes || '');
      setRecommendation(existingReview.recommendation);
      setReferralSignal(existingReview.referralSignal || 'neutral');
    } else {
      // Initialize all scores to 0
      const initialScores: Record<string, number> = {};
      scoringCategories.forEach(cat => {
        initialScores[cat.key] = 0;
      });
      setScores(initialScores);
    }
  }, [existingReview, scoringCategories]);

  const handleScoreChange = (key: string, value: number) => {
    setScores(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (isFinalized) {
      setError('Cannot modify reviews for a finalized phase');
      return;
    }

    setSaving(true);
    setError(null);

    const reviewData = {
      applicationId,
      phase,
      scores,
      notes,
      recommendation,
      referralSignal,
    };

    try {
      if (propOnSave) {
        // Use provided callback
        await propOnSave(reviewData);
      } else {
        // Use API directly
        const res = await fetch('/api/admin/recruitment/phase-reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reviewData),
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to save review');
        }
      }
      onReviewSaved?.();
    } catch (err: any) {
      setError(err.message || 'Failed to save review');
    } finally {
      setSaving(false);
    }
  };

  const renderStarRating = (key: string, category: ScoringCategory) => {
    const currentScore = scores[key] || 0;
    const maxScore = category.maxScore;
    const starDescriptions = category.starDescriptions;
    const currentDescription = currentScore > 0 && starDescriptions?.[currentScore as 1|2|3|4|5];
    
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          {Array.from({ length: maxScore }, (_, i) => i + 1).map(star => {
            const description = starDescriptions?.[star as 1|2|3|4|5];
            return (
              <button
                key={star}
                type="button"
                disabled={isFinalized}
                onClick={() => handleScoreChange(key, star)}
                title={description || `${star} star${star > 1 ? 's' : ''}`}
                className={`transition-colors ${isFinalized ? 'cursor-not-allowed' : 'hover:scale-110'}`}
              >
                {star <= currentScore ? (
                  <StarIconSolid className="w-6 h-6 text-yellow-400" />
                ) : (
                  <StarIcon className="w-6 h-6 text-gray-400 hover:text-yellow-300" />
                )}
              </button>
            );
          })}
          <span className="ml-2 text-sm text-gray-300">{currentScore}/{maxScore}</span>
        </div>
        {currentDescription && (
          <span className="text-xs text-yellow-300/80 italic">{currentDescription}</span>
        )}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white/10 rounded-xl p-12 flex flex-col items-center justify-center">
        <ArrowPathIcon className="w-8 h-8 text-white/50 animate-spin" />
        <p className="text-white/60 mt-3">Loading review data...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{PHASE_LABELS[phase]}</h3>
        {isFinalized && (
          <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm">
            Finalized - Read Only
          </span>
        )}
      </div>

      {/* Interview Details (for interview phases) */}
      {(phase === 'interview_round1' || phase === 'interview_round2') && interviewDetails && (
        <div className="bg-white/5 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-medium text-white/80 mb-3">Interview Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-white/70">
              <ClockIcon className="w-4 h-4" />
              <span>{interviewDetails.time ? new Date(interviewDetails.time).toLocaleString() : 'Not scheduled'}</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <MapPinIcon className="w-4 h-4" />
              <span>{interviewDetails.location || 'Location TBD'}</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <UserCircleIcon className="w-4 h-4" />
              <span>{interviewDetails.interviewers?.join(', ') || 'Interviewer TBD'}</span>
            </div>
            <div className="flex items-center gap-2">
              {interviewDetails.completed ? (
                <span className="text-green-400 flex items-center gap-1">
                  <CheckCircleIcon className="w-4 h-4" />
                  Completed
                </span>
              ) : (
                <span className="text-yellow-400 flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" />
                  Pending
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scoring Categories */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-white/80">Scoring</h4>
        {scoringCategories.map(category => (
          <div key={category.key} className="flex items-center justify-between">
            <div>
              <span className="text-white">{category.label}</span>
              {category.description && (
                <p className="text-xs text-white/50">{category.description}</p>
              )}
              <span className="text-xs text-white/40 ml-2">
                (Weight: {Math.round(category.weight * 100)}%)
              </span>
            </div>
            {renderStarRating(category.key, category)}
          </div>
        ))}
      </div>

      {/* Referral Signal */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-white/80">Your Signal</h4>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={isFinalized}
            onClick={() => setReferralSignal('referral')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              referralSignal === 'referral'
                ? 'bg-green-500/30 border-green-400 text-green-300'
                : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
            } ${isFinalized ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <ArrowUpIcon className="w-4 h-4" />
            Strong Advocate
          </button>
          <button
            type="button"
            disabled={isFinalized}
            onClick={() => setReferralSignal('neutral')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              referralSignal === 'neutral'
                ? 'bg-gray-500/30 border-gray-400 text-gray-300'
                : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
            } ${isFinalized ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <MinusIcon className="w-4 h-4" />
            Neutral
          </button>
          <button
            type="button"
            disabled={isFinalized}
            onClick={() => setReferralSignal('deferral')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              referralSignal === 'deferral'
                ? 'bg-red-500/30 border-red-400 text-red-300'
                : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
            } ${isFinalized ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <ArrowDownIcon className="w-4 h-4" />
            Strong Oppose
          </button>
        </div>
      </div>

      {/* Recommendation */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-white/80">Recommendation</h4>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={isFinalized}
            onClick={() => setRecommendation('advance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              recommendation === 'advance'
                ? 'bg-green-500/30 border-green-400 text-green-300'
                : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
            } ${isFinalized ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <CheckCircleIcon className="w-4 h-4" />
            Advance
          </button>
          <button
            type="button"
            disabled={isFinalized}
            onClick={() => setRecommendation('hold')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              recommendation === 'hold'
                ? 'bg-yellow-500/30 border-yellow-400 text-yellow-300'
                : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
            } ${isFinalized ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <ClockIcon className="w-4 h-4" />
            Hold
          </button>
          <button
            type="button"
            disabled={isFinalized}
            onClick={() => setRecommendation('reject')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              recommendation === 'reject'
                ? 'bg-red-500/30 border-red-400 text-red-300'
                : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
            } ${isFinalized ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <XCircleIcon className="w-4 h-4" />
            Reject
          </button>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-white/80">Notes</h4>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isFinalized}
          placeholder="Add your notes about this applicant..."
          className="w-full h-32 bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Save Button */}
      {!isFinalized && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4" />
                {existingReview ? 'Update Review' : 'Submit Review'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
