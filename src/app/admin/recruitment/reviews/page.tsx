'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import {
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  FunnelIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import PhaseReviewPanel from '@/components/admin/PhaseReviewPanel';
import PhaseRankingsTable from '@/components/admin/PhaseRankingsTable';
import CutoffDecisionPanel from '@/components/admin/CutoffDecisionPanel';
import type { 
  ReviewPhase, 
  PhaseConfig, 
  PhaseCompleteness,
  RankedApplicant,
  CutoffCriteria,
  ApplicationTrack,
} from '@/types/recruitment';
import { TRACK_FILTER_OPTIONS, getTrackConfig } from '@/lib/tracks';

type PhaseTab = ReviewPhase | 'overview';

interface PhaseData {
  config: PhaseConfig | null;
  completeness: PhaseCompleteness | null;
  rankings: RankedApplicant[];
  isFinalized: boolean;
}

interface ApplicationSummary {
  id: string;
  name: string;
  email: string;
  track: 'business' | 'engineering';
  stage: string;
  submittedAt: string;
}

const PHASE_ICONS: Record<ReviewPhase, React.ReactNode> = {
  application: <DocumentTextIcon className="w-5 h-5" />,
  interview_round1: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
  interview_round2: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
};

const PHASE_LABELS: Record<ReviewPhase, string> = {
  application: 'Application Review',
  interview_round1: 'Round 1 Technical',
  interview_round2: 'Round 2 Behavioral',
};

const PHASE_ORDER: ReviewPhase[] = ['application', 'interview_round1', 'interview_round2'];

export default function PhaseReviewsPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<PhaseTab>('application');
  const [cycleId, setCycleId] = useState<string | null>(null);
  
  // Data states
  const [phases, setPhases] = useState<Record<ReviewPhase, PhaseData>>({
    application: { config: null, completeness: null, rankings: [], isFinalized: false },
    interview_round1: { config: null, completeness: null, rankings: [], isFinalized: false },
    interview_round2: { config: null, completeness: null, rankings: [], isFinalized: false },
  });
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subTab, setSubTab] = useState<'review' | 'rankings' | 'cutoff'>('review');
  const [trackFilter, setTrackFilter] = useState<ApplicationTrack | ''>('');
  const [manualOverrides, setManualOverrides] = useState<Array<{ applicationId: string; action: 'advance' | 'reject'; reason: string }>>([]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) redirect('/auth/signin');
  }, [session, status]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load active cycle
      const cycleRes = await fetch('/api/admin/recruitment/cycles?status=active');
      const cycleData = await cycleRes.json();
      const activeCycleId = cycleData[0]?._id;
      
      if (!activeCycleId) {
        setLoading(false);
        return;
      }
      
      setCycleId(activeCycleId);
      
      // Load applications for this cycle
      const appsRes = await fetch(`/api/admin/recruitment/applications?cycleId=${activeCycleId}`);
      const appsData = await appsRes.json();
      setApplications(appsData.applications || []);
      
      // Load phase configs and completeness
      await loadPhaseData(activeCycleId);
      
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPhaseData = async (cid: string) => {
    const updatedPhases = { ...phases };
    
    for (const phase of PHASE_ORDER) {
      try {
        // Load config and completeness
        const configRes = await fetch(`/api/admin/recruitment/phase-configs?cycleId=${cid}&phase=${phase}`);
        const configData = await configRes.json();
        
        // Load rankings if available
        const rankingsRes = await fetch(`/api/admin/recruitment/phase-rankings?cycleId=${cid}&phase=${phase}`);
        const rankingsData = await rankingsRes.json();
        
        updatedPhases[phase] = {
          config: configData.config || null,
          completeness: configData.completeness || null,
          rankings: rankingsData.rankings || [],
          isFinalized: configData.config?.status === 'finalized',
        };
      } catch (err) {
        console.error(`Error loading ${phase} data:`, err);
      }
    }
    
    setPhases(updatedPhases);
  };

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleRefresh = async () => {
    if (!cycleId) return;
    setRefreshing(true);
    await loadPhaseData(cycleId);
    setRefreshing(false);
  };

  const handleGenerateRankings = async (phase: ReviewPhase) => {
    if (!cycleId) return;
    
    try {
      const res = await fetch('/api/admin/recruitment/phase-rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycleId, phase }),
      });
      
      if (!res.ok) throw new Error('Failed to generate rankings');
      
      await loadPhaseData(cycleId);
    } catch (err) {
      console.error('Error generating rankings:', err);
    }
  };

  const handleApplyCutoff = async (phase: ReviewPhase, criteria: CutoffCriteria, sendEmails: boolean) => {
    if (!cycleId) return;
    
    const res = await fetch('/api/admin/recruitment/phase-cutoffs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cycleId,
        phase,
        criteria,
        manualOverrides,
        sendEmails,
      }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to apply cutoff');
    }
    
    // Clear overrides and reload
    setManualOverrides([]);
    await loadPhaseData(cycleId);
  };

  const handleManualOverride = (applicationId: string, action: 'advance' | 'reject', reason: string) => {
    setManualOverrides(prev => {
      const existing = prev.findIndex(o => o.applicationId === applicationId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { applicationId, action, reason };
        return updated;
      }
      return [...prev, { applicationId, action, reason }];
    });
  };

  const handleRemoveOverride = (applicationId: string) => {
    setManualOverrides(prev => prev.filter(o => o.applicationId !== applicationId));
  };

  // Filter applications by current phase eligibility
  const getPhaseApplications = (phase: ReviewPhase): ApplicationSummary[] => {
    const stageMap: Record<ReviewPhase, string[]> = {
      application: ['submitted', 'under_review'],
      interview_round1: ['interview_round1'],
      interview_round2: ['interview_round2'],
    };
    
    let filtered = applications.filter(app => stageMap[phase].includes(app.stage));
    
    if (trackFilter) {
      filtered = filtered.filter(app => app.track === trackFilter);
    }
    
    return filtered;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#00274c] p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!cycleId) {
    return (
      <div className="min-h-screen bg-[#00274c] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/10 rounded-xl p-12 text-center">
            <DocumentTextIcon className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Active Recruitment Cycle</h2>
            <p className="text-white/60">Create an active cycle first to start reviewing applications.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentPhaseData = activeTab !== 'overview' ? phases[activeTab] : null;
  const currentApplications = activeTab !== 'overview' ? getPhaseApplications(activeTab) : [];

  return (
    <div className="min-h-screen bg-[#00274c] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Phase Reviews & Decisions</h1>
            <p className="text-white/60 mt-1">
              Review applications, generate rankings, and make advancement decisions
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            <ArrowPathIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Phase Tabs */}
        <div className="flex gap-2 border-b border-white/20 pb-4">
          {PHASE_ORDER.map((phase) => {
            const phaseData = phases[phase];
            const isActive = activeTab === phase;
            
            return (
              <button
                key={phase}
                onClick={() => setActiveTab(phase)}
                className={`flex items-center gap-2 px-4 py-3 rounded-t-lg transition-colors ${
                  isActive 
                    ? 'bg-white/20 text-white border-b-2 border-blue-400' 
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {PHASE_ICONS[phase]}
                <span>{PHASE_LABELS[phase]}</span>
                
                {/* Status Indicator */}
                {phaseData.isFinalized ? (
                  <LockClosedIcon className="w-4 h-4 text-yellow-400" title="Finalized" />
                ) : phaseData.completeness && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">
                    {phaseData.completeness.applicantsFullyReviewed}/{phaseData.completeness.totalApplicants}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Phase Content */}
        {activeTab !== 'overview' && currentPhaseData && (
          <div className="space-y-6">
            {/* Sub-tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setSubTab('review')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  subTab === 'review' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <DocumentTextIcon className="w-4 h-4" />
                Review
              </button>
              <button
                onClick={() => setSubTab('rankings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  subTab === 'rankings' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <ChartBarIcon className="w-4 h-4" />
                Rankings
              </button>
              <button
                onClick={() => setSubTab('cutoff')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  subTab === 'cutoff' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                Cutoff & Decisions
              </button>

              {/* Track Filter */}
              <div className="ml-auto flex items-center gap-2">
                <FunnelIcon className="w-4 h-4 text-white/50" />
                <select
                  value={trackFilter}
                  onChange={(e) => setTrackFilter(e.target.value as ApplicationTrack | '')}
                  className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm"
                >
                  {TRACK_FILTER_OPTIONS.map((track) => (
                    <option key={track.value} value={track.value}>
                      {track.value ? `${track.label} Only` : track.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sub-tab Content */}
            {subTab === 'review' && (
              <div className="grid grid-cols-3 gap-6">
                {/* Application List */}
                <div className="col-span-1 bg-white/10 rounded-xl p-4 max-h-[70vh] overflow-y-auto">
                  <h3 className="font-medium text-white mb-4">
                    Applicants ({currentApplications.length})
                  </h3>
                  <div className="space-y-2">
                    {currentApplications.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => setSelectedApplicationId(app.id)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedApplicationId === app.id
                            ? 'bg-blue-600'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="font-medium text-white truncate">{app.name}</div>
                        <div className="text-sm text-white/60 truncate">{app.email}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            getTrackConfig(app.track as ApplicationTrack)?.color || 'bg-gray-500/30'
                          } text-white`}>
                            {getTrackConfig(app.track as ApplicationTrack)?.shortLabel || app.track}
                          </span>
                        </div>
                      </button>
                    ))}
                    {currentApplications.length === 0 && (
                      <div className="text-center text-white/40 py-8">
                        No applicants in this phase
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Panel */}
                <div className="col-span-2">
                  {selectedApplicationId ? (
                    <PhaseReviewPanel
                      applicationId={selectedApplicationId}
                      phase={activeTab}
                      cycleId={cycleId}
                      onReviewSaved={handleRefresh}
                    />
                  ) : (
                    <div className="bg-white/10 rounded-xl p-12 text-center">
                      <DocumentTextIcon className="w-12 h-12 text-white/30 mx-auto mb-3" />
                      <p className="text-white/60">Select an applicant to review</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {subTab === 'rankings' && (
              <div className="space-y-4">
                {/* Generate Rankings Button */}
                {!currentPhaseData.isFinalized && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleGenerateRankings(activeTab)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <ChartBarIcon className="w-5 h-5" />
                      Generate/Refresh Rankings
                    </button>
                  </div>
                )}

                <PhaseRankingsTable
                  rankings={currentPhaseData.rankings}
                  completeness={currentPhaseData.completeness || undefined}
                  isFinalized={currentPhaseData.isFinalized}
                  manualOverrides={manualOverrides}
                  onManualOverride={handleManualOverride}
                  onRemoveOverride={handleRemoveOverride}
                />
              </div>
            )}

            {subTab === 'cutoff' && currentPhaseData.completeness && (
              <CutoffDecisionPanel
                phase={activeTab}
                completeness={currentPhaseData.completeness}
                rankings={currentPhaseData.rankings}
                manualOverrides={manualOverrides}
                isFinalized={currentPhaseData.isFinalized}
                onApplyCutoff={(criteria, sendEmails) => handleApplyCutoff(activeTab, criteria, sendEmails)}
              />
            )}
          </div>
        )}

        {/* Overview Stats (optional) */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-6">
            {PHASE_ORDER.map((phase) => {
              const phaseData = phases[phase];
              return (
                <div key={phase} className="bg-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    {PHASE_ICONS[phase]}
                    <h3 className="font-medium text-white">{PHASE_LABELS[phase]}</h3>
                    {phaseData.isFinalized && (
                      <LockClosedIcon className="w-4 h-4 text-yellow-400 ml-auto" />
                    )}
                  </div>
                  {phaseData.completeness ? (
                    <div className="space-y-3">
                      <div>
                        <div className="text-3xl font-bold text-white">
                          {phaseData.completeness.applicantsFullyReviewed}
                          <span className="text-lg text-white/50">/{phaseData.completeness.totalApplicants}</span>
                        </div>
                        <div className="text-sm text-white/60">Fully reviewed</div>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ 
                            width: `${(phaseData.completeness.applicantsFullyReviewed / phaseData.completeness.totalApplicants) * 100}%` 
                          }}
                        />
                      </div>
                      <button
                        onClick={() => setActiveTab(phase)}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        View details →
                      </button>
                    </div>
                  ) : (
                    <div className="text-white/40 text-sm">No data yet</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
