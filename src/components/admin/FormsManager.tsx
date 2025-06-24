'use client';

import { useState, useEffect } from 'react';

interface FormData {
  id?: string;
  title: string;
  description: string;
  slug?: string;
  category: string;
  isActive: boolean;
  isPublic: boolean;
  allowMultiple: boolean;
  deadline: string;
  maxSubmissions: string;
  notifyOnSubmission: boolean;
  notificationEmail: string;
  requireAuth: boolean;
  backgroundColor: string;
  textColor: string;
  questions?: any[];
  _count?: { applications: number; questions: number };
}

interface Question {
  id?: string;
  title: string;
  description: string;
  type: string;
  required: boolean;
  order: number;
  options: string;
  minLength: string;
  maxLength: string;
  pattern: string;
}

export default function FormsManager({ forms, onReload }: { forms: any[], onReload: () => void }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeView, setActiveView] = useState<'list' | 'create' | 'edit' | 'applications' | 'questions'>('list');
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [editingForm, setEditingForm] = useState<FormData | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  const [newForm, setNewForm] = useState<FormData>({
    title: '',
    description: '',
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

  const [newQuestion, setNewQuestion] = useState<Question>({
    title: '',
    description: '',
    type: 'TEXT',
    required: false,
    order: 0,
    options: '',
    minLength: '',
    maxLength: '',
    pattern: ''
  });

  const questionTypes = [
    { value: 'TEXT', label: 'Short Text' },
    { value: 'TEXTAREA', label: 'Long Text' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'PHONE', label: 'Phone Number' },
    { value: 'NUMBER', label: 'Number' },
    { value: 'DATE', label: 'Date' },
    { value: 'SELECT', label: 'Dropdown' },
    { value: 'RADIO', label: 'Radio Buttons' },
    { value: 'CHECKBOX', label: 'Checkboxes' },
    { value: 'BOOLEAN', label: 'Yes/No' },
    { value: 'URL', label: 'Website URL' },
    { value: 'FILE', label: 'File Upload' }
  ];

  const resetForm = () => {
    setNewForm({
      title: '',
      description: '',
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
  };

  const createForm = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newForm,
          deadline: newForm.deadline ? new Date(newForm.deadline) : null,
          maxSubmissions: newForm.maxSubmissions ? parseInt(newForm.maxSubmissions) : null
        })
      });

      if (res.ok) {
        setMessage('Form created successfully!');
        resetForm();
        setActiveView('list');
        onReload();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await res.json();
        setMessage(error.error || 'Error creating form');
      }
    } catch (error) {
      console.error('Error creating form:', error);
      setMessage('Error creating form');
    }
    setSaving(false);
  };

  const updateForm = async () => {
    if (!editingForm || !editingForm.id) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/admin/forms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingForm,
          deadline: editingForm.deadline ? new Date(editingForm.deadline) : null,
          maxSubmissions: editingForm.maxSubmissions ? parseInt(editingForm.maxSubmissions) : null
        })
      });

      if (res.ok) {
        setMessage('Form updated successfully!');
        setEditingForm(null);
        setActiveView('list');
        onReload();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await res.json();
        setMessage(error.error || 'Error updating form');
      }
    } catch (error) {
      console.error('Error updating form:', error);
      setMessage('Error updating form');
    }
    setSaving(false);
  };

  const startEditingForm = (form: any) => {
    setEditingForm({
      ...form,
      deadline: form.deadline ? new Date(form.deadline).toISOString().slice(0, 16) : '',
      maxSubmissions: form.maxSubmissions?.toString() || ''
    });
    setActiveView('edit');
  };

  const deleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form? This will also delete all applications.')) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/forms?id=${formId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setMessage('Form deleted successfully!');
        onReload();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await res.json();
        setMessage(error.error || 'Error deleting form');
      }
    } catch (error) {
      console.error('Error deleting form:', error);
      setMessage('Error deleting form');
    }
    setSaving(false);
  };

  const loadApplications = async (form: any) => {
    setSelectedForm(form);
    try {
      const res = await fetch(`/api/admin/applications?formId=${form.id}`);
      if (res.ok) {
        const apps = await res.json();
        setApplications(apps);
        setActiveView('applications');
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const loadFormQuestions = async (form: any) => {
    setSelectedForm(form);
    setActiveView('questions');
  };

  const addQuestion = async () => {
    if (!selectedForm) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/forms/${selectedForm.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newQuestion,
          options: newQuestion.options ? JSON.stringify(newQuestion.options.split('\n').filter(Boolean)) : null,
          minLength: newQuestion.minLength ? parseInt(newQuestion.minLength) : null,
          maxLength: newQuestion.maxLength ? parseInt(newQuestion.maxLength) : null
        })
      });

      if (res.ok) {
        setMessage('Question added successfully!');
        setNewQuestion({
          title: '',
          description: '',
          type: 'TEXT',
          required: false,
          order: 0,
          options: '',
          minLength: '',
          maxLength: '',
          pattern: ''
        });
        setShowAddQuestion(false);
        onReload();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await res.json();
        setMessage(error.error || 'Error adding question');
      }
    } catch (error) {
      console.error('Error adding question:', error);
      setMessage('Error adding question');
    }
    setSaving(false);
  };

  const updateApplicationStatus = async (applicationId: string, status: string, adminNotes?: string) => {
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: applicationId,
          status,
          adminNotes
        })
      });

      if (res.ok) {
        setMessage('Application status updated!');
        if (selectedForm) {
          loadApplications(selectedForm);
        }
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating application:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      REVIEWING: 'bg-blue-100 text-blue-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      WAITLISTED: 'bg-purple-100 text-purple-800',
      WITHDRAWN: 'bg-gray-100 text-gray-800',
      EXPIRED: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const renderNavigation = () => (
    <div className="flex items-center gap-2 mb-6 text-sm">
      <button
        onClick={() => setActiveView('list')}
        className={`px-3 py-1 rounded ${activeView === 'list' ? 'bg-[#00274c] text-white' : 'text-gray-600 hover:text-gray-800'}`}
      >
        Forms List
      </button>
      {selectedForm && (
        <>
          <span className="text-gray-400">›</span>
          <span className="text-gray-600">{selectedForm.title}</span>
          {activeView === 'applications' && (
            <>
              <span className="text-gray-400">›</span>
              <span className="text-[#00274c] font-medium">Applications</span>
            </>
          )}
          {activeView === 'questions' && (
            <>
              <span className="text-gray-400">›</span>
              <span className="text-[#00274c] font-medium">Questions</span>
            </>
          )}
        </>
      )}
    </div>
  );

  const renderFormEditor = (formData: FormData, isEditing: boolean = false) => (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        {isEditing ? 'Edit Form' : 'Create New Form'}
      </h3>
      
      {/* Basic Information */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
        
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => isEditing 
                ? setEditingForm({...editingForm!, title: e.target.value})
                : setNewForm({...newForm, title: e.target.value})
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Membership Application"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => isEditing 
                ? setEditingForm({...editingForm!, category: e.target.value})
                : setNewForm({...newForm, category: e.target.value})
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => isEditing 
              ? setEditingForm({...editingForm!, description: e.target.value})
              : setNewForm({...newForm, description: e.target.value})
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Brief description of this form..."
          />
        </div>
      </div>

      {/* Access & Limits */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Access & Limits</h4>
        
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Deadline (Optional)</label>
            <input
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => isEditing 
                ? setEditingForm({...editingForm!, deadline: e.target.value})
                : setNewForm({...newForm, deadline: e.target.value})
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Max Submissions (Optional)</label>
            <input
              type="number"
              value={formData.maxSubmissions}
              onChange={(e) => isEditing 
                ? setEditingForm({...editingForm!, maxSubmissions: e.target.value})
                : setNewForm({...newForm, maxSubmissions: e.target.value})
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Leave empty for unlimited"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-gray-900">Form Settings</h5>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => isEditing 
                  ? setEditingForm({...editingForm!, isActive: e.target.checked})
                  : setNewForm({...newForm, isActive: e.target.checked})
                }
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-900">Form is active</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => isEditing 
                  ? setEditingForm({...editingForm!, isPublic: e.target.checked})
                  : setNewForm({...newForm, isPublic: e.target.checked})
                }
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-900">Publicly accessible</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.allowMultiple}
                onChange={(e) => isEditing 
                  ? setEditingForm({...editingForm!, allowMultiple: e.target.checked})
                  : setNewForm({...newForm, allowMultiple: e.target.checked})
                }
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-900">Allow multiple submissions per email</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.requireAuth}
                onChange={(e) => isEditing 
                  ? setEditingForm({...editingForm!, requireAuth: e.target.checked})
                  : setNewForm({...newForm, requireAuth: e.target.checked})
                }
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-900">Require UMich Google sign-in</span>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Notification Email</label>
            <input
              type="email"
              value={formData.notificationEmail}
              onChange={(e) => isEditing 
                ? setEditingForm({...editingForm!, notificationEmail: e.target.value})
                : setNewForm({...newForm, notificationEmail: e.target.value})
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="admin@abg-umich.com"
            />
            <p className="text-xs text-gray-500 mt-1">Get notified when someone submits this form</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={isEditing ? updateForm : createForm}
          disabled={saving || !formData.title}
          className="bg-[#00274c] text-white px-6 py-2 rounded-lg hover:bg-[#00274c]/90 transition-colors disabled:opacity-50 font-medium"
        >
          {saving ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Form' : 'Create Form')}
        </button>
        <button
          onClick={() => {
            if (isEditing) {
              setEditingForm(null);
            } else {
              resetForm();
            }
            setActiveView('list');
          }}
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {renderNavigation()}

      {/* Forms List View */}
      {activeView === 'list' && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Forms & Applications</h2>
            <button
              onClick={() => setActiveView('create')}
              className="bg-[#00274c] text-white px-4 py-2 rounded-lg hover:bg-[#00274c]/90 transition-colors"
            >
              Create New Form
            </button>
          </div>

          <div className="grid gap-4">
            {forms.map((form: any) => (
              <div key={form.id} className="bg-white rounded-lg border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{form.title}</h3>
                    <p className="text-sm text-gray-600">{form.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>Category: {form.category}</span>
                      <span>Questions: {form._count?.questions || 0}</span>
                      <span>Applications: {form._count?.applications || 0}</span>
                      <span className={form.isActive ? 'text-green-600' : 'text-red-600'}>
                        {form.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-2">
                      <a 
                        href={`/forms/${form.slug}`}
                        target="_blank"
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        View Public Form →
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => loadApplications(form)}
                      className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100"
                    >
                      Applications ({form._count?.applications || 0})
                    </button>
                    <button
                      onClick={() => loadFormQuestions(form)}
                      className="text-sm bg-green-50 text-green-600 px-3 py-1 rounded hover:bg-green-100"
                    >
                      Questions ({form._count?.questions || 0})
                    </button>
                    <button
                      onClick={() => startEditingForm(form)}
                      className="text-sm bg-yellow-50 text-yellow-600 px-3 py-1 rounded hover:bg-yellow-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteForm(form.id)}
                      className="text-sm bg-red-50 text-red-600 px-3 py-1 rounded hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {forms.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>No forms created yet.</p>
                <button
                  onClick={() => setActiveView('create')}
                  className="mt-4 bg-[#00274c] text-white px-6 py-2 rounded-lg hover:bg-[#00274c]/90 transition-colors"
                >
                  Create Your First Form
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Form View */}
      {activeView === 'create' && renderFormEditor(newForm)}

      {/* Edit Form View */}
      {activeView === 'edit' && editingForm && renderFormEditor(editingForm, true)}

      {/* Applications View */}
      {activeView === 'applications' && selectedForm && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Applications for "{selectedForm.title}"
            </h3>
          </div>

          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {app.applicantName || app.applicantEmail}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Submitted: {new Date(app.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                    <select
                      value={app.status}
                      onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                      className="text-sm border rounded px-2 py-1 bg-white text-black"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="REVIEWING">Reviewing</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="WAITLISTED">Waitlisted</option>
                      <option value="WITHDRAWN">Withdrawn</option>
                    </select>
                  </div>
                </div>

                {/* Application Responses */}
                <div className="space-y-2">
                  {app.responses.map((response: any) => (
                    <div key={response.id} className="text-sm">
                      <span className="font-medium text-gray-900">{response.question.title}:</span>
                      <span className="ml-2 text-gray-600">
                        {response.textValue || response.numberValue || response.dateValue || 
                         (response.booleanValue !== null ? (response.booleanValue ? 'Yes' : 'No') : '') ||
                         response.selectedOptions || response.fileUrl || 'No answer'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Admin Notes */}
                <div className="mt-3 pt-3 border-t">
                  <textarea
                    placeholder="Add admin notes..."
                    className="w-full text-sm border rounded px-3 py-2 bg-white text-black"
                    rows={2}
                    defaultValue={app.adminNotes || ''}
                    onBlur={(e) => {
                      if (e.target.value !== (app.adminNotes || '')) {
                        updateApplicationStatus(app.id, app.status, e.target.value);
                      }
                    }}
                  />
                </div>
              </div>
            ))}

            {applications.length === 0 && (
              <p className="text-gray-500 text-center py-8">No applications submitted yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Questions Management View */}
      {activeView === 'questions' && selectedForm && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Questions for "{selectedForm.title}"
            </h3>
            <button
              onClick={() => setShowAddQuestion(true)}
              className="bg-[#00274c] text-white px-4 py-2 rounded-lg hover:bg-[#00274c]/90 transition-colors"
            >
              Add Question
            </button>
          </div>

          {/* Add Question Form */}
          {showAddQuestion && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-4">Add New Question</h4>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Question Title *</label>
                  <input
                    type="text"
                    value={newQuestion.title}
                    onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="What is your question?"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Question Type</label>
                  <select
                    value={newQuestion.type}
                    onChange={(e) => setNewQuestion({...newQuestion, type: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {questionTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">Description (Optional)</label>
                <textarea
                  value={newQuestion.description}
                  onChange={(e) => setNewQuestion({...newQuestion, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Additional context for this question..."
                />
              </div>

              {(newQuestion.type === 'SELECT' || newQuestion.type === 'RADIO' || newQuestion.type === 'CHECKBOX') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Options (one per line)</label>
                  <textarea
                    value={newQuestion.options}
                    onChange={(e) => setNewQuestion({...newQuestion, options: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                  />
                </div>
              )}

              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newQuestion.required}
                    onChange={(e) => setNewQuestion({...newQuestion, required: e.target.checked})}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-900">Required question</span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={addQuestion}
                  disabled={saving || !newQuestion.title}
                  className="bg-[#00274c] text-white px-4 py-2 rounded-lg hover:bg-[#00274c]/90 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Question'}
                </button>
                <button
                  onClick={() => {
                    setShowAddQuestion(false);
                    setNewQuestion({
                      title: '',
                      description: '',
                      type: 'TEXT',
                      required: false,
                      order: 0,
                      options: '',
                      minLength: '',
                      maxLength: '',
                      pattern: ''
                    });
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-3">
            {selectedForm.questions?.sort((a: any, b: any) => a.order - b.order).map((question: any, index: number) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <h4 className="font-medium text-gray-900">{question.title}</h4>
                      {question.required && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Required</span>
                      )}
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{question.type}</span>
                    </div>
                    {question.description && (
                      <p className="text-sm text-gray-600 mb-2">{question.description}</p>
                    )}
                    {question.options && (
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Options: </span>
                        {JSON.parse(question.options).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                    <button className="text-sm text-red-600 hover:text-red-800">Delete</button>
                  </div>
                </div>
              </div>
            ))}

            {(!selectedForm.questions || selectedForm.questions.length === 0) && (
              <p className="text-gray-500 text-center py-8">No questions added yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 