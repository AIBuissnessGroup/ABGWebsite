'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CalendarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useAdminApi } from '@/hooks/useAdminApi';
import { withAdminPageProtection } from '@/components/admin/AdminPageProtection';
import { AdminSection, AdminEmptyState, AdminLoadingState } from '@/components/admin/ui';
import type { RecruitmentCycle } from '@/types/recruitment';

function RecruitmentPortalAdmin() {
  const { data: session } = useSession();
  const router = useRouter();
  const { get, post, put, del } = useAdminApi();
  
  const [cycles, setCycles] = useState<RecruitmentCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCycle, setEditingCycle] = useState<RecruitmentCycle | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    portalOpenAt: '',
    portalCloseAt: '',
    applicationDueAt: '',
    isActive: false,
  });

  const loadCycles = async () => {
    try {
      setLoading(true);
      const data = await get<RecruitmentCycle[]>('/api/admin/recruitment/cycles');
      setCycles(data);
    } catch (error) {
      console.error('Error loading cycles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCycles();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      portalOpenAt: '',
      portalCloseAt: '',
      applicationDueAt: '',
      isActive: false,
    });
    setEditingCycle(null);
    setShowForm(false);
  };

  const handleEdit = (cycle: RecruitmentCycle) => {
    setEditingCycle(cycle);
    setFormData({
      name: cycle.name,
      slug: cycle.slug,
      portalOpenAt: formatDateForInput(new Date(cycle.portalOpenAt)),
      portalCloseAt: formatDateForInput(new Date(cycle.portalCloseAt)),
      applicationDueAt: formatDateForInput(new Date(cycle.applicationDueAt)),
      isActive: cycle.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        portalOpenAt: new Date(formData.portalOpenAt).toISOString(),
        portalCloseAt: new Date(formData.portalCloseAt).toISOString(),
        applicationDueAt: new Date(formData.applicationDueAt).toISOString(),
      };

      if (editingCycle) {
        await put(`/api/admin/recruitment/cycles/${editingCycle._id}`, data, {
          successMessage: 'Cycle updated successfully',
        });
      } else {
        await post('/api/admin/recruitment/cycles', data, {
          successMessage: 'Cycle created successfully',
        });
      }
      
      resetForm();
      loadCycles();
    } catch (error) {
      console.error('Error saving cycle:', error);
    }
  };

  const handleDelete = async (cycle: RecruitmentCycle) => {
    if (!confirm(`Are you sure you want to delete "${cycle.name}"?`)) return;
    
    try {
      // First attempt without cascade
      const response = await fetch(`/api/admin/recruitment/cycles/${cycle._id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.status === 409 && data.requiresConfirmation) {
        // Cycle has data - ask for cascade confirmation
        const cascadeConfirm = confirm(
          `${data.message}\n\nClick OK to delete everything, or Cancel to abort.`
        );
        
        if (cascadeConfirm) {
          // Retry with cascade confirmation
          await del(`/api/admin/recruitment/cycles/${cycle._id}?confirm=cascade`, {
            successMessage: `Cycle "${cycle.name}" and all related data deleted successfully`,
          });
          loadCycles();
        }
      } else if (response.ok) {
        toast.success('Cycle deleted successfully');
        loadCycles();
      } else {
        throw new Error(data.error || 'Failed to delete cycle');
      }
    } catch (error) {
      console.error('Error deleting cycle:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete cycle');
    }
  };

  const handleSetActive = async (cycle: RecruitmentCycle) => {
    try {
      await put(`/api/admin/recruitment/cycles/${cycle._id}`, { isActive: true }, {
        successMessage: `${cycle.name} is now the active cycle`,
      });
      loadCycles();
    } catch (error) {
      console.error('Error activating cycle:', error);
    }
  };

  const formatDateForInput = (date: Date): string => {
    // Get local date/time components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDisplayDate = (dateStr: string | Date): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York',
      timeZoneName: 'short',
    });
  };

  const getCycleStatus = (cycle: RecruitmentCycle): { label: string; color: string } => {
    const now = new Date();
    const open = new Date(cycle.portalOpenAt);
    const close = new Date(cycle.portalCloseAt);
    const due = new Date(cycle.applicationDueAt);

    if (now < open) {
      return { label: 'Not Started', color: 'bg-gray-100 text-gray-800' };
    }
    if (now > close) {
      return { label: 'Closed', color: 'bg-red-100 text-red-800' };
    }
    if (now > due) {
      return { label: 'Apps Closed', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { label: 'Active', color: 'bg-green-100 text-green-800' };
  };

  if (loading) {
    return <AdminLoadingState message="Loading recruitment cycles..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruitment Portal</h1>
          <p className="text-gray-600 mt-1">Manage recruitment cycles and applications</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          New Cycle
        </button>
      </div>

      {/* Cycle Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 m-4">
            <h2 className="text-xl font-bold mb-4">
              {editingCycle ? 'Edit Cycle' : 'Create New Cycle'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Fall 2025 Recruitment"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  placeholder="fall-2025"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">URL-friendly identifier (e.g., fall-2025)</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Schedule</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    Eastern Time (ET)
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Portal Opens - Date</label>
                    <input
                      type="date"
                      value={formData.portalOpenAt.split('T')[0]}
                      onChange={(e) => {
                        const time = formData.portalOpenAt.split('T')[1] || '09:00';
                        setFormData({ ...formData, portalOpenAt: `${e.target.value}T${time}` });
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                    <input
                      type="time"
                      value={formData.portalOpenAt.split('T')[1] || '09:00'}
                      onChange={(e) => {
                        const date = formData.portalOpenAt.split('T')[0];
                        setFormData({ ...formData, portalOpenAt: `${date}T${e.target.value}` });
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">App Deadline - Date</label>
                    <input
                      type="date"
                      value={formData.applicationDueAt.split('T')[0]}
                      onChange={(e) => {
                        const time = formData.applicationDueAt.split('T')[1] || '23:59';
                        setFormData({ ...formData, applicationDueAt: `${e.target.value}T${time}` });
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                    <input
                      type="time"
                      value={formData.applicationDueAt.split('T')[1] || '23:59'}
                      onChange={(e) => {
                        const date = formData.applicationDueAt.split('T')[0];
                        setFormData({ ...formData, applicationDueAt: `${date}T${e.target.value}` });
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Portal Closes - Date</label>
                    <input
                      type="date"
                      value={formData.portalCloseAt.split('T')[0]}
                      onChange={(e) => {
                        const time = formData.portalCloseAt.split('T')[1] || '23:59';
                        setFormData({ ...formData, portalCloseAt: `${e.target.value}T${time}` });
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                    <input
                      type="time"
                      value={formData.portalCloseAt.split('T')[1] || '23:59'}
                      onChange={(e) => {
                        const date = formData.portalCloseAt.split('T')[0];
                        setFormData({ ...formData, portalCloseAt: `${date}T${e.target.value}` });
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Set as active cycle (only one cycle can be active)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCycle ? 'Save Changes' : 'Create Cycle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cycles List */}
      {cycles.length === 0 ? (
        <AdminEmptyState
          title="No Recruitment Cycles"
          description="Create your first recruitment cycle to get started"
          action={
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Cycle
            </button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {cycles.map((cycle) => {
            const status = getCycleStatus(cycle);
            return (
              <div
                key={cycle._id?.toString()}
                className={`bg-white rounded-xl border p-6 ${
                  cycle.isActive ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{cycle.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                      {cycle.isActive && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          Active Cycle
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">/{cycle.slug}</p>
                    
                    <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-gray-500">Opens</p>
                        <p className="font-medium">{formatDisplayDate(cycle.portalOpenAt)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Deadline</p>
                        <p className="font-medium">{formatDisplayDate(cycle.applicationDueAt)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Closes</p>
                        <p className="font-medium">{formatDisplayDate(cycle.portalCloseAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!cycle.isActive && (
                      <button
                        onClick={() => handleSetActive(cycle)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Set as active"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(cycle)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cycle)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                  <button
                    onClick={() => router.push(`/admin/recruitment-portal/${cycle._id}/events`)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <CalendarIcon className="w-4 h-4" />
                    Events
                  </button>
                  <button
                    onClick={() => router.push(`/admin/recruitment-portal/${cycle._id}/questions`)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <ClipboardDocumentListIcon className="w-4 h-4" />
                    Questions
                  </button>
                  <button
                    onClick={() => router.push(`/admin/recruitment-portal/${cycle._id}/slots`)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    Slots
                  </button>
                  <button
                    onClick={() => router.push(`/admin/recruitment-portal/${cycle._id}/applicants`)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <UserGroupIcon className="w-4 h-4" />
                    Applicants
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default withAdminPageProtection(RecruitmentPortalAdmin, 'recruitment');
