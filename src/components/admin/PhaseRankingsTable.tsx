'use client';

import { useState } from 'react';
import { 
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { TRACK_FILTER_OPTIONS } from '@/lib/tracks';
import type { 
  RankedApplicant,
  PhaseCompleteness,
  ApplicationTrack,
} from '@/types/recruitment';

interface PhaseRankingsTableProps {
  rankings: RankedApplicant[];
  completeness?: PhaseCompleteness;
  isFinalized: boolean;
  manualOverrides?: Array<{ applicationId: string; action: 'advance' | 'reject'; reason: string }>;
  onApplicantClick?: (applicationId: string) => void;
  onManualOverride?: (applicationId: string, action: 'advance' | 'reject', reason: string) => void;
  onRemoveOverride?: (applicationId: string) => void;
}

type SortKey = 'rank' | 'name' | 'weightedScore' | 'reviewCount' | 'referralCount';
type SortDirection = 'asc' | 'desc';

export default function PhaseRankingsTable({
  rankings,
  completeness,
  isFinalized,
  manualOverrides = [],
  onApplicantClick,
  onManualOverride,
  onRemoveOverride,
}: PhaseRankingsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [trackFilter, setTrackFilter] = useState<ApplicationTrack | 'all'>('all');
  const [overrideModal, setOverrideModal] = useState<{
    applicationId: string;
    applicantName: string;
    action: 'advance' | 'reject';
  } | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  // Sort rankings
  const sortedRankings = [...rankings].sort((a, b) => {
    let comparison = 0;
    switch (sortKey) {
      case 'rank':
        comparison = a.rank - b.rank;
        break;
      case 'name':
        comparison = a.applicantName.localeCompare(b.applicantName);
        break;
      case 'weightedScore':
        comparison = a.weightedScore - b.weightedScore;
        break;
      case 'reviewCount':
        comparison = a.reviewCount - b.reviewCount;
        break;
      case 'referralCount':
        comparison = (a.referralCount - a.deferralCount) - (b.referralCount - b.deferralCount);
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Filter rankings
  const filteredRankings = sortedRankings.filter(r => {
    const matchesSearch = 
      r.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.applicantEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTrack = trackFilter === 'all' || r.track === trackFilter;
    return matchesSearch && matchesTrack;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection(key === 'rank' ? 'asc' : 'desc');
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null;
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="w-4 h-4" />
      : <ChevronDownIcon className="w-4 h-4" />;
  };

  const handleOverrideSubmit = () => {
    if (overrideModal && overrideReason.trim() && onManualOverride) {
      onManualOverride(overrideModal.applicationId, overrideModal.action, overrideReason);
      setOverrideModal(null);
      setOverrideReason('');
    }
  };

  const getDecisionBadge = (ranking: RankedApplicant) => {
    if (!ranking.decision) return null;
    
    const badges = {
      advance: 'bg-green-500/30 text-green-300 border-green-400',
      reject: 'bg-red-500/30 text-red-300 border-red-400',
      manual_advance: 'bg-green-500/30 text-green-300 border-green-400 border-2',
      manual_reject: 'bg-red-500/30 text-red-300 border-red-400 border-2',
    };
    
    const labels = {
      advance: 'Advance',
      reject: 'Reject',
      manual_advance: 'Manual ✓',
      manual_reject: 'Manual ✗',
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs border ${badges[ranking.decision]}`}>
        {labels[ranking.decision]}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Completeness Stats */}
      {completeness && (
        <div className="bg-white/5 rounded-lg p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{completeness.totalApplicants}</div>
              <div className="text-xs text-white/60">Total Applicants</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{completeness.applicantsWithReviews}</div>
              <div className="text-xs text-white/60">With Reviews</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{completeness.applicantsFullyReviewed}</div>
              <div className="text-xs text-white/60">Fully Reviewed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {completeness.totalApplicants > 0 
                  ? Math.round((completeness.applicantsFullyReviewed / completeness.totalApplicants) * 100)
                  : 0}%
              </div>
              <div className="text-xs text-white/60">Complete</div>
            </div>
          </div>
        </div>
      )}

      {/* Reviewer Progress */}
      {completeness && completeness.reviewerCompletion.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white/80 mb-3">Reviewer Progress</h4>
          <div className="space-y-2">
            {completeness.reviewerCompletion.map(reviewer => (
              <div key={reviewer.email} className="flex items-center gap-3">
                <UserCircleIcon className="w-5 h-5 text-white/50" />
                <span className="text-sm text-white/80 flex-1">{reviewer.name || reviewer.email}</span>
                <div className="w-32 bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${reviewer.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-white/60 w-20 text-right">
                  {reviewer.reviewed}/{reviewer.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <select
          value={trackFilter}
          onChange={(e) => setTrackFilter(e.target.value as ApplicationTrack | 'all')}
          className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="all">All Tracks</option>
          {TRACK_FILTER_OPTIONS.filter(t => t.value !== '').map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Rankings Table */}
      <div className="bg-white/5 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/10">
            <tr>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-white/80 cursor-pointer hover:bg-white/5"
                onClick={() => handleSort('rank')}
              >
                <div className="flex items-center gap-1">
                  Rank <SortIcon column="rank" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-white/80 cursor-pointer hover:bg-white/5"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Applicant <SortIcon column="name" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-white/80">Track</th>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-white/80 cursor-pointer hover:bg-white/5"
                onClick={() => handleSort('weightedScore')}
              >
                <div className="flex items-center gap-1">
                  Score <SortIcon column="weightedScore" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-white/80 cursor-pointer hover:bg-white/5"
                onClick={() => handleSort('reviewCount')}
              >
                <div className="flex items-center gap-1">
                  Reviews <SortIcon column="reviewCount" />
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-white/80 cursor-pointer hover:bg-white/5"
                onClick={() => handleSort('referralCount')}
              >
                <div className="flex items-center gap-1">
                  Signals <SortIcon column="referralCount" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-white/80">Recommendations</th>
              {isFinalized && (
                <th className="px-4 py-3 text-left text-sm font-medium text-white/80">Decision</th>
              )}
              {!isFinalized && onManualOverride && (
                <th className="px-4 py-3 text-left text-sm font-medium text-white/80">Override</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredRankings.map((ranking) => (
              <tr 
                key={ranking.applicationId}
                className="hover:bg-white/5 cursor-pointer transition-colors"
                onClick={() => onApplicantClick?.(ranking.applicationId)}
              >
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                    ranking.rank <= 3 ? 'bg-yellow-500/30 text-yellow-300' :
                    ranking.rank <= 10 ? 'bg-blue-500/30 text-blue-300' :
                    'bg-white/10 text-white/60'
                  }`}>
                    {ranking.rank}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="text-white font-medium">{ranking.applicantName}</div>
                    <div className="text-xs text-white/50">{ranking.applicantEmail}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    ranking.track === 'business' 
                      ? 'bg-purple-500/30 text-purple-300'
                      : 'bg-blue-500/30 text-blue-300'
                  }`}>
                    {ranking.track}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">
                      {ranking.weightedScore.toFixed(2)}
                    </span>
                    <span className="text-xs text-white/40">
                      (avg: {ranking.averageScore.toFixed(2)})
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-white/80">
                  {ranking.reviewCount}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {ranking.referralCount > 0 && (
                      <span className="flex items-center gap-1 text-green-400 text-sm">
                        <ArrowUpIcon className="w-3 h-3" />
                        {ranking.referralCount}
                      </span>
                    )}
                    {ranking.neutralCount > 0 && (
                      <span className="flex items-center gap-1 text-gray-400 text-sm">
                        <MinusIcon className="w-3 h-3" />
                        {ranking.neutralCount}
                      </span>
                    )}
                    {ranking.deferralCount > 0 && (
                      <span className="flex items-center gap-1 text-red-400 text-sm">
                        <ArrowDownIcon className="w-3 h-3" />
                        {ranking.deferralCount}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {ranking.recommendations.advance > 0 && (
                      <span className="flex items-center gap-1 text-green-400 text-sm">
                        <CheckCircleIcon className="w-4 h-4" />
                        {ranking.recommendations.advance}
                      </span>
                    )}
                    {ranking.recommendations.hold > 0 && (
                      <span className="flex items-center gap-1 text-yellow-400 text-sm ml-2">
                        ⏸ {ranking.recommendations.hold}
                      </span>
                    )}
                    {ranking.recommendations.reject > 0 && (
                      <span className="flex items-center gap-1 text-red-400 text-sm ml-2">
                        <XCircleIcon className="w-4 h-4" />
                        {ranking.recommendations.reject}
                      </span>
                    )}
                  </div>
                </td>
                {isFinalized && (
                  <td className="px-4 py-3">
                    {getDecisionBadge(ranking)}
                  </td>
                )}
                {!isFinalized && onManualOverride && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setOverrideModal({
                          applicationId: ranking.applicationId,
                          applicantName: ranking.applicantName,
                          action: 'advance',
                        })}
                        className="p-1 hover:bg-green-500/30 rounded text-green-400"
                        title="Force Advance"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setOverrideModal({
                          applicationId: ranking.applicationId,
                          applicantName: ranking.applicantName,
                          action: 'reject',
                        })}
                        className="p-1 hover:bg-red-500/30 rounded text-red-400"
                        title="Force Reject"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRankings.length === 0 && (
          <div className="text-center py-8 text-white/50">
            No applicants match your filters
          </div>
        )}
      </div>

      {/* Override Modal */}
      {overrideModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#00274c] border border-white/20 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              {overrideModal.action === 'advance' ? 'Force Advance' : 'Force Reject'} - {overrideModal.applicantName}
            </h3>
            <p className="text-white/70 text-sm mb-4">
              This will manually {overrideModal.action} this applicant regardless of their ranking.
              Please provide a reason for this override.
            </p>
            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Reason for override..."
              className="w-full h-24 bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setOverrideModal(null);
                  setOverrideReason('');
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleOverrideSubmit}
                disabled={!overrideReason.trim()}
                className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  overrideModal.action === 'advance'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                Confirm {overrideModal.action === 'advance' ? 'Advance' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
