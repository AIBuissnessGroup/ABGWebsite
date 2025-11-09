'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import {
  CalendarDaysIcon,
  ClockIcon,
  EnvelopeIcon,
  EyeIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import CoffeeChatBulkCreateModal from '@/components/admin/CoffeeChatBulkCreateModal';
import CoffeeChatSpreadsheet from '@/components/admin/CoffeeChatSpreadsheet';
import { useAdminApi, useAdminQuery } from '@/hooks/useAdminApi';
import { AdminSection, AdminEmptyState, AdminLoadingState } from '@/components/admin/ui';
import { easternInputToUtc, formatUtcDateInEastern, utcToEasternInput } from '@/lib/timezone';

type Signup = {
  id: string;
  userEmail: string;
  userName: string | null;
  phone?: string;
  createdAt: string;
};

type Slot = {
  id?: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  hostName?: string;
  hostEmail?: string;
  capacity?: number;
  isOpen?: boolean;
  execMember?: {
    id: string;
    name: string;
    role: string;
    email?: string;
  };
  execMemberId?: string;
  signups?: Signup[];
  signupCount?: number;
};

type SlotForm = Pick<
  Slot,
  'id' | 'title' | 'location' | 'hostName' | 'hostEmail' | 'capacity' | 'isOpen'
> & {
  startTime: string;
  endTime: string;
};

type TeamMember = {
  id: string;
  name: string;
  role: string;
  email?: string;
};

const createDefaultSlot = (): SlotForm => {
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    title: 'Coffee Chat',
    startTime: utcToEasternInput(start.toISOString()),
    endTime: utcToEasternInput(end.toISOString()),
    location: 'Ross School of Business',
    hostName: '',
    hostEmail: '',
    capacity: 1,
    isOpen: true,
  };
};

const formatDateTime = (dateString?: string) =>
  formatUtcDateInEastern(dateString, undefined, true);

const formatSignupDate = (dateString: string) =>
  formatUtcDateInEastern(dateString, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }, true);

export default function AdminCoffeeChatsPage() {
  const { data: session, status } = useSession();
  const { post, put, del, request } = useAdminApi();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [editing, setEditing] = useState<SlotForm | null>(null);
  const [showBulkCreate, setShowBulkCreate] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'spreadsheet'>('list');
  const [showSignups, setShowSignups] = useState<string | null>(null);
  const [removingSignup, setRemovingSignup] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all');
  const [filterHost, setFilterHost] = useState('all');
  const [saving, setSaving] = useState(false);

  const {
    data: slotsData,
    loading: slotsLoading,
    error: slotsError,
    refetch: refetchSlots,
  } = useAdminQuery<Slot[]>(status === 'authenticated' ? '/api/admin/recruitment/coffee-chats' : null, {
    enabled: status === 'authenticated',
    skipErrorToast: true,
  });

  const {
    data: teamData,
    loading: teamLoading,
    error: teamError,
    refetch: refetchTeam,
  } = useAdminQuery<TeamMember[]>(status === 'authenticated' ? '/api/admin/team' : null, {
    enabled: status === 'authenticated',
    skipErrorToast: true,
  });

  const teamMembers = useMemo(() => teamData ?? [], [teamData]);

  const openSlotEditor = (slot?: Slot) => {
    if (!slot) {
      setEditing(createDefaultSlot());
      return;
    }

    setEditing({
      id: slot.id,
      title: slot.title,
      location: slot.location,
      hostName: slot.hostName,
      hostEmail: slot.hostEmail,
      capacity: slot.capacity,
      isOpen: slot.isOpen,
      startTime: utcToEasternInput(slot.startTime) || '',
      endTime: utcToEasternInput(slot.endTime) || '',
    });
  };

  useEffect(() => {
    setSlots(slotsData ?? []);
  }, [slotsData]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
    }
  }, [session, status]);

  const filteredSlots = useMemo(() => {
    if (!slots.length) return [];
    const userEmail = session?.user?.email;

    return slots.filter((slot) => {
      const text = filterText.toLowerCase();
      const textMatch =
        !filterText ||
        slot.title?.toLowerCase().includes(text) ||
        slot.location?.toLowerCase().includes(text) ||
        slot.hostName?.toLowerCase().includes(text) ||
        slot.execMember?.name?.toLowerCase().includes(text) ||
        slot.signups?.some(
          (signup) =>
            signup.userName?.toLowerCase().includes(text) ||
            signup.userEmail?.toLowerCase().includes(text),
        );

      const capacity = slot.capacity ?? 1;
      const taken = slot.signupCount ?? slot.signups?.length ?? 0;
      const statusMatch =
        filterStatus === 'all' ||
        (filterStatus === 'open' && taken < capacity) ||
        (filterStatus === 'closed' && taken >= capacity);

      const hostMatch =
        filterHost === 'all' ||
        slot.execMember?.id === filterHost ||
        slot.hostEmail === filterHost ||
        (userEmail && slot.hostEmail === userEmail);

      return textMatch && statusMatch && hostMatch;
    });
  }, [slots, filterText, filterStatus, filterHost, session?.user?.email]);

  const resetFilters = () => {
    setFilterText('');
    setFilterStatus('all');
    setFilterHost('all');
  };

  const handleSaveSlot = async () => {
    if (!editing) return;

    const errors: string[] = [];
    if (!editing.title?.trim()) errors.push('Title is required');
    if (!editing.startTime) errors.push('Start time is required');
    if (!editing.endTime) errors.push('End time is required');
    if (!editing.location?.trim()) errors.push('Location is required');
    if (!editing.hostName?.trim()) errors.push('Host name is required');
    if (!editing.hostEmail?.trim()) errors.push('Host email is required');
    if (!editing.capacity || editing.capacity < 1) errors.push('Capacity must be at least 1');

    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    setSaving(true);
    const payload = {
      title: editing.title?.trim(),
      startTime: easternInputToUtc(editing.startTime),
      endTime: easternInputToUtc(editing.endTime),
      location: editing.location?.trim(),
      hostName: editing.hostName?.trim(),
      hostEmail: editing.hostEmail?.trim(),
      capacity: editing.capacity,
      isOpen: editing.isOpen ?? true,
    };

    try {
      if (editing.id) {
        await put('/api/admin/recruitment/coffee-chats', { id: editing.id, ...payload }, {
          successMessage: 'Coffee chat updated',
        });
      } else {
        await post('/api/admin/recruitment/coffee-chats', payload, {
          successMessage: 'Coffee chat created',
        });
      }

      setEditing(null);
      await refetchSlots();
    } catch {
      // Error surfaced via toast in useAdminApi
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (slot: Slot) => {
    if (!slot.id) return;
    if (!confirm(`Delete "${slot.title ?? 'this coffee chat'}"? This cannot be undone.`)) {
      return;
    }

    try {
      await del(`/api/admin/recruitment/coffee-chats?id=${slot.id}`, {
        successMessage: 'Coffee chat removed',
      });
      await refetchSlots();
    } catch {
      // Error surfaced via toast in useAdminApi
    }
  };

  const handleAssignExec = async (slotId: string, execMemberId: string) => {
    const execMember = teamMembers.find((member) => member.id === execMemberId);
    if (!execMember) {
      toast.error('Unable to find that exec member');
      return;
    }

    try {
      const response = await post<{
        slot?: {
          id: string;
          execMemberId?: string;
          hostName?: string;
          hostEmail?: string;
        };
      }>(
        `/api/admin/coffee-chats/${slotId}/assign-exec`,
        {
          slotId,
          execMemberId,
          execName: execMember.name,
          execEmail: execMember.email,
        },
        {
          successMessage: 'Exec assigned to coffee chat',
        },
      );

      if (response?.slot?.id) {
        setSlots((prev) =>
          prev.map((slot) =>
            slot.id === response.slot?.id
              ? {
                  ...slot,
                  hostName: response.slot?.hostName ?? slot.hostName,
                  hostEmail: response.slot?.hostEmail ?? slot.hostEmail,
                  execMemberId: response.slot?.execMemberId,
                  execMember,
                }
              : slot,
          ),
        );
      } else {
        await refetchSlots();
      }
    } catch {
      // toasts handled by hook
    }
  };

  const handleRemoveSignup = async (slotId: string, signupId: string) => {
    setRemovingSignup(signupId);
    try {
      const updatedSlot = await request<Slot>('/api/admin/recruitment/coffee-chats', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'removeSignup',
          slotId,
          signupId,
        }),
        successMessage: 'Signup removed',
      });

      if (updatedSlot?.id) {
        setSlots((prev) =>
          prev.map((slot) => (slot.id === updatedSlot.id ? { ...slot, ...updatedSlot } : slot)),
        );
      } else {
        await refetchSlots();
      }
    } catch {
      await refetchSlots();
    } finally {
      setRemovingSignup(null);
    }
  };

  const handleRemoveHost = async (slotId: string) => {
    if (!confirm('Remove yourself as the host for this coffee chat?')) return;

    try {
      const updatedSlot = await request<Slot>('/api/admin/recruitment/coffee-chats', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'removeHost',
          slotId,
        }),
        successMessage: 'Host removed',
      });

      if (updatedSlot?.id) {
        setSlots((prev) =>
          prev.map((slot) => (slot.id === updatedSlot.id ? { ...slot, ...updatedSlot } : slot)),
        );
      } else {
        await refetchSlots();
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const isLoading = slotsLoading || teamLoading || status === 'loading';
  const loadError = slotsError || teamError;

  if (status === 'loading') {
    return <AdminLoadingState fullHeight message="Checking permissions..." />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="space-y-6">
      <AdminSection
        title="Coffee Chat Slots"
        description="Coordinate every coffee chat slot, host, and signup from one place."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="inline-flex rounded-lg border border-gray-200 p-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  viewMode === 'list'
                    ? 'bg-[#00274c] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('spreadsheet')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  viewMode === 'spreadsheet'
                    ? 'bg-[#00274c] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Spreadsheet
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowBulkCreate(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              <CalendarDaysIcon className="h-4 w-4" />
              Bulk Create
            </button>

            <button
              type="button"
              onClick={() => openSlotEditor()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#00274c] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#01305e]"
            >
              <PlusIcon className="h-4 w-4" />
              Add Slot
            </button>
          </div>
        }
      >
        {isLoading && <AdminLoadingState fullHeight message="Loading coffee chats..." />}

        {!isLoading && loadError && (
          <AdminEmptyState
            title="We couldn't load coffee chats"
            description={loadError.message}
            action={
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    refetchSlots();
                    refetchTeam();
                  }}
                >
                  Try again
                </button>
              </div>
            }
          />
        )}

        {!isLoading && !loadError && (
          <>
            {viewMode === 'list' && (
              <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Search
                    </label>
                    <input
                      type="text"
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      placeholder="Title, location, host, attendee..."
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#00274c]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as 'all' | 'open' | 'closed')}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#00274c]"
                    >
                      <option value="all">All statuses</option>
                      <option value="open">Open</option>
                      <option value="closed">Full</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Host</label>
                    <select
                      value={filterHost}
                      onChange={(e) => setFilterHost(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#00274c]"
                    >
                      <option value="all">All hosts</option>
                      {teamMembers.map((member) => (
                        <option key={`member-${member.id}`} value={member.id}>
                          {member.name} (Exec)
                        </option>
                      ))}
                      {Array.from(
                        new Set(
                          slots
                            .filter(
                              (slot) =>
                                slot.hostEmail &&
                                !teamMembers.some((member) => member.email === slot.hostEmail),
                            )
                            .map((slot) => slot.hostEmail as string),
                        ),
                      ).map((hostEmail) => (
                        <option key={`host-${hostEmail}`} value={hostEmail}>
                          {slots.find((slot) => slot.hostEmail === hostEmail)?.hostName ||
                            hostEmail?.split('@')[0]}
                          {' '}
                          ({hostEmail})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Clear filters
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  Showing {filteredSlots.length} of {slots.length} slots
                </p>
              </div>
            )}

            {viewMode === 'spreadsheet' ? (
              <CoffeeChatSpreadsheet
                slots={slots}
                teamMembers={teamMembers}
                onRefresh={refetchSlots}
                currentUserEmail={session?.user?.email || undefined}
              />
            ) : filteredSlots.length === 0 ? (
              <AdminEmptyState
                title="No coffee chat slots yet"
                description="Create your first slot or bulk import to get started."
                action={
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBulkCreate(true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                    >
                      <CalendarDaysIcon className="h-4 w-4" />
                      Bulk create
                    </button>
                    <button
                      type="button"
                      onClick={() => openSlotEditor()}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#00274c] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#01305e]"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add slot
                    </button>
                  </div>
                }
              />
            ) : (
              <div className="space-y-4">
                {filteredSlots.map((slot) => (
                  <div key={slot.id} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="mb-4 flex items-center justify-between gap-4">
                          <h3 className="text-lg font-semibold text-gray-900">{slot.title}</h3>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              slot.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {slot.isOpen ? 'Open' : 'Closed'}
                          </span>
                        </div>

                        <div className="grid gap-4 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">Start</p>
                              <p>{formatDateTime(slot.startTime)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">End</p>
                              <p>{formatDateTime(slot.endTime)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">Location</p>
                              <p>{slot.location}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <UsersIcon className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">Capacity</p>
                              <p>
                                {slot.signupCount ?? slot.signups?.length ?? 0} / {slot.capacity ?? 1}
                              </p>
                            </div>
                          </div>
                        </div>

                        {(slot.hostName || slot.hostEmail) && (
                          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-start gap-2 text-sm">
                                <UserIcon className="h-4 w-4 text-blue-600" />
                                <div>
                                  <p className="font-semibold text-blue-900">{slot.hostName}</p>
                                  <p className="flex items-center gap-1 text-blue-800">
                                    <EnvelopeIcon className="h-3.5 w-3.5" />
                                    {slot.hostEmail}
                                  </p>
                                </div>
                              </div>
                              {slot.hostEmail === session?.user?.email && (
                                <button
                                  type="button"
                                  onClick={() => slot.id && handleRemoveHost(slot.id)}
                                  className="text-sm font-medium text-red-600 hover:text-red-700"
                                >
                                  Remove myself as host
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mt-4 grid gap-4 text-sm text-gray-600 md:grid-cols-2">
                          <div>
                            <p className="font-medium text-gray-900">Assign exec host</p>
                            <select
                              value={slot.execMember?.id || ''}
                              onChange={(e) => {
                                const execId = e.target.value;
                                if (!execId || !slot.id) return;
                                handleAssignExec(slot.id, execId);
                              }}
                              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#00274c]"
                            >
                              <option value="">Select exec...</option>
                              {teamMembers.map((member) => (
                                <option key={member.id} value={member.id}>
                                  {member.name} — {member.role}
                                </option>
                              ))}
                            </select>
                            {slot.execMember && (
                              <p className="mt-1 text-sm text-green-600">
                                ✓ Assigned to {slot.execMember.name}
                              </p>
                            )}
                          </div>

                          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-900">
                                Signups ({slot.signupCount ?? slot.signups?.length ?? 0})
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowSignups((prev) => (prev === slot.id ? null : slot.id ?? null))
                                }
                                className="inline-flex items-center gap-1 text-sm font-medium text-[#00274c]"
                              >
                                <EyeIcon className="h-4 w-4" />
                                {showSignups === slot.id ? 'Hide' : 'Show'} details
                              </button>
                            </div>

                            {showSignups === slot.id && (
                              <div className="mt-4 space-y-2">
                                {slot.signups?.map((signup) => (
                                  <div
                                    key={signup.id}
                                    className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                                  >
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">
                                        {signup.userName || signup.userEmail.split('@')[0]}
                                      </p>
                                      <p className="text-sm text-gray-500">{signup.userEmail}</p>
                                      {signup.phone && (
                                        <p className="text-sm text-gray-500">📞 {signup.phone}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-400">
                                      <span>{formatSignupDate(signup.createdAt)}</span>
                                      <button
                                        type="button"
                                        onClick={() => slot.id && handleRemoveSignup(slot.id, signup.id)}
                                        disabled={removingSignup === signup.id}
                                        className="rounded-full p-1 text-red-600 hover:bg-red-50"
                                      >
                                        {removingSignup === signup.id ? (
                                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                                        ) : (
                                          <XMarkIcon className="h-4 w-4" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                {!slot.signups?.length && (
                                  <p className="py-2 text-center text-sm text-gray-500">
                                    No signups yet
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 border-t border-gray-100 pt-4 text-sm">
                      <button
                        type="button"
                        onClick={() => openSlotEditor(slot)}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-[#00274c] hover:bg-blue-50"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSlot(slot)}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-red-600 hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </AdminSection>

      <CoffeeChatBulkCreateModal
        isOpen={showBulkCreate}
        onClose={() => setShowBulkCreate(false)}
        onSuccess={async () => {
          setShowBulkCreate(false);
          await refetchSlots();
        }}
      />

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editing.id ? 'Edit Coffee Chat Slot' : 'New Coffee Chat Slot'}
              </h2>
            </div>
            <div className="space-y-4 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Title *</label>
                  <input
                    type="text"
                    value={editing.title || ''}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#00274c]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={editing.location || ''}
                    onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#00274c]"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Host Name *</label>
                  <input
                    type="text"
                    value={editing.hostName || ''}
                    onChange={(e) => setEditing({ ...editing, hostName: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#00274c]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Host Email *</label>
                  <input
                    type="email"
                    value={editing.hostEmail || ''}
                    onChange={(e) => setEditing({ ...editing, hostEmail: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#00274c]"
                    placeholder="host@umich.edu"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={editing.startTime || ''}
                    onChange={(e) => setEditing({ ...editing, startTime: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#00274c]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={editing.endTime || ''}
                    onChange={(e) => setEditing({ ...editing, endTime: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#00274c]"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Capacity *</label>
                  <input
                    type="number"
                    min={1}
                    value={editing.capacity ?? 1}
                    onChange={(e) => setEditing({ ...editing, capacity: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#00274c]"
                  />
                </div>
                <label className="mt-6 flex items-center gap-3 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={!!editing.isOpen}
                    onChange={(e) => setEditing({ ...editing, isOpen: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-[#00274c] focus:ring-[#00274c]"
                  />
                  Slot is open for signups
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSlot}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-lg bg-[#00274c] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#01305e] disabled:opacity-60"
              >
                {saving ? 'Saving…' : editing.id ? 'Update Slot' : 'Create Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
