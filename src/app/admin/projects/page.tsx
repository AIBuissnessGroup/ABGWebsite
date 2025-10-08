'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

export default function ProjectsAdmin() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  // Restore form state on mount
  useEffect(() => {
    try {
      const savedFormState = localStorage.getItem('projectsAdmin_formState');
      if (savedFormState && projects && projects.length > 0) {
        const { showForm: savedShowForm, editingProjectId } = JSON.parse(savedFormState);
        console.log('🔄 Restoring projects form state:', { savedShowForm, editingProjectId, projectsLoaded: projects.length > 0 });
        if (savedShowForm) {
          setShowForm(true);
          if (editingProjectId) {
            // Find and set the editing project
            const project = projects.find(p => p.id === editingProjectId);
            if (project) {
              setEditingProject(project);
              console.log('✓ Projects editing project restored:', project.title);
            }
          } else {
            console.log('✓ Projects new form restored');
          }
        }
      }
    } catch (error) {
      console.error('Error restoring form state:', error);
    }
  }, [projects]);

  // Save form state whenever it changes
  useEffect(() => {
    try {
      const formState = {
        showForm,
        editingProjectId: editingProject?.id || null
      };
      if (showForm || editingProject) {
        localStorage.setItem('projectsAdmin_formState', JSON.stringify(formState));
      } else {
        localStorage.removeItem('projectsAdmin_formState');
      }
    } catch (error) {
      console.error('Error saving form state:', error);
    }
  }, [showForm, editingProject]);

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
      return;
    }
    // Let the API handle admin checking - just proceed if logged in
    console.log('User session:', session.user);
  }, [session, status]);

  // Load projects
  useEffect(() => {
    if (session?.user) {
      loadProjects();
    }
  }, [session]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      console.log('Loading projects...');
      const res = await fetch('/api/admin/projects');
      console.log('Projects API response status:', res.status);
      const data = await res.json();
      console.log('Projects API response data:', data);
      if (data && !data.error) {
        setProjects(data);
      } else {
        console.error('Projects API error:', data.error);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        const res = await fetch(`/api/admin/projects?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          loadProjects();
        }
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'ACTIVE': return 'bg-blue-100 text-blue-800';
      case 'PLANNING': return 'bg-yellow-100 text-yellow-800';
      case 'ON_HOLD': return 'bg-orange-100 text-orange-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00274c]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage project portfolio ({(projects || []).length} total)</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setEditingProject(null);
              setShowForm(true);
            }}
            className="bg-[#00274c] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#003366] admin-white-text"
          >
            <PlusIcon className="w-4 h-4" />
            Add Project
          </button>
        )}
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
          <ProjectForm
            project={editingProject}
            onClose={() => {
              setShowForm(false);
              setEditingProject(null);
              // Clear form state from localStorage
              localStorage.removeItem('projectsAdmin_formState');
            }}
            onSave={() => {
              loadProjects();
              setShowForm(false);
              setEditingProject(null);
              // Clear form state from localStorage
              localStorage.removeItem('projectsAdmin_formState');
            }}
          />
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid gap-6">
        {(projects || []).map((project: any) => (
          <div key={project.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  {project.featured && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Progress:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#00274c] h-2 rounded-full" 
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">{project.progress || 0}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Start Date:</span>
                    <p className="text-gray-900">{new Date(project.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">End Date:</span>
                    <p className="text-gray-900">
                      {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Budget:</span>
                    <p className="text-gray-900">{project.budget || 'N/A'}</p>
                  </div>
                </div>
                
                {project.technologies && (
                  <div className="mt-3">
                    <span className="font-medium text-gray-700 text-sm">Technologies:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(() => {
                        try {
                          // Try to parse as JSON first
                          const parsed = JSON.parse(project.technologies || '[]');
                          return Array.isArray(parsed) ? parsed : [];
                        } catch (e) {
                          // If JSON parsing fails, treat as comma-separated string
                          return project.technologies.split(',').map((tech: string) => tech.trim()).filter(Boolean);
                        }
                      })().slice(0, 5).map((tech: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2 ml-4">
                <a
                  href={`/projects`}
                  target="_blank"
                  className="text-blue-600 hover:text-blue-900 p-2"
                  title="View Project"
                >
                  <EyeIcon className="w-4 h-4" />
                </a>
                <button
                  onClick={() => {
                    setEditingProject(project);
                    setShowForm(true);
                  }}
                  className="text-green-600 hover:text-green-900 p-2"
                  title="Edit Project"
                  disabled={showForm}
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteProject(project.id)}
                  className="text-red-600 hover:text-red-900 p-2"
                  title="Delete Project"
                  disabled={showForm}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(projects || []).length === 0 && !showForm && (
        <div className="text-center py-12">
          <RocketLaunchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-4">Create your first project to get started.</p>
          <button
            onClick={() => {
              setEditingProject(null);
              setShowForm(true);
            }}
                              className="bg-[#00274c] text-white px-4 py-2 rounded-lg hover:bg-[#003366] admin-white-text"
                >
                  Add Project
          </button>
        </div>
      )}
    </div>
  );
}

function ProjectForm({ project, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'PLANNING',
    startDate: '',
    endDate: '',
    budget: '',
    progress: 0,
    objectives: '',
    outcomes: '',
    technologies: '',
    links: '',
    imageUrl: '',
    featured: false,
    published: true
  });
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [partnerships, setPartnerships] = useState<any[]>([]);

  // Autosave functionality - works for both new and editing
  useEffect(() => {
    const autoSaveData = () => {
      if (formData.title.trim()) {
        try {
          const draftKey = project ? `projectForm_draft_edit_${project.id}` : 'projectForm_draft_new';
          const draftData = {
            formData,
            partnerships
          };
          localStorage.setItem(draftKey, JSON.stringify(draftData));
          console.log('✓ Project form autosaved:', formData.title, project ? '(editing)' : '(new)');
        } catch (error) {
          console.error('Error autosaving project form:', error);
        }
      }
    };

    const timeoutId = setTimeout(autoSaveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData, partnerships, project]);

  // Load companies, existing partnerships, or draft
  useEffect(() => {
    const loadData = async () => {
      try {
        const companiesRes = await fetch('/api/admin/companies');
        if (companiesRes.ok) {
          const companiesData = await companiesRes.json();
          setCompanies(companiesData);
        }

        if (project?.id) {
          const partnershipsRes = await fetch(`/api/admin/partnerships/project/${project.id}`);
          if (partnershipsRes.ok) {
            const partnershipsData = await partnershipsRes.json();
            setPartnerships(partnershipsData);
          }
          
          // Check for editing draft
          const editDraftKey = `projectForm_draft_edit_${project.id}`;
          const editDraft = localStorage.getItem(editDraftKey);
          if (editDraft) {
            try {
              const parsedDraft = JSON.parse(editDraft);
              setFormData(parsedDraft.formData);
              setPartnerships(parsedDraft.partnerships || []);
              console.log('✓ Project editing draft loaded:', parsedDraft.formData.title);
            } catch (error) {
              console.error('Error loading project editing draft:', error);
              localStorage.removeItem(editDraftKey);
            }
          }
        } else {
          // Load draft for new projects
          const draftKey = 'projectForm_draft_new';
          const draft = localStorage.getItem(draftKey);
          if (draft) {
            try {
              const parsedDraft = JSON.parse(draft);
              setFormData(parsedDraft.formData);
              setPartnerships(parsedDraft.partnerships || []);
              console.log('✓ Project form draft loaded:', parsedDraft.formData.title);
            } catch (error) {
              console.error('Error loading project form draft:', error);
              localStorage.removeItem(draftKey);
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();

    // Set initial form data for existing project
    if (project) {
      // Convert technologies from string to JSON format if needed
      let technologiesForForm = project.technologies || '';
      if (technologiesForForm && !technologiesForForm.startsWith('[')) {
        // Convert comma-separated string to JSON array format
        const techArray = technologiesForForm.split(',').map((tech: string) => tech.trim()).filter(Boolean);
        technologiesForForm = JSON.stringify(techArray);
      }

      setFormData({
        title: project.title || '',
        description: project.description || '',
        status: project.status || 'PLANNING',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
        budget: project.budget || '',
        progress: project.progress || 0,
        objectives: project.objectives || '',
        outcomes: project.outcomes || '',
        technologies: technologiesForForm,
        links: project.links || '',
        imageUrl: project.imageUrl || '',
        featured: project.featured || false,
        published: project.published ?? true
      });
    }
  }, [project]);

  const addPartnership = () => {
    setPartnerships([...partnerships, { companyId: '', type: 'COLLABORATOR', description: '' }]);
  };

  const removePartnership = (index: number) => {
    setPartnerships(partnerships.filter((_: any, i: number) => i !== index));
  };

  const updatePartnership = (index: number, field: string, value: string) => {
    const updated = [...partnerships];
    updated[index][field] = value;
    setPartnerships(updated);
  };

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = project 
        ? `/api/admin/projects?id=${project.id}` 
        : '/api/admin/projects';
      
      const method = project ? 'PUT' : 'POST';
      const data = project ? { ...formData, id: project.id } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        const projectData = await res.json();
        const projectId = projectData.id || project?.id;

        // Save partnerships if any exist
        if (partnerships.length > 0 && projectId) {
          await fetch('/api/admin/partnerships/project', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              projectId: projectId,
              partnerships: partnerships.filter(p => p.companyId) 
            })
          });
        }

        // Clear the draft on successful save
        const draftKey = project ? `projectForm_draft_edit_${project.id}` : 'projectForm_draft_new';
        localStorage.removeItem(draftKey);
        console.log('✓ Project form saved successfully, draft cleared');
        onSave();
      } else {
        const error = await res.json();
        alert(error.message || 'Error saving project');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Error saving project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {project ? 'Edit Project' : 'Add Project'}
        </h3>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500 bg-green-50 px-2 py-1 rounded">
            ✓ Auto-saving
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              >
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Progress (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({...formData, progress: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
              <input
                type="text"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="e.g., $10,000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Technologies (JSON format)</label>
            <textarea
              value={formData.technologies}
              onChange={(e) => setFormData({...formData, technologies: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] font-mono text-sm"
              placeholder='["React", "Node.js", "Python"]'
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Objectives (JSON format)</label>
            <textarea
              value={formData.objectives}
              onChange={(e) => setFormData({...formData, objectives: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] font-mono text-sm"
              placeholder='["Objective 1", "Objective 2"]'
            />
          </div>

          {/* Company Partnerships Section */}
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-medium text-gray-900">Company Partnerships</h4>
              <button
                type="button"
                onClick={addPartnership}
                className="px-3 py-1 bg-[#00274c] text-white rounded-md hover:bg-[#003366] text-sm admin-white-text"
              >
                Add Partnership
              </button>
            </div>
            
            {partnerships.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No partnerships added yet</p>
            ) : (
              <div className="space-y-3">
                {partnerships.map((partnership: any, index: number) => (
                  <div key={index} className="bg-white p-3 rounded border space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                        <select
                          value={partnership.companyId}
                          onChange={(e) => updatePartnership(index, 'companyId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00274c]"
                          required
                        >
                          <option value="">Select a company</option>
                          {companies.map((company: any) => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Partnership Type</label>
                        <select
                          value={partnership.type}
                          onChange={(e) => updatePartnership(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00274c]"
                        >
                          <option value="SPONSOR">Sponsor</option>
                          <option value="COLLABORATOR">Collaborator</option>
                          <option value="CLIENT">Client</option>
                          <option value="MENTOR">Mentor</option>
                          <option value="ADVISOR">Advisor</option>
                          <option value="VENDOR">Vendor</option>
                          <option value="RESEARCH_PARTNER">Research Partner</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removePartnership(index)}
                          className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={partnership.description}
                        onChange={(e) => updatePartnership(index, 'description', e.target.value)}
                        placeholder="Describe the partnership..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00274c]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 mb-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                className="rounded border-gray-300 text-[#00274c] focus:ring-[#00274c]"
              />
              <span className="text-sm text-gray-700">Featured Project</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData({...formData, published: e.target.checked})}
                className="rounded border-gray-300 text-[#00274c] focus:ring-[#00274c]"
              />
              <span className="text-sm text-gray-700">Published</span>
            </label>
          </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="admin-save-btn px-4 py-2 bg-[#00274c] text-white hover:bg-[#003366] hover:text-white rounded-lg disabled:opacity-50 disabled:text-white font-medium admin-white-text"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
} 
