'use client';
import { useState, useMemo } from 'react';
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useAdminApi } from '@/hooks/useAdminApi';
import { formatUtcDateInEastern, getEasternDateKey } from '@/lib/timezone';

interface SpreadsheetSignup {
  id: string;
  userEmail: string;
  userName: string | null;
  phone?: string;
  createdAt: string;
}

interface SpreadsheetExecMember {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

interface SpreadsheetSlot {
  id?: string;
  title?: string;
  startTime: string;
  endTime?: string;
  location: string;
  execMember?: SpreadsheetExecMember | null;
  capacity?: number;
  signupCount?: number;
  isOpen?: boolean;
  signups?: SpreadsheetSignup[];
}

interface SpreadsheetProps {
  slots: SpreadsheetSlot[];
  teamMembers: SpreadsheetExecMember[];
  onRefresh: () => void;
  currentUserEmail?: string;
}

export default function CoffeeChatSpreadsheet({
  slots,
  teamMembers,
  onRefresh,
  currentUserEmail,
}: SpreadsheetProps) {
  const { post } = useAdminApi();
  const [filters, setFilters] = useState({
    day: '',
    execId: '',
    location: '',
    showSignupsOnly: false,
    showOpenSlotsOnly: false,
    showAvailableSlotsOnly: false, // Slots with no exec assigned
  });
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>('startTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredSlots = useMemo(() => {
    let filtered = [...slots];

    // Apply filters
    if (filters.day) {
      filtered = filtered.filter((slot) => getEasternDateKey(slot.startTime) === filters.day);
    }

    if (filters.execId) {
      filtered = filtered.filter(slot => slot.execMember?.id === filters.execId);
    }

    if (filters.location) {
      filtered = filtered.filter(slot => 
        slot.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.showSignupsOnly) {
      filtered = filtered.filter(slot => slot.signupCount > 0);
    }

    if (filters.showOpenSlotsOnly) {
      filtered = filtered.filter(slot => slot.isOpen);
    }

    if (filters.showAvailableSlotsOnly) {
      filtered = filtered.filter(slot => !slot.execMember || !slot.execMember.id);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'startTime' || sortField === 'endTime') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortField === 'execName') {
        aValue = a.execMember?.name || '';
        bValue = b.execMember?.name || '';
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [slots, filters, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleExpanded = (slotId: string) => {
    const newExpanded = new Set(expandedSlots);
    if (newExpanded.has(slotId)) {
      newExpanded.delete(slotId);
    } else {
      newExpanded.add(slotId);
    }
    setExpandedSlots(newExpanded);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.day) params.append('day', filters.day);
      if (filters.execId) params.append('execId', filters.execId);
      if (filters.location) params.append('location', filters.location);

      const response = await fetch(`/api/admin/coffee-chats/export?${params}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `coffee-chats-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) {
      return { date: 'Not set', time: 'Not set' };
    }

    return {
      date: formatUtcDateInEastern(
        dateString,
        { weekday: 'short', month: 'short', day: 'numeric' },
        false,
      ),
      time: formatUtcDateInEastern(dateString, { hour: 'numeric', minute: '2-digit' }),
    };
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const assignSelfToSlot = async (slotId: string) => {
    if (!currentUserEmail) {
      toast.error('Unable to determine current user');
      return;
    }

    const currentUser = teamMembers.find((member) => member.email === currentUserEmail);
    if (!currentUser) {
      toast.error('Current user not found in team list');
      return;
    }

    try {
      await post(
        `/api/admin/coffee-chats/${slotId}/assign-exec`,
        {
          slotId,
          execMemberId: currentUser.id,
          execName: currentUser.name,
          execEmail: currentUser.email,
        },
        { successMessage: 'Assigned yourself to this slot' },
      );
      onRefresh();
    } catch {
      // Errors surface via toast in useAdminApi
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              Filter by Day
            </label>
            <input
              type="date"
              value={filters.day}
              onChange={(e) => setFilters({ ...filters, day: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UserIcon className="w-4 h-4 inline mr-1" />
              Filter by Exec Member
            </label>
            <select
              value={filters.execId}
              onChange={(e) => setFilters({ ...filters, execId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
            >
              <option value="">All Exec Members</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPinIcon className="w-4 h-4 inline mr-1" />
              Filter by Location
            </label>
            <input
              type="text"
              placeholder="Location..."
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.showSignupsOnly}
                onChange={(e) => setFilters({ ...filters, showSignupsOnly: e.target.checked })}
                className="rounded border-gray-300 text-[#00274c] focus:ring-[#00274c]"
              />
              Show only slots with signups
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.showOpenSlotsOnly}
                onChange={(e) => setFilters({ ...filters, showOpenSlotsOnly: e.target.checked })}
                className="rounded border-gray-300 text-[#00274c] focus:ring-[#00274c]"
              />
              Show only open slots
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.showAvailableSlotsOnly}
                onChange={(e) => setFilters({ ...filters, showAvailableSlotsOnly: e.target.checked })}
                className="rounded border-gray-300 text-[#00274c] focus:ring-[#00274c]"
              />
              Show only unassigned slots
            </label>
          </div>

          <div>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-sm text-gray-600">
          Showing <strong>{filteredSlots.length}</strong> of <strong>{slots.length}</strong> slots
          {filters.showSignupsOnly && ' with signups'}
        </p>
      </div>

      {/* Spreadsheet Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('startTime')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Date/Time {getSortIcon('startTime')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('location')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Location {getSortIcon('location')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('execName')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Exec Member {getSortIcon('execName')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('signupCount')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Signups {getSortIcon('signupCount')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSlots.map((slot) => {
                const startTime = formatDateTime(slot.startTime);
                const endTime = formatDateTime(slot.endTime);
                const isExpanded = expandedSlots.has(slot.id);

                return (
                  <>
                    <tr key={slot.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{startTime.date}</div>
                          <div className="text-gray-500">{startTime.time} - {endTime.time}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{slot.location}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-gray-900">
                            {slot.execMember ? slot.execMember.name : 'Not assigned'}
                          </div>
                          {slot.execMember && (
                            <div className="text-gray-500">{slot.execMember.role}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            slot.signupCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {slot.signupCount} / {slot.capacity}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleExpanded(slot.id)}
                            className="text-[#00274c] hover:text-[#003366] flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>
                                <EyeSlashIcon className="w-4 h-4" />
                                Hide Details
                              </>
                            ) : (
                              <>
                                <EyeIcon className="w-4 h-4" />
                                Show Details
                              </>
                            )}
                          </button>
                          
                          {!slot.execMember && (
                            <button
                              onClick={() => assignSelfToSlot(slot.id)}
                              className="text-green-600 hover:text-green-700 flex items-center gap-1 px-2 py-1 bg-green-50 rounded text-xs"
                              title="Assign yourself to this slot"
                            >
                              <UserIcon className="w-3 h-3" />
                              Assign Me
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 bg-gray-50">
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-900">Signup Details</h4>
                            
                            {slot.signups && slot.signups.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {slot.signups.map((signup) => (
                                  <div key={signup.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <div className="font-medium text-gray-900">
                                            {signup.userName || signup.userEmail.split('@')[0]}
                                          </div>
                                          <div className="text-sm text-gray-500">{signup.userEmail}</div>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                          {formatUtcDateInEastern(signup.createdAt, { month: 'short', day: 'numeric' }, false)}
                                        </span>
                                      </div>
                                      
                                      {signup.phone && (
                                        <div className="text-sm">
                                          <span className="font-medium text-gray-700">Phone:</span>
                                          <span className="ml-2 text-gray-900">{signup.phone}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6 text-gray-500">
                                <UserIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No signups yet</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}

              {filteredSlots.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    <MagnifyingGlassIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No slots found matching your filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
