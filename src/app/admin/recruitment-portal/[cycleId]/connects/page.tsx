'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useAdminApi } from '@/hooks/useAdminApi';
import { useCycle } from '../layout';
import { AdminSection, AdminEmptyState, AdminLoadingState } from '@/components/admin/ui';
import type { RecruitmentConnect, CycleSettings } from '@/types/recruitment';

interface ConnectFormData {
  name: string;
  email: string;
  photo: string;
  major: string;
  roleLastSemester: string;
}

const defaultFormData: ConnectFormData = {
  name: '',
  email: '',
  photo: '',
  major: '',
  roleLastSemester: '',
};

export default function ConnectsPage() {
  const params = useParams();
  const cycleId = params.cycleId as string;
  const { cycle, loading: cycleLoading, refreshCycle } = useCycle();
  const { put } = useAdminApi();

  const [connects, setConnects] = useState<RecruitmentConnect[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<ConnectFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);

  // Load connects from cycle settings
  useEffect(() => {
    if (cycle?.settings?.recruitmentConnects) {
      setConnects(cycle.settings.recruitmentConnects);
    } else {
      setConnects([]);
    }
  }, [cycle]);

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditIndex(null);
    setShowForm(false);
  };

  const handleEdit = (index: number) => {
    const connect = connects[index];
    setFormData({
      name: connect.name,
      email: connect.email,
      photo: connect.photo || '',
      major: connect.major,
      roleLastSemester: connect.roleLastSemester || '',
    });
    setEditIndex(index);
    setShowForm(true);
  };

  const handleDelete = async (index: number) => {
    const connect = connects[index];
    if (!confirm(`Are you sure you want to remove ${connect.name} from Recruitment Connects?`)) {
      return;
    }

    try {
      setSaving(true);
      const newConnects = connects.filter((_, i) => i !== index);
      
      const updatedSettings: CycleSettings = {
        ...(cycle?.settings || { requireResume: true, requireHeadshot: true, allowTrackChange: false }),
        recruitmentConnects: newConnects,
      };

      await put(`/api/admin/recruitment/cycles/${cycleId}`, { settings: updatedSettings }, {
        successMessage: 'Recruitment connect removed',
      });
      
      setConnects(newConnects);
      await refreshCycle();
    } catch (error) {
      console.error('Error removing connect:', error);
      toast.error('Failed to remove connect');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.major) {
      toast.error('Name, email, and major are required');
      return;
    }

    // Validate email format
    if (!formData.email.endsWith('@umich.edu')) {
      toast.error('Email must be a @umich.edu address');
      return;
    }

    try {
      setSaving(true);
      
      const newConnect: RecruitmentConnect = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        photo: formData.photo.trim() || undefined,
        major: formData.major.trim(),
        roleLastSemester: formData.roleLastSemester.trim() || undefined,
      };

      let newConnects: RecruitmentConnect[];
      if (editIndex !== null) {
        newConnects = [...connects];
        newConnects[editIndex] = newConnect;
      } else {
        newConnects = [...connects, newConnect];
      }

      const updatedSettings: CycleSettings = {
        ...(cycle?.settings || { requireResume: true, requireHeadshot: true, allowTrackChange: false }),
        recruitmentConnects: newConnects,
      };

      await put(`/api/admin/recruitment/cycles/${cycleId}`, { settings: updatedSettings }, {
        successMessage: editIndex !== null ? 'Recruitment connect updated' : 'Recruitment connect added',
      });
      
      setConnects(newConnects);
      resetForm();
      await refreshCycle();
    } catch (error) {
      console.error('Error saving connect:', error);
      toast.error('Failed to save connect');
    } finally {
      setSaving(false);
    }
  };

  if (cycleLoading) {
    return <AdminLoadingState message="Loading recruitment connects..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Recruitment Connects</h2>
          <p className="text-gray-600 mt-1 max-w-2xl">
            These are confidential contacts for applicants who have questions. They guarantee anonymity - 
            they will not share what applicants ask with anyone reviewing applications. Applicants 
            can feel comfortable asking any question without worrying about it affecting their application.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Connect
        </button>
      </div>

      {/* Anonymity Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheckIcon className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-amber-800">Anonymity Policy</h3>
          <p className="text-sm text-amber-700 mt-1">
            Recruitment Connects pledge complete confidentiality. Any questions asked by applicants 
            will never be shared with anyone involved in the application review process. This helps 
            applicants feel safe asking "dumb" questions they might otherwise be afraid to ask.
          </p>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 m-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editIndex !== null ? 'Edit Recruitment Connect' : 'Add Recruitment Connect'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="uniqname@umich.edu"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Must be a @umich.edu email</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Major *</label>
                <input
                  type="text"
                  value={formData.major}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                  placeholder="Economics, Information, LSA, etc."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Last Semester</label>
                <input
                  type="text"
                  value={formData.roleLastSemester}
                  onChange={(e) => setFormData({ ...formData, roleLastSemester: e.target.value })}
                  placeholder="e.g., Consulting Analyst, Tech Committee, etc."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">What was their position/role last semester?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
                <input
                  type="url"
                  value={formData.photo}
                  onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL to their headshot photo. Leave empty to show initials.
                </p>
                {formData.photo && (
                  <div className="mt-2 flex items-center gap-3">
                    <Image
                      src={formData.photo}
                      alt="Preview"
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span className="text-xs text-gray-500">Photo preview</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editIndex !== null ? 'Save Changes' : 'Add Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connects Grid */}
      {connects.length === 0 ? (
        <AdminEmptyState
          title="No Recruitment Connects"
          description="Add contacts that applicants can reach out to with confidential questions."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Connect
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {connects.map((connect, index) => (
            <div
              key={`${connect.email}-${index}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Photo */}
                {connect.photo ? (
                  <Image
                    src={connect.photo}
                    alt={connect.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-[#00274C] to-[#1e3a5f] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {connect.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{connect.name}</h3>
                  
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                    <AcademicCapIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{connect.major}</span>
                  </div>

                  {connect.roleLastSemester && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                      <BriefcaseIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{connect.roleLastSemester}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-sm text-blue-600 mt-2">
                    <EnvelopeIcon className="w-4 h-4 flex-shrink-0" />
                    <a 
                      href={`mailto:${connect.email}`}
                      className="hover:underline truncate"
                    >
                      {connect.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleEdit(index)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(index)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
