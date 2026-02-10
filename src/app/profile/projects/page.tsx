'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  RocketLaunchIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ProfileProjectsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [contribution, setContribution] = useState('');
  const [saving, setSaving] = useState(false);

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
      return;
    }
  }, [session, status]);

  // Load user's projects
  useEffect(() => {
    if (session?.user) {
      loadProjects();
    }
  }, [session]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      } else {
        toast.error('Failed to load projects');
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project: any) => {
    setEditingProject(project.id);
    setContribution(project.userContribution?.contribution || '');
  };

  const handleSave = async (projectId: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId, 
          contribution 
        })
      });

      if (res.ok) {
        toast.success('Contribution updated successfully!');
        loadProjects();
        setEditingProject(null);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update contribution');
      }
    } catch (error) {
      console.error('Error updating contribution:', error);
      toast.error('Failed to update contribution');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingProject(null);
    setContribution('');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00274c]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/profile"
            className="inline-flex items-center gap-2 text-[#00274c] hover:text-[#003366] mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Profile
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-600 mt-2">
            Manage your contributions to ABG projects. Update your role and achievements for each project you're involved in.
          </p>
        </div>

        {/* Projects List */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <RocketLaunchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Yet</h3>
            <p className="text-gray-600">
              You're not currently assigned to any projects. Once you're added to a project team, 
              you'll be able to manage your contributions here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
                    <p className="text-gray-600 mb-3">{project.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                        project.status === 'PLANNING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                      {project.userContribution?.role && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          {project.userContribution.role}
                        </span>
                      )}
                    </div>
                  </div>

                  {editingProject !== project.id && (
                    <button
                      onClick={() => handleEdit(project)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#00274c] text-white rounded-lg hover:bg-[#003366]"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Edit Contribution
                    </button>
                  )}
                </div>

                {/* Contribution Section */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Your Contribution</h4>
                  
                  {editingProject === project.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={contribution}
                        onChange={(e) => setContribution(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                        placeholder="Describe your role, responsibilities, and achievements in this project..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(project.id)}
                          disabled={saving}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckIcon className="w-4 h-4" />
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={saving}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                        >
                          <XMarkIcon className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      {project.userContribution?.contribution ? (
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {project.userContribution.contribution}
                        </p>
                      ) : (
                        <p className="text-gray-500 italic">
                          No contribution description yet. Click "Edit Contribution" to add one.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Project Details */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Start Date:</span>
                      <p className="text-gray-900">{new Date(project.startDate).toLocaleDateString()}</p>
                    </div>
                    {project.endDate && (
                      <div>
                        <span className="font-medium text-gray-700">End Date:</span>
                        <p className="text-gray-900">{new Date(project.endDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">Progress:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[#00274c] h-2 rounded-full" 
                            style={{ width: `${project.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-900 font-medium">{project.progress || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
