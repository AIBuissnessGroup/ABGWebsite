'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

export default function CompaniesAdmin() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);

  // Restore form state on mount
  useEffect(() => {
    try {
      const savedFormState = localStorage.getItem('companiesAdmin_formState');
      if (savedFormState) {
        const { showForm: savedShowForm, editingCompanyId } = JSON.parse(savedFormState);
        console.log('🔄 Restoring companies form state:', { savedShowForm, editingCompanyId, companiesLoaded: companies.length > 0 });
        if (savedShowForm) {
          setShowForm(true);
          if (editingCompanyId) {
            // We'll set the editing company after companies are loaded
            const checkForCompany = () => {
              if (companies.length > 0) {
                const company = companies.find(c => c.id === editingCompanyId);
                if (company) {
                  setEditingCompany(company);
                  console.log('✓ Companies editing company restored:', company.name);
                }
              }
            };
            // Check immediately and also set up a timeout
            checkForCompany();
            setTimeout(checkForCompany, 100);
          } else {
            console.log('✓ Companies new form restored');
          }
        }
      }
    } catch (error) {
      console.error('Error restoring form state:', error);
    }
  }, [companies]);

  // Save form state whenever it changes
  useEffect(() => {
    try {
      const formState = {
        showForm,
        editingCompanyId: editingCompany?.id || null
      };
      if (showForm || editingCompany) {
        localStorage.setItem('companiesAdmin_formState', JSON.stringify(formState));
      } else {
        localStorage.removeItem('companiesAdmin_formState');
      }
    } catch (error) {
      console.error('Error saving form state:', error);
    }
  }, [showForm, editingCompany]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
      return;
    }
    // Let the API handle admin checking - just proceed if logged in
    console.log('User session:', session.user);
  }, [session, status]);

  useEffect(() => {
    if (session?.user) loadCompanies();
  }, [session]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/companies');
      const data = await res.json();
      if (data && !data.error) setCompanies(data);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCompany = async (id: string, force = false) => {
    const confirmMsg = force 
      ? 'Are you sure you want to FORCE DELETE this company? This will also remove all partnerships and cannot be undone.'
      : 'Are you sure you want to delete this company? This action cannot be undone.';
      
    if (confirm(confirmMsg)) {
      try {
        const url = force 
          ? `/api/admin/companies?id=${id}&force=true`
          : `/api/admin/companies?id=${id}`;
          
        const res = await fetch(url, { method: 'DELETE' });
        
        if (res.ok) {
          loadCompanies(); // Reload the companies list
        } else {
          const error = await res.json();
          if (!force && error.error && error.error.includes('partnerships')) {
            if (confirm('This company has active partnerships. Do you want to force delete it and remove all partnerships?')) {
              deleteCompany(id, true); // Retry with force
            }
          } else {
            alert(error.error || 'Error deleting company');
          }
        }
      } catch (error) {
        console.error('Error deleting company:', error);
        alert('Error deleting company');
      }
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-600 mt-1">Manage partner companies ({companies.length} total)</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setEditingCompany(null);
              setShowForm(true);
            }}
            className="bg-[#00274c] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#003366] admin-white-text"
          >
            <PlusIcon className="w-4 h-4" />
            Add Company
          </button>
        )}
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
          <CompanyForm
            company={editingCompany}
            onClose={() => {
              setShowForm(false);
              setEditingCompany(null);
              // Clear form state from localStorage
              localStorage.removeItem('companiesAdmin_formState');
            }}
            onSave={() => {
              loadCompanies();
              setShowForm(false);
              setEditingCompany(null);
              // Clear form state from localStorage
              localStorage.removeItem('companiesAdmin_formState');
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company: any) => (
          <div key={company.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {company.logoUrl && (
                  <img 
                    src={company.logoUrl} 
                    alt={`${company.name} logo`}
                    className="w-12 h-12 object-contain rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                  <p className="text-sm text-gray-500">{company.industry}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingCompany(company);
                    setShowForm(true);
                  }}
                  className="text-green-600 hover:text-green-900 p-2"
                  title="Edit Company"
                  disabled={showForm}
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteCompany(company.id)}
                  className="text-red-600 hover:text-red-900 p-2"
                  title="Delete Company"
                  disabled={showForm}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {company.description && (
                <p className="text-gray-600 line-clamp-2">{company.description}</p>
              )}
              {company.size && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Size:</span>
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">{company.size}</span>
                </div>
              )}
              {company.location && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Location:</span>
                  <span className="font-medium">{company.location}</span>
                </div>
              )}
            </div>

            {company.website && (
              <div className="mt-4">
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00274c] hover:text-[#003366] text-sm font-medium"
                >
                  Visit Website →
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {companies.length === 0 && !showForm && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No companies yet</h3>
          <p className="text-gray-600 mb-4">Add your first partner company to get started.</p>
          <button
            onClick={() => {
              setEditingCompany(null);
              setShowForm(true);
            }}
                              className="bg-[#00274c] text-white px-4 py-2 rounded-lg hover:bg-[#003366] admin-white-text"
                >
                  Add Company
          </button>
        </div>
      )}
     </div>
   );
 }

function CompanyForm({ company, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logoUrl: '',
    website: '',
    industry: '',
    size: '',
    location: '',
    contactEmail: '',
    active: true
  });
  const [saving, setSaving] = useState(false);

  // Autosave functionality - works for both new and editing
  useEffect(() => {
    const autoSaveData = () => {
      if (formData.name.trim()) {
        try {
          const draftKey = company ? `companyForm_draft_edit_${company.id}` : 'companyForm_draft_new';
          localStorage.setItem(draftKey, JSON.stringify(formData));
          console.log('✓ Company form autosaved:', formData.name, company ? '(editing)' : '(new)');
        } catch (error) {
          console.error('Error autosaving company form:', error);
        }
      }
    };

    const timeoutId = setTimeout(autoSaveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData, company]);

  // Load draft on mount or set company data - works for both new and editing
  useEffect(() => {
    if (company) {
      // For editing, first set the company data, then check for editing draft
      setFormData({
        name: company.name || '',
        description: company.description || '',
        logoUrl: company.logoUrl || '',
        website: company.website || '',
        industry: company.industry || '',
        size: company.size || '',
        location: company.location || '',
        contactEmail: company.contactEmail || '',
        active: company.active ?? true
      });
      
      // Check for editing draft (modifications to existing company)
      const editDraftKey = `companyForm_draft_edit_${company.id}`;
      const editDraft = localStorage.getItem(editDraftKey);
      if (editDraft) {
        try {
          const parsedDraft = JSON.parse(editDraft);
          setFormData(parsedDraft);
          console.log('✓ Company editing draft loaded:', parsedDraft.name);
        } catch (error) {
          console.error('Error loading company editing draft:', error);
          localStorage.removeItem(editDraftKey);
        }
      }
    } else {
      // Load draft for new companies
      const draftKey = 'companyForm_draft_new';
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft);
          setFormData(parsedDraft);
          console.log('✓ Company form draft loaded:', parsedDraft.name);
        } catch (error) {
          console.error('Error loading company form draft:', error);
          localStorage.removeItem(draftKey);
        }
      }
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = company 
        ? `/api/admin/companies?id=${company.id}` 
        : '/api/admin/companies';
      
      const method = company ? 'PUT' : 'POST';
      const data = company ? { ...formData, id: company.id } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        // Clear the draft on successful save
        const draftKey = company ? `companyForm_draft_edit_${company.id}` : 'companyForm_draft_new';
        localStorage.removeItem(draftKey);
        console.log('✓ Company form saved successfully, draft cleared');
        onSave();
      } else {
        const error = await res.json();
        alert(error.message || 'Error saving company');
      }
    } catch (error) {
      console.error('Error saving company:', error);
      alert('Error saving company');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {company ? 'Edit Company' : 'Add Company'}
        </h3>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500 bg-green-50 px-2 py-1 rounded">
            ✓ Auto-saving
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
          
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
            <input
              type="text"
              value={formData.industry}
              onChange={(e) => setFormData({...formData, industry: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="e.g., Technology"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
            placeholder="Brief description of the company"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({...formData, website: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="https://company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
            <input
              type="url"
              value={formData.logoUrl}
              onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="https://company.com/logo.png"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
            <select
              value={formData.size}
              onChange={(e) => setFormData({...formData, size: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
            >
              <option value="">Select Size</option>
              <option value="Startup">Startup (1-10)</option>
              <option value="Small">Small (11-50)</option>
              <option value="Medium">Medium (51-200)</option>
              <option value="Large">Large (201-1000)</option>
              <option value="Enterprise">Enterprise (1000+)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="e.g., San Francisco, CA"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
          <input
            type="email"
            value={formData.contactEmail}
            onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
            placeholder="contact@company.com"
          />
        </div>

        <div className="flex items-center gap-2 mb-6">
          <input
            type="checkbox"
            checked={formData.active}
            onChange={(e) => setFormData({...formData, active: e.target.checked})}
            className="rounded border-gray-300 text-[#00274c] focus:ring-[#00274c]"
          />
          <span className="text-sm text-gray-700">Active Partner</span>
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