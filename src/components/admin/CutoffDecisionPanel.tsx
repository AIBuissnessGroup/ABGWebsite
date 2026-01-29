'use client';

import { useState } from 'react';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import type { 
  ReviewPhase, 
  CutoffCriteria,
  PhaseCompleteness,
  RankedApplicant,
  ApplicationTrack,
} from '@/types/recruitment';

interface CutoffDecisionPanelProps {
  phase: ReviewPhase;
  completeness: PhaseCompleteness;
  rankings: RankedApplicant[];
  manualOverrides: Array<{ applicationId: string; action: 'advance' | 'reject'; reason: string }>;
  isFinalized: boolean;
  onApplyCutoff: (criteria: CutoffCriteria, sendEmails: boolean) => Promise<void>;
  trackFilter?: ApplicationTrack | '';  // Current track filter selection
}

const PHASE_LABELS: Record<ReviewPhase, string> = {
  application: 'Application Review',
  interview_round1: 'Round 1 Technical',
  interview_round2: 'Round 2 Behavioral',
};

const NEXT_STAGE_LABELS: Record<ReviewPhase, string> = {
  application: 'Round 1 Interviews',
  interview_round1: 'Round 2 Interviews',
  interview_round2: 'Final Acceptance',
};

export default function CutoffDecisionPanel({
  phase,
  completeness,
  rankings,
  manualOverrides,
  isFinalized,
  onApplyCutoff,
  trackFilter,
}: CutoffDecisionPanelProps) {
  const [cutoffType, setCutoffType] = useState<CutoffCriteria['type']>('top_n');
  const [topN, setTopN] = useState<number>(10);
  const [minScore, setMinScore] = useState<number>(3);
  const [sendEmails, setSendEmails] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate preview of who would be advanced/rejected
  const getPreview = () => {
    const overrideMap = new Map(manualOverrides.map(o => [o.applicationId, o.action]));
    let advanced: RankedApplicant[] = [];
    let rejected: RankedApplicant[] = [];

    rankings.forEach((r, idx) => {
      const override = overrideMap.get(r.applicationId);
      
      if (override) {
        if (override === 'advance') advanced.push(r);
        else rejected.push(r);
      } else {
        let shouldAdvance = false;
        
        switch (cutoffType) {
          case 'top_n':
            shouldAdvance = idx < topN;
            break;
          case 'min_score':
            shouldAdvance = r.weightedScore >= minScore;
            break;
          case 'manual':
            shouldAdvance = false;
            break;
        }
        
        if (shouldAdvance) advanced.push(r);
        else rejected.push(r);
      }
    });

    return { advanced, rejected };
  };

  const preview = getPreview();

  const handleApply = async () => {
    setApplying(true);
    setError(null);

    try {
      const criteria: CutoffCriteria = {
        type: cutoffType,
        topN: cutoffType === 'top_n' ? topN : undefined,
        minScore: cutoffType === 'min_score' ? minScore : undefined,
        includeManualOverrides: manualOverrides.length > 0,
      };

      await onApplyCutoff(criteria, sendEmails);
      setShowConfirmation(false);
    } catch (err: any) {
      setError(err.message || 'Failed to apply cutoff');
    } finally {
      setApplying(false);
    }
  };

  if (isFinalized) {
    return (
      <div className="bg-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 text-yellow-400">
          <LockClosedIcon className="w-6 h-6" />
          <span className="font-medium">This phase has been finalized</span>
        </div>
        <p className="text-white/60 mt-2 text-sm">
          Decisions have been made and applicants have been transitioned. 
          Rankings and decisions are now locked.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Track Filter Warning - show when no track is selected */}
      {!trackFilter && (
        <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-400 flex-shrink-0" />
          <div>
            <h4 className="text-red-300 font-medium">⚠️ No Track Selected</h4>
            <p className="text-red-200/70 text-sm">
              You must select a specific track filter before applying cutoff. 
              Applying cutoff without a track will affect <strong>all tracks</strong> at once.
              Please select Business, Engineering, or AI Investment Fund from the filter dropdown above.
            </p>
          </div>
        </div>
      )}

      {/* Completeness Warning */}
      {completeness.applicantsFullyReviewed < completeness.totalApplicants && (
        <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-4 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400 flex-shrink-0" />
          <div>
            <h4 className="text-yellow-300 font-medium">Incomplete Reviews</h4>
            <p className="text-yellow-200/70 text-sm">
              Only {completeness.applicantsFullyReviewed} of {completeness.totalApplicants} applicants 
              have been fully reviewed. Consider waiting for all reviews before applying cutoff.
            </p>
          </div>
        </div>
      )}

      {/* Cutoff Configuration */}
      <div className="bg-white/10 rounded-xl p-6 space-y-6">
        <h3 className="text-lg font-semibold text-white">Configure Cutoff</h3>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              checked={cutoffType === 'top_n'}
              onChange={() => setCutoffType('top_n')}
              className="w-4 h-4 accent-blue-500"
            />
            <div className="flex-1">
              <span className="text-white">Top N Applicants</span>
              <p className="text-xs text-white/50">Advance the top-ranked applicants</p>
            </div>
            {cutoffType === 'top_n' && (
              <input
                type="number"
                value={topN}
                onChange={(e) => setTopN(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                max={rankings.length}
                className="w-20 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-center"
              />
            )}
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              checked={cutoffType === 'min_score'}
              onChange={() => setCutoffType('min_score')}
              className="w-4 h-4 accent-blue-500"
            />
            <div className="flex-1">
              <span className="text-white">Minimum Score</span>
              <p className="text-xs text-white/50">Advance all applicants above a score threshold</p>
            </div>
            {cutoffType === 'min_score' && (
              <input
                type="number"
                value={minScore}
                onChange={(e) => setMinScore(Math.max(0, parseFloat(e.target.value) || 0))}
                min={0}
                max={5}
                step={0.1}
                className="w-20 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-center"
              />
            )}
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              checked={cutoffType === 'manual'}
              onChange={() => setCutoffType('manual')}
              className="w-4 h-4 accent-blue-500"
            />
            <div className="flex-1">
              <span className="text-white">Manual Only</span>
              <p className="text-xs text-white/50">Only apply manual overrides, reject all others</p>
            </div>
          </label>
        </div>

        {/* Manual Overrides Summary */}
        {manualOverrides.length > 0 && (
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white/80 mb-2">Manual Overrides ({manualOverrides.length})</h4>
            <div className="space-y-1 text-sm">
              {manualOverrides.filter(o => o.action === 'advance').length > 0 && (
                <div className="text-green-400">
                  ✓ {manualOverrides.filter(o => o.action === 'advance').length} forced advances
                </div>
              )}
              {manualOverrides.filter(o => o.action === 'reject').length > 0 && (
                <div className="text-red-400">
                  ✗ {manualOverrides.filter(o => o.action === 'reject').length} forced rejections
                </div>
              )}
            </div>
          </div>
        )}

        {/* Email Option */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={sendEmails}
            onChange={(e) => setSendEmails(e.target.checked)}
            className="w-4 h-4 accent-blue-500 rounded"
          />
          <div>
            <span className="text-white flex items-center gap-2">
              <EnvelopeIcon className="w-4 h-4" />
              Send notification emails
            </span>
            <p className="text-xs text-white/50">
              Automatically send advance/rejection emails to all applicants
            </p>
          </div>
        </label>
      </div>

      {/* Preview */}
      <div className="bg-white/10 rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Preview</h3>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="font-medium">Will Advance</span>
            </div>
            <div className="text-3xl font-bold text-green-300">{preview.advanced.length}</div>
            <p className="text-xs text-green-400/70 mt-1">
              → {NEXT_STAGE_LABELS[phase]}
            </p>
          </div>
          
          <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span className="font-medium">Will Reject</span>
            </div>
            <div className="text-3xl font-bold text-red-300">{preview.rejected.length}</div>
            <p className="text-xs text-red-400/70 mt-1">
              → Rejected
            </p>
          </div>
        </div>

        {/* Cutoff Line Preview */}
        {cutoffType === 'top_n' && rankings.length > 0 && (
          <div className="mt-4 p-4 bg-white/5 rounded-lg">
            <div className="text-sm text-white/70 mb-2">Cutoff line after:</div>
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500/30 px-3 py-1 rounded text-yellow-300 text-sm font-medium">
                #{Math.min(topN, rankings.length)}
              </div>
              <ArrowRightIcon className="w-4 h-4 text-white/40" />
              <div className="text-white">
                {rankings[Math.min(topN - 1, rankings.length - 1)]?.applicantName || 'N/A'}
              </div>
              <div className="text-white/50 text-sm">
                (Score: {rankings[Math.min(topN - 1, rankings.length - 1)]?.weightedScore.toFixed(2) || 'N/A'})
              </div>
            </div>
          </div>
        )}

        {cutoffType === 'min_score' && (
          <div className="mt-4 p-4 bg-white/5 rounded-lg">
            <div className="text-sm text-white/70">
              All applicants with score ≥ {minScore.toFixed(1)} will advance
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Apply Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowConfirmation(true)}
          disabled={!trackFilter}
          className={`px-6 py-3 text-white rounded-lg font-medium transition-colors flex items-center gap-2 ${
            !trackFilter 
              ? 'bg-gray-500 cursor-not-allowed opacity-50' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          title={!trackFilter ? 'Select a track filter first' : undefined}
        >
          <LockClosedIcon className="w-5 h-5" />
          Apply Cutoff & Finalize{trackFilter ? ` (${trackFilter})` : ''}
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#00274c] border border-white/20 rounded-xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400" />
              Confirm Cutoff Application
            </h3>
            
            <div className="space-y-4 text-white/80">
              <p>You are about to:</p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li><span className="text-green-400">Advance {preview.advanced.length}</span> applicants to {NEXT_STAGE_LABELS[phase]}</li>
                <li><span className="text-red-400">Reject {preview.rejected.length}</span> applicants</li>
                {sendEmails && (
                  <li><span className="text-blue-400">Send notification emails</span> to all affected applicants</li>
                )}
                <li><span className="text-yellow-400">Finalize</span> this phase (rankings will be locked)</li>
              </ul>
              
              <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-3 text-red-300 text-sm">
                ⚠️ This action cannot be undone. Make sure all reviews are complete and you have verified the rankings.
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={applying}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {applying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <LockClosedIcon className="w-4 h-4" />
                    Confirm & Finalize
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
