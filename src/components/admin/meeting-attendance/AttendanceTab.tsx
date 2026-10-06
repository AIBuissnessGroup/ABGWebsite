'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  MagnifyingGlassIcon, 
  CalendarDaysIcon, 
  XMarkIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { UserAttendanceSummary, MeetingAttendee } from '@/types/meetings';

export default function AttendanceTab() {
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<UserAttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Selected user for attendance history drawer/modal
  const [selectedUser, setSelectedUser] = useState<UserAttendanceSummary | null>(null);
  const [userMeetings, setUserMeetings] = useState<MeetingAttendee[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchUsers = async (searchQuery: string = search, role: string = roleFilter) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (role && role !== 'ALL') params.set('role', role);
      params.set('limit', '100');

      const res = await fetch(`/api/admin/attendance/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data?.users) ? data.users : []);
      } else {
        toast.error('Failed to load users');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(search, roleFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, roleFilter]);

  const handleSelectUser = async (user: UserAttendanceSummary) => {
    setSelectedUser(user);
    setUserMeetings([]);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/admin/attendance/users/${user.userId}`);
      if (res.ok) {
        const data = await res.json();
        setUserMeetings(Array.isArray(data?.meetings) ? data.meetings : []);
      } else {
        toast.error('Failed to load user attendance history');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error loading user history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleExportUserHistoryCSV = () => {
    if (!selectedUser || userMeetings.length === 0) return;

    const headers = ['Meeting Name', 'Category', 'Meeting Date', 'Checked-In At'];
    const rows = userMeetings.map((m) => [
      `"${(m.meetingName || '').replace(/"/g, '""')}"`,
      `"${m.meetingCategory || ''}"`,
      `"${m.meetingDate || ''}"`,
      `"${m.checkedInAt ? new Date(m.checkedInAt).toLocaleString() : ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_${(selectedUser.name || 'member').replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully');
  };

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'Education Meeting':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Project Team':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'General Meeting':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const rolePills = [
    { label: 'All Members', value: 'ALL' },
    { label: 'Project Team Members', value: 'PROJECT_TEAM_MEMBER' },
    { label: 'General Members', value: 'GENERAL_MEMBER' },
    { label: 'Admins', value: 'ADMIN' },
  ];

  return (
    <div className="space-y-6">
      {/* Search & Role Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or umich email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00274c] focus:bg-white text-gray-900 transition-all"
          />
        </div>

        {/* Role Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {rolePills.map((pill) => (
            <button
              key={pill.value}
              onClick={() => setRoleFilter(pill.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                roleFilter === pill.value
                  ? 'bg-[#00274c] text-white shadow-sm'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Attendance Grid / Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
            Searching users and calculating attendance...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-sm font-medium">No members found matching your search.</p>
            <p className="text-xs text-gray-400 mt-1">Try searching by full name or @umich.edu email address.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Member</th>
                  <th className="px-5 py-3.5 font-semibold">Roles</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Meetings Attended</th>
                  <th className="px-5 py-3.5 font-semibold">Last Attended Meeting</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => {
                  const safeRoles = Array.isArray(user.roles) ? user.roles : [];
                  return (
                    <tr
                      key={user.userId}
                      onClick={() => handleSelectUser(user)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00274c] to-blue-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {safeRoles.map((role) => (
                            <span
                              key={role}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                role === 'PROJECT_TEAM_MEMBER'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : role === 'GENERAL_MEMBER'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : role === 'ADMIN'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-gray-100 text-gray-600 border-gray-200'
                              }`}
                            >
                              {role === 'PROJECT_TEAM_MEMBER'
                                ? 'Project Team'
                                : role === 'GENERAL_MEMBER'
                                ? 'General Member'
                                : role}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                            user.totalAttended > 0
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-gray-50 text-gray-400 border-gray-200'
                          }`}
                        >
                          <CalendarDaysIcon className="w-3.5 h-3.5" />
                          {user.totalAttended} {user.totalAttended === 1 ? 'meeting' : 'meetings'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-xs text-gray-600">
                        {user.lastAttended ? (
                          <div>
                            <p className="font-medium text-gray-800 truncate max-w-xs">
                              {user.lastAttended.meetingName}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {user.lastAttended.meetingDate} • {user.lastAttended.meetingCategory}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No attendance recorded</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectUser(user);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#00274c] bg-gray-100 group-hover:bg-[#00274c] group-hover:text-white transition-all cursor-pointer"
                        >
                          <span>History</span>
                          <ChevronRightIcon className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Meeting History Modal - Rendered via createPortal directly into document.body */}
      {mounted && selectedUser && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedUser(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl relative border border-gray-100 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00274c] to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-md">
                  {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">{selectedUser.name}</h3>
                  <p className="text-xs text-gray-500">{selectedUser.email}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(selectedUser.roles || []).map((r) => (
                      <span
                        key={r}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200"
                      >
                        {r === 'PROJECT_TEAM_MEMBER' ? 'Project Team' : r === 'GENERAL_MEMBER' ? 'General Member' : r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {userMeetings.length > 0 && (
                  <button
                    onClick={handleExportUserHistoryCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-sm cursor-pointer"
                  >
                    <ArrowDownTrayIcon className="w-3.5 h-3.5 text-gray-500" />
                    Export
                  </button>
                )}
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Attendance Stat Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-center">
                <span className="text-xs text-blue-700 font-medium">Total Check-Ins</span>
                <p className="text-xl font-bold text-blue-900">{userMeetings.length}</p>
              </div>
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 text-center">
                <span className="text-xs text-emerald-700 font-medium">General Mtgs</span>
                <p className="text-xl font-bold text-emerald-900">
                  {userMeetings.filter((m) => m.meetingCategory === 'General Meeting').length}
                </p>
              </div>
              <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-3 text-center">
                <span className="text-xs text-purple-700 font-medium">Education Mtgs</span>
                <p className="text-xl font-bold text-purple-900">
                  {userMeetings.filter((m) => m.meetingCategory === 'Education Meeting').length}
                </p>
              </div>
              <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3 text-center">
                <span className="text-xs text-amber-700 font-medium">Project Team</span>
                <p className="text-xl font-bold text-amber-900">
                  {userMeetings.filter((m) => m.meetingCategory === 'Project Team').length}
                </p>
              </div>
            </div>

            {/* Meeting Timeline Content */}
            <div className="flex-1 overflow-y-auto pr-1">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
                Meeting Attendance History
              </h4>

              {loadingHistory ? (
                <div className="py-12 text-center text-gray-500">
                  <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                  Loading meeting history...
                </div>
              ) : userMeetings.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  This member has not checked in to any meetings yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {userMeetings.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200/80 bg-white hover:border-gray-300 transition-all shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getCategoryBadge(
                              record.meetingCategory
                            )}`}
                          >
                            {record.meetingCategory}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">📅 {record.meetingDate}</span>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm">{record.meetingName}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ✓ Attended
                        </span>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {record.checkedInAt
                            ? new Date(record.checkedInAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
