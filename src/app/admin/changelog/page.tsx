'use client';
import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  ClockIcon, 
  UserIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

interface ChangelogEntry {
  id: string;
  version: string;
  date: string;
  author: string;
  type: 'FEATURE' | 'IMPROVEMENT' | 'BUGFIX' | 'CONTENT' | 'ADMIN';
  title: string;
  description: string;
  changes: string[];
  breaking?: boolean;
}

export default function ChangelogAdmin() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>('ALL');

  // Initialize with current changes
  useEffect(() => {
    const initialEntries: ChangelogEntry[] = [
      {
        id: '1',
        version: '2.3.0',
        date: new Date().toISOString().split('T')[0],
        author: 'Admin',
        type: 'FEATURE',
        title: 'Complete Admin Restructure & Internship Application System',
        description: 'Fixed admin pages and added comprehensive internship application functionality',
        changes: [
          'Created missing admin pages: About, Join, Events, Companies',
          'Fixed black screen issues on admin pages',
          'Added internship application form to frontend /internships page',
          'Implemented opportunity listings with company partnerships',
          'Enhanced internship admin with working application management',
          'Added visual opportunity showcase with real company examples',
          'Improved user experience with complete application workflow'
        ]
      },
      {
        id: '2',
        version: '2.2.0',
        date: new Date().toISOString().split('T')[0],
        author: 'Admin',
        type: 'IMPROVEMENT',
        title: 'Admin Structure Reorganization',
        description: 'Reorganized admin interface into dedicated pages with improved functionality',
        changes: [
          'Separated admin content management into individual pages',
          'Created dedicated admin pages: Hero, About, Join, Team, Projects, Events, Companies, Forms, Settings',
          'Updated admin sidebar navigation with new structure',
          'Enhanced internship admin with application approval/denial workflow',
          'Added functional forms management with create/edit capabilities',
          'Improved user experience with focused admin sections'
        ]
      },
      {
        id: '3',
        version: '2.1.0',
        date: new Date().toISOString().split('T')[0],
        author: 'Admin',
        type: 'FEATURE',
        title: 'Internship Program Launch',
        description: 'Added comprehensive internship program with application management',
        changes: [
          'Created new internship program page (/internships)',
          'Added internship navigation to main navbar',
          'Built admin interface for managing applications and opportunities',
          'Implemented three-phase program structure display',
          'Added timeline and benefits visualization'
        ]
      },
      {
        id: '4',
        version: '2.0.1',
        date: new Date().toISOString().split('T')[0],
        author: 'Admin',
        type: 'IMPROVEMENT',
        title: 'Email Address Updates',
        description: 'Updated all contact emails to use official umich.edu domain',
        changes: [
          'General email: info@abg-umich.com → aibusinessgroup@umich.edu',
          'Partnerships email: partnerships@abg-umich.com → ABGPartnerships@umich.edu',
          'Careers email renamed to Recruitment: careers@abg-umich.com → ABGRecruitment@umich.edu',
          'Updated email references across all components and database schema'
        ]
      },
      {
        id: '5',
        version: '2.0.0',
        date: new Date().toISOString().split('T')[0],
        author: 'Admin',
        type: 'ADMIN',
        title: 'Admin Interface Improvements',
        description: 'Enhanced admin dashboard with changelog system',
        changes: [
          'Added changelog management system',
          'Removed notification bell icon from admin header',
          'Added internship management to admin sidebar',
          'Improved admin navigation structure'
        ]
      },
      {
        id: "changelog-v2.5.0",
        version: "2.5.0",
        date: "2024-12-30",
        type: "FEATURE" as const,
        title: "Comprehensive Forms Review System",
        description: "Complete application review workflow with categorization and status management",
        author: "ABG Development Team",
        changes: [
          "🎯 Added comprehensive forms review dashboard with category-based organization",
          "📊 Created visual application status overview with real-time statistics",
          "⚡ Implemented quick-action buttons for approve/reject/pending workflows",
          "🔗 Added one-click form link copying functionality for easy sharing",
          "📂 Enhanced form categorization (Internships, Membership, Events, General)",
          "👀 Added expandable application details view with full response display",
          "📝 Integrated admin notes system for application tracking",
          "🎨 Improved visual indicators with color-coded status badges",
          "🔄 Real-time application status updates and reviewer tracking",
          "📱 Mobile-responsive design for application review on any device",
          "🔐 Added UMich authentication requirement option for forms",
          "🏫 Implemented secure @umich.edu email validation for restricted forms",
          "✨ Enhanced form settings with comprehensive access controls and notifications"
        ]
      },
      {
        id: "changelog-v2.4.0",
        version: "2.4.0",
        date: "2024-12-30",
        type: "FEATURE" as const,
        title: "Admin Forms and Management System Complete",
        description: "Comprehensive fixes and feature implementations for all admin management sections",
        author: "ABG Development Team",
        changes: [
          "✅ Fixed admin form creation functionality - forms can now be successfully created and saved",
          "✅ Implemented complete Team Member management with full CRUD operations", 
          "✅ Added comprehensive Project management with status tracking and progress monitoring",
          "✅ Enhanced Event management with detailed scheduling and capacity controls",
          "✅ Completed Company partnership management with contact information and categorization",
          "✅ Fixed all black screen issues in admin sections",
          "🔧 Resolved 500 errors when saving forms - proper question handling implemented",
          "🔧 Enhanced form question creation with proper validation and options support",
          "📱 Improved admin interface responsiveness and user experience"
        ]
      }
    ];

    setEntries(initialEntries);
  }, []);

  const addEntry = async (entry: Omit<ChangelogEntry, 'id'>) => {
    const newEntry = {
      ...entry,
      id: Date.now().toString(),
    };
    setEntries([newEntry, ...entries]);
    setShowForm(false);
  };

  const toggleExpanded = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'FEATURE': return 'bg-green-100 text-green-800';
      case 'IMPROVEMENT': return 'bg-blue-100 text-blue-800';
      case 'BUGFIX': return 'bg-red-100 text-red-800';
      case 'CONTENT': return 'bg-purple-100 text-purple-800';
      case 'ADMIN': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEntries = filterType === 'ALL' 
    ? entries 
    : entries.filter(entry => entry.type === filterType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Changelog</h1>
          <p className="text-gray-600 mt-1">Track all website changes and updates</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#00274c] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#003366] admin-white-text"
        >
          <PlusIcon className="w-4 h-4" />
          Add Entry
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2">Filter by type:</span>
          {['ALL', 'FEATURE', 'IMPROVEMENT', 'BUGFIX', 'CONTENT', 'ADMIN'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterType === type
                  ? 'bg-[#00274c] text-white admin-white-text'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Changelog Entries */}
      <div className="space-y-4">
        {filteredEntries.map((entry) => (
          <div key={entry.id} className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-semibold text-gray-900">v{entry.version}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(entry.type)}`}>
                      {entry.type}
                    </span>
                    {entry.breaking && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        BREAKING
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{entry.title}</h3>
                  <p className="text-gray-600 mb-3">{entry.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      <span>{entry.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      <span>{entry.author}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => toggleExpanded(entry.id)}
                  className="ml-4 p-2 text-gray-400 hover:text-gray-600 rounded"
                >
                  {expandedEntries.has(entry.id) ? (
                    <ChevronUpIcon className="w-5 h-5" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {expandedEntries.has(entry.id) && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Changes:</h4>
                  <ul className="space-y-2">
                    {entry.changes.map((change, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700">{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Entry Form Modal */}
      {showForm && (
        <ChangelogForm
          onSubmit={addEntry}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function ChangelogForm({ 
  onSubmit, 
  onCancel 
}: { 
  onSubmit: (entry: Omit<ChangelogEntry, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    version: '',
    date: new Date().toISOString().split('T')[0],
    author: 'Admin',
    type: 'IMPROVEMENT' as const,
    title: '',
    description: '',
    changes: [''],
    breaking: false
  });

  const addChange = () => {
    setFormData({
      ...formData,
      changes: [...formData.changes, '']
    });
  };

  const updateChange = (index: number, value: string) => {
    const newChanges = [...formData.changes];
    newChanges[index] = value;
    setFormData({
      ...formData,
      changes: newChanges
    });
  };

  const removeChange = (index: number) => {
    if (formData.changes.length > 1) {
      setFormData({
        ...formData,
        changes: formData.changes.filter((_, i) => i !== index)
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      changes: formData.changes.filter(change => change.trim() !== '')
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Add Changelog Entry</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Version</label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({...formData, version: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="e.g., 2.1.0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              >
                <option value="FEATURE">Feature</option>
                <option value="IMPROVEMENT">Improvement</option>
                <option value="BUGFIX">Bug Fix</option>
                <option value="CONTENT">Content</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({...formData, author: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="Brief title for this update"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="Detailed description of the changes"
              required
            />
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Changes</label>
              <button
                type="button"
                onClick={addChange}
                className="text-[#00274c] hover:text-[#003366] text-sm font-medium"
              >
                + Add Change
              </button>
            </div>
            <div className="space-y-2">
              {formData.changes.map((change, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={change}
                    onChange={(e) => updateChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    placeholder="Describe a specific change"
                  />
                  {formData.changes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChange(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.breaking}
                onChange={(e) => setFormData({...formData, breaking: e.target.checked})}
                className="rounded border-gray-300 text-[#00274c] focus:ring-[#00274c]"
              />
              <span className="text-sm font-medium text-gray-700">Breaking Change</span>
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#00274c] text-white rounded-lg hover:bg-[#003366] admin-white-text"
            >
              Add Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 