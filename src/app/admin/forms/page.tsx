'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ClipboardIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  FunnelIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

export default function FormsAdmin() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('review'); // 'review', 'forms', 'create'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedReviewer, setSelectedReviewer] = useState('all');

  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [formResponses, setFormResponses] = useState<any[]>([]);
  const [selectedFormStatus, setSelectedFormStatus] = useState('all');
  const [selectedFormReviewer, setSelectedFormReviewer] = useState('all');
  const [customStatuses, setCustomStatuses] = useState<any[]>([]);
  const [showCreateStatus, setShowCreateStatus] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#6366F1');
  
  // File data loading state
  const [fileDataCache, setFileDataCache] = useState<{ [key: string]: any }>({});
  const [loadingFiles, setLoadingFiles] = useState<{ [key: string]: boolean }>({});
  const [editingForm, setEditingForm] = useState<any>(null);
  const [expandedApplications, setExpandedApplications] = useState(new Set());
  const [selectedApplications, setSelectedApplications] = useState(new Set());
  const [copySuccess, setCopySuccess] = useState('');
  // Attendance config for forms
  const [attendanceConfig, setAttendanceConfig] = useState({
    isAttendanceForm: false,
    attendanceLatitude: '',
    attendanceLongitude: '',
    attendanceRadiusMeters: ''
  });
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  
  // Google Forms import state
  const [showGoogleImport, setShowGoogleImport] = useState(false);
  const [googleFormUrl, setGoogleFormUrl] = useState('');
  const [importingGoogle, setImportingGoogle] = useState(false);
  const [googleImportResult, setGoogleImportResult] = useState<any>(null);

  // Form filtering state
  const [formSearchQuery, setFormSearchQuery] = useState('');
  const [selectedFormCategory, setSelectedFormCategory] = useState('all');
  const [formStatusFilter, setFormStatusFilter] = useState('all'); // all, active, inactive, archived
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, name-asc, name-desc

  // Application filtering state
  const [includeArchivedApplications, setIncludeArchivedApplications] = useState(false);
  const [selectedApplicationForm, setSelectedApplicationForm] = useState('all');

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
      return;
    }
    console.log('User session:', session.user);
  }, [session, status]);



  // Load custom statuses from localStorage
  const loadCustomStatuses = () => {
    try {
      const saved = localStorage.getItem('admin_custom_statuses');
      if (saved) {
        setCustomStatuses(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading custom statuses:', error);
    }
  };

  // Load data
  useEffect(() => {
    if (session?.user) {
      loadForms();
      loadApplications(includeArchivedApplications, selectedApplicationForm);
      loadCustomStatuses();
    }
  }, [session]);



  // Load responses for a specific form
  const loadFormResponses = async (formId: string, isArchived: boolean = false) => {
    if (!formId) {
      console.error('Form ID is required to load responses');
      return;
    }
    
    try {
      // For archived forms, show a warning and require explicit confirmation
      if (isArchived) {
        const shouldLoad = confirm(
          'This form is archived and may have many responses. Loading all responses might take some time. Do you want to continue?'
        );
        if (!shouldLoad) {
          return;
        }
      }

      const res = await fetch(`/api/admin/applications?formId=${formId}`);
      const data = await res.json();
      if (data && !data.error) {
        setFormResponses(data);
      }
    } catch (error) {
      console.error('Error loading form responses:', error);
    }
  };

  // Filter form responses
  const filteredFormResponses = formResponses.filter((response: any) => {
    const statusMatch = selectedFormStatus === 'all' || response.status === selectedFormStatus;
    const reviewerMatch = selectedFormReviewer === 'all' || response.reviewedBy === selectedFormReviewer;
    return statusMatch && reviewerMatch;
  });

  // Export form responses
  const exportFormResponses = async (exportType: 'summary' | 'detailed') => {
    if (!selectedForm || !selectedForm.id) {
      alert('No form selected or form ID is missing');
      return;
    }
    
    try {
      const response = await fetch('/api/admin/applications/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: selectedForm.id,
          status: selectedFormStatus,
          reviewer: selectedFormReviewer,
          exportType
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedForm.title}-${exportType}-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export form responses');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export form responses');
    }
  };



  // Save custom statuses to localStorage
  const saveCustomStatuses = (statuses: any[]) => {
    try {
      localStorage.setItem('admin_custom_statuses', JSON.stringify(statuses));
      setCustomStatuses(statuses);
    } catch (error) {
      console.error('Error saving custom statuses:', error);
    }
  };

  // Create new custom status
  const createCustomStatus = () => {
    if (!newStatusName.trim()) return;
    
    const newStatus = {
      id: `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newStatusName.toUpperCase().replace(/\s+/g, '_'),
      label: newStatusName,
      color: newStatusColor,
      createdAt: new Date().toISOString()
    };
    
    const updatedStatuses = [...customStatuses, newStatus];
    saveCustomStatuses(updatedStatuses);
    setNewStatusName('');
    setNewStatusColor('#6366F1');
    setShowCreateStatus(false);
  };

  // Delete custom status
  const deleteCustomStatus = (statusId: string) => {
    const updatedStatuses = customStatuses.filter(s => s.id !== statusId);
    saveCustomStatuses(updatedStatuses);
  };

  // Get all available statuses (default + custom)
  const getAllStatuses = () => {
    const defaultStatuses = [
      { name: 'PENDING', label: 'Pending', color: '#EAB308' },
      { name: 'REVIEWING', label: 'Reviewing', color: '#3B82F6' },
      { name: 'ACCEPTED', label: 'Accepted', color: '#10B981' },
      { name: 'REJECTED', label: 'Rejected', color: '#EF4444' },
      { name: 'WAITLISTED', label: 'Waitlisted', color: '#8B5CF6' },
      { name: 'WITHDRAWN', label: 'Withdrawn', color: '#6B7280' }
    ];
    
    return [...defaultStatuses, ...customStatuses];
  };

  const loadForms = async () => {
    try {
      const res = await fetch('/api/admin/forms');
      const data = await res.json();
      if (data && !data.error) {
        console.log('Forms loaded from API:', data);
        data.forEach((form: any, index: number) => {
          console.log(`Frontend Form ${index}: ${form.title}, Questions: ${form.questions ? form.questions.length : 'undefined'}`);
        });
        setForms(data);
      }
    } catch (error) {
      console.error('Error loading forms:', error);
    }
  };

  const loadApplications = async (includeArchived: boolean = false, formFilter: string = 'all') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (includeArchived) {
        params.append('includeArchived', 'true');
      }
      if (formFilter !== 'all') {
        params.append('formId', formFilter);
      }

      const url = `/api/admin/applications${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && !data.error) {
        setApplications(data);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load file data on demand for preview
  const loadFileData = async (applicationId: string, questionId: string) => {
    const cacheKey = `${applicationId}-${questionId}`;
    
    console.log('loadFileData called with:', { applicationId, questionId, cacheKey });
    
    // Return cached data if available
    if (fileDataCache[cacheKey]) {
      console.log('Returning cached data for:', cacheKey);
      return fileDataCache[cacheKey];
    }
    
    // Check if already loading
    if (loadingFiles[cacheKey]) {
      console.log('Already loading:', cacheKey);
      return null;
    }
    
    setLoadingFiles(prev => ({ ...prev, [cacheKey]: true }));
    
    try {
      const url = `/api/admin/files/${applicationId}/${questionId}/data`;
      console.log('Fetching from:', url);
      const res = await fetch(url);
      console.log('Fetch response:', res.status, res.statusText);
      if (res.ok) {
        const fileData = await res.json();
        console.log('File data received:', fileData);
        setFileDataCache(prev => ({ ...prev, [cacheKey]: fileData }));
        return fileData;
      } else {
        console.error('Failed to fetch file data:', res.status, await res.text());
      }
    } catch (error) {
      console.error('Error loading file data:', error);
    } finally {
      setLoadingFiles(prev => ({ ...prev, [cacheKey]: false }));
    }
    
    return null;
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string, adminNotes: string = '') => {
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: applicationId,
          status: newStatus,
          adminNotes: adminNotes
        })
      });

      if (res.ok) {
        loadApplications(includeArchivedApplications, selectedApplicationForm); // Reload to get updated data
      } else {
        alert('Error updating application status');
      }
    } catch (error) {
      console.error('Error updating application:', error);
    }
  };

  const copyFormLink = async (slug: string) => {
    const url = `${window.location.origin}/forms/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(slug);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Import Google Form using OAuth
  const importGoogleForm = async () => {
    if (!googleFormUrl.trim()) {
      alert('Please enter a Google Form URL');
      return;
    }

    setImportingGoogle(true);
    setGoogleImportResult(null);

    try {
      const res = await fetch('/api/admin/forms/import-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formUrl: googleFormUrl.trim() })
      });

      const result = await res.json();
      setGoogleImportResult(result);

      if (res.ok && result.success) {
        await loadForms();
        setGoogleFormUrl('');
        setTimeout(() => setShowGoogleImport(false), 3000);
      }
    } catch (error) {
      console.error('Error importing Google Form:', error);
      setGoogleImportResult({ error: 'Failed to import Google Form. Please try again.' });
    } finally {
      setImportingGoogle(false);
    }
  };



  // Filter and sort forms
  const filteredAndSortedForms = forms.filter((form) => {
    // Search query filter
    if (formSearchQuery.trim()) {
      const query = formSearchQuery.toLowerCase();
      const matchesTitle = form.title.toLowerCase().includes(query);
      const matchesDescription = form.description?.toLowerCase()?.includes(query);
      const matchesSlug = form.slug?.toLowerCase()?.includes(query);
      if (!matchesTitle && !matchesDescription && !matchesSlug) {
        return false;
      }
    }

    // Category filter
    if (selectedFormCategory !== 'all' && form.category !== selectedFormCategory) {
      return false;
    }

    // Status filter
    if (formStatusFilter === 'active' && !form.isActive) {
      return false;
    }
    if (formStatusFilter === 'inactive' && form.isActive) {
      return false;
    }
    if (formStatusFilter === 'archived' && !form.isArchived) {
      return false;
    }
    if (formStatusFilter === 'all' && form.isArchived) {
      // Don't show archived forms in "all" by default
      return false;
    }

    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return (a.createdAt || 0) - (b.createdAt || 0);
      case 'name-asc':
        return a.title.localeCompare(b.title);
      case 'name-desc':
        return b.title.localeCompare(a.title);
      case 'newest':
      default:
        return (b.createdAt || 0) - (a.createdAt || 0);
    }
  });

  const toggleApplicationExpanded = (applicationId: string) => {
    const newExpanded = new Set(expandedApplications);
    if (newExpanded.has(applicationId)) {
      newExpanded.delete(applicationId);
    } else {
      newExpanded.add(applicationId);
    }
    setExpandedApplications(newExpanded);
  };

  // Delete application
  const deleteApplication = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from the applications list
        setApplications(prev => prev.filter((app: any) => app.id !== applicationId));
        
        // Also remove from form responses if it's there
        setFormResponses(prev => prev.filter((app: any) => app.id !== applicationId));
        
        // Remove from expanded set if it was expanded
        const newExpanded = new Set(expandedApplications);
        newExpanded.delete(applicationId);
        setExpandedApplications(newExpanded);
        
        // Remove from selected set if it was selected
        const newSelected = new Set(selectedApplications);
        newSelected.delete(applicationId);
        setSelectedApplications(newSelected);
        
        console.log('Application deleted successfully');
      } else {
        const errorData = await response.json();
        alert(`Failed to delete application: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting application:', error);
      alert('Failed to delete application');
    }
  };

  // Bulk delete applications
  const bulkDeleteApplications = async () => {
    if (selectedApplications.size === 0) {
      alert('No applications selected');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedApplications.size} selected application(s)? This action cannot be undone.`)) {
      return;
    }

    const deletePromises = Array.from(selectedApplications).map(id => 
      fetch(`/api/admin/applications/${id}`, { method: 'DELETE' })
    );

    try {
      const results = await Promise.all(deletePromises);
      const successful = results.filter(r => r.ok).length;
      const failed = results.length - successful;

      if (successful > 0) {
        // Remove successful deletions from state
        setApplications(prev => prev.filter((app: any) => !selectedApplications.has(app.id)));
        setFormResponses(prev => prev.filter((app: any) => !selectedApplications.has(app.id)));
        
        // Clear selections
        setSelectedApplications(new Set());
        
        alert(`Successfully deleted ${successful} application(s)${failed > 0 ? `, ${failed} failed` : ''}`);
      } else {
        alert('Failed to delete applications');
      }
    } catch (error) {
      console.error('Error bulk deleting applications:', error);
      alert('Failed to delete applications');
    }
  };

  // Toggle application selection
  const toggleApplicationSelection = (applicationId: string) => {
    const newSelected = new Set(selectedApplications);
    if (newSelected.has(applicationId)) {
      newSelected.delete(applicationId);
    } else {
      newSelected.add(applicationId);
    }
    setSelectedApplications(newSelected);
  };

  // Select all applications
  const selectAllApplications = () => {
    const allIds = filteredApplications.map((app: any) => app.id);
    setSelectedApplications(new Set(allIds));
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedApplications(new Set());
  };

  // Get reviewer colors
  const getReviewerColor = (reviewerId: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800', 
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-teal-100 text-teal-800',
      'bg-red-100 text-red-800'
    ];
    const hash = reviewerId?.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0) || 0;
    return colors[Math.abs(hash) % colors.length];
  };

  // Filter applications
  const filteredApplications = applications.filter((app: any) => {
    const categoryMatch = selectedCategory === 'all' || (app.form && app.form.category === selectedCategory);
    const statusMatch = selectedStatus === 'all' || app.status === selectedStatus;
    const reviewerMatch = selectedReviewer === 'all' || app.reviewedBy === selectedReviewer;
    return categoryMatch && statusMatch && reviewerMatch;
  });

  // Get unique categories and reviewers
  const categories = [...new Set(forms.filter((form: any) => form && form.category).map((form: any) => form.category))];
  const uniqueReviewers = [...new Set(applications.filter((app: any) => app.reviewedBy).map((app: any) => ({
    id: app.reviewedBy,
    name: app.reviewer?.name,
    email: app.reviewer?.email
  })))];

  // Excel export function
  const exportToExcel = async () => {
    try {
      const response = await fetch('/api/admin/applications/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          status: selectedStatus,
          reviewer: selectedReviewer,
          exportType: 'summary'
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `applications-summary-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export data');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    }
  };

  // Detailed responses export function
  const exportDetailedResponses = async () => {
    try {
      const response = await fetch('/api/admin/applications/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          status: selectedStatus,
          reviewer: selectedReviewer,
          exportType: 'detailed'
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `applications-detailed-responses-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export detailed responses');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export detailed responses');
    }
  };

  const getStatusColor = (status: string) => {
    // Check if it's a custom status first
    const customStatus = customStatuses.find(s => s.name === status);
    if (customStatus) {
      return `text-white font-semibold`;
    }
    
    // Default status colors
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REVIEWING': return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'WAITLISTED': return 'bg-purple-100 text-purple-800';
      case 'WITHDRAWN': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusStyle = (status: string) => {
    const customStatus = customStatuses.find(s => s.name === status);
    if (customStatus) {
      return {
        backgroundColor: customStatus.color,
        color: 'white'
      };
    }
    return {};
  };

  const getCategoryIcon = (category: string) => {
    if (!category) return <DocumentTextIcon className="w-5 h-5" />;
    
    switch (category.toLowerCase()) {
      case 'internship': 
      case 'internships': 
        return <BriefcaseIcon className="w-5 h-5" />;
      case 'membership': 
        return <UserGroupIcon className="w-5 h-5" />;
      case 'event': 
      case 'events': 
        return <AcademicCapIcon className="w-5 h-5" />;
      default: 
        return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const getCategoryStats = (category: string) => {
    const categoryApps = applications.filter((app: any) => 
      category === 'all' || (app.form && app.form.category === category)
    );
    
    return {
      total: categoryApps.length,
      pending: categoryApps.filter((app: any) => app.status === 'PENDING').length,
      reviewing: categoryApps.filter((app: any) => app.status === 'REVIEWING').length,
      accepted: categoryApps.filter((app: any) => app.status === 'ACCEPTED').length,
      rejected: categoryApps.filter((app: any) => app.status === 'REJECTED').length,
    };
  };

  // Analytics data processing
  const getAnalyticsData = () => {
    // Question Analysis
    const questionAnalysis = {
      totalQuestions: 0,
      questionTypes: {} as Record<string, number>,
      averageQuestionsPerForm: 0,
      responseRates: {} as Record<string, number>
    };

    forms.forEach((form: any) => {
      if (form.questions) {
        questionAnalysis.totalQuestions += form.questions.length;
        form.questions.forEach((question: any) => {
          const type = question.type || 'TEXT';
          questionAnalysis.questionTypes[type] = (questionAnalysis.questionTypes[type] || 0) + 1;
        });
      }
    });

    if (forms.length > 0) {
      questionAnalysis.averageQuestionsPerForm = Math.round(questionAnalysis.totalQuestions / forms.length * 10) / 10;
    }

    // Response Status Distribution
    const statusDistribution = {} as Record<string, number>;
    const allStatuses = getAllStatuses();
    
    // Initialize all statuses with 0
    allStatuses.forEach(status => {
      statusDistribution[status.name] = 0;
    });

    // Count actual statuses
    applications.forEach((app: any) => {
      const status = app.status || 'PENDING';
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
    });

    return {
      questionAnalysis,
      statusDistribution,
      totalApplications: applications.length,
      totalForms: forms.length
    };
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Forms & Applications</h1>
          <p className="text-gray-600 mt-1">Review applications and manage forms</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('review')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === 'review' 
                ? 'bg-[#00274c] text-white admin-white-text' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ClipboardDocumentListIcon className="w-4 h-4" />
            Review Applications
          </button>
          <button
            onClick={() => setActiveTab('forms')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === 'forms' 
                ? 'bg-[#00274c] text-white admin-white-text' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <DocumentTextIcon className="w-4 h-4" />
            Manage Forms
          </button>
          <button
            onClick={() => setActiveTab('statuses')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === 'statuses' 
                ? 'bg-[#00274c] text-white admin-white-text' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Custom Statuses
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === 'analytics' 
                ? 'bg-[#00274c] text-white admin-white-text' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <PlusIcon className="w-4 h-4" />
            Create Form
          </button>
        </div>
      </div>

      {/* Applications Review Tab */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          {/* Category Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['all', ...categories].map((category) => {
              const stats = getCategoryStats(category);
              const isSelected = selectedCategory === category;
              
              return (
                <div
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-[#00274c] bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {category === 'all' ? (
                      <ClipboardDocumentListIcon className="w-5 h-5 text-[#00274c]" />
                    ) : (
                      <div className="text-[#00274c]">
                        {getCategoryIcon(category)}
                      </div>
                    )}
                    <h3 className="font-semibold capitalize text-gray-900">
                      {category === 'all' ? 'All Applications' : category}
                    </h3>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total</span>
                      <span className="font-medium">{stats.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-yellow-600">Pending</span>
                      <span className="font-medium">{stats.pending}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Accepted</span>
                      <span className="font-medium">{stats.accepted}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Rejected</span>
                      <span className="font-medium">{stats.rejected}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>



          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#00274c]"
              >
                <option value="all">All Status</option>
                {getAllStatuses().map((status) => (
                  <option key={status.name} value={status.name}>
                    {status.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedReviewer}
                onChange={(e) => setSelectedReviewer(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#00274c]"
              >
                <option value="all">All Reviewers</option>
                {uniqueReviewers.map((reviewer: any) => (
                  <option key={reviewer.id} value={reviewer.id}>
                    {reviewer.email || reviewer.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedApplicationForm}
                onChange={(e) => {
                  setSelectedApplicationForm(e.target.value);
                  loadApplications(includeArchivedApplications, e.target.value);
                }}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#00274c]"
              >
                <option value="all">All Forms</option>
                {forms.map((form: any) => (
                  <option key={form.id} value={form.id}>
                    {form.title} {form.isArchived ? '(Archived)' : ''}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  const newValue = !includeArchivedApplications;
                  setIncludeArchivedApplications(newValue);
                  loadApplications(newValue, selectedApplicationForm);
                }}
                className={`px-3 py-1 border rounded text-sm font-medium transition-colors ${
                  includeArchivedApplications
                    ? 'bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {includeArchivedApplications ? 'Hide Archived' : 'Load Archived'}
              </button>



              <div className="flex gap-1">
                <button
                  onClick={exportToExcel}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-2"
                  title="Export summary with basic info and response values"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Summary
                </button>
                <button
                  onClick={exportDetailedResponses}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-2"
                  title="Export detailed responses with scoring section for each applicant"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Detailed + Scoring
                </button>
              </div>

              {/* Bulk Actions */}
              {selectedApplications.size > 0 && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border">
                  <span className="text-sm text-blue-700">
                    {selectedApplications.size} selected
                  </span>
                  <button
                    onClick={bulkDeleteApplications}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center gap-1"
                  >
                    <TrashIcon className="w-3 h-3" />
                    Delete Selected
                  </button>
                  <button
                    onClick={clearAllSelections}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Selection Controls */}
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={selectAllApplications}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Select All ({filteredApplications.length})
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={clearAllSelections}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Clear All
                </button>
              </div>

              <div className="text-sm text-gray-600">
                Showing {filteredApplications.length} of {applications.length} applications
              </div>
            </div>
          </div>



          {/* Applications List */}
          <div className="space-y-4">
            {filteredApplications.map((app) => (
              <div key={app.id} className="bg-white rounded-lg shadow-sm border">
                {/* Application Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedApplications.has(app.id)}
                        onChange={() => toggleApplicationSelection(app.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="text-[#00274c]">
                        {app.form ? getCategoryIcon(app.form.category) : <DocumentTextIcon className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{app.applicantName || app.applicantEmail}</h4>
                        {app.applicantPhone && (
                          <p className="text-sm text-gray-700">📞 {app.applicantPhone} | ✉️ {app.applicantEmail}</p>
                        )}
                        <p className="text-sm text-gray-600">{app.form ? app.form.title : 'Form not found'}</p>
                        <p className="text-xs text-gray-500">
                          Submitted {new Date(app.submittedAt).toLocaleDateString()} at {new Date(app.submittedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span 
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}
                        style={getStatusStyle(app.status)}
                      >
                        {getAllStatuses().find(s => s.name === app.status)?.label || app.status}
                      </span>
                      
                      {app.reviewedBy && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReviewerColor(app.reviewedBy)}`}>
                          👤 {app.reviewer?.email?.split('@')[0] || 'Reviewer'}
                        </span>
                      )}
                      
                      {/* Quick Action Buttons */}
                      <div className="flex gap-1">
                        {app.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => updateApplicationStatus(app.id, 'REVIEWING')}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Start Reviewing"
                            >
                              <ClockIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateApplicationStatus(app.id, 'ACCEPTED')}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Accept"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateApplicationStatus(app.id, 'REJECTED')}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Reject"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => toggleApplicationExpanded(app.id)}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete this application from ${app.applicantName || app.applicantEmail}? This action cannot be undone.`)) {
                              deleteApplication(app.id);
                            }
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete Application"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Application Details */}
                {expandedApplications.has(app.id) && (
                  <div className="p-4 bg-gray-50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Application Responses */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">Application Responses</h5>
                        <div className="space-y-3">
                          {(app.responses || [])
                            .sort((a: any, b: any) => (a.question?.order || 0) - (b.question?.order || 0))
                            .map((response: any) => {
                            // Debug logging for file responses
                            if (response.question?.type === 'FILE') {
                              console.log('File response debug:', {
                                questionTitle: response.question.title,
                                questionType: response.question.type,
                                fileName: response.fileName,
                                fileSize: response.fileSize,
                                fileType: response.fileType,
                                hasFileData: !!response.fileData,
                                fileUrl: response.fileUrl,
                                textValue: response.textValue,
                                booleanValue: response.booleanValue,
                                allFields: Object.keys(response)
                              });
                            }
                            
                            return (
                            <div key={response.id} className="text-sm">
                              <span className="font-medium text-gray-900 block">{response.question.title}:</span>
                              <span className="text-gray-700 mt-1 block pl-2 border-l-2 border-gray-200">
                                {(() => {
                                  // Debug all response types to see what we're working with
                                  console.log('Response debug for', response.question.title, {
                                    questionType: response.question.type,
                                    fileName: response.fileName,
                                    fileUrl: response.fileUrl,
                                    textValue: response.textValue,
                                    booleanValue: response.booleanValue,
                                    booleanValueType: typeof response.booleanValue,
                                    selectedOptions: response.selectedOptions,
                                    hasFileData: response.hasFileData,
                                    allKeys: Object.keys(response),
                                    allValues: response
                                  });
                                  
                                  // Handle file uploads first - check for file indicators
                                  // Handle file uploads first - check for file indicators
                                  if (response.fileName || response.fileUrl || response.question?.type === 'FILE') {
                                    // If we have file data, display it
                                    if (response.fileName) {
                                      console.log('Rendering file preview for:', response.fileName, 'Type:', response.fileType);
                                      return (
                                        <div className="space-y-2">
                                          <div className="flex items-center space-x-2">
                                            <span className="font-medium">{response.fileName}</span>
                                            <span className="text-xs text-gray-500">
                                              ({Math.round(response.fileSize / 1024)}KB)
                                            </span>
                                          </div>
                                          
                                          <FilePreview 
                                            applicationId={app.id}
                                            questionId={response.questionId}
                                            fileName={response.fileName}
                                            fileType={response.fileType}
                                            hasFileData={response.hasFileData}
                                            loadFileData={loadFileData}
                                          />
                                        </div>
                                      );
                                    } else if (response.fileUrl) {
                                      return (
                                        <div className="space-y-2">
                                          <a 
                                            href={response.fileUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 underline"
                                          >
                                            View File
                                          </a>
                                        </div>
                                      );
                                    } else if (response.question?.type === 'FILE') {
                                      // This is a file question but no file was uploaded
                                      return <span className="text-gray-500 italic">No file uploaded</span>;
                                    }
                                  }
                                  
                                  // Handle matrix responses with ranking display
                                  if (response.question?.type === 'MATRIX' && response.selectedOptions) {
                                    try {
                                      const selections = JSON.parse(response.selectedOptions);
                                      if (Array.isArray(selections)) {
                                        const matrixRows = response.question.matrixRows ? response.question.matrixRows.split('\n').filter((r: string) => r.trim()) : [];
                                        return (
                                          <div className="space-y-1">
                                            {selections.map((selection: string, index: number) => (
                                              <div key={index} className="flex justify-between text-sm">
                                                <span className="font-medium">{matrixRows[index] || `Row ${index + 1}`}:</span>
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                                  {selection || 'Not ranked'}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        );
                                      }
                                    } catch (e) {
                                      return response.selectedOptions;
                                    }
                                  }
                                  
                                  // Handle description type (no response needed)
                                  if (response.question?.type === 'DESCRIPTION') {
                                    return <span className="text-gray-500 italic">Description section (no response required)</span>;
                                  }
                                  
                                  // Handle other response types - prioritize file URLs first
                                  if (response.fileUrl) return response.fileUrl;
                                  if (response.textValue) return response.textValue;
                                  if (response.numberValue) return response.numberValue;
                                  if (response.dateValue) return new Date(response.dateValue).toLocaleDateString();
                                  // Handle checkbox, radio, and select options
                                  if (response.selectedOptions) {
                                    try {
                                      const options = JSON.parse(response.selectedOptions);
                                      return Array.isArray(options) ? options.join(', ') : options;
                                    } catch (e) {
                                      return response.selectedOptions;
                                    }
                                  }
                                  // Only check boolean value for actual boolean questions
                                  if (response.question?.type === 'BOOLEAN' && response.booleanValue !== null) {
                                    return response.booleanValue ? 'Yes' : 'No';
                                  }
                                  
                                  return 'No answer provided';
                                })()}
                              </span>
                            </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Status Management */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">Application Management</h5>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                              value={app.status}
                              onChange={(e) => updateApplicationStatus(app.id, e.target.value, app.adminNotes)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                            >
                              {getAllStatuses().map((status) => (
                                <option key={status.name} value={status.name}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                            <textarea
                              defaultValue={app.adminNotes || ''}
                              placeholder="Add notes about this application..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                              rows={3}
                              onBlur={(e) => {
                                if (e.target.value !== (app.adminNotes || '')) {
                                  updateApplicationStatus(app.id, app.status, e.target.value);
                                }
                              }}
                            />
                          </div>

                          {app.reviewedBy && (
                            <div className="text-sm text-gray-600">
                              <p>Reviewed by: {app.reviewer?.email || app.reviewer?.name}</p>
                              <p>Review date: {new Date(app.reviewedAt).toLocaleDateString()}</p>
                            </div>
                          )}
                          
                          <div className="text-sm text-gray-500 mt-3 pt-3 border-t">
                            <p><strong>IP Address:</strong> {app.ipAddress || 'Not recorded'}</p>
                            {app.userAgent && (
                              <p className="mt-1"><strong>User Agent:</strong> <span className="font-mono text-xs">{app.userAgent}</span></p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filteredApplications.length === 0 && (
              <div className="text-center py-12">
                <ClipboardDocumentListIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                <p className="text-gray-600">
                  {selectedCategory === 'all' && selectedStatus === 'all' 
                    ? 'No applications have been submitted yet.'
                    : 'Try adjusting your filters to see more applications.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Forms Management Tab */}
      {activeTab === 'forms' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Manage Forms</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGoogleImport(v => !v)}
                className="px-4 py-2 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
                Import Google Form
              </button>
              <button
                onClick={() => setShowImport(v => !v)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Bulk Upload CSV
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className="bg-[#00274c] text-white px-4 py-2 rounded-lg hover:bg-[#003366] admin-white-text"
              >
                Create Form
              </button>
            </div>
          </div>

          {showGoogleImport && (
            <div className="bg-white p-4 rounded-lg border border-green-200 bg-green-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                  Import Google Form
                </h4>
                <button className="text-sm text-gray-500 hover:text-gray-700" onClick={() => setShowGoogleImport(false)}>Close</button>
              </div>
              <div className="text-sm text-gray-600 mb-3">
                <p className="mb-2">Paste a Google Form link to automatically recreate it on your website.</p>
                <div className="bg-green-50 border border-green-200 rounded p-2 text-xs">
                  <p className="font-semibold text-green-800 mb-1">� OAuth Authentication Active:</p>
                  <ul className="list-disc list-inside text-green-700 space-y-1">
                    <li>Uses your Google account credentials</li>
                    <li>Can access forms you have permission to view</li>
                    <li>Supports both public and private forms</li>
                    <li>More reliable and secure than API keys</li>
                  </ul>
                </div>
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                  <p className="font-semibold text-blue-800 mb-1">DOES NOT WORK YET!!!</p>
                  <p className="text-blue-700">
                    Your signed-in Google account is used to fetch form data via the Google Forms API. 
                    You can import any form you have access to view.
                  </p>
                </div>
                <details className="mt-2">
                </details>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <input 
                  type="url"
                  value={googleFormUrl}
                  onChange={(e) => setGoogleFormUrl(e.target.value)}
                  placeholder="https://docs.google.com/forms/d/..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <button
                  disabled={!googleFormUrl.trim() || importingGoogle}
                  onClick={importGoogleForm}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {importingGoogle ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Importing...
                    </>
                  ) : (
                    'Import Form'
                  )}
                </button>
              </div>
              {googleImportResult && (
                <div className={`mt-3 p-3 rounded border text-sm ${
                  googleImportResult.success 
                    ? 'bg-green-100 border-green-300 text-green-800' 
                    : 'bg-red-100 border-red-300 text-red-800'
                }`}>
                  {googleImportResult.success ? (
                    <div>
                      <p className="font-semibold">✅ Success!</p>
                      <p>{googleImportResult.message}</p>
                      <p className="mt-1">Questions: {googleImportResult.questions}, Sections: {googleImportResult.sections}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold">❌ Error</p>
                      <p className="mb-2">{googleImportResult.error}</p>
                      
                      {googleImportResult.error?.includes('OAuth access token missing') && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="font-semibold text-yellow-800 mb-2">🔄 Re-authentication Required</p>
                          <p className="text-yellow-700 text-sm mb-3">
                            You need to sign out and sign back in to get Google Forms API permissions.
                          </p>
                          <button
                            onClick={() => {
                              if (typeof window !== 'undefined') {
                                import('next-auth/react').then(({ signOut }) => {
                                  signOut({ callbackUrl: window.location.origin + '/auth/signin' });
                                });
                              }
                            }}
                            className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm font-medium"
                          >
                            Sign Out & Re-authenticate
                          </button>
                        </div>
                      )}
                      
                      <div className="mt-3">
                        <p className="font-semibold mb-1">💡 Troubleshooting Tips:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Ensure you have <strong>view access</strong> to the Google Form</li>
                          <li>Check that the URL is complete and starts with https://docs.google.com/forms/</li>
                          <li>Try signing out and back in to refresh your Google permissions</li>
                          <li>Make sure the Google Forms API is enabled in your Google Cloud project</li>
                        </ul>
                      </div>
                      
                      {googleImportResult.suggestions && googleImportResult.suggestions.length > 0 && (
                        <div className="mt-2">
                          <p className="font-semibold mb-1">Additional suggestions:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {googleImportResult.suggestions.map((suggestion: string, index: number) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {googleImportResult.helpText && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-red-700">{googleImportResult.helpText}</p>
                        </div>
                      )}

                      {googleImportResult.needsReauth && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-yellow-800 font-semibold mb-2">🔄 Re-authentication Required</p>
                          <p className="text-yellow-700 text-sm mb-3">
                            To use Google Forms import, you need to sign out and sign back in to grant Google Forms API permissions.
                          </p>
                          <button
                            onClick={() => {
                              // Import signOut from next-auth/react at the top of the file
                              if (typeof window !== 'undefined') {
                                import('next-auth/react').then(({ signOut }) => {
                                  signOut({ callbackUrl: window.location.href });
                                });
                              }
                            }}
                            className="bg-yellow-600 text-white px-4 py-2 rounded text-sm hover:bg-yellow-700 font-medium"
                          >
                            Sign Out & Re-authenticate
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {showImport && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Bulk Upload Forms (CSV)</h4>
                <button className="text-sm text-gray-500 hover:text-gray-700" onClick={() => setShowImport(false)}>Close</button>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Required: <code className="bg-gray-100 px-1 rounded">title</code>. Optional: description, category, isActive, isPublic, allowMultiple, requireAuth, deadline, maxSubmissions, notifyOnSubmission, notificationEmail, backgroundColor, textColor.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <input type="file" accept=".csv" onChange={(e)=>setImportFile(e.target.files?.[0]||null)}
                  className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#00274c] file:text-white hover:file:bg-[#003366]" />
                <button
                  disabled={!importFile || importing}
                  onClick={async ()=>{
                    if(!importFile) return; setImporting(true); setImportResult(null);
                    try{
                      const fd=new FormData(); fd.append('file', importFile);
                      const res=await fetch('/api/admin/forms/import',{method:'POST', body:fd});
                      const json=await res.json(); setImportResult(json);
                      if(res.ok && json.success){ await loadForms(); }
                    }catch(e){ setImportResult({error:'Upload failed'}); } finally{ setImporting(false); }
                  }}
                  className="px-4 py-2 rounded-md bg-[#00274c] text-white hover:bg-[#003366] disabled:opacity-50">
                  {importing ? 'Uploading…' : 'Upload CSV'}
                </button>
              </div>
              {importResult && <pre className="bg-gray-50 p-3 rounded border overflow-auto max-h-64 mt-3 text-sm">{JSON.stringify(importResult,null,2)}</pre>}
            </div>
          )}

          {/* Form Filters */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <FunnelIcon className="w-5 h-5 text-gray-500" />
              <h4 className="font-medium text-gray-900">Filter Forms</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={formSearchQuery}
                  onChange={(e) => setFormSearchQuery(e.target.value)}
                  placeholder="Search forms..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={selectedFormCategory}
                  onChange={(e) => setSelectedFormCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="general">General</option>
                  <option value="application">Application</option>
                  <option value="event">Event Registration</option>
                  <option value="partnership">Partnership</option>
                  <option value="internship">Internship</option>
                  <option value="feedback">Feedback</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formStatusFilter}
                  onChange={(e) => setFormStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Active Forms</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                  <option value="archived">Archived Only</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                </select>
              </div>
            </div>

            {/* Results Summary */}
            <div className="mt-3 text-sm text-gray-500">
              Showing {filteredAndSortedForms.length} of {forms.length} forms
              {formSearchQuery && <span> matching "{formSearchQuery}"</span>}
            </div>
          </div>

          <div className="grid gap-6">
            {filteredAndSortedForms.map((form) => (
              <div key={form.id} className={`bg-white rounded-lg shadow-md p-6 ${form.isArchived ? 'opacity-75 border-2 border-dashed border-orange-200' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getCategoryIcon(form.category)}
                      <h3 className="text-lg font-semibold text-gray-900">{form.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-3">{form.description || 'No description'}</p>
                    
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        form.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {form.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {form.isArchived && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Archived
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        {form._count?.applications || 0} submissions
                      </span>
                      <span className="text-sm text-gray-500 font-mono">
                        /{form.slug}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyFormLink(form.slug)}
                      className={`p-2 rounded transition-colors ${
                        copySuccess === form.slug 
                          ? 'text-green-600 bg-green-50' 
                          : 'text-blue-600 hover:text-blue-900 hover:bg-blue-50'
                      }`}
                      title="Copy Form Link"
                    >
                      {copySuccess === form.slug ? (
                        <CheckIcon className="w-4 h-4" />
                      ) : (
                        <LinkIcon className="w-4 h-4" />
                      )}
                    </button>
                    <a
                      href={`/forms/${form.slug}`}
                      target="_blank"
                      className="text-purple-600 hover:text-purple-900 p-2 hover:bg-purple-50 rounded"
                      title="Preview Form"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => {
                        setSelectedForm(form);
                        setActiveTab('responses');
                        loadFormResponses(form.id, form.isArchived);
                      }}
                      className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded"
                      title="View Responses"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        console.log('Edit button clicked for form:', form);
                        console.log('Form questions:', form.questions);
                        setEditingForm(form);
                        setActiveTab('edit');
                      }}
                      className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded"
                      title="Edit Form"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleArchiveForm(form.id, form.isArchived)}
                      className={`p-2 rounded ${
                        form.isArchived 
                          ? 'text-blue-600 hover:text-blue-900 hover:bg-blue-50' 
                          : 'text-orange-600 hover:text-orange-900 hover:bg-orange-50'
                      }`}
                      title={form.isArchived ? 'Unarchive Form' : 'Archive Form'}
                    >
                      {form.isArchived ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6V9h5a2 2 0 012 2v1M1 1l22 22m0 0l-6-6M7 3a1 1 0 000 2v1a1 1 0 001 1h9a1 1 0 001-1V5a1 1 0 100-2H8a1 1 0 00-1 1z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6V9h5a2 2 0 012 2v1M1 1l22 22" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => deleteForm(form.id)}
                      className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
                      title="Delete Form"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Category:</span>
                      <p className="text-gray-900 capitalize">{form.category}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Questions:</span>
                      <p className="text-gray-900">{form._count?.questions || 0}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Auth Required:</span>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-900">{form.requireAuth ? 'Yes' : 'No'}</p>
                        {form.requireAuth && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            UMich Only
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Deadline:</span>
                      <p className="text-gray-900">
                        {form.deadline ? new Date(form.deadline).toLocaleDateString() : 'None'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Applications:</span>
                      <div className="flex gap-1 mt-1">
                        {form.applications?.map((app: any, idx: number) => (
                          <span key={idx} className={`w-2 h-2 rounded-full ${getStatusColor(app.status).replace('text-', 'bg-').split(' ')[0]}`}></span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {forms.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No forms yet</h3>
              <p className="text-gray-600 mb-4">Create your first application form to get started.</p>
              <button
                onClick={() => setActiveTab('create')}
                className="bg-[#00274c] text-white px-4 py-2 rounded-lg hover:bg-[#003366] admin-white-text"
              >
                Create Form
              </button>
            </div>
          )}

          {forms.length > 0 && filteredAndSortedForms.length === 0 && (
            <div className="text-center py-12">
              <FunnelIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No forms match your filters</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search query or filters to see more forms.</p>
              <button
                onClick={() => {
                  setFormSearchQuery('');
                  setSelectedFormCategory('all');
                  setFormStatusFilter('all');
                  setSortBy('newest');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Form Responses Tab */}
      {activeTab === 'responses' && selectedForm && (
        <div className="space-y-6">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setActiveTab('forms');
                setSelectedForm(null);
                setFormResponses([]);
              }}
              className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-100 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Responses: {selectedForm.title}</h2>
              <p className="text-gray-600">{formResponses.length} total submissions</p>
            </div>
          </div>



          {/* Form Response Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>
              
                             <select
                 value={selectedFormStatus}
                 onChange={(e) => setSelectedFormStatus(e.target.value)}
                 className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#00274c]"
               >
                 <option value="all">All Status</option>
                 {getAllStatuses().map((status) => (
                   <option key={status.name} value={status.name}>
                     {status.label}
                   </option>
                 ))}
               </select>

              <select
                value={selectedFormReviewer}
                onChange={(e) => setSelectedFormReviewer(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#00274c]"
              >
                <option value="all">All Reviewers</option>
                {[...new Set(formResponses.filter((r: any) => r.reviewedBy).map((r: any) => ({
                  id: r.reviewedBy,
                  email: r.reviewer?.email
                })))].map((reviewer: any) => (
                  <option key={reviewer.id} value={reviewer.id}>
                    {reviewer.email}
                  </option>
                ))}
              </select>

              <div className="flex gap-1">
                <button
                  onClick={() => exportFormResponses('summary')}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-2"
                  title="Export summary of responses"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Summary
                </button>
                <button
                  onClick={() => exportFormResponses('detailed')}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-2"
                  title="Export detailed responses with full question/answer pairs"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Detailed
                </button>
              </div>

              <div className="text-sm text-gray-600">
                Showing {filteredFormResponses.length} of {formResponses.length} responses
              </div>
            </div>
          </div>

          {/* Form Responses List */}
          <div className="space-y-4">
            {filteredFormResponses.map((response) => (
              <div key={response.id} className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-[#00274c]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{response.applicantName || response.applicantEmail}</h4>
                        {response.applicantPhone && (
                          <p className="text-sm text-gray-700">📞 {response.applicantPhone} | ✉️ {response.applicantEmail}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Submitted {new Date(response.submittedAt).toLocaleDateString()} at {new Date(response.submittedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(response.status)}`}>
                        {response.status}
                      </span>
                      
                      {response.reviewedBy && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReviewerColor(response.reviewedBy)}`}>
                          👤 {response.reviewer?.email?.split('@')[0] || 'Reviewer'}
                        </span>
                      )}
                      
                      <button
                        onClick={() => toggleApplicationExpanded(response.id)}
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                        title="View Details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Response Details */}
                {expandedApplications.has(response.id) && (
                  <div className="p-4 bg-gray-50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Response Answers */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">Response Details</h5>
                        <div className="space-y-3">
                          {response.responses
                            .sort((a: any, b: any) => (a.question?.order || 0) - (b.question?.order || 0))
                            .map((answer: any) => (
                            <div key={answer.id} className="text-sm">
                              <span className="font-medium text-gray-900 block">{answer.question.title}:</span>
                              <span className="text-gray-700 mt-1 block pl-2 border-l-2 border-gray-200">
                                {(() => {
                                  // Handle file questions first
                                  if (answer.fileName || answer.fileUrl || answer.question?.type === 'FILE') {
                                    if (answer.fileName) {
                                      return (
                                        <div className="space-y-2">
                                          <div className="flex items-center space-x-2">
                                            <span className="font-medium">{answer.fileName}</span>
                                            <span className="text-xs text-gray-500">
                                              ({Math.round(answer.fileSize / 1024)}KB)
                                            </span>
                                          </div>
                                          
                                          <FilePreview 
                                            applicationId={response.id}
                                            questionId={answer.questionId}
                                            fileName={answer.fileName}
                                            fileType={answer.fileType}
                                            hasFileData={answer.hasFileData || true}
                                            loadFileData={loadFileData}
                                          />
                                        </div>
                                      );
                                    } else if (answer.fileUrl) {
                                      return answer.fileUrl;
                                    } else {
                                      return 'No file uploaded';
                                    }
                                  }
                                  
                                  // Handle matrix responses with ranking display
                                  if (answer.question?.type === 'MATRIX' && answer.selectedOptions) {
                                    try {
                                      const selections = JSON.parse(answer.selectedOptions);
                                      if (Array.isArray(selections)) {
                                        const matrixRows = answer.question.matrixRows ? answer.question.matrixRows.split('\n').filter((r: string) => r.trim()) : [];
                                        return (
                                          <div className="space-y-1">
                                            {selections.map((selection: string, index: number) => (
                                              <div key={index} className="flex justify-between text-sm">
                                                <span className="font-medium">{matrixRows[index] || `Row ${index + 1}`}:</span>
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                                  {selection || 'Not ranked'}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        );
                                      }
                                    } catch (e) {
                                      return answer.selectedOptions;
                                    }
                                  }
                                  
                                  // Handle description type (no response needed)
                                  if (answer.question?.type === 'DESCRIPTION') {
                                    return <span className="text-gray-500 italic">Description section (no response required)</span>;
                                  }
                                  
                                  // Handle other response types
                                  return answer.textValue || 
                                         answer.numberValue || 
                                         (answer.dateValue && new Date(answer.dateValue).toLocaleDateString()) ||
                                         (answer.selectedOptions && (() => {
                                           try {
                                             const options = JSON.parse(answer.selectedOptions);
                                             return Array.isArray(options) ? options.join(', ') : options;
                                           } catch (e) {
                                             return answer.selectedOptions;
                                           }
                                         })()) ||
                                         (answer.question?.type === 'BOOLEAN' && answer.booleanValue !== null ? (answer.booleanValue ? 'Yes' : 'No') : '') ||
                                         'No answer provided';
                                })()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status Management */}
                      <div>

                          <div className="text-sm text-gray-500 mt-3 pt-3 border-t">
                            <p><strong>IP Address:</strong> {response.ipAddress || 'Not recorded'}</p>
                            {response.userAgent && (
                              <p className="mt-1"><strong>User Agent:</strong> <span className="font-mono text-xs">{response.userAgent}</span></p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                )}
              </div>
            ))}

            {filteredFormResponses.length === 0 && (
              <div className="text-center py-12">
                <ClipboardDocumentListIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No responses found</h3>
                <p className="text-gray-600">
                  {formResponses.length === 0 
                    ? 'No responses have been submitted for this form yet.'
                    : 'Try adjusting your filters to see more responses.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Forms Analytics</h2>
              <p className="text-gray-600">Analyze form usage, question types, and response patterns</p>
            </div>
          </div>

          {(() => {
            const analyticsData = getAnalyticsData();
            
            return (
              <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="text-2xl font-bold text-blue-600">{analyticsData.totalForms}</div>
                    <div className="text-sm text-gray-600">Total Forms</div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="text-2xl font-bold text-green-600">{analyticsData.totalApplications}</div>
                    <div className="text-sm text-gray-600">Total Applications</div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="text-2xl font-bold text-purple-600">{analyticsData.questionAnalysis.totalQuestions}</div>
                    <div className="text-sm text-gray-600">Total Questions</div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="text-2xl font-bold text-orange-600">{analyticsData.questionAnalysis.averageQuestionsPerForm}</div>
                    <div className="text-sm text-gray-600">Avg Questions/Form</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Question Analysis */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Analysis</h3>
                    
                    {Object.keys(analyticsData.questionAnalysis.questionTypes).length > 0 ? (
                      <div className="space-y-4">
                        <div className="text-sm text-gray-600 mb-3">
                          Distribution of question types across all forms
                        </div>
                        
                        {Object.entries(analyticsData.questionAnalysis.questionTypes)
                          .sort(([,a], [,b]) => b - a)
                          .map(([type, count]) => {
                            const percentage = Math.round((count / analyticsData.questionAnalysis.totalQuestions) * 100);
                            const typeLabels: Record<string, string> = {
                              'TEXT': 'Text Input',
                              'TEXTAREA': 'Long Text',
                              'SELECT': 'Dropdown',
                              'RADIO': 'Multiple Choice',
                              'CHECKBOX': 'Checkboxes',
                              'BOOLEAN': 'Yes/No',
                              'NUMBER': 'Number',
                              'EMAIL': 'Email',
                              'PHONE': 'Phone',
                              'DATE': 'Date',
                              'FILE': 'File Upload',
                              'DESCRIPTION': 'Description/Text Block',
                              'MATRIX': 'Matrix/Grid'
                            };
                            
                            return (
                              <div key={type} className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-900">
                                      {typeLabels[type] || type}
                                    </span>
                                    <span className="text-gray-600">{count} ({percentage}%)</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No question data available</h3>
                        <p className="text-gray-600">Create forms with questions to see analysis here.</p>
                      </div>
                    )}
                  </div>

                  {/* Response Status Distribution */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Status Distribution</h3>
                    
                    {analyticsData.totalApplications > 0 ? (
                      <div className="space-y-4">
                        <div className="text-sm text-gray-600 mb-3">
                          Distribution of application statuses across all forms
                        </div>
                        
                        {Object.entries(analyticsData.statusDistribution)
                          .filter(([, count]) => count > 0)
                          .sort(([,a], [,b]) => b - a)
                          .map(([status, count]) => {
                            const percentage = Math.round((count / analyticsData.totalApplications) * 100);
                            const statusInfo = getAllStatuses().find(s => s.name === status);
                            const statusLabel = statusInfo?.label || status;
                            const statusColor = statusInfo?.color || '#6B7280';
                            
                            return (
                              <div key={status} className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: statusColor }}
                                      ></div>
                                      <span className="font-medium text-gray-900">{statusLabel}</span>
                                    </div>
                                    <span className="text-gray-600">{count} ({percentage}%)</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="h-2 rounded-full transition-all duration-300" 
                                      style={{ 
                                        width: `${percentage}%`,
                                        backgroundColor: statusColor
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No application data available</h3>
                        <p className="text-gray-600">Applications need to be submitted to see status distribution.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Analytics */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applications</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {forms.map((form: any) => {
                          const formApplications = applications.filter((app: any) => app.formId === form.id);
                          return (
                            <tr key={form.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{form.title}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                                  {form.category || 'general'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {form.questions?.length || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formApplications.length}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  form.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {form.isActive ? 'Active' : 'Inactive'}
                                </span>
                                {form.isArchived && (
                                  <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                                    Archived
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {forms.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No forms available for analysis.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Custom Status Management Tab */}
      {activeTab === 'statuses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Custom Status Management</h2>
              <p className="text-gray-600">Create and manage custom statuses for applications</p>
            </div>
            <button
              onClick={() => setShowCreateStatus(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
            >
              <PlusIcon className="w-4 h-4" />
              Create Status
            </button>
          </div>

          {/* Current Custom Statuses */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Custom Statuses</h3>
            
            {customStatuses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customStatuses.map((status) => (
                  <div key={status.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: status.color }}
                      >
                        {status.label}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{status.label}</p>
                        <p className="text-xs text-gray-500">ID: {status.name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteCustomStatus(status.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete status"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No custom statuses yet</h3>
                <p className="text-gray-600 mb-4">Create custom statuses to better organize your application workflow.</p>
                <button
                  onClick={() => setShowCreateStatus(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  Create Your First Status
                </button>
              </div>
            )}
          </div>

          {/* Default Statuses Reference */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Default Statuses</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {getAllStatuses().filter(s => !customStatuses.find(cs => cs.name === s.name)).map((status) => (
                <div key={status.name} className="flex items-center gap-2">
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: status.color + '20', color: status.color }}
                  >
                    {status.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Status Modal */}
      {showCreateStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full">
            <h3 className="text-lg font-semibold mb-4">Create Custom Status</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status Name</label>
                <input
                  type="text"
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  placeholder="e.g., Under Committee Review, Needs Interview..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newStatusColor}
                    onChange={(e) => setNewStatusColor(e.target.value)}
                    className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <div 
                    className="px-3 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: newStatusColor }}
                  >
                    {newStatusName || 'Preview'}
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                <strong>Note:</strong> The status ID will be: <code className="bg-white px-1 rounded">{newStatusName.toUpperCase().replace(/\s+/g, '_')}</code>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateStatus(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createCustomStatus}
                disabled={!newStatusName.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Editor */}
      {(activeTab === 'create' || activeTab === 'edit') && (
        <FormEditor
          form={editingForm}
          onClose={() => {
            setActiveTab(editingForm ? 'forms' : 'review');
            setEditingForm(null);
          }}
          onSave={() => {
            loadForms();
            setActiveTab('forms');
            setEditingForm(null);
          }}
        />
      )}
    </div>
  );

  // Helper function to delete form
  async function deleteForm(id: string) {
    if (!id) {
      alert('Form ID is missing');
      return;
    }
    
    if (confirm('Are you sure you want to delete this form? This will also delete all applications.')) {
      try {
        const res = await fetch(`/api/admin/forms?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          loadForms();
          loadApplications(includeArchivedApplications, selectedApplicationForm);
        } else {
          const error = await res.json();
          alert(`Failed to delete form: ${error.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error deleting form:', error);
        alert('Failed to delete form');
      }
    }
  }

  // Helper function to archive/unarchive form
  async function toggleArchiveForm(formId: string, isCurrentlyArchived: boolean) {
    if (!formId) {
      alert('Form ID is missing');
      return;
    }

    const action = isCurrentlyArchived ? 'unarchive' : 'archive';
    const confirmMessage = isCurrentlyArchived 
      ? 'Are you sure you want to unarchive this form? It will become active again.'
      : 'Are you sure you want to archive this form? It will be hidden from the main list and become inactive.';

    if (confirm(confirmMessage)) {
      try {
        const res = await fetch(`/api/admin/forms/${formId}/archive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        });

        const result = await res.json();

        if (res.ok && result.success) {
          loadForms();
          loadApplications(includeArchivedApplications, selectedApplicationForm);
        } else {
          alert(`Failed to ${action} form: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error(`Error ${action}ing form:`, error);
        alert(`Failed to ${action} form`);
      }
    }
  }
}

// Google Forms-inspired Form Editor Component
function FormEditor({ form, onClose, onSave }: any) {
  type BuilderQuestion = {
    id: string;
    title: string;
    description: string;
    type: string;
    required: boolean;
    options: string;
    minLength: string;
    maxLength: string;
    pattern: string;
    matrixRows: string;
    matrixCols: string;
    descriptionContent: string;
  };

  type BuilderSection = {
    id: string;
    title: string;
    description: string;
    questions: BuilderQuestion[];
  };

  const generateId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `id-${Math.random().toString(36).slice(2)}`;
  };

  const createEmptyQuestion = (): BuilderQuestion => ({
    id: generateId(),
    title: '',
    description: '',
    type: 'TEXT',
    required: false,
    options: '',
    minLength: '',
    maxLength: '',
    pattern: '',
    matrixRows: '',
    matrixCols: '',
    descriptionContent: ''
  });

  const createEmptySection = (title?: string): BuilderSection => ({
    id: generateId(),
    title: title || 'Untitled section',
    description: '',
    questions: [createEmptyQuestion()]
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    slug: '',
    category: 'general',
    isActive: true,
    isPublic: true,
    allowMultiple: false,
    deadline: '',
    maxSubmissions: '',
    notifyOnSubmission: true,
    notificationEmail: '',
    requireAuth: false,
    backgroundColor: '#00274c',
    textColor: '#ffffff',
    isAttendanceForm: false,
    attendanceLatitude: '',
    attendanceLongitude: '',
    attendanceRadiusMeters: ''
  });

  const [sections, setSections] = useState<BuilderSection[]>([createEmptySection()]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const convertFormToSections = (incoming: any): BuilderSection[] => {
    if (!incoming) return [createEmptySection()];

    const sourceSections = Array.isArray(incoming.sections) && incoming.sections.length
      ? incoming.sections
      : [{
          id: generateId(),
          title: incoming.title || 'Untitled section',
          description: incoming.description || '',
          questions: incoming.questions || []
        }];

    const builderSections = sourceSections.map((section: any, sectionIndex: number) => {
      const sectionId = section.id || generateId();
      const questionList = Array.isArray(section.questions) && section.questions.length
        ? section.questions
        : Array.isArray(incoming.questions)
          ? incoming.questions.filter((q: any) => q.sectionId === section.id)
          : [];

      const normalizedQuestions = questionList.map((question: any) => ({
        id: question.id || generateId(),
        title: question.title || question.question || '',
        description: question.description || '',
        type: question.type || 'TEXT',
        required: Boolean(question.required),
        options: Array.isArray(question.options)
          ? question.options.join('\n')
          : (question.options || ''),
        minLength: question.minLength != null ? String(question.minLength) : '',
        maxLength: question.maxLength != null ? String(question.maxLength) : '',
        pattern: question.pattern || '',
        matrixRows: Array.isArray(question.matrixRows)
          ? question.matrixRows.join('\n')
          : (question.matrixRows || ''),
        matrixCols: Array.isArray(question.matrixCols)
          ? question.matrixCols.join('\n')
          : (question.matrixCols || ''),
        descriptionContent: question.descriptionContent || ''
      }));

      return {
        id: sectionId,
        title: section.title || `Section ${sectionIndex + 1}`,
        description: section.description || '',
        questions: normalizedQuestions.length ? normalizedQuestions : [createEmptyQuestion()]
      };
    });

    return builderSections.length ? builderSections : [createEmptySection()];
  };

  useEffect(() => {
    if (form) {
      setFormData({
        title: form.title || '',
        description: form.description || '',
        slug: form.slug || '',
        category: form.category || 'general',
        isActive: form.isActive ?? true,
        isPublic: form.isPublic ?? true,
        allowMultiple: form.allowMultiple ?? false,
        deadline: form.deadline ? new Date(form.deadline).toISOString().slice(0, 16) : '',
        maxSubmissions: form.maxSubmissions?.toString() || '',
        notifyOnSubmission: form.notifyOnSubmission ?? true,
        notificationEmail: form.notificationEmail || '',
        requireAuth: form.requireAuth ?? false,
        backgroundColor: form.backgroundColor || '#00274c',
        textColor: form.textColor || '#ffffff',
        isAttendanceForm: form.isAttendanceForm ?? false,
        attendanceLatitude: form.attendanceLatitude?.toString() || '',
        attendanceLongitude: form.attendanceLongitude?.toString() || '',
        attendanceRadiusMeters: form.attendanceRadiusMeters?.toString() || ''
      });
      setSections(convertFormToSections(form));
    } else {
      const draft = localStorage.getItem('formEditor_draft_new');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed.formData) setFormData(parsed.formData);
          if (parsed.sections) setSections(parsed.sections);
        } catch (error) {
          console.error('Error loading form editor draft:', error);
          localStorage.removeItem('formEditor_draft_new');
        }
      } else {
        setSections([createEmptySection()]);
      }
    }
  }, [form]);

  useEffect(() => {
    if (!formData.title.trim()) return;
    const draftKey = form ? `formEditor_draft_edit_${form.id}` : 'formEditor_draft_new';
    const timeoutId = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify({ formData, sections }));
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [formData, sections, form]);

  const updateSection = (sectionId: string, field: keyof BuilderSection, value: string) => {
    setSections(prev => prev.map(section => section.id === sectionId ? { ...section, [field]: value } : section));
  };

  const moveSection = (sectionId: string, direction: -1 | 1) => {
    setSections(prev => {
      const index = prev.findIndex(section => section.id === sectionId);
      if (index === -1) return prev;
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(index, 1);
      updated.splice(newIndex, 0, moved);
      return updated;
    });
  };

  const removeSection = (sectionId: string) => {
    setSections(prev => {
      if (prev.length === 1) {
        return [createEmptySection()];
      }
      return prev.filter(section => section.id !== sectionId);
    });
  };

  const addSection = () => {
    setSections(prev => [...prev, createEmptySection(`Section ${prev.length + 1}`)]);
  };

  const addQuestion = (sectionId: string) => {
    setSections(prev => prev.map(section => section.id === sectionId
      ? { ...section, questions: [...section.questions, createEmptyQuestion()] }
      : section
    ));
  };

  const updateQuestion = (sectionId: string, questionId: string, field: keyof BuilderQuestion, value: any) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        questions: section.questions.map(question => question.id === questionId
          ? { ...question, [field]: value }
          : question)
      };
    }));
  };

  const moveQuestion = (sectionId: string, questionId: string, direction: -1 | 1) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      const index = section.questions.findIndex(question => question.id === questionId);
      if (index === -1) return section;
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= section.questions.length) return section;
      const updatedQuestions = [...section.questions];
      const [moved] = updatedQuestions.splice(index, 1);
      updatedQuestions.splice(newIndex, 0, moved);
      return { ...section, questions: updatedQuestions };
    }));
  };

  const duplicateQuestion = (sectionId: string, questionId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      const index = section.questions.findIndex(question => question.id === questionId);
      if (index === -1) return section;
      const original = section.questions[index];
      const copy: BuilderQuestion = {
        ...original,
        id: generateId(),
        title: original.title ? `${original.title} (Copy)` : ''
      };
      const updatedQuestions = [...section.questions];
      updatedQuestions.splice(index + 1, 0, copy);
      return { ...section, questions: updatedQuestions };
    }));
  };

  const removeQuestion = (sectionId: string, questionId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      const filtered = section.questions.filter(question => question.id !== questionId);
      return {
        ...section,
        questions: filtered.length ? filtered : [createEmptyQuestion()]
      };
    }));
  };

  const normalizeSectionsForSave = () => {
    return sections.map((section, sectionIndex) => {
      const sectionId = section.id || generateId();
      const normalizedQuestions = section.questions.map((question, questionIndex) => {
        const shouldUseOptions = ['SELECT', 'RADIO', 'CHECKBOX'].includes(question.type);
        const optionsArray = shouldUseOptions
          ? (question.options || '').split('\n').map(opt => opt.trim()).filter(Boolean)
          : null;

        return {
          id: question.id || generateId(),
          title: question.title || `Question ${questionIndex + 1}`,
          description: question.description || '',
          type: question.type,
          required: Boolean(question.required),
          order: questionIndex,
          options: optionsArray,
          minLength: question.minLength ? Number(question.minLength) : null,
          maxLength: question.maxLength ? Number(question.maxLength) : null,
          pattern: question.pattern || null,
          matrixRows: question.matrixRows || null,
          matrixCols: question.matrixCols || null,
          descriptionContent: question.descriptionContent || null,
          sectionId,
          sectionOrder: sectionIndex,
          sectionTitle: section.title || `Section ${sectionIndex + 1}`
        };
      });

      return {
        id: sectionId,
        title: section.title || `Section ${sectionIndex + 1}`,
        description: section.description || '',
        order: sectionIndex,
        questions: normalizedQuestions
      };
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const normalizedSections = normalizeSectionsForSave();
    const flattenedQuestions = normalizedSections.flatMap(section => section.questions);

    const payload = {
      ...formData,
      id: form?.id,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
      maxSubmissions: formData.maxSubmissions ? parseInt(formData.maxSubmissions) : null,
      allowMultiple: Boolean(formData.allowMultiple),
      isActive: Boolean(formData.isActive),
      isPublic: Boolean(formData.isPublic),
      notifyOnSubmission: Boolean(formData.notifyOnSubmission),
      requireAuth: Boolean(formData.requireAuth),
      isAttendanceForm: Boolean(formData.isAttendanceForm),
      attendanceLatitude: formData.attendanceLatitude ? Number(formData.attendanceLatitude) : null,
      attendanceLongitude: formData.attendanceLongitude ? Number(formData.attendanceLongitude) : null,
      attendanceRadiusMeters: formData.attendanceRadiusMeters ? Number(formData.attendanceRadiusMeters) : null,
      sections: normalizedSections,
      questions: flattenedQuestions
    };

    try {
      const url = form && form.id ? `/api/admin/forms?id=${form.id}` : '/api/admin/forms';
      const method = form && form.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const draftKey = form ? `formEditor_draft_edit_${form.id}` : 'formEditor_draft_new';
        localStorage.removeItem(draftKey);
        setMessage('Form saved successfully!');
        onSave();
        onClose();
      } else {
        const error = await res.json();
        setMessage(error?.message || 'Error saving form');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      setMessage('Error saving form');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start gap-3 mb-6">
        <div>
          <h2 className="text-xl font-semibold">{form ? 'Edit Form' : 'Create New Form'}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Design your form just like Google Forms – sections, questions, and validations included.
          </p>
          {message && (
            <div className="mt-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded px-3 py-2">
              {message}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500 bg-green-50 px-2 py-1 rounded border border-green-200">
            ✓ Auto-saving
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Form title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="e.g., Membership Application"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                rows={3}
                placeholder="Tell respondents what this form is about"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              >
                <option value="general">General</option>
                <option value="membership">Membership</option>
                <option value="event">Event Registration</option>
                <option value="partnership">Partnership</option>
                <option value="internship">Internship</option>
                <option value="feedback">Feedback</option>
              </select>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max submissions</label>
              <input
                type="number"
                value={formData.maxSubmissions}
                onChange={(e) => setFormData({ ...formData, maxSubmissions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="Leave blank for no limit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notification email</label>
              <input
                type="email"
                value={formData.notificationEmail}
                onChange={(e) => setFormData({ ...formData, notificationEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="Where should submissions be sent?"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-[#00274c] border-gray-300 rounded"
            />
            Form is active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="h-4 w-4 text-[#00274c] border-gray-300 rounded"
            />
            Form is public
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.requireAuth}
              onChange={(e) => setFormData({ ...formData, requireAuth: e.target.checked })}
              className="h-4 w-4 text-[#00274c] border-gray-300 rounded"
            />
            Require UMich authentication
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.allowMultiple}
              onChange={(e) => setFormData({ ...formData, allowMultiple: e.target.checked })}
              className="h-4 w-4 text-[#00274c] border-gray-300 rounded"
            />
            Allow multiple submissions per user
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.notifyOnSubmission}
              onChange={(e) => setFormData({ ...formData, notifyOnSubmission: e.target.checked })}
              className="h-4 w-4 text-[#00274c] border-gray-300 rounded"
            />
            Send email on new submission
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.isAttendanceForm as boolean}
              onChange={(e) => setFormData({ ...formData, isAttendanceForm: e.target.checked })}
              className="h-4 w-4 text-[#00274c] border-gray-300 rounded"
            />
            Enable attendance geo-verification
          </label>
        </div>

        {formData.isAttendanceForm && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">Latitude</label>
              <input
                type="number"
                value={formData.attendanceLatitude}
                onChange={(e) => setFormData({ ...formData, attendanceLatitude: e.target.value })}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="42.2768"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">Longitude</label>
              <input
                type="number"
                value={formData.attendanceLongitude}
                onChange={(e) => setFormData({ ...formData, attendanceLongitude: e.target.value })}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="-83.7382"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">Radius (meters)</label>
              <input
                type="number"
                value={formData.attendanceRadiusMeters}
                onChange={(e) => setFormData({ ...formData, attendanceRadiusMeters: e.target.value })}
                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="100"
              />
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Sections & Questions</h3>
            <button
              type="button"
              onClick={addSection}
              className="px-3 py-2 bg-[#00274c] text-white rounded-lg text-sm font-medium hover:bg-[#003366]"
            >
              + Add section
            </button>
          </div>

          <div className="space-y-6">
            {sections.map((section, sectionIndex) => (
              <div key={section.id} className="border border-gray-200 rounded-xl shadow-sm bg-white">
                <div className="flex items-start justify-between gap-4 p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                      placeholder={`Section ${sectionIndex + 1}`}
                    />
                    <textarea
                      value={section.description}
                      onChange={(e) => updateSection(section.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                      rows={2}
                      placeholder="Describe this section (optional)"
                    />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => moveSection(section.id, -1)}
                      disabled={sectionIndex === 0}
                      className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(section.id, 1)}
                      disabled={sectionIndex === sections.length - 1}
                      className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded disabled:opacity-40"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSection(section.id)}
                      className="px-2 py-1 text-xs text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="space-y-4 p-4">
                  {section.questions.map((question, questionIndex) => (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-4 bg-white/70">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question title *</label>
                            <input
                              type="text"
                              value={question.title}
                              onChange={(e) => updateQuestion(section.id, question.id, 'title', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                              placeholder={`Question ${questionIndex + 1}`}
                              required
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Question type</label>
                              <select
                                value={question.type}
                                onChange={(e) => updateQuestion(section.id, question.id, 'type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                              >
                                <option value="TEXT">Short Answer</option>
                                <option value="TEXTAREA">Paragraph</option>
                                <option value="EMAIL">Email</option>
                                <option value="PHONE">Phone Number</option>
                                <option value="NUMBER">Number</option>
                                <option value="DATE">Date</option>
                                <option value="SELECT">Dropdown</option>
                                <option value="RADIO">Multiple Choice</option>
                                <option value="CHECKBOX">Checkboxes</option>
                                <option value="FILE">File Upload</option>
                                <option value="URL">URL</option>
                                <option value="BOOLEAN">Yes / No</option>
                                <option value="DESCRIPTION">Description</option>
                                <option value="MATRIX">Matrix/Grid</option>
                              </select>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => moveQuestion(section.id, question.id, -1)}
                                disabled={questionIndex === 0}
                                className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded disabled:opacity-40"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={() => moveQuestion(section.id, question.id, 1)}
                                disabled={questionIndex === section.questions.length - 1}
                                className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded disabled:opacity-40"
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                onClick={() => duplicateQuestion(section.id, question.id)}
                                className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded"
                              >
                                Duplicate
                              </button>
                              <button
                                type="button"
                                onClick={() => removeQuestion(section.id, question.id)}
                                className="px-2 py-1 text-xs text-red-600 hover:text-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Helper text</label>
                            <input
                              type="text"
                              value={question.description}
                              onChange={(e) => updateQuestion(section.id, question.id, 'description', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                              placeholder="Optional context for respondents"
                            />
                          </div>
                        </div>
                      </div>

                      {(question.type === 'SELECT' || question.type === 'RADIO' || question.type === 'CHECKBOX') && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Options (one per line)</label>
                          <textarea
                            value={question.options}
                            onChange={(e) => updateQuestion(section.id, question.id, 'options', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                            placeholder={`Option 1\nOption 2\nOption 3`}
                          />
                        </div>
                      )}

                      {question.type === 'MATRIX' && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rows</label>
                            <textarea
                              value={question.matrixRows}
                              onChange={(e) => updateQuestion(section.id, question.id, 'matrixRows', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                              placeholder={`Row 1\nRow 2\nRow 3`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Columns</label>
                            <textarea
                              value={question.matrixCols}
                              onChange={(e) => updateQuestion(section.id, question.id, 'matrixCols', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                              placeholder={`Column 1\nColumn 2\nColumn 3`}
                            />
                          </div>
                        </div>
                      )}

                      {question.type === 'DESCRIPTION' && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description content</label>
                          <textarea
                            value={question.descriptionContent}
                            onChange={(e) => updateQuestion(section.id, question.id, 'descriptionContent', e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                            placeholder="Rich description shown to respondents"
                          />
                        </div>
                      )}

                      {['TEXT', 'TEXTAREA', 'NUMBER'].includes(question.type) && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min length</label>
                            <input
                              type="number"
                              value={question.minLength}
                              onChange={(e) => updateQuestion(section.id, question.id, 'minLength', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                              placeholder="Optional"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max length</label>
                            <input
                              type="number"
                              value={question.maxLength}
                              onChange={(e) => updateQuestion(section.id, question.id, 'maxLength', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                              placeholder="Optional"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pattern (regex)</label>
                            <input
                              type="text"
                              value={question.pattern}
                              onChange={(e) => updateQuestion(section.id, question.id, 'pattern', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                              placeholder="Optional validation pattern"
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) => updateQuestion(section.id, question.id, 'required', e.target.checked)}
                            className="h-4 w-4 text-[#00274c] border-gray-300 rounded"
                          />
                          Required question
                        </label>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addQuestion(section.id)}
                    className="px-3 py-2 text-sm text-[#00274c] border border-[#00274c] rounded-lg hover:bg-[#00274c]/10"
                  >
                    + Add question
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[#00274c] text-white hover:bg-[#003366] rounded-lg disabled:opacity-50 admin-white-text"
          >
            {saving ? 'Saving...' : form ? 'Update Form' : 'Create Form'}
          </button>
        </div>
      </form>
    </div>
  );
}

// File Preview Component with lazy loading
function FilePreview({ 
  applicationId, 
  questionId, 
  fileName, 
  fileType, 
  hasFileData,
  loadFileData 
}: { 
  applicationId: string;
  questionId: string;
  fileName: string;
  fileType: string;
  hasFileData: boolean;
  loadFileData: (appId: string, qId: string) => Promise<any>;
}) {
  const [fileData, setFileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Debug logging
  console.log('FilePreview props:', {
    applicationId,
    questionId,
    fileName,
    fileType,
    hasFileData,
    isImage: fileType?.startsWith('image/')
  });

  const loadFile = async () => {
    if (loading || fileData) return;
    
    console.log('loadFile called for:', applicationId, questionId);
    setLoading(true);
    try {
      const data = await loadFileData(applicationId, questionId);
      console.log('loadFileData returned:', data);
      if (data) {
        setFileData(data);
      }
    } catch (error) {
      console.error('Error loading file:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = () => {
    const link = document.createElement('a');
    link.href = `/api/admin/files/${applicationId}/${questionId}`;
    link.download = fileName;
    link.click();
  };

  return (
    <div className="space-y-2 border border-blue-200 p-2 rounded bg-blue-50">
      <div className="text-xs text-blue-600">FilePreview Component Loaded</div>
      <div className="flex space-x-2">
        <button
          onClick={downloadFile}
          className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
        >
          Download
        </button>
        
        {/* Show preview button for images, or view button for other files */}
        {(hasFileData || fileName) && (
          <>
            {(fileType?.startsWith('image/') || fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
              <button
                onClick={() => {
                  console.log('Preview button clicked, showPreview:', showPreview);
                  if (!showPreview) {
                    loadFile();
                  }
                  setShowPreview(!showPreview);
                }}
                className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            ) : (
              <button
                onClick={() => {
                  console.log('View File button clicked');
                  window.open(`/api/admin/files/${applicationId}/${questionId}`, '_blank');
                }}
                className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
              >
                View File
              </button>
            )}
          </>
        )}
      </div>
      
      {showPreview && (
        <div className="mt-2">
          {loading ? (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>Loading preview...</span>
            </div>
          ) : fileData ? (
            <img 
              src={fileData.fileData} 
              alt={fileName}
              className="max-w-xs max-h-48 rounded border"
            />
          ) : (
            <span className="text-sm text-gray-500">Preview not available</span>
          )}
        </div>
      )}
    </div>
  );
} 