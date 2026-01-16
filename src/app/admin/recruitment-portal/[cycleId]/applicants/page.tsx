'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useAdminApi } from '@/hooks/useAdminApi';
import { useCycle } from '../layout';
import { AdminLoadingState, AdminEmptyState } from '@/components/admin/ui';
import type { Application, ApplicationStage, ApplicationTrack, ApplicantDetail } from '@/types/recruitment';

const STAGES: { value: ApplicationStage; label: string; color: string }[] = [
  { value: 'not_started', label: 'Not Started', color: 'bg-gray-100 text-gray-700' },
  { value: 'draft', label: 'Draft', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'submitted', label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
  { value: 'under_review', label: 'Under Review', color: 'bg-purple-100 text-purple-800' },
  { value: 'coffee_chat', label: 'Coffee Chat', color: 'bg-amber-100 text-amber-800' },
  { value: 'interview_round1', label: 'Interview R1', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'interview_round2', label: 'Interview R2', color: 'bg-pink-100 text-pink-800' },
  { value: 'final_review', label: 'Final Review', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'waitlisted', label: 'Waitlisted', color: 'bg-orange-100 text-orange-800' },
  { value: 'accepted', label: 'Accepted', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'withdrawn', label: 'Withdrawn', color: 'bg-gray-100 text-gray-500' },
];

import { TRACK_FILTER_OPTIONS, getTrackConfig, getTrackShortLabel } from '@/lib/tracks';

const TRACKS = TRACK_FILTER_OPTIONS;

// Interface matches the enriched data from the API
interface ApplicationListItem {
  _id: string;
  name: string;
  email: string;
  track: string;
  stage: string;
  submittedAt?: string;
  reviewCount: number;
  averageScore?: number;
  eventsAttended?: number;
  hasCoffeeChat?: boolean;
  hasInterview?: boolean;
  headshot?: string;
}

export default function CycleApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const cycleId = params.cycleId as string;
  const { cycle } = useCycle();
  const { get, put } = useAdminApi();
  
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<ApplicationStage | ''>('');
  const [filterTrack, setFilterTrack] = useState<ApplicationTrack | ''>('');
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [questionLabels, setQuestionLabels] = useState<Record<string, string>>({});

  const loadApplications = async () => {
    try {
      setLoading(true);
      let url = `/api/admin/recruitment/applications?cycleId=${cycleId}`;
      if (filterStage) url += `&stage=${filterStage}`;
      if (filterTrack) url += `&track=${filterTrack}`;
      const data = await get<ApplicationListItem[]>(url);
      setApplications(data);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cycleId) {
      loadApplications();
    }
  }, [cycleId, filterStage, filterTrack]);

  const loadApplicantDetail = async (applicationId: string) => {
    try {
      setLoadingDetail(true);
      const data = await get<ApplicantDetail>(`/api/admin/recruitment/applications/${applicationId}`);
      setSelectedApplicant(data);
      
      // Load question labels for this track
      if (data?.application?.track) {
        try {
          const questions = await get<Array<{ fields: Array<{ key: string; label: string }> }>>(
            `/api/admin/recruitment/questions?cycleId=${cycleId}&track=${data.application.track}`
          );
          const labels: Record<string, string> = {};
          questions?.forEach(q => {
            q.fields?.forEach(f => {
              labels[f.key] = f.label;
            });
          });
          setQuestionLabels(labels);
        } catch (e) {
          console.error('Error loading question labels:', e);
        }
      }
    } catch (error) {
      console.error('Error loading applicant detail:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const updateStage = async (applicationId: string, newStage: ApplicationStage) => {
    try {
      await put(`/api/admin/recruitment/applications/${applicationId}`, { stage: newStage }, {
        successMessage: `Application moved to ${STAGES.find(s => s.value === newStage)?.label}`,
      });
      loadApplications();
      if (selectedApplicant && selectedApplicant.application._id === applicationId) {
        loadApplicantDetail(applicationId);
      }
    } catch (error) {
      console.error('Error updating stage:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Track', 'Stage', 'Submitted At', 'Avg Score', 'Reviews'];
    const rows = filteredApplications.map(app => [
      app.name || 'Unknown',
      app.email || 'N/A',
      app.track,
      STAGES.find(s => s.value === app.stage)?.label || app.stage,
      app.submittedAt ? new Date(app.submittedAt).toISOString() : 'N/A',
      app.averageScore?.toFixed(2) || 'N/A',
      app.reviewCount || 0,
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applicants-${cycleId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredApplications = applications.filter(app => {
    if (!searchQuery) return true;
    const name = app.name?.toLowerCase() || '';
    const email = app.email?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  // Count by stage
  const stageCounts = STAGES.reduce((acc, stage) => {
    acc[stage.value] = applications.filter(a => a.stage === stage.value).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return <AdminLoadingState message="Loading applicants..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Applicants</h2>
          <p className="text-sm text-gray-500 mt-1">
            {applications.length} total applications
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stage Pipeline */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStage('')}
          className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
            !filterStage ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({applications.length})
        </button>
        {STAGES.filter(s => stageCounts[s.value] > 0 || ['submitted', 'under_review', 'accepted', 'rejected'].includes(s.value)).map((stage) => (
          <button
            key={stage.value}
            onClick={() => setFilterStage(stage.value)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              filterStage === stage.value ? 'bg-gray-900 text-white' : `${stage.color} hover:opacity-80`
            }`}
          >
            {stage.label} ({stageCounts[stage.value] || 0})
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterTrack}
          onChange={(e) => setFilterTrack(e.target.value as ApplicationTrack | '')}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {TRACKS.map((track) => (
            <option key={track.value} value={track.value}>{track.label}</option>
          ))}
        </select>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <AdminEmptyState
          title="No applicants found"
          description={searchQuery ? 'Try adjusting your search or filters' : 'No applications have been submitted yet'}
        />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Applicant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Track</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Submitted</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredApplications.map((app) => {
                const stageInfo = STAGES.find(s => s.value === app.stage);
                
                return (
                  <tr key={app._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {app.headshot ? (
                          <img 
                            src={app.headshot} 
                            alt={app.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-sm font-medium">
                              {app.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{app.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{app.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const trackConfig = getTrackConfig(app.track as any);
                        return (
                          <span className={`px-2 py-0.5 text-xs rounded-full ${trackConfig?.color || 'bg-gray-100'} ${
                            app.track === 'business' ? 'text-blue-700' : 
                            app.track === 'engineering' ? 'text-purple-700' :
                            app.track === 'ai_investment_fund' ? 'text-emerald-700' :
                            app.track === 'ai_energy_efficiency' ? 'text-amber-700' : 'text-gray-700'
                          }`}>
                            {getTrackShortLabel(app.track as any)}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={app.stage}
                        onChange={(e) => updateStage(app._id, e.target.value as ApplicationStage)}
                        className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${stageInfo?.color} cursor-pointer`}
                      >
                        {STAGES.map((stage) => (
                          <option key={stage.value} value={stage.value}>{stage.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {app.averageScore ? (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{app.averageScore.toFixed(1)}</span>
                          <span className="text-sm text-gray-500">/ 5</span>
                          <span className="text-xs text-gray-400">({app.reviewCount})</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No reviews</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => loadApplicantDetail(app._id)}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <EyeIcon className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Applicant Detail Modal */}
      {(selectedApplicant || loadingDetail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <div className="flex items-center gap-3">
                  {!loadingDetail && selectedApplicant?.application?.files && (() => {
                    // Look for headshot in files
                    const files = selectedApplicant.application.files;
                    const headshot = files.headshot || files.photo || files.profile_photo || files.h ||
                      Object.values(files).find(url => 
                        typeof url === 'string' && (url.includes('headshot') || url.includes('photo'))
                      );
                    return headshot ? (
                      <img src={headshot as string} alt="Headshot" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 font-medium">
                          {selectedApplicant?.user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="text-lg font-semibold">
                      {loadingDetail ? 'Loading...' : (selectedApplicant?.user?.name || 'Unknown Applicant')}
                    </h3>
                    {!loadingDetail && selectedApplicant?.user?.email && (
                      <p className="text-sm text-gray-500">{selectedApplicant.user.email}</p>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {loadingDetail ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading applicant details...</p>
              </div>
            ) : selectedApplicant && (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-3 gap-6">
                  {/* Left Column: Basic Info */}
                  <div className="col-span-2 space-y-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Application Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Track</p>
                          <p className="font-medium capitalize">{selectedApplicant.application.track}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Stage</p>
                          <select
                            value={selectedApplicant.application.stage}
                            onChange={(e) => updateStage(selectedApplicant.application._id!, e.target.value as ApplicationStage)}
                            className={`text-sm font-medium rounded-full px-2 py-1 border-0 ${
                              STAGES.find(s => s.value === selectedApplicant.application.stage)?.color
                            } cursor-pointer`}
                          >
                            {STAGES.map((stage) => (
                              <option key={stage.value} value={stage.value}>{stage.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Submitted</p>
                          <p className="font-medium">
                            {selectedApplicant.application.submittedAt
                              ? new Date(selectedApplicant.application.submittedAt).toLocaleString()
                              : 'Not submitted'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{selectedApplicant.user?.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Answers */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Application Answers</h4>
                      <div className="space-y-4">
                        {Object.entries(selectedApplicant.application.answers).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              {questionLabels[key] || key.replace(/_/g, ' ')}
                            </p>
                            <p className="text-gray-900 whitespace-pre-wrap">
                              {typeof value === 'string' ? value : 
                               Array.isArray(value) ? value.join(', ') : 
                               JSON.stringify(value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Files */}
                    {Object.keys(selectedApplicant.application.files).length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Uploaded Files</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(selectedApplicant.application.files).map(([key, url]) => (
                            <a
                              key={key}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                            >
                              📄 {questionLabels[key] || key.replace(/_/g, ' ')}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Reviews & Activity */}
                  <div className="space-y-6">
                    {/* Review Summary */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Review Summary</h4>
                      {selectedApplicant.reviewSummary ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Average Score</span>
                            <span className="text-2xl font-bold text-gray-900">
                              {selectedApplicant.reviewSummary.avgScore.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Reviews</span>
                            <span>{selectedApplicant.reviewSummary.reviewCount}</span>
                          </div>
                          <div className="pt-2 border-t">
                            <p className="text-xs text-gray-500 mb-1">Score Distribution</p>
                            {Object.entries(selectedApplicant.reviewSummary.scores).map(([category, score]) => (
                              <div key={category} className="flex items-center justify-between text-sm">
                                <span className="capitalize">{category}</span>
                                <span>{score.toFixed(1)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No reviews yet</p>
                      )}
                    </div>

                    {/* Bookings */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Scheduled</h4>
                      {selectedApplicant.bookings.length > 0 ? (
                        <div className="space-y-3">
                          {selectedApplicant.bookings.map((booking) => (
                            <div key={booking._id} className="text-sm border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                              <p className="font-medium capitalize">{booking.slotKind.replace(/_/g, ' ')}</p>
                              {booking.slotDetails ? (
                                <>
                                  <p className="text-gray-600">
                                    Host: {booking.slotDetails.hostName}
                                  </p>
                                  <p className="text-gray-500">
                                    {new Date(booking.slotDetails.startTime).toLocaleString()}
                                  </p>
                                  {booking.slotDetails.location && (
                                    <p className="text-gray-500 text-xs">{booking.slotDetails.location}</p>
                                  )}
                                </>
                              ) : (
                                <p className="text-gray-500">
                                  Booked: {new Date(booking.bookedAt).toLocaleDateString()}
                                </p>
                              )}
                              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-xs ${
                                booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {booking.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No bookings</p>
                      )}
                    </div>

                    {/* RSVPs */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Event RSVPs</h4>
                      {selectedApplicant.rsvps.length > 0 ? (
                        <div className="space-y-2">
                          {selectedApplicant.rsvps.map((rsvp: any) => (
                            <div key={rsvp._id} className="flex items-center justify-between text-sm">
                              <span className="truncate max-w-[150px]" title={rsvp.eventTitle || rsvp.eventId}>
                                {rsvp.eventTitle || `Event ${rsvp.eventId?.substring(0, 8)}...`}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-xs ${
                                rsvp.attended || rsvp.attendedAt || rsvp.checkedInAt 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {rsvp.attended || rsvp.attendedAt || rsvp.checkedInAt ? '✓ Attended' : 'RSVP\'d'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No RSVPs</p>
                      )}
                    </div>

                    {/* Link to review page */}
                    <button
                      onClick={() => {
                        setSelectedApplicant(null);
                        router.push(`/admin/recruitment-portal/${cycleId}/reviews?applicant=${selectedApplicant?.application._id}`);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add Review
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
