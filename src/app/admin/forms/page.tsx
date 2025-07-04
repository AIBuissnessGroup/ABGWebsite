'use client';
import { useState, useEffect } from 'react';
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
  const [forms, setForms] = useState([]);
  const [applications, setApplications] = useState([]);
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
  const [editingForm, setEditingForm] = useState(null);
  const [expandedApplications, setExpandedApplications] = useState(new Set());
  const [copySuccess, setCopySuccess] = useState('');

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
      loadApplications();
      loadCustomStatuses();
    }
  }, [session]);



  // Load responses for a specific form
  const loadFormResponses = async (formId: string) => {
    try {
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
    if (!selectedForm) return;
    
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
      id: Date.now().toString(),
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
        setForms(data);
      }
    } catch (error) {
      console.error('Error loading forms:', error);
    }
  };

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/applications');
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
        loadApplications(); // Reload to get updated data
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

  const toggleApplicationExpanded = (applicationId: string) => {
    const newExpanded = new Set(expandedApplications);
    if (newExpanded.has(applicationId)) {
      newExpanded.delete(applicationId);
    } else {
      newExpanded.add(applicationId);
    }
    setExpandedApplications(newExpanded);
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
    const categoryMatch = selectedCategory === 'all' || app.form.category === selectedCategory;
    const statusMatch = selectedStatus === 'all' || app.status === selectedStatus;
    const reviewerMatch = selectedReviewer === 'all' || app.reviewedBy === selectedReviewer;
    return categoryMatch && statusMatch && reviewerMatch;
  });

  // Get unique categories and reviewers
  const categories = [...new Set(forms.map((form: any) => form.category))];
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
      category === 'all' || app.form.category === category
    );
    
    return {
      total: categoryApps.length,
      pending: categoryApps.filter((app: any) => app.status === 'PENDING').length,
      reviewing: categoryApps.filter((app: any) => app.status === 'REVIEWING').length,
      accepted: categoryApps.filter((app: any) => app.status === 'ACCEPTED').length,
      rejected: categoryApps.filter((app: any) => app.status === 'REJECTED').length,
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
                  title="Export detailed responses with full question/answer pairs"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Detailed
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
                      <div className="text-[#00274c]">
                        {getCategoryIcon(app.form.category)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{app.applicantName || app.applicantEmail}</h4>
                        <p className="text-sm text-gray-600">{app.form.title}</p>
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
                          {app.responses.map((response) => (
                            <div key={response.id} className="text-sm">
                              <span className="font-medium text-gray-900 block">{response.question.title}:</span>
                              <span className="text-gray-700 mt-1 block pl-2 border-l-2 border-gray-200">
                                {response.textValue || 
                                 response.numberValue || 
                                 (response.dateValue && new Date(response.dateValue).toLocaleDateString()) ||
                                 (response.booleanValue !== null ? (response.booleanValue ? 'Yes' : 'No') : '') ||
                                 (response.selectedOptions && JSON.parse(response.selectedOptions).join(', ')) ||
                                 response.fileUrl || 
                                 'No answer provided'}
                              </span>
                            </div>
                          ))}
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
          <div className="grid gap-6">
            {forms.map((form) => (
              <div key={form.id} className="bg-white rounded-lg shadow-md p-6">
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
                        loadFormResponses(form.id);
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
                        setEditingForm(form);
                        setActiveTab('edit');
                      }}
                      className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded"
                      title="Edit Form"
                    >
                      <PencilIcon className="w-4 h-4" />
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
                        {form.applications?.map((app, idx) => (
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
                          {response.responses.map((answer: any) => (
                            <div key={answer.id} className="text-sm">
                              <span className="font-medium text-gray-900 block">{answer.question.title}:</span>
                              <span className="text-gray-700 mt-1 block pl-2 border-l-2 border-gray-200">
                                {answer.textValue || 
                                 answer.numberValue || 
                                 (answer.dateValue && new Date(answer.dateValue).toLocaleDateString()) ||
                                 (answer.booleanValue !== null ? (answer.booleanValue ? 'Yes' : 'No') : '') ||
                                 (answer.selectedOptions && JSON.parse(answer.selectedOptions).join(', ')) ||
                                 answer.fileUrl || 
                                 'No answer provided'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status Management */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">Response Management</h5>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                              value={response.status}
                              onChange={(e) => updateApplicationStatus(response.id, e.target.value, response.adminNotes)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                            >
                              <option value="PENDING">Pending Review</option>
                              <option value="REVIEWING">Under Review</option>
                              <option value="ACCEPTED">Accepted</option>
                              <option value="REJECTED">Rejected</option>
                              <option value="WAITLISTED">Waitlisted</option>
                              <option value="WITHDRAWN">Withdrawn</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                            <textarea
                              defaultValue={response.adminNotes || ''}
                              placeholder="Add notes about this response..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                              rows={3}
                              onBlur={(e) => {
                                if (e.target.value !== (response.adminNotes || '')) {
                                  updateApplicationStatus(response.id, response.status, e.target.value);
                                }
                              }}
                            />
                          </div>

                          {response.reviewedBy && (
                            <div className="text-sm text-gray-600">
                              <p>Reviewed by: {response.reviewer?.email || response.reviewer?.name}</p>
                              <p>Review date: {new Date(response.reviewedAt).toLocaleDateString()}</p>
                            </div>
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
    if (confirm('Are you sure you want to delete this form? This will also delete all applications.')) {
      try {
        const res = await fetch(`/api/admin/forms?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          loadForms();
          loadApplications();
        }
      } catch (error) {
        console.error('Error deleting form:', error);
      }
    }
  }
}

// Simplified Form Editor Component
function FormEditor({ form, onClose, onSave }: any) {
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
    textColor: '#ffffff'
  });

  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveData = () => {
      if (formData.title.trim()) {
        const draftKey = form ? `formEditor_draft_edit_${form.id}` : 'formEditor_draft_new';
        localStorage.setItem(draftKey, JSON.stringify({
          formData,
          questions
        }));
        console.log('✓ Form editor autosaved:', formData.title, form ? '(editing)' : '(new)');
      }
    };

    const timeoutId = setTimeout(autoSaveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData, questions, form]);

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
        textColor: form.textColor || '#ffffff'
      });

      if (form.questions) {
        setQuestions(form.questions.sort((a, b) => a.order - b.order));
      }
    } else {
      // Load draft for new forms
      const draftKey = 'formEditor_draft_new';
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft);
          if (parsedDraft.formData) {
            setFormData(parsedDraft.formData);
          }
          if (parsedDraft.questions) {
            setQuestions(parsedDraft.questions);
          }
          console.log('✓ Form editor draft loaded:', parsedDraft.formData?.title);
        } catch (error) {
          console.error('Error loading form editor draft:', error);
          localStorage.removeItem(draftKey);
        }
      }
    }
  }, [form]);

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now().toString(),
      title: '',
      description: '',
      type: 'TEXT',
      required: false,
      order: questions.length,
      options: null,
      minLength: null,
      maxLength: null,
      pattern: null
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    updated.forEach((q, i) => {
      q.order = i;
    });
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        maxSubmissions: formData.maxSubmissions ? parseInt(formData.maxSubmissions) : null,
        questions: questions.map((q, index) => ({
          title: q.title,
          description: q.description || '',
          type: q.type,
          required: q.required || false,
          order: index,
          options: (q.type === 'SELECT' || q.type === 'RADIO' || q.type === 'CHECKBOX') && q.options 
            ? q.options 
            : null,
          minLength: q.minLength || null,
          maxLength: q.maxLength || null,
          pattern: q.pattern || null
        }))
      };

      const url = form 
        ? `/api/admin/forms?id=${form.id}` 
        : '/api/admin/forms';
      
      const method = form ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Clear draft on successful save
        const draftKey = form ? `formEditor_draft_edit_${form.id}` : 'formEditor_draft_new';
        localStorage.removeItem(draftKey);
        console.log('✓ Form saved successfully, draft cleared');
        onSave();
      } else {
        const error = await res.json();
        alert(error.message || 'Error saving form');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Error saving form');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {form ? 'Edit Form' : 'Create New Form'}
        </h2>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500 bg-green-50 px-2 py-1 rounded border border-green-200">
            ✓ Auto-saving
          </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              required
            >
              <option value="general">General</option>
              <option value="membership">Membership</option>
              <option value="internship">Internship</option>
              <option value="event">Event</option>
              <option value="project">Project</option>
              <option value="partnership">Partnership</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
            placeholder="Describe what this form is for..."
          />
        </div>

        {/* Form Settings */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.348 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.348a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.348 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.348a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">⚙️ Form Configuration & Settings</h3>
          </div>
          <p className="text-gray-700 mb-6 text-sm">Configure authentication, deadlines, notifications, and submission limits for your form.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  🔒 Access & Security Settings
                </h4>
                
                <div className="space-y-4">
                  <label className="flex items-start gap-3 p-3 border-2 border-green-200 bg-green-50 rounded-lg hover:bg-green-100 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.requireAuth}
                      onChange={(e) => setFormData({...formData, requireAuth: e.target.checked})}
                      className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div>
                      <span className="text-sm font-bold text-gray-900">🎓 Require UMich Authentication</span>
                      <p className="text-xs text-gray-600 mt-1">
                        ✅ Only users with @umich.edu emails can submit this form
                      </p>
                      <p className="text-xs text-blue-600 mt-1 font-medium">
                        Recommended for official university forms and applications
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                      className="mt-1 rounded border-gray-300 text-[#00274c] focus:ring-[#00274c]"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">📖 Public Form</span>
                      <p className="text-xs text-gray-500 mt-1">Form is publicly accessible via direct link</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="mt-1 rounded border-gray-300 text-[#00274c] focus:ring-[#00274c]"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">✅ Active Form</span>
                      <p className="text-xs text-gray-500 mt-1">Form is currently accepting submissions</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowMultiple}
                      onChange={(e) => setFormData({...formData, allowMultiple: e.target.checked})}
                      className="mt-1 rounded border-gray-300 text-[#00274c] focus:ring-[#00274c]"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">🔄 Allow Multiple Submissions</span>
                      <p className="text-xs text-gray-500 mt-1">Users can submit this form multiple times</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  ⏰ Deadlines & Notifications
                </h4>
                
                <div className="space-y-4">
                  <div className="p-3 border-2 border-orange-200 bg-orange-50 rounded-lg">
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      📅 Submission Deadline
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                      className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      ⚠️ Leave empty for no deadline. After deadline, form will be automatically closed.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📊 Max Submissions</label>
                    <input
                      type="number"
                      value={formData.maxSubmissions}
                      onChange={(e) => setFormData({...formData, maxSubmissions: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] bg-white"
                      placeholder="Leave empty for unlimited"
                    />
                    <p className="text-xs text-gray-500 mt-1">Limit total number of submissions accepted</p>
                  </div>

                  <div className="p-3 border-2 border-blue-200 bg-blue-50 rounded-lg">
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      📧 Notification Email
                    </label>
                    <input
                      type="email"
                      value={formData.notificationEmail}
                      onChange={(e) => setFormData({...formData, notificationEmail: e.target.value})}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="aibusinessgroup@umich.edu"
                    />
                    <p className="text-xs text-gray-600 mt-2">Email address to receive submission notifications</p>
                  </div>

                  <label className="flex items-start gap-3 p-3 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifyOnSubmission}
                      onChange={(e) => setFormData({...formData, notifyOnSubmission: e.target.checked})}
                      className="mt-1 rounded border-gray-300 text-[#00274c] focus:ring-[#00274c]"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">📬 Email Notifications</span>
                      <p className="text-xs text-gray-500 mt-1">Send email alerts when forms are submitted</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Questions</h3>
            <button
              type="button"
              onClick={addQuestion}
              className="admin-save-btn bg-[#00274c] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#003366] admin-white-text"
            >
              Add Question
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium">Question {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Question Title *</label>
                      <input
                        type="text"
                        value={question.title}
                        onChange={(e) => updateQuestion(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#00274c]"
                        placeholder="e.g., What is your academic year?"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={question.type}
                        onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#00274c]"
                      >
                        <option value="TEXT">Short Text</option>
                        <option value="TEXTAREA">Long Text</option>
                        <option value="EMAIL">Email</option>
                        <option value="PHONE">Phone</option>
                        <option value="NUMBER">Number</option>
                        <option value="DATE">Date</option>
                        <option value="SELECT">Dropdown</option>
                        <option value="RADIO">Radio Buttons</option>
                        <option value="CHECKBOX">Checkboxes</option>
                        <option value="FILE">File Upload</option>
                        <option value="URL">URL</option>
                        <option value="BOOLEAN">Yes/No</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 border-2 border-green-200 bg-green-50 rounded-lg">
                    <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                      💬 Question Description (Optional)
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Clarification Feature</span>
                    </label>
                    <input
                      type="text"
                      value={question.description || ''}
                      onChange={(e) => updateQuestion(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                      placeholder="e.g., 'Please provide your current GPA on a 4.0 scale' or 'Include any relevant experience with Python, R, or SQL'"
                    />
                    <p className="text-xs text-gray-700 mt-2 font-medium">
                      ℹ️ This description will appear below the question title to provide additional context and clarification for users
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      💡 Use this to explain requirements, provide examples, or clarify what kind of answer you're looking for
                    </p>
                  </div>
                </div>

                {(question.type === 'SELECT' || question.type === 'RADIO' || question.type === 'CHECKBOX') && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Options (one per line)</label>
                    <textarea
                      value={question.options || ''}
                      onChange={(e) => updateQuestion(index, 'options', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#00274c]"
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                    />
                  </div>
                )}

                <div className="mt-4 flex items-center">
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                    className="rounded border-gray-300 text-[#00274c] focus:ring-[#00274c]"
                  />
                  <label className="ml-2 text-sm text-gray-700">Required</label>
                </div>
              </div>
            ))}

            {questions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No questions yet. Click "Add Question" to get started.
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-6 border-t">
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
            {saving ? 'Saving...' : (form ? 'Update Form' : 'Create Form')}
          </button>
        </div>
      </form>
    </div>
  );
} 