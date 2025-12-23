'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import {
  PlusIcon,
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useAdminApi, useAdminQuery } from '@/hooks/useAdminApi';
import {
  AdminSection,
  AdminStatCard,
  AdminEmptyState,
  AdminLoadingState,
} from '@/components/admin/ui';

interface Company {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
  contactEmail?: string;
  active?: boolean;
  createdAt?: number;
}

export default function CompaniesAdmin() {
  const { status } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const { del } = useAdminApi();

  const {
    data: companiesData,
    loading,
    error,
    refetch,
  } = useAdminQuery<Company[]>(
    status === 'authenticated' ? '/api/admin/companies' : null,
    {
      enabled: status === 'authenticated',
      skipErrorToast: true,
    }
  );

  const companies = useMemo(() => companiesData ?? [], [companiesData]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
  }, [status]);

  useEffect(() => {
    if (!companies.length) return;
    const savedState = localStorage.getItem('companiesAdmin_formState');
    if (!savedState) return;

    try {
      const { showForm: savedShowForm, editingCompanyId } = JSON.parse(savedState);
      if (savedShowForm) {
        setShowForm(true);
        if (editingCompanyId) {
          const match = companies.find((company) => company.id === editingCompanyId);
          if (match) setEditingCompany(match);
        }
      }
    } catch (err) {
      console.error('Failed to restore company form state', err);
      localStorage.removeItem('companiesAdmin_formState');
    }
  }, [companies]);

  useEffect(() => {
    const state = JSON.stringify({
      showForm,
      editingCompanyId: editingCompany?.id ?? null,
    });

    if (showForm || editingCompany) {
      localStorage.setItem('companiesAdmin_formState', state);
    } else {
      localStorage.removeItem('companiesAdmin_formState');
    }
  }, [showForm, editingCompany]);

  const stats = useMemo(
    () => [
      {
        label: 'Total Companies',
        value: companies.length,
        icon: <BuildingOfficeIcon className="w-5 h-5" />,
        accent: 'primary' as const,
      },
      {
        label: 'Active Partnerships',
        value: companies.filter((c) => c.active ?? true).length,
        icon: <GlobeAltIcon className="w-5 h-5" />,
        accent: 'success' as const,
      },
      {
        label: 'New This Week',
        value: companies.filter(
          (c) => c.createdAt && Date.now() - c.createdAt < 7 * 24 * 60 * 60 * 1000,
        ).length,
        icon: <PlusIcon className="w-5 h-5" />,
        accent: 'warning' as const,
      },
    ],
    [companies],
  );

  if (status === 'loading') {
    return <AdminLoadingState fullHeight message="Checking permissions..." />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  const handleDelete = async (company: Company, force = false) => {
    const confirmMessage = force
      ? `Force delete "${company.name}"? This removes all linked partnerships.`
      : `Delete "${company.name}"? This action cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    try {
      const url = force
        ? `/api/admin/companies?id=${company.id}&force=true`
        : `/api/admin/companies?id=${company.id}`;
      await del(url, { successMessage: 'Company removed' });
      await refetch();
    } catch (err) {
      if (!force && err instanceof Error && err.message.includes('partnerships')) {
        const agree = confirm(
          'This company has active partnerships. Force delete and remove all partnerships?',
        );
        if (agree) {
          handleDelete(company, true);
        }
      }
    }
  };

  const openForm = (company?: Company) => {
    setEditingCompany(company ?? null);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingCompany(null);
    setShowForm(false);
    localStorage.removeItem('companiesAdmin_formState');
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <AdminStatCard key={stat.label} {...stat} />
        ))}
      </div>

      <AdminSection
        title="Companies"
        description="Manage every partner relationship in one place."
        actions={
          !showForm && (
            <button
              onClick={() => openForm()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#00274c] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#01305e]"
            >
              <PlusIcon className="w-4 h-4" />
              Add Company
            </button>
          )
        }
      >
        {loading && <AdminLoadingState fullHeight message="Loading companies..." />}

        {!loading && error && (
          <AdminEmptyState
            title="We couldn't load companies"
            description={error.message}
            action={
              <button
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={refetch}
              >
                Try again
              </button>
            }
          />
        )}

        {!loading && !error && companies.length === 0 && (
          <AdminEmptyState
            icon={<BuildingOfficeIcon className="w-12 h-12" />}
            title="No companies yet"
            description="Add your first partner company to get started."
            action={
              <button
                onClick={() => openForm()}
                className="rounded-lg bg-[#00274c] px-4 py-2 text-sm font-medium text-white hover:bg-[#01305e]"
              >
                Add Company
              </button>
            }
          />
        )}

        {!loading && !error && companies.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {companies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onEdit={() => openForm(company)}
                onDelete={() => handleDelete(company)}
              />
            ))}
          </div>
        )}
      </AdminSection>

      {showForm && (
        <AdminSection
          title={editingCompany ? 'Edit Company' : 'Add Company'}
          description="Keep partner details accurate so the team always has the latest info."
          actions={
            <button
              onClick={closeForm}
              className="rounded-lg border border-gray-200 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Close
            </button>
          }
        >
          <CompanyForm
            company={editingCompany}
            onClose={closeForm}
            onSaved={async () => {
              await refetch();
              closeForm();
            }}
          />
        </AdminSection>
      )}
    </div>
  );
}

function CompanyCard({
  company,
  onEdit,
  onDelete,
}: {
  company: Company;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {company.logoUrl ? (
            <Image
              src={company.logoUrl}
              alt={`${company.name} logo`}
              width={48}
              height={48}
              className="h-12 w-12 rounded-lg border border-gray-100 object-contain"
              unoptimized
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
              <BuildingOfficeIcon className="h-6 w-6" />
            </div>
          )}
          <div>
            <h3 className="text-base font-semibold text-gray-900">{company.name}</h3>
            <p className="text-sm text-gray-500">{company.industry || 'Industry TBD'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
            aria-label={`Edit ${company.name}`}
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
            aria-label={`Delete ${company.name}`}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      {company.description && (
        <p className="mt-4 flex-1 text-sm text-gray-600 line-clamp-3">{company.description}</p>
      )}
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-500">
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-400">Size</dt>
          <dd className="font-medium text-gray-900">{company.size || 'Unknown'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-400">Location</dt>
          <dd className="font-medium text-gray-900">{company.location || 'TBD'}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-gray-600 hover:bg-gray-50"
          >
            <GlobeAltIcon className="h-4 w-4" />
            Website
          </a>
        )}
        {company.contactEmail && (
          <a
            href={`mailto:${company.contactEmail}`}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-gray-600 hover:bg-gray-50"
          >
            Contact
          </a>
        )}
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
            company.active ?? true ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {company.active ?? true ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  );
}

interface CompanyFormProps {
  company: Company | null;
  onClose: () => void;
  onSaved: () => void;
}

function CompanyForm({ company, onClose, onSaved }: CompanyFormProps) {
  const { post, put } = useAdminApi();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logoUrl: '',
    website: '',
    industry: '',
    size: '',
    location: '',
    contactEmail: '',
    active: true,
  });

  useEffect(() => {
    const draftKey = company ? `companyForm_draft_edit_${company.id}` : 'companyForm_draft_new';

    if (company) {
      setFormData({
        name: company.name || '',
        description: company.description || '',
        logoUrl: company.logoUrl || '',
        website: company.website || '',
        industry: company.industry || '',
        size: company.size || '',
        location: company.location || '',
        contactEmail: company.contactEmail || '',
        active: company.active ?? true,
      });
    } else {
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        try {
          setFormData(JSON.parse(draft));
        } catch {
          localStorage.removeItem(draftKey);
        }
      }
    }

    return () => {
      localStorage.removeItem('companyForm_draft_new');
    };
  }, [company]);

  useEffect(() => {
    const draftKey = company ? `companyForm_draft_edit_${company.id}` : 'companyForm_draft_new';
    const timeout = setTimeout(() => {
      if (formData.name.trim()) {
        localStorage.setItem(draftKey, JSON.stringify(formData));
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [company, formData]);

  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (company) {
        await put(`/api/admin/companies?id=${company.id}`, { ...formData }, { successMessage: 'Company updated' });
        localStorage.removeItem(`companyForm_draft_edit_${company.id}`);
      } else {
        await post('/api/admin/companies', formData, { successMessage: 'Company created' });
        localStorage.removeItem('companyForm_draft_new');
      }

      onSaved();
    } catch (err) {
      console.error('Failed to save company', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Company Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-[#00274c] focus:outline-none focus:ring-2 focus:ring-[#00274c]/20"
            placeholder="Partner Inc."
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Industry</label>
          <input
            type="text"
            value={formData.industry}
            onChange={(e) => handleChange('industry', e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-[#00274c] focus:outline-none focus:ring-2 focus:ring-[#00274c]/20"
            placeholder="Technology"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Website</label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => handleChange('website', e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-[#00274c] focus:outline-none focus:ring-2 focus:ring-[#00274c]/20"
            placeholder="https://company.com"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Logo URL</label>
          <input
            type="url"
            value={formData.logoUrl}
            onChange={(e) => handleChange('logoUrl', e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-[#00274c] focus:outline-none focus:ring-2 focus:ring-[#00274c]/20"
            placeholder="https://company.com/logo.png"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Size</label>
          <input
            type="text"
            value={formData.size}
            onChange={(e) => handleChange('size', e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-[#00274c] focus:outline-none focus:ring-2 focus:ring-[#00274c]/20"
            placeholder="50-100 employees"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-[#00274c] focus:outline-none focus:ring-2 focus:ring-[#00274c]/20"
            placeholder="Ann Arbor, MI"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Contact Email</label>
          <input
            type="email"
            value={formData.contactEmail}
            onChange={(e) => handleChange('contactEmail', e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-[#00274c] focus:outline-none focus:ring-2 focus:ring-[#00274c]/20"
            placeholder="hello@company.com"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={formData.active ? 'active' : 'inactive'}
            onChange={(e) => handleChange('active', e.target.value === 'active')}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-[#00274c] focus:outline-none focus:ring-2 focus:ring-[#00274c]/20"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-[#00274c] focus:outline-none focus:ring-2 focus:ring-[#00274c]/20"
          placeholder="What kind of work will the partnership focus on?"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center rounded-lg bg-[#00274c] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#01305e] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? 'Saving…' : company ? 'Save Changes' : 'Create Company'}
        </button>
      </div>
    </form>
  );
}
