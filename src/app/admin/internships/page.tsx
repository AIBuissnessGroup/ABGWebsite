'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

export default function InternshipsAdmin() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'companies' | 'projects' | 'content'>('companies');
  const [loading, setLoading] = useState(true);
  
  // Companies state
  const [companies, setCompanies] = useState<any[]>([]);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  
  // Projects state
  const [projects, setProjects] = useState<any[]>([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  
  // Forms for linking
  const [availableForms, setAvailableForms] = useState<any[]>([]);
  
  // Page content state
  const [pageContent, setPageContent] = useState({
    badgeText: 'AI Business Group Applied AI Internship Program',
    heroTitle: 'Launch Your AI Career',
    heroSubtitle: 'High-impact, real-world AI internship opportunities through Michigan Ross/COE recruitment pipelines and industry partnerships',
    missionTitle: 'Program Mission',
    missionText: 'To provide high-impact, real-world AI internship opportunities to ABG students by partnering with Michigan Ross/COE recruitment pipelines and company demand for applied AI talent.',
    phases: [
      {
        title: "Internal Project Phase",
        description: "Students complete a vetted project under AI Business Group mentorship.",
        duration: "8–10 weeks",
        details: [
          "Eligibility: Ross/COE/LSA students involved in AI Business Group projects",
          "High-quality, original, and impactful AI work with business relevance",
          "Project report, working model/prototype, and executive summary/pitch deck"
        ]
      },
      {
        title: "Internship Matching Phase", 
        description: "Top performers are referred to company partners for internship opportunities.",
        duration: "2-3 weeks",
        details: [
          "Past projects evaluation and project feedback forms",
          "PM direct input and club participation assessment",
          "Company intake with detailed project descriptions",
          "Interview process and final selection"
        ]
      },
      {
        title: "Internal Support Phase",
        description: "Technical preparation and mentorship before internships begin.",
        duration: "2-4 weeks",
        details: [
          "Technical prep with ABG mentor/eBoard/VP Education",
          "Skill development and project preparation",
          "Industry readiness and professional development"
        ]
      }
    ],
    timelineTitle: 'Program Timeline',
    timelineSubtitle: 'Typical UMich semester spans ~15 weeks with 1 finals week',
    timeline: [
      { phase: "New Member Recruitment", timing: "Weeks 1-4" },
      { phase: "Project Groups Decided", timing: "Week 5" },
      { phase: "Project Work Period", timing: "Weeks 6–14" },
      { phase: "Project Review + Selection", timing: "Weeks 13–14" },
      { phase: "Internship Matching Outreach", timing: "Weeks 15–16" },
      { phase: "Internship Period", timing: "Summer or following term" },
      { phase: "Feedback", timing: "Post-internship" }
    ],
    benefitsTitle: 'Benefits for All Stakeholders',
    benefits: {
      students: [
        "Get practical AI experience",
        "Build resumes with real company exposure", 
        "Access Ross/COE recruiting pipelines",
        "Work on cutting-edge AI projects",
        "Receive mentorship from industry professionals"
      ],
      companies: [
        "Access to pre-vetted, passionate AI students",
        "Reduced risk via project-based screening",
        "Collaboration with a premier university program",
        "Early access to top AI talent",
        "Flexible internship structures"
      ],
      university: [
        "Enhanced student career outcomes",
        "Strengthened industry ties in AI",
        "Encourages interdisciplinary, entrepreneurial student work",
        "Bridges academic learning with industry application"
      ]
    },
    opportunitiesTitle: 'Current Opportunities',
    opportunitiesSubtitle: 'Explore available internship positions with our partner companies',
    ctaTitle: 'Ready to Join the Program?',
    ctaSubtitle: 'Get involved with AI Business Group projects to qualify for our internship program.',
    published: true
  });

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
      return;
    }
  }, [session, status]);

  // Load data
  useEffect(() => {
    if (session?.user) {
      loadCompanies();
      loadProjects();
      loadForms();
      loadPageContent();
    }
  }, [session]);

  const loadCompanies = async () => {
    try {
      const res = await fetch('/api/admin/internships/companies');
      const data = await res.json();
      if (data && !data.error) setCompanies(data);
    } catch (error) {
      console.error('Error loading internship companies:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const res = await fetch('/api/admin/internships/projects');
      const data = await res.json();
      if (data && !data.error) setProjects(data);
    } catch (error) {
      console.error('Error loading internship projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadForms = async () => {
    try {
      const res = await fetch('/api/admin/forms');
      const data = await res.json();
      if (data && !data.error) setAvailableForms(data);
    } catch (error) {
      console.error('Error loading forms:', error);
    }
  };

  const loadPageContent = async () => {
    try {
      const res = await fetch('/api/admin/internships/content');
      const data = await res.json();
      if (data && !data.error) {
        setPageContent(data);
      }
    } catch (error) {
      console.error('Error loading page content:', error);
    }
  };

  const savePageContent = async () => {
    try {
      const res = await fetch('/api/admin/internships/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageContent)
      });
      
      if (res.ok) {
        alert('Page content saved successfully!');
      } else {
        const error = await res.json();
        alert(error.error || 'Error saving page content');
      }
    } catch (error) {
      console.error('Error saving page content:', error);
      alert('Error saving page content');
    }
  };

  const deleteCompany = async (id: string) => {
    if (confirm('Are you sure you want to delete this company?')) {
      try {
        const res = await fetch(`/api/admin/internships/companies?id=${id}`, { 
          method: 'DELETE' 
        });
        if (res.ok) {
          loadCompanies(); // Reload the companies list
        } else {
          const error = await res.json();
          alert(error.error || 'Error deleting company');
        }
      } catch (error) {
        console.error('Error deleting company:', error);
        alert('Error deleting company');
      }
    }
  };

  const deleteProject = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        const res = await fetch(`/api/admin/internships/projects?id=${id}`, { 
          method: 'DELETE' 
        });
        if (res.ok) {
          loadProjects(); // Reload the projects list
        } else {
          const error = await res.json();
          alert(error.error || 'Error deleting project');
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Error deleting project');
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Internship Program</h1>
          <p className="text-gray-600 mt-1">Manage companies, projects, and page content</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'companies', name: 'Companies', icon: BuildingOfficeIcon },
            { id: 'projects', name: 'Projects', icon: BriefcaseIcon },
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

      {/* Companies Tab */}
      {activeTab === 'companies' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Internship Partner Companies</h3>
            {!showCompanyForm && (
              <button
                onClick={() => {
                  setEditingCompany(null);
                  setShowCompanyForm(true);
                }}
                className="bg-[#00274c] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#003366] admin-white-text"
              >
                <PlusIcon className="w-4 h-4" />
                Add Company
              </button>
            )}
            </div>

          {/* Inline Company Form */}
          {showCompanyForm && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
              <InternshipCompanyForm
                company={editingCompany}
                onClose={() => {
                  setShowCompanyForm(false);
                  setEditingCompany(null);
                }}
                onSave={() => {
                  loadCompanies();
                  setShowCompanyForm(false);
                  setEditingCompany(null);
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
                        setShowCompanyForm(true);
                      }}
                      className="text-green-600 hover:text-green-900 p-2"
                      title="Edit Company"
                      disabled={showCompanyForm}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCompany(company.id)}
                      className="text-red-600 hover:text-red-900 p-2"
                      title="Delete Company"
                      disabled={showCompanyForm}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
              </div>
            </div>

                <div className="space-y-2 text-sm">
                  {company.description && (
                    <p className="text-gray-600 line-clamp-2">{company.description}</p>
                  )}
                  {company.location && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Location:</span>
                      <span className="font-medium">{company.location}</span>
                </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Projects:</span>
                    <span className="bg-[#00274c] text-white px-2 py-1 rounded text-xs font-medium">
                      {projects.filter(p => p.companyId === company.id).length}
                    </span>
            </div>
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

          {companies.length === 0 && !showCompanyForm && (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No companies yet</h3>
              <p className="text-gray-600 mb-4">Add your first partner company to get started.</p>
              <button
                onClick={() => {
                  setEditingCompany(null);
                  setShowCompanyForm(true);
                }}
                className="bg-[#00274c] text-white px-4 py-2 rounded-lg hover:bg-[#003366] admin-white-text"
              >
                Add Company
              </button>
            </div>
          )}
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Internship Projects</h3>
            {!showProjectForm && (
              <button
                onClick={() => {
                  setEditingProject(null);
                  setShowProjectForm(true);
                }}
                className="bg-[#00274c] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#003366] admin-white-text"
              >
                <PlusIcon className="w-4 h-4" />
                Add Project
              </button>
            )}
            </div>

          {/* Inline Project Form */}
          {showProjectForm && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
              <InternshipProjectForm
                project={editingProject}
                companies={companies}
                availableForms={availableForms}
                onClose={() => {
                  setShowProjectForm(false);
                  setEditingProject(null);
                }}
                onSave={() => {
                  loadProjects();
                  setShowProjectForm(false);
                  setEditingProject(null);
                }}
              />
          </div>
          )}

          <div className="grid gap-6">
            {projects.map((project: any) => (
              <div key={project.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                        project.status === 'FILLED' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                      {project.linkedForm && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium flex items-center gap-1">
                          <LinkIcon className="w-3 h-3" />
                          Form Linked
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                        <span className="font-medium text-gray-700">Company:</span>
                        <p className="text-gray-900">
                          {companies.find(c => c.id === project.companyId)?.name || 'Unknown'}
                        </p>
                        </div>
                      <div>
                        <span className="font-medium text-gray-700">Duration:</span>
                        <p className="text-gray-900">{project.duration || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Location:</span>
                        <p className="text-gray-900">{project.location || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Applications:</span>
                        <p className="text-gray-900">{project.applicationsCount || 0}</p>
                      </div>
                    </div>
                    
                    {project.skills && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-700 text-sm">Skills:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {JSON.parse(project.skills || '[]').slice(0, 5).map((skill: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {project.linkedForm && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-700 text-sm">Linked Form:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-[#00274c]">
                            {availableForms.find(f => f.id === project.linkedForm)?.title || 'Unknown Form'}
                          </span>
                          <a
                            href={`/forms/${availableForms.find(f => f.id === project.linkedForm)?.slug || project.linkedForm}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs underline"
                          >
                            View Form →
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <a
                      href={`/internships`}
                      target="_blank"
                      className="text-blue-600 hover:text-blue-900 p-2"
                      title="View on Page"
                          >
                            <EyeIcon className="w-4 h-4" />
                    </a>
                          <button 
                      onClick={() => {
                        setEditingProject(project);
                        setShowProjectForm(true);
                      }}
                      className="text-green-600 hover:text-green-900 p-2"
                      title="Edit Project"
                      disabled={showProjectForm}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button 
                      onClick={() => deleteProject(project.id)}
                      className="text-red-600 hover:text-red-900 p-2"
                      title="Delete Project"
                      disabled={showProjectForm}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
            </div>
              </div>
            ))}
          </div>

          {projects.length === 0 && !showProjectForm && (
            <div className="text-center py-12">
              <BriefcaseIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-600 mb-4">Create your first internship project to get started.</p>
              <button
                onClick={() => {
                  setEditingProject(null);
                  setShowProjectForm(true);
                }}
                className="bg-[#00274c] text-white px-4 py-2 rounded-lg hover:bg-[#003366] admin-white-text"
              >
                Add Project
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Internship Page Content</h3>
              <div className="flex gap-2">
                <a 
                  href="/internships" 
                  target="_blank"
                  className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-2 px-3 py-2 border border-blue-200 rounded-lg"
                >
                  <EyeIcon className="w-4 h-4" />
                  Preview Page
                </a>
                <button
                  onClick={savePageContent}
                  className="admin-save-btn bg-[#00274c] text-white px-4 py-2 rounded-lg hover:bg-[#003366] admin-white-text"
                >
                  Save Changes
            </button>
              </div>
          </div>

            <div className="space-y-8">
              {/* Hero Section */}
              <div className="border-b border-gray-200 pb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Hero Section</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Badge Text</label>
                    <input
                      type="text"
                      value={pageContent.badgeText}
                      onChange={(e) => setPageContent({...pageContent, badgeText: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hero Title</label>
                    <input
                      type="text"
                      value={pageContent.heroTitle}
                      onChange={(e) => setPageContent({...pageContent, heroTitle: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hero Subtitle</label>
                    <textarea
                      value={pageContent.heroSubtitle}
                      onChange={(e) => setPageContent({...pageContent, heroSubtitle: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    />
                  </div>
                </div>
                </div>
                
              {/* Mission Section */}
              <div className="border-b border-gray-200 pb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Mission Section</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mission Title</label>
                    <input
                      type="text"
                      value={pageContent.missionTitle}
                      onChange={(e) => setPageContent({...pageContent, missionTitle: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mission Text</label>
                    <textarea
                      value={pageContent.missionText}
                      onChange={(e) => setPageContent({...pageContent, missionText: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    />
                  </div>
                </div>
              </div>

              {/* Program Phases Section */}
              <div className="border-b border-gray-200 pb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Program Phases</h4>
                <div className="space-y-6">
                  {pageContent.phases.map((phase: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3">Phase {index + 1}</h5>
                      <div className="space-y-3">
                  <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phase Title</label>
                          <input
                            type="text"
                            value={phase.title}
                            onChange={(e) => {
                              const newPhases = [...pageContent.phases];
                              newPhases[index].title = e.target.value;
                              setPageContent({...pageContent, phases: newPhases});
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                          />
                  </div>
                  <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={phase.description}
                            onChange={(e) => {
                              const newPhases = [...pageContent.phases];
                              newPhases[index].description = e.target.value;
                              setPageContent({...pageContent, phases: newPhases});
                            }}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                          />
                  </div>
                  <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                          <input
                            type="text"
                            value={phase.duration}
                            onChange={(e) => {
                              const newPhases = [...pageContent.phases];
                              newPhases[index].duration = e.target.value;
                              setPageContent({...pageContent, phases: newPhases});
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                          />
                  </div>
                  <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Details (one per line)</label>
                          <textarea
                            value={phase.details.join('\n')}
                            onChange={(e) => {
                              const newPhases = [...pageContent.phases];
                              newPhases[index].details = e.target.value.split('\n').filter(line => line.trim());
                              setPageContent({...pageContent, phases: newPhases});
                            }}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
                
              {/* Timeline Section */}
              <div className="border-b border-gray-200 pb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Timeline Section</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timeline Title</label>
                    <input
                      type="text"
                      value={pageContent.timelineTitle}
                      onChange={(e) => setPageContent({...pageContent, timelineTitle: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timeline Subtitle</label>
                    <input
                      type="text"
                      value={pageContent.timelineSubtitle}
                      onChange={(e) => setPageContent({...pageContent, timelineSubtitle: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timeline Items</label>
                    <div className="space-y-3">
                      {pageContent.timeline.map((item: any, index: number) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border border-gray-200 rounded">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Phase</label>
                            <input
                              type="text"
                              value={item.phase}
                              onChange={(e) => {
                                const newTimeline = [...pageContent.timeline];
                                newTimeline[index].phase = e.target.value;
                                setPageContent({...pageContent, timeline: newTimeline});
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#00274c] text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Timing</label>
                            <input
                              type="text"
                              value={item.timing}
                              onChange={(e) => {
                                const newTimeline = [...pageContent.timeline];
                                newTimeline[index].timing = e.target.value;
                                setPageContent({...pageContent, timeline: newTimeline});
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#00274c] text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                </div>
                
              {/* Benefits Section */}
              <div className="border-b border-gray-200 pb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Benefits Section</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Benefits Title</label>
                    <input
                      type="text"
                      value={pageContent.benefitsTitle}
                      onChange={(e) => setPageContent({...pageContent, benefitsTitle: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Students Benefits */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">For Students (one per line)</label>
                      <textarea
                        value={pageContent.benefits.students.join('\n')}
                        onChange={(e) => {
                          const newBenefits = {...pageContent.benefits};
                          newBenefits.students = e.target.value.split('\n').filter(line => line.trim());
                          setPageContent({...pageContent, benefits: newBenefits});
                        }}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] text-sm"
                        placeholder="Enter benefits for students, one per line"
                      />
                    </div>
                    
                    {/* Companies Benefits */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">For Companies (one per line)</label>
                      <textarea
                        value={pageContent.benefits.companies.join('\n')}
                        onChange={(e) => {
                          const newBenefits = {...pageContent.benefits};
                          newBenefits.companies = e.target.value.split('\n').filter(line => line.trim());
                          setPageContent({...pageContent, benefits: newBenefits});
                        }}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] text-sm"
                        placeholder="Enter benefits for companies, one per line"
                      />
                    </div>
                    
                    {/* University Benefits */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">For Ross/COE (one per line)</label>
                      <textarea
                        value={pageContent.benefits.university.join('\n')}
                        onChange={(e) => {
                          const newBenefits = {...pageContent.benefits};
                          newBenefits.university = e.target.value.split('\n').filter(line => line.trim());
                          setPageContent({...pageContent, benefits: newBenefits});
                        }}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] text-sm"
                        placeholder="Enter benefits for Ross/COE, one per line"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="border-b border-gray-200 pb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Call-to-Action Section</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CTA Title</label>
                    <input
                      type="text"
                      value={pageContent.ctaTitle}
                      onChange={(e) => setPageContent({...pageContent, ctaTitle: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CTA Subtitle</label>
                    <textarea
                      value={pageContent.ctaSubtitle}
                      onChange={(e) => setPageContent({...pageContent, ctaSubtitle: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    />
                  </div>
                </div>
              </div>

              {/* Publishing */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={pageContent.published}
                  onChange={(e) => setPageContent({...pageContent, published: e.target.checked})}
                  className="h-4 w-4 text-[#00274c] focus:ring-[#00274c] border-gray-300 rounded"
                />
                <label htmlFor="published" className="text-sm font-medium text-gray-700">
                  Page Published
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Company Form Component
function InternshipCompanyForm({ company, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logoUrl: '',
    website: '',
    industry: '',
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
          const draftKey = company ? `internshipCompanyForm_draft_edit_${company.id}` : 'internshipCompanyForm_draft_new';
          localStorage.setItem(draftKey, JSON.stringify(formData));
          console.log('✓ Internship company form autosaved:', formData.name, company ? '(editing)' : '(new)');
        } catch (error) {
          console.error('Error autosaving internship company form:', error);
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
        location: company.location || '',
        contactEmail: company.contactEmail || '',
        active: company.active ?? true
      });
      
      // Check for editing draft (modifications to existing company)
      const editDraftKey = `internshipCompanyForm_draft_edit_${company.id}`;
      const editDraft = localStorage.getItem(editDraftKey);
      if (editDraft) {
        try {
          const parsedDraft = JSON.parse(editDraft);
          setFormData(parsedDraft);
          console.log('✓ Internship company editing draft loaded:', parsedDraft.name);
        } catch (error) {
          console.error('Error loading internship company editing draft:', error);
          localStorage.removeItem(editDraftKey);
        }
      }
    } else {
      // Load draft for new companies
      const draftKey = 'internshipCompanyForm_draft_new';
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft);
          setFormData(parsedDraft);
          console.log('✓ Internship company form draft loaded:', parsedDraft.name);
        } catch (error) {
          console.error('Error loading internship company form draft:', error);
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
        ? `/api/admin/internships/companies?id=${company.id}` 
        : '/api/admin/internships/companies';
      
      const method = company ? 'PUT' : 'POST';
      const data = company ? { ...formData, id: company.id } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        // Clear the draft on successful save
        const draftKey = company ? `internshipCompanyForm_draft_edit_${company.id}` : 'internshipCompanyForm_draft_new';
        localStorage.removeItem(draftKey);
        console.log('✓ Internship company form saved successfully, draft cleared');
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
            placeholder="Brief description of the company"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="admin-save-btn bg-[#00274c] text-white px-4 py-2 rounded-lg hover:bg-[#003366] disabled:opacity-50 admin-white-text"
          >
            {saving ? 'Saving...' : 'Save Company'}
                  </button>
                </div>
      </form>
              </div>
  );
}

// Project Form Component
function InternshipProjectForm({ project, companies, availableForms, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    companyId: '',
    linkedForm: '',
    status: 'OPEN',
    duration: '',
    location: '',
    type: '',
    skills: '',
    requirements: '',
    applicationDeadline: '',
    active: true
  });
  const [saving, setSaving] = useState(false);

  // Autosave functionality - works for both new and editing
  useEffect(() => {
    const autoSaveData = () => {
      if (formData.title.trim()) {
        try {
          const draftKey = project ? `internshipProjectForm_draft_edit_${project.id}` : 'internshipProjectForm_draft_new';
          localStorage.setItem(draftKey, JSON.stringify(formData));
          console.log('✓ Internship project form autosaved:', formData.title, project ? '(editing)' : '(new)');
        } catch (error) {
          console.error('Error autosaving internship project form:', error);
        }
      }
    };

    const timeoutId = setTimeout(autoSaveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData, project]);

  // Load draft on mount or set project data - works for both new and editing
  useEffect(() => {
    if (project) {
      // For editing, first set the project data, then check for editing draft
      setFormData({
        title: project.title || '',
        description: project.description || '',
        companyId: project.companyId || '',
        linkedForm: project.linkedForm || '',
        status: project.status || 'OPEN',
        duration: project.duration || '',
        location: project.location || '',
        type: project.type || '',
        skills: project.skills || '',
        requirements: project.requirements || '',
        applicationDeadline: project.applicationDeadline ? project.applicationDeadline.split('T')[0] : '',
        active: project.active ?? true
      });
      
      // Check for editing draft (modifications to existing project)
      const editDraftKey = `internshipProjectForm_draft_edit_${project.id}`;
      const editDraft = localStorage.getItem(editDraftKey);
      if (editDraft) {
        try {
          const parsedDraft = JSON.parse(editDraft);
          setFormData(parsedDraft);
          console.log('✓ Internship project editing draft loaded:', parsedDraft.title);
        } catch (error) {
          console.error('Error loading internship project editing draft:', error);
          localStorage.removeItem(editDraftKey);
        }
      }
    } else {
      // Load draft for new projects
      const draftKey = 'internshipProjectForm_draft_new';
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft);
          setFormData(parsedDraft);
          console.log('✓ Internship project form draft loaded:', parsedDraft.title);
        } catch (error) {
          console.error('Error loading internship project form draft:', error);
          localStorage.removeItem(draftKey);
        }
      }
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = project 
        ? `/api/admin/internships/projects?id=${project.id}` 
        : '/api/admin/internships/projects';
      
      const method = project ? 'PUT' : 'POST';
      const data = project ? { ...formData, id: project.id } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        // Clear the draft on successful save
        const draftKey = project ? `internshipProjectForm_draft_edit_${project.id}` : 'internshipProjectForm_draft_new';
        localStorage.removeItem(draftKey);
        console.log('✓ Internship project form saved successfully, draft cleared');
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
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company *</label>
            <select
              value={formData.companyId}
              onChange={(e) => setFormData({...formData, companyId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              required
            >
              <option value="">Select Company</option>
              {companies.map((company: any) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
            >
              <option value="OPEN">Open</option>
              <option value="FILLED">Filled</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="e.g., 12 weeks"
            />
        </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="e.g., Remote, San Francisco"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Linked Application Form</label>
          <select
            value={formData.linkedForm}
            onChange={(e) => setFormData({...formData, linkedForm: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
          >
            <option value="">No form linked</option>
            {availableForms.map((form: any) => (
              <option key={form.id} value={form.id}>{form.title}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Link a form created in the Forms section to collect applications for this project
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills (JSON array)</label>
          <input
            type="text"
            value={formData.skills}
            onChange={(e) => setFormData({...formData, skills: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
            placeholder='["Python", "Machine Learning", "React"]'
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="admin-save-btn bg-[#00274c] text-white px-4 py-2 rounded-lg hover:bg-[#003366] disabled:opacity-50 admin-white-text"
          >
            {saving ? 'Saving...' : 'Save Project'}
          </button>
        </div>
      </form>
    </div>
  );
} 