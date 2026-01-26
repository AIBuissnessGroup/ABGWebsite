'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon,
  LockClosedIcon,
  LockOpenIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ArrowUturnLeftIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useAdminApi } from '@/hooks/useAdminApi';
import { useCycle } from '../layout';
import { AdminLoadingState } from '@/components/admin/ui';
import { TRACKS, getTrackLabel } from '@/lib/tracks';
import type { 
  ReviewPhase, 
  PhaseConfig, 
  PhaseRanking, 
  RankedApplicant,
  PhaseCompleteness,
  ReviewerCompletion,
  ApplicationTrack,
} from '@/types/recruitment';

type PhaseTab = 'application' | 'interview_round1' | 'interview_round2';

// Simplified scoring category for UI
interface SimpleScoringCategory {
  key: string;
  label: string;
  weight: number;
  starDescriptions?: {
    1?: string;
    2?: string;
    3?: string;
    4?: string;
    5?: string;
  };
}

// Map phases to their corresponding application stages
const PHASE_INFO: Record<PhaseTab, { 
  label: string; 
  description: string; 
  stages: string[]; // Application stages included in this phase
}> = {
  application: {
    label: 'Application Review',
    description: 'Score and rank applicants based on their written applications',
    stages: ['submitted', 'under_review'],
  },
  interview_round1: {
    label: 'Round 1 Interview',
    description: 'Technical interview scoring and ranking',
    stages: ['interview_round1'],
  },
  interview_round2: {
    label: 'Round 2 Interview',
    description: 'Behavioral interview scoring and final decisions',
    stages: ['interview_round2'],
  },
};

const DEFAULT_CATEGORIES: Record<PhaseTab, SimpleScoringCategory[]> = {
  application: [
    { key: 'experience', label: 'Experience', weight: 1.0 },
    { key: 'writing', label: 'Writing Quality', weight: 1.0 },
    { key: 'fit', label: 'Organization Fit', weight: 1.0 },
    { key: 'potential', label: 'Growth Potential', weight: 1.0 },
  ],
  interview_round1: [
    { key: 'technical', label: 'Technical Skills', weight: 1.5 },
    { key: 'problem_solving', label: 'Problem Solving', weight: 1.5 },
    { key: 'communication', label: 'Communication', weight: 1.0 },
    { key: 'enthusiasm', label: 'Enthusiasm', weight: 0.5 },
  ],
  interview_round2: [
    { key: 'leadership', label: 'Leadership', weight: 1.0 },
    { key: 'teamwork', label: 'Teamwork', weight: 1.5 },
    { key: 'culture', label: 'Culture Fit', weight: 1.5 },
    { key: 'motivation', label: 'Motivation', weight: 1.0 },
  ],
};

export default function RankingsPage() {
  const params = useParams();
  const { data: session } = useSession();
  const cycleId = params.cycleId as string;
  const { cycle } = useCycle();
  const { get, post, put } = useAdminApi();

  const [activePhase, setActivePhase] = useState<PhaseTab>('application');
  const [filterTrack, setFilterTrack] = useState<ApplicationTrack | ''>('');
  const [loading, setLoading] = useState(true);
  const [phaseConfigs, setPhaseConfigs] = useState<Record<string, PhaseConfig>>({});
  const [ranking, setRanking] = useState<PhaseRanking | null>(null);
  const [completeness, setCompleteness] = useState<PhaseCompleteness | null>(null);
  const [incompleteAdmins, setIncompleteAdmins] = useState<{ email: string; reviewed: number; total: number }[]>([]);
  // Applicant counts per phase (based on application stage)
  const [phaseCounts, setPhaseCounts] = useState<Record<PhaseTab, number>>({
    application: 0,
    interview_round1: 0,
    interview_round2: 0,
  });
  // Settings mode
  const [showSettings, setShowSettings] = useState(false);
  const [editingCategories, setEditingCategories] = useState<SimpleScoringCategory[]>([]);
  const [minReviewersRequired, setMinReviewersRequired] = useState<number>(2);
  const [referralWeights, setReferralWeights] = useState<{ advocate: number; oppose: number }>({ advocate: 1, oppose: -1 });
  const [interviewQuestions, setInterviewQuestions] = useState<{ key: string; question: string }[]>([]);
  const [useZScoreNormalization, setUseZScoreNormalization] = useState<boolean>(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Cutoff mode
  const [cutoffCount, setCutoffCount] = useState<number>(10);
  const [showCutoffPreview, setShowCutoffPreview] = useState(false);
  const [applyingCutoff, setApplyingCutoff] = useState(false);
  
  // Unlock/Revert mode
  const [unlocking, setUnlocking] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  
  // Override mode - allow finalization without all admins completing reviews
  const [forceFinalize, setForceFinalize] = useState(false);
  
  // Manual overrides
  const [overrides, setOverrides] = useState<Record<string, { action: 'advance' | 'reject'; reason: string }>>({});

  const [expandedApplicant, setExpandedApplicant] = useState<string | null>(null);

  const loadPhaseData = async () => {
    try {
      setLoading(true);
      const trackParam = filterTrack ? `&track=${filterTrack}` : '';
      
      // Load phase configs
      const configs = await get<PhaseConfig[]>(`/api/admin/recruitment/phase-configs?cycleId=${cycleId}${trackParam}`);
      const configMap: Record<string, PhaseConfig> = {};
      configs.forEach(c => { configMap[c.phase] = c; });
      setPhaseConfigs(configMap);
      
      // Load ranking and completeness for active phase
      const rankingData = await get<{
        ranking: PhaseRanking;
        completeness: PhaseCompleteness;
        phaseConfig: PhaseConfig;
        isFinalized: boolean;
        incompleteAdmins?: { email: string; reviewed: number; total: number }[];
      }>(`/api/admin/recruitment/phase-rankings?cycleId=${cycleId}&phase=${activePhase}${trackParam}`);
      
      setRanking(rankingData.ranking);
      setCompleteness(rankingData.completeness);
      setIncompleteAdmins(rankingData.incompleteAdmins || []);
      
      // Set default cutoff to half of applicants
      if (rankingData.ranking?.rankings) {
        setCutoffCount(Math.ceil(rankingData.ranking.rankings.length / 2));
      }
      
      // Initialize editing categories from config or defaults
      const currentConfig = configMap[activePhase];
      console.log('Loaded phase config:', activePhase, currentConfig);
      console.log('Loaded scoringCategories:', JSON.stringify(currentConfig?.scoringCategories, null, 2));
      if (currentConfig?.scoringCategories) {
        setEditingCategories(currentConfig.scoringCategories);
      } else {
        setEditingCategories(DEFAULT_CATEGORIES[activePhase]);
      }
      // Initialize minReviewersRequired from config or default to 2
      setMinReviewersRequired(currentConfig?.minReviewersRequired ?? 2);
      // Initialize referral weights from config or defaults
      setReferralWeights(currentConfig?.referralWeights ?? { advocate: 1, oppose: -1 });
      // Initialize interview questions from config
      setInterviewQuestions(currentConfig?.interviewQuestions ?? []);
      // Initialize z-score normalization setting
      setUseZScoreNormalization(currentConfig?.useZScoreNormalization ?? false);
    } catch (error) {
      console.error('Error loading phase data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load phase counts (applicant counts by stage/phase)
  const loadPhaseCounts = async () => {
    try {
      const trackParam = filterTrack ? `&track=${filterTrack}` : '';
      const data = await get<{ phaseCounts: Record<PhaseTab, number> }>(
        `/api/admin/recruitment/phase-rankings?cycleId=${cycleId}&mode=counts${trackParam}`
      );
      if (data.phaseCounts) {
        setPhaseCounts(data.phaseCounts);
      }
    } catch (error) {
      console.error('Error loading phase counts:', error);
    }
  };

  useEffect(() => {
    if (cycleId) {
      // Initialize phase configs if they don't exist
      post('/api/admin/recruitment/phase-configs', { cycleId, action: 'initialize' })
        .then(() => {
          loadPhaseData();
          loadPhaseCounts();
        })
        .catch(() => {
          loadPhaseData();
          loadPhaseCounts();
        });
    }
  }, [cycleId]);

  useEffect(() => {
    if (cycleId) {
      loadPhaseData();
      loadPhaseCounts();
    }
  }, [activePhase, filterTrack]);

  // Refresh counts after applying cutoff
  const refreshAfterCutoff = async () => {
    await loadPhaseData();
    await loadPhaseCounts();
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      console.log('Saving settings with categories:', JSON.stringify(editingCategories, null, 2));
      // Note: We save settings WITHOUT track filter - scoring categories/settings apply to all tracks
      await put('/api/admin/recruitment/phase-configs', {
        cycleId,
        phase: activePhase,
        // Don't include track - settings are shared across all tracks
        scoringCategories: editingCategories,
        minReviewersRequired,
        referralWeights,
        interviewQuestions: isInterviewPhase ? interviewQuestions : undefined,
        useZScoreNormalization,
      }, {
        successMessage: 'Phase settings saved (applies to all tracks)',
      });
      await loadPhaseData();
      setShowSettings(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleApplyCutoff = async () => {
    if (!ranking) return;
    
    // Build manual overrides array
    const manualOverrides = Object.entries(overrides).map(([id, override]) => ({
      applicationId: id,
      action: override.action,
      reason: override.reason,
    }));

    try {
      setApplyingCutoff(true);
      await post('/api/admin/recruitment/phase-cutoffs', {
        cycleId,
        phase: activePhase,
        track: filterTrack || undefined,  // Only apply to filtered track
        cutoffCriteria: {
          type: 'top_n',
          topN: cutoffCount,
          includeManualOverrides: true,
        },
        manualOverrides,
        sendEmails: false, // Don't auto-send - let them do it from communications
        finalizeAfter: true, // Lock the phase after applying cutoff
        forceFinalize, // Allow skipping admin completion check
      }, {
        successMessage: `Applied cutoff: advancing top ${cutoffCount} applicants${filterTrack ? ` for ${filterTrack}` : ''}`,
      });
      await refreshAfterCutoff(); // Refresh data and counts
      setShowCutoffPreview(false);
      setOverrides({});
      setForceFinalize(false); // Reset override
    } catch (error) {
      console.error('Error applying cutoff:', error);
    } finally {
      setApplyingCutoff(false);
    }
  };

  const handleUnlockPhase = async () => {
    try {
      setUnlocking(true);
      await put('/api/admin/recruitment/phase-configs', {
        cycleId,
        phase: activePhase,
        action: 'unlock',
      }, {
        successMessage: 'Phase unlocked. You can now make changes.',
      });
      await loadPhaseData();
    } catch (error) {
      console.error('Error unlocking phase:', error);
    } finally {
      setUnlocking(false);
    }
  };

  const handleRevertPhase = async () => {
    try {
      setReverting(true);
      const result = await put<{ revertedCount: number; message: string }>('/api/admin/recruitment/phase-configs', {
        cycleId,
        phase: activePhase,
        action: 'revert',
      }, {
        successMessage: 'Phase reverted. Applicants have been moved back to previous stage.',
      });
      await refreshAfterCutoff(); // Refresh data and counts
      setShowRevertConfirm(false);
    } catch (error) {
      console.error('Error reverting phase:', error);
    } finally {
      setReverting(false);
    }
  };

  const toggleOverride = (applicationId: string, currentRank: number) => {
    const isAboveCutoff = currentRank <= cutoffCount;
    const currentOverride = overrides[applicationId];
    
    if (!currentOverride) {
      // First click: set opposite of natural position
      setOverrides({
        ...overrides,
        [applicationId]: {
          action: isAboveCutoff ? 'reject' : 'advance',
          reason: '',
        },
      });
    } else if (currentOverride.action === (isAboveCutoff ? 'reject' : 'advance')) {
      // Second click: remove override (back to natural)
      const newOverrides = { ...overrides };
      delete newOverrides[applicationId];
      setOverrides(newOverrides);
    }
  };

  const currentConfig = phaseConfigs[activePhase];
  const isFinalized = currentConfig?.status === 'finalized';
  const isInterviewPhase = activePhase === 'interview_round1' || activePhase === 'interview_round2';

  if (loading) {
    return <AdminLoadingState message="Loading rankings..." />;
  }

  return (
    <div className="space-y-6">
      {/* Phase Tabs and Track Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-xl border p-1 inline-flex gap-1">
            {Object.entries(PHASE_INFO).map(([phase, info]) => {
              const config = phaseConfigs[phase];
              const isActive = activePhase === phase;
              return (
                <button
                  key={phase}
                  onClick={() => setActivePhase(phase as PhaseTab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {config?.status === 'finalized' && (
                    <LockClosedIcon className="w-4 h-4" />
                  )}
                  {info.label}
                  {/* Show applicant count based on application stage */}
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                    isActive 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {phaseCounts[phase as PhaseTab] || 0}
                  </span>
                </button>
              );
            })}
          </div>
          
          {/* Track Filter */}
          <select
            value={filterTrack}
            onChange={(e) => setFilterTrack(e.target.value as ApplicationTrack | '')}
            className="px-3 py-2 border rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Tracks</option>
            {TRACKS.map((track) => (
              <option key={track.value} value={track.value}>
                {track.label}
              </option>
            ))}
          </select>
        </div>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
        >
          <Cog6ToothIcon className="w-4 h-4" />
          Phase Settings
        </button>
      </div>

      {/* Phase Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">{PHASE_INFO[activePhase].label}</h3>
            <p className="text-sm text-blue-700 mt-1">{PHASE_INFO[activePhase].description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600">Application Stages:</span>
            {PHASE_INFO[activePhase].stages.map((stage) => (
              <span 
                key={stage}
                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
              >
                {stage.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
        {(isFinalized || currentConfig?.cutoffAppliedAt) && (
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 text-blue-800">
              <LockClosedIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isFinalized ? 'This phase has been finalized' : 'Cutoff has been applied'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isFinalized && (
                <button
                  onClick={handleUnlockPhase}
                  disabled={unlocking}
                  className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                >
                  {unlocking ? 'Unlocking...' : '🔓 Unlock Phase'}
                </button>
              )}
              <button
                onClick={() => setShowRevertConfirm(true)}
                className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200"
              >
                ↩️ Revert & Unlock
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Revert Confirmation Modal */}
      {showRevertConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Revert Phase?</h3>
            <p className="text-sm text-gray-600">
              This will move all applicants back to their previous stage before this phase was finalized.
              For example, if this is the Application phase, applicants who were advanced to Round 1 will be moved back to &quot;Under Review&quot;.
            </p>
            <p className="text-sm text-amber-600 font-medium">
              ⚠️ This action cannot be undone. You&apos;ll need to re-apply the cutoff after making changes.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRevertConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleRevertPhase}
                disabled={reverting}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
              >
                {reverting ? 'Reverting...' : 'Yes, Revert Phase'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Review Completion Warning */}
      {!isFinalized && incompleteAdmins.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-amber-600 text-xl">⚠️</div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900">
                {incompleteAdmins.length} admin{incompleteAdmins.length !== 1 ? 's' : ''} have not completed their reviews
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                All admins must review all {completeness?.totalApplicants || 0} applicants before the phase can be finalized.
              </p>
              <div className="mt-3 space-y-1">
                {incompleteAdmins.map((admin) => (
                  <div key={admin.email} className="flex items-center justify-between text-sm">
                    <span className="text-amber-800">{admin.email}</span>
                    <span className="text-amber-600 font-medium">
                      {admin.reviewed}/{admin.total} reviewed ({Math.round((admin.reviewed / admin.total) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Reviews Complete Message */}
      {!isFinalized && incompleteAdmins.length === 0 && completeness && completeness.totalApplicants > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="text-green-600 text-xl">✅</div>
            <div>
              <h3 className="font-semibold text-green-900">All admins have completed their reviews!</h3>
              <p className="text-sm text-green-700 mt-1">
                You can now apply the cutoff and finalize this phase.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white rounded-xl border p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Phase Settings</h3>
            {isFinalized && (
              <span className="text-sm text-amber-600 flex items-center gap-1">
                <LockClosedIcon className="w-4 h-4" />
                Phase finalized - settings locked
              </span>
            )}
          </div>

          {/* Reviewers per Application */}
          <div className="pb-4 border-b">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reviewers Required per Application
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Set the minimum number of reviewers that must review each application in this phase.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={minReviewersRequired}
                onChange={(e) => setMinReviewersRequired(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={isFinalized}
                min={1}
                max={20}
                className="w-24 px-3 py-2 border rounded-lg text-sm disabled:bg-gray-100"
              />
              <span className="text-sm text-gray-500">reviewers per application</span>
            </div>
          </div>

          {/* Referral Weights */}
          <div className="pb-4 border-b">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referral Weights
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Configure how much referral signals (thumbs up/down) affect the ranking. 
              These weights are added to the weighted score for tie-breaking.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">👍 Advocate Weight</label>
                <input
                  type="number"
                  value={referralWeights.advocate}
                  onChange={(e) => setReferralWeights({ ...referralWeights, advocate: parseFloat(e.target.value) || 0 })}
                  disabled={isFinalized}
                  step={0.1}
                  className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">👎 Oppose Weight</label>
                <input
                  type="number"
                  value={referralWeights.oppose}
                  onChange={(e) => setReferralWeights({ ...referralWeights, oppose: parseFloat(e.target.value) || 0 })}
                  disabled={isFinalized}
                  step={0.1}
                  className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-gray-100"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Example: With advocate=0.5 and oppose=-0.5, an applicant with 3 advocates and 1 oppose gets +1.0 added to their score.
            </p>
          </div>

          {/* Z-Score Normalization */}
          <div className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Score Normalization (Z-Score)
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  Automatically adjust scores to account for different reviewer tendencies. 
                  Harsh scorers and lenient scorers will contribute equally to rankings.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUseZScoreNormalization(!useZScoreNormalization)}
                disabled={isFinalized}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                  useZScoreNormalization ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    useZScoreNormalization ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {useZScoreNormalization && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>How it works:</strong> Each reviewer&apos;s scores are converted to z-scores based on their 
                  personal scoring average and spread. This means a &quot;3&quot; from a harsh scorer may be equivalent 
                  to a &quot;4&quot; from a lenient scorer after normalization.
                </p>
              </div>
            )}
          </div>

          {/* Scoring Categories */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Scoring Categories & Weights</h4>
            <p className="text-sm text-gray-600 mb-4">
              Configure the scoring categories and their weights for this phase. 
              Higher weights mean that category counts more in the final score.
            </p>

          <div className="space-y-4">
            {editingCategories.map((cat, idx) => (
              <div key={cat.key} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={cat.label}
                    onChange={(e) => {
                      const updated = [...editingCategories];
                      updated[idx] = { ...cat, label: e.target.value };
                      setEditingCategories(updated);
                    }}
                    disabled={isFinalized}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm disabled:bg-gray-100"
                    placeholder="Category name"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Weight:</span>
                    <input
                      type="number"
                      value={cat.weight}
                      onChange={(e) => {
                        const updated = [...editingCategories];
                        updated[idx] = { ...cat, weight: parseFloat(e.target.value) || 1 };
                        setEditingCategories(updated);
                      }}
                      disabled={isFinalized}
                      min={0.1}
                      max={5}
                      step={0.1}
                      className="w-20 px-3 py-2 border rounded-lg text-sm disabled:bg-gray-100"
                    />
                  </div>
                  {!isFinalized && editingCategories.length > 1 && (
                    <button
                      onClick={() => {
                        setEditingCategories(editingCategories.filter((_, i) => i !== idx));
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <XCircleIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {/* Star Rating Descriptions */}
                <details className="mt-3">
                  <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                    ★ Configure star descriptions (helps reviewers understand what each rating means)
                  </summary>
                  <div className="mt-3 space-y-2 pl-2 border-l-2 border-blue-200">
                    {[5, 4, 3, 2, 1].map(star => (
                      <div key={star} className="flex items-start gap-2">
                        <span className="text-yellow-500 font-bold w-8 flex-shrink-0">{star} ★</span>
                        <input
                          type="text"
                          value={cat.starDescriptions?.[star as 1|2|3|4|5] || ''}
                          onChange={(e) => {
                            const updated = [...editingCategories];
                            updated[idx] = {
                              ...cat,
                              starDescriptions: {
                                ...cat.starDescriptions,
                                [star]: e.target.value,
                              },
                            };
                            setEditingCategories(updated);
                          }}
                          disabled={isFinalized}
                          className="flex-1 px-2 py-1 border rounded text-sm disabled:bg-gray-100"
                          placeholder={`Description for ${star} star${star > 1 ? 's' : ''} (e.g., "${star === 5 ? 'Exceptional - exceeds expectations' : star === 4 ? 'Strong - above average' : star === 3 ? 'Average - meets expectations' : star === 2 ? 'Below average - needs improvement' : 'Poor - does not meet expectations'}")`}
                        />
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            ))}
          </div>

          {!isFinalized && (
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => {
                  setEditingCategories([
                    ...editingCategories,
                    { key: `custom_${Date.now()}`, label: 'New Category', weight: 1.0 },
                  ]);
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Category
              </button>
            </div>
          )}
          </div>

          {/* Interview Questions - Only show for interview phases */}
          {isInterviewPhase && (
            <div className="pb-4 border-b">
              <h4 className="font-medium text-gray-900 mb-2">Interview Questions</h4>
              <p className="text-sm text-gray-600 mb-4">
                Configure the interview questions for this phase. Reviewers will be able to take notes under each question.
              </p>
              
              <div className="space-y-3">
                {interviewQuestions.map((q, idx) => (
                  <div key={q.key} className="flex items-start gap-3">
                    <span className="text-sm text-gray-500 font-medium mt-2.5 w-6">{idx + 1}.</span>
                    <textarea
                      value={q.question}
                      onChange={(e) => {
                        const updated = [...interviewQuestions];
                        updated[idx] = { ...q, question: e.target.value };
                        setInterviewQuestions(updated);
                      }}
                      disabled={isFinalized}
                      rows={2}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm disabled:bg-gray-100 resize-none"
                      placeholder="Enter interview question..."
                    />
                    {!isFinalized && (
                      <button
                        onClick={() => {
                          setInterviewQuestions(interviewQuestions.filter((_, i) => i !== idx));
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded mt-1"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                
                {interviewQuestions.length === 0 && (
                  <p className="text-sm text-gray-400 italic">No interview questions configured yet.</p>
                )}
              </div>

              {!isFinalized && (
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setInterviewQuestions([
                        ...interviewQuestions,
                        { key: `q_${Date.now()}`, question: '' },
                      ]);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Question
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Save/Cancel Buttons */}
          {!isFinalized && (
            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Completeness Stats */}
      {completeness && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-4">
            <div className="text-sm text-gray-500">Total Applicants</div>
            <div className="text-2xl font-bold text-gray-900">{completeness.totalApplicants}</div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="text-sm text-gray-500">With Reviews</div>
            <div className="text-2xl font-bold text-green-600">{completeness.applicantsWithReviews}</div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="text-sm text-gray-500">Fully Reviewed</div>
            <div className="text-2xl font-bold text-blue-600">{completeness.applicantsFullyReviewed}</div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="text-sm text-gray-500">Active Reviewers</div>
            <div className="text-2xl font-bold text-purple-600">
              {completeness.reviewerCompletion?.length || 0}
            </div>
          </div>
        </div>
      )}

      {/* Incomplete Reviewers Warning */}
      {completeness && completeness.reviewerCompletion && (() => {
        const incompleteReviewers = completeness.reviewerCompletion.filter(r => r.percentage < 100);
        if (incompleteReviewers.length === 0) return null;
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-900">Some reviewers haven't finished scoring</p>
                <div className="mt-2 space-y-1">
                  {incompleteReviewers.map(r => (
                    <div key={r.email} className="text-sm text-amber-700 flex items-center justify-between">
                      <span>{r.email}</span>
                      <span className="font-medium">{r.reviewed}/{r.total} ({Math.round(r.percentage)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Rankings Table */}
      {ranking && ranking.rankings && ranking.rankings.length > 0 ? (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="font-semibold text-gray-900">Rankings</h3>
              <span className="text-sm text-gray-500">
                {ranking.rankings.length} applicants
              </span>
              {currentConfig?.useZScoreNormalization && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  📊 Z-Score Normalized
                </span>
              )}
              <button
                onClick={() => {
                  const emails = ranking.rankings.map((r: RankedApplicant) => r.applicantEmail).join(', ');
                  navigator.clipboard.writeText(emails);
                  toast.success(`Copied ${ranking.rankings.length} emails to clipboard!`);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy all emails to clipboard"
              >
                <ClipboardDocumentIcon className="w-4 h-4" />
                Copy Emails
              </button>
            </div>
            
            {!isFinalized && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Advance top</label>
                  <input
                    type="number"
                    value={cutoffCount}
                    onChange={(e) => setCutoffCount(parseInt(e.target.value) || 0)}
                    min={0}
                    max={ranking.rankings.length}
                    className="w-20 px-3 py-1.5 border rounded-lg text-sm"
                  />
                  <span className="text-sm text-gray-500">applicants</span>
                </div>
                <button
                  onClick={() => setShowCutoffPreview(!showCutoffPreview)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  {showCutoffPreview ? 'Hide Preview' : 'Preview Cutoff'}
                </button>
              </div>
            )}
          </div>

          {/* Cutoff Preview */}
          {showCutoffPreview && !isFinalized && (
            <div className="p-4 bg-gray-50 border-b">
              {/* Track Filter Warning */}
              {filterTrack ? (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">🎯 Track Filter Active:</span> This cutoff will only affect applicants in the <strong>{filterTrack}</strong> track.
                  </p>
                </div>
              ) : (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">⚠️ No Track Filter:</span> This cutoff will affect <strong>ALL tracks</strong>. Select a specific track above if you only want to advance applicants from one track.
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    Cutoff at rank {cutoffCount}{filterTrack ? ` (${filterTrack} only)` : ' (all tracks)'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="text-green-600 font-medium">
                      {cutoffCount + Object.values(overrides).filter(o => o.action === 'advance').length - 
                       Object.entries(overrides).filter(([id, o]) => {
                         const rank = ranking.rankings.findIndex((a: RankedApplicant) => a.applicationId === id) + 1;
                         return rank <= cutoffCount && o.action === 'reject';
                       }).length} will advance
                    </span>
                    {' • '}
                    <span className="text-red-600 font-medium">
                      {ranking.rankings.length - cutoffCount + 
                       Object.entries(overrides).filter(([id, o]) => {
                         const rank = ranking.rankings.findIndex((a: RankedApplicant) => a.applicationId === id) + 1;
                         return rank <= cutoffCount && o.action === 'reject';
                       }).length -
                       Object.entries(overrides).filter(([id, o]) => {
                         const rank = ranking.rankings.findIndex((a: RankedApplicant) => a.applicationId === id) + 1;
                         return rank > cutoffCount && o.action === 'advance';
                       }).length} will be rejected
                    </span>
                  </p>
                  {Object.keys(overrides).length > 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      {Object.keys(overrides).length} manual override(s) applied
                    </p>
                  )}
                  {incompleteAdmins.length > 0 && !forceFinalize && (
                    <p className="text-sm text-red-600 mt-1">
                      ⚠️ Cannot finalize: {incompleteAdmins.length} admin(s) have not completed their reviews
                    </p>
                  )}
                  {/* Override checkbox to allow finalization without all reviews */}
                  {incompleteAdmins.length > 0 && (
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={forceFinalize}
                        onChange={(e) => setForceFinalize(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-amber-700 font-medium">
                        Override: Finalize without all reviews complete
                      </span>
                    </label>
                  )}
                </div>
                <button
                  onClick={handleApplyCutoff}
                  disabled={applyingCutoff || (incompleteAdmins.length > 0 && !forceFinalize)}
                  className={`px-6 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                    forceFinalize && incompleteAdmins.length > 0 
                      ? 'bg-amber-600 hover:bg-amber-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {applyingCutoff 
                    ? 'Applying...' 
                    : incompleteAdmins.length > 0 && !forceFinalize 
                      ? 'Reviews Incomplete' 
                      : forceFinalize && incompleteAdmins.length > 0
                        ? '⚠️ Force Apply Cutoff'
                        : 'Apply Cutoff & Finalize Phase'}
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-sm font-medium text-gray-500">
                <tr>
                  <th className="px-4 py-3 w-16">Rank</th>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3 w-24">Avg Score</th>
                  <th className="px-4 py-3 w-24">Weighted</th>
                  <th className="px-4 py-3 w-32">Reviews</th>
                  <th className="px-4 py-3 w-32">Referrals</th>
                  {showCutoffPreview && !isFinalized && (
                    <th className="px-4 py-3 w-32">Decision</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {ranking.rankings.map((applicant: RankedApplicant, idx: number) => {
                  const rank = idx + 1;
                  const isAboveCutoff = rank <= cutoffCount;
                  const override = overrides[applicant.applicationId];
                  const finalDecision = override?.action || (isAboveCutoff ? 'advance' : 'reject');
                  
                  return (
                    <tr 
                      key={applicant.applicationId}
                      className={`${
                        showCutoffPreview && !isFinalized
                          ? finalDecision === 'advance'
                            ? 'bg-green-50'
                            : 'bg-red-50'
                          : rank === cutoffCount && !isFinalized
                            ? 'border-b-4 border-b-blue-500'
                            : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className={`font-mono font-bold ${
                          rank <= 3 ? 'text-yellow-600' : 'text-gray-600'
                        }`}>
                          #{rank}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {applicant.applicantHeadshot ? (
                            <img
                              src={applicant.applicantHeadshot}
                              alt={applicant.applicantName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserGroupIcon className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{applicant.applicantName}</p>
                            <p className="text-sm text-gray-500">{applicant.applicantEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900">
                          {applicant.averageScore?.toFixed(2) || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-blue-600">
                          {applicant.weightedScore?.toFixed(2) || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {applicant.reviewCount || 0} review(s)
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-600">
                            👍{applicant.referralCount || 0}
                          </span>
                          <span className="text-red-600">
                            👎{applicant.deferralCount || 0}
                          </span>
                        </div>
                      </td>
                      {showCutoffPreview && !isFinalized && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleOverride(applicant.applicationId, rank)}
                              className={`px-3 py-1 rounded text-sm font-medium flex items-center gap-1 ${
                                finalDecision === 'advance'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {finalDecision === 'advance' ? (
                                <>
                                  <CheckCircleIcon className="w-4 h-4" />
                                  Advance
                                </>
                              ) : (
                                <>
                                  <XCircleIcon className="w-4 h-4" />
                                  Reject
                                </>
                              )}
                            </button>
                            {override && (
                              <span className="text-xs text-amber-600">(override)</span>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-12 text-center">
          <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No rankings yet</h3>
          <p className="text-gray-500 mt-1">
            Rankings will appear once applicants have been reviewed in this phase.
          </p>
        </div>
      )}
    </div>
  );
}
