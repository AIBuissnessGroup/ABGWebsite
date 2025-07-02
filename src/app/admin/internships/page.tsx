'use client';
import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface InternshipApplication {
  id: string;
  studentName: string;
  email: string;
  year: string;
  major: string;
  projects: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INTERVIEWED';
  appliedAt: string;
  companyInterest?: string;
}

interface InternshipOpportunity {
  id: string;
  company: string;
  title: string;
  description: string;
  skills: string[];
  type: string;
  duration: string;
  location: string;
  status: 'OPEN' | 'FILLED' | 'CLOSED';
  applicationsCount: number;
}

export default function InternshipsAdmin() {
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'opportunities' | 'content'>('overview');
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [opportunities, setOpportunities] = useState<InternshipOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setApplications([
        {
          id: '1',
          studentName: 'Sarah Chen',
          email: 'sarahc@umich.edu',
          year: 'Junior',
          major: 'Computer Science',
          projects: ['AI Chatbot for Student Services', 'ML Pipeline Optimization'],
          status: 'APPROVED',
          appliedAt: '2025-01-15',
          companyInterest: 'Tech Startups'
        },
        {
          id: '2',
          studentName: 'Marcus Johnson',
          email: 'marcusj@umich.edu',
          year: 'Senior',
          major: 'Business Administration',
          projects: ['Market Analysis Dashboard'],
          status: 'PENDING',
          appliedAt: '2025-01-10'
        }
      ]);

      setOpportunities([
        {
          id: '1',
          company: 'TechCorp Inc.',
          title: 'AI Research Intern',
          description: 'Work on cutting-edge NLP projects',
          skills: ['Python', 'PyTorch', 'NLP'],
          type: 'Research',
          duration: '12 weeks',
          location: 'Remote',
          status: 'OPEN',
          applicationsCount: 5
        },
        {
          id: '2',
          company: 'StartupAI',
          title: 'ML Engineering Intern',
          description: 'Build production ML pipelines',
          skills: ['Python', 'Docker', 'AWS'],
          type: 'Engineering',
          duration: '10 weeks', 
          location: 'San Francisco',
          status: 'FILLED',
          applicationsCount: 12
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': case 'OPEN': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': case 'CLOSED': return 'bg-red-100 text-red-800';
      case 'INTERVIEWED': case 'FILLED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const updateApplicationStatus = async (id: string, status: string) => {
    try {
      // Update the application status in the local state
      setApplications(prev => prev.map(app => 
        app.id === id ? { ...app, status: status as any } : app
      ));
      // Here you would typically make an API call to update the status
      console.log(`Updated application ${id} to status ${status}`);
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const viewApplication = (app: InternshipApplication) => {
    // Open modal or navigate to detailed view
    alert(`Viewing application for ${app.studentName}`);
  };

  const editApplication = (app: InternshipApplication) => {
    // Open edit modal or form
    alert(`Editing application for ${app.studentName}`);
  };

  const deleteApplication = async (id: string) => {
    if (confirm('Are you sure you want to delete this application?')) {
      try {
        setApplications(prev => prev.filter(app => app.id !== id));
        console.log(`Deleted application ${id}`);
      } catch (error) {
        console.error('Error deleting application:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading internship data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Internship Program</h1>
          <p className="text-gray-600 mt-1">Manage internship applications and opportunities</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: ChartBarIcon },
            { id: 'applications', name: 'Applications', icon: UserGroupIcon },
            { id: 'opportunities', name: 'Opportunities', icon: BriefcaseIcon },
            { id: 'content', name: 'Page Content', icon: DocumentTextIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-[#00274c] text-[#00274c]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Applications</dt>
                    <dd className="text-lg font-medium text-gray-900">{applications.length}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BriefcaseIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Open Opportunities</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {opportunities.filter(o => o.status === 'OPEN').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Review</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {applications.filter(a => a.status === 'PENDING').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {applications.filter(a => a.status === 'APPROVED').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Applications</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {applications.slice(0, 3).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{app.studentName}</p>
                      <p className="text-sm text-gray-500">{app.email} • {app.year} {app.major}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                      <span className="text-sm text-gray-500">{app.appliedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Student Applications</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowApplicationForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
              >
                <PlusIcon className="w-4 h-4" />
                Create Application Form
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Projects
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{app.studentName}</div>
                          <div className="text-sm text-gray-500">{app.email}</div>
                          <div className="text-xs text-gray-400">{app.year} • {app.major}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {app.projects.slice(0, 2).map((project, idx) => (
                            <div key={idx} className="mb-1">{project}</div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={app.status}
                          onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                          className={`px-2 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-offset-2 ${getStatusColor(app.status)}`}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="REJECTED">REJECTED</option>
                          <option value="INTERVIEWED">INTERVIEWED</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {app.appliedAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => viewApplication(app)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => editApplication(app)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit Application"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteApplication(app.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Application"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {applications.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
              <p className="text-gray-600 mb-4">Students will appear here when they submit internship applications.</p>
              <button
                onClick={() => setShowApplicationForm(true)}
                className="bg-[#00274c] text-white px-4 py-2 rounded-lg hover:bg-[#003366]"
              >
                Create Application Form
              </button>
            </div>
          )}
        </div>
      )}

      {/* Opportunities Tab */}
      {activeTab === 'opportunities' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Internship Opportunities</h3>
            <button className="bg-[#00274c] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#003366]">
              <PlusIcon className="w-4 h-4" />
              Add Opportunity
            </button>
          </div>

          <div className="grid gap-6">
            {opportunities.map((opp) => (
              <div key={opp.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{opp.title}</h4>
                    <p className="text-gray-600">{opp.company}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(opp.status)}`}>
                    {opp.status}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-4">{opp.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Type:</span>
                    <p className="text-sm text-gray-900">{opp.type}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Duration:</span>
                    <p className="text-sm text-gray-900">{opp.duration}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Location:</span>
                    <p className="text-sm text-gray-900">{opp.location}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Applications:</span>
                    <p className="text-sm text-gray-900">{opp.applicationsCount}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {opp.skills.map((skill, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button className="text-blue-600 hover:text-blue-900">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Internship Page Content</h3>
            <p className="text-gray-600 mb-4">
              The internship page content is currently static. Future versions will include 
              dynamic content management for program details, timeline, and application instructions.
            </p>
            <a 
              href="/internships" 
              target="_blank"
              className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-2"
            >
              <EyeIcon className="w-4 h-4" />
              View Live Page
            </a>
          </div>
        </div>
      )}
    </div>
  );
} 