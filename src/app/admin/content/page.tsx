'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

import CSVUploader from '@/components/admin/CSVUploader';
import { toast } from 'react-toastify';
import MetadataSettings from '@/components/admin/MetadataSettings';

export default function UnifiedContentManagement() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Content states
  const [heroContent, setHeroContent] = useState({ title: '', subtitle: '', description: '' });
  const [aboutContent, setAboutContent] = useState({ title: '', subtitle: '', description: '' });
  const [joinContent, setJoinContent] = useState({ title: '', subtitle: '', description: '', options: [{ title: '', description: '', buttonText: '', buttonLink: '' }] });
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);

  // Persistent form states - these survive tab switches
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showSubeventForm, setShowSubeventForm] = useState<any>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<any>(null);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);

  // Persistent Forms state - simplified to match other sections
  const [formsActiveView, setFormsActiveView] = useState<'list' | 'create'>('list');
  const [formsEditingForm, setFormsEditingForm] = useState<any>(null);

  // Restore form states based on active tab
  useEffect(() => {
    if (!activeTab || loading || saving) return;
    
    try {
      const stateKey = `contentAdmin_${activeTab}_formState`;
      const savedState = localStorage.getItem(stateKey);
      
      if (savedState) {
        const state = JSON.parse(savedState);
        console.log('🔄 Restoring content form state for', activeTab, ':', state);
        
        switch (activeTab) {
          case 'team':
            if (state.showForm) {
              setShowTeamForm(true);
              if (state.editingId && teamMembers.length > 0) {
                const member = teamMembers.find(m => m.id === state.editingId);
                if (member) {
                  setEditingTeamMember(member);
                  console.log('✓ Team editing member restored:', member.name);
                }
              } else if (!state.editingId) {
                console.log('✓ Team new form restored');
              }
            }
            break;
          case 'projects':
            if (state.showForm) {
              setShowProjectForm(true);
              if (state.editingId && projects.length > 0) {
                const project = projects.find(p => p.id === state.editingId);
                if (project) {
                  setEditingProject(project);
                  console.log('✓ Project editing form restored:', project.title);
                }
              } else if (!state.editingId) {
                console.log('✓ Project new form restored');
              }
            }
            break;
          case 'events':
            if (state.showForm) {
              setShowEventForm(true);
              if (state.editingId && events.length > 0) {
                const event = events.find(e => e.id === state.editingId);
                if (event) {
                  setEditingEvent(event);
                  console.log('✓ Event editing form restored:', event.title);
                }
              } else if (state.subeventParentId && events.length > 0) {
                const parentEvent = events.find(e => e.id === state.subeventParentId);
                if (parentEvent) {
                  setShowSubeventForm(parentEvent);
                  console.log('✓ Event subevent form restored for parent:', parentEvent.title);
                }
              } else if (!state.editingId && !state.subeventParentId) {
                console.log('✓ Event new form restored');
              }
            }
            break;
          case 'companies':
            if (state.showForm) {
              setShowCompanyForm(true);
              if (state.editingId && companies.length > 0) {
                const company = companies.find(c => c.id === state.editingId);
                if (company) {
                  setEditingCompany(company);
                  console.log('✓ Company editing form restored:', company.name);
                }
              } else if (!state.editingId) {
                console.log('✓ Company new form restored');
              }
            }
            break;
        }
      }
    } catch (error) {
      console.error('Error restoring form state for', activeTab, error);
    }
  }, [activeTab, teamMembers, projects, events, companies, loading, saving]);

  // Save form states whenever they change
  useEffect(() => {
    if (loading || saving) return;
    
    try {
      // Save team form state
      const teamState = {
        showForm: showTeamForm,
        editingId: editingTeamMember?.id || null
      };
      if (showTeamForm || editingTeamMember) {
        localStorage.setItem('contentAdmin_team_formState', JSON.stringify(teamState));
      } else {
        localStorage.removeItem('contentAdmin_team_formState');
      }

      // Save project form state
      const projectState = {
        showForm: showProjectForm,
        editingId: editingProject?.id || null
      };
      if (showProjectForm || editingProject) {
        localStorage.setItem('contentAdmin_projects_formState', JSON.stringify(projectState));
      } else {
        localStorage.removeItem('contentAdmin_projects_formState');
      }

      // Save event form state
      const eventState = {
        showForm: showEventForm,
        editingId: editingEvent?.id || null
      };
      if (showEventForm || editingEvent) {
        localStorage.setItem('contentAdmin_events_formState', JSON.stringify(eventState));
      } else {
        localStorage.removeItem('contentAdmin_events_formState');
      }

      // Save company form state
      const companyState = {
        showForm: showCompanyForm,
        editingId: editingCompany?.id || null
      };
      if (showCompanyForm || editingCompany) {
        localStorage.setItem('contentAdmin_companies_formState', JSON.stringify(companyState));
      } else {
        localStorage.removeItem('contentAdmin_companies_formState');
      }
    } catch (error) {
      console.error('Error saving form states:', error);
    }
  }, [showTeamForm, editingTeamMember, showProjectForm, editingProject, showEventForm, editingEvent, showCompanyForm, editingCompany, loading, saving]);

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
    }
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      redirect('/auth/unauthorized');
    }
  }, [session, status]);

  // Load all content
  useEffect(() => {
    if (session?.user) {
      loadAllContent();
    }
  }, [session]);

  const loadAllContent = async () => {
    setLoading(true);
    try {
      const [heroRes, aboutRes, joinRes, teamRes, projectsRes, eventsRes, companiesRes, settingsRes, formsRes] = await Promise.all([
        fetch('/api/admin/hero'),
        fetch('/api/admin/about'),
        fetch('/api/admin/join'),
        fetch('/api/admin/team'),
        fetch('/api/admin/projects'),
        fetch('/api/admin/events'),
        fetch('/api/admin/companies'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/forms')
      ]);

      const [heroData, aboutData, joinData, teamData, projectsData, eventsData, companiesData, settingsData, formsData] = await Promise.all([
        heroRes.json(),
        aboutRes.json(),
        joinRes.json(),
        teamRes.json(),
        projectsRes.json(),
        eventsRes.json(),
        companiesRes.json(),
        settingsRes.json(),
        formsRes.json()
      ]);

      if (heroData && !heroData.error) setHeroContent(heroData);
      if (aboutData && !aboutData.error) setAboutContent(aboutData);
      if (joinData && !joinData.error) setJoinContent(joinData);
      if (teamData && !teamData.error) setTeamMembers(teamData);
      if (projectsData && !projectsData.error) setProjects(projectsData);
      if (eventsData && !eventsData.error) setEvents(eventsData);
      if (companiesData && !companiesData.error) setCompanies(companiesData);
      if (settingsData && !settingsData.error) setSettings(settingsData);
      if (formsData && !formsData.error) setForms(formsData);
    } catch (error) {
      console.error('Error loading content:', error);
      setMessage('Error loading content');
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async (endpoint, data) => {
    setSaving(true);
    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await res.json();
      if (res.ok) {
        setMessage('Content saved successfully!');
        return result;
      } else {
        setMessage(result.error || 'Error saving content');
        return null;
      }
    } catch (error) {
      console.error('Error saving content:', error);
      setMessage('Error saving content');
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Helper function to check if a tab has an open form
  const hasOpenForm = (tabId: string) => {
    switch (tabId) {
      case 'team': return showTeamForm || editingTeamMember;
      case 'projects': return showProjectForm || editingProject;
      case 'events': return showEventForm || editingEvent;
      case 'companies': return showCompanyForm || editingCompany;
      case 'forms': return formsActiveView === 'create' || formsEditingForm;
      default: return false;
    }
  };

  const tabs = [
    { id: 'hero', name: 'Hero Section', icon: '🏠' },
    { id: 'about', name: 'About Section', icon: '📋' },
    { id: 'join', name: 'Join Section', icon: '🤝' },
    { id: 'team', name: 'Team Members', icon: '👥' },
    { id: 'projects', name: 'Projects', icon: '🚀' },
    { id: 'events', name: 'Events', icon: '📅' },
    { id: 'companies', name: 'Companies', icon: '🏢' },
    { id: 'forms', name: 'Forms & Applications', icon: '📝' },
    { id: 'settings', name: 'Site Settings', icon: '⚙️' }
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00274c]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Content Management</h1>

      {/* Add CSV Uploaders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <CSVUploader
          title="Import Team Members"
          description="Bulk import team members from a CSV file. Download the template to see the required format."
          endpoint="/api/admin/team/import"
          templateFields={[
            'name',
            'role',
            'year',
            'major',
            'bio',
            'email',
            'linkedIn',
            'github',
            'imageUrl',
            'featured',
            'active'
          ]}
          requiredFields={['name', 'role', 'year']}
          examples={{
            'name': 'John Doe',
            'role': 'Technical Lead',
            'year': 'Senior',
            'major': 'Computer Science',
            'bio': 'Expert in AI and machine learning',
            'email': 'johndoe@umich.edu',
            'linkedIn': 'https://linkedin.com/in/johndoe',
            'github': 'https://github.com/johndoe',
            'imageUrl': 'https://example.com/photo.jpg',
            'featured': 'true',
            'active': 'true'
          }}
          specialInstructions={{
            'featured': 'Use true or false',
            'active': 'Use true or false',
            'email': 'Must be a valid email address',
            'year': 'Freshman, Sophomore, Junior, Senior, or Graduate'
          }}
          onSuccess={() => {
            toast.success('Team members imported successfully');
            loadAllContent();
          }}
        />

        <CSVUploader
          title="Import Events"
          description="Bulk import events from a CSV file. Download the template to see the required format."
          endpoint="/api/admin/events/import"
          templateFields={[
            'title',
            'description',
            'eventDate',
            'endDate',
            'location',
            'venue',
            'capacity',
            'registrationUrl',
            'eventType',
            'imageUrl',
            'featured',
            'published'
          ]}
          requiredFields={['title', 'description', 'eventDate', 'location', 'eventType']}
          examples={{
            'title': 'AI Workshop Spring 2024',
            'description': 'Learn about machine learning applications',
            'eventDate': '2024-03-15T14:00:00',
            'endDate': '2024-03-15T16:00:00',
            'location': 'Ann Arbor',
            'venue': 'Ross School of Business',
            'capacity': '50',
            'registrationUrl': 'https://register.com/workshop',
            'eventType': 'WORKSHOP',
            'imageUrl': 'https://example.com/event.jpg',
            'featured': 'true',
            'published': 'true'
          }}
          specialInstructions={{
            'eventType': 'Must be one of: WORKSHOP, SYMPOSIUM, NETWORKING, CONFERENCE, MEETING, SOCIAL, RECRUITMENT',
            'eventDate': 'Use format: YYYY-MM-DDTHH:mm:ss',
            'endDate': 'Use format: YYYY-MM-DDTHH:mm:ss',
            'capacity': 'Must be a number',
            'featured': 'Use true or false',
            'published': 'Use true or false'
          }}
          onSuccess={() => {
            toast.success('Events imported successfully');
            loadAllContent();
          }}
        />
      </div>

      {message && (
        <div className={`p-3 md:p-4 rounded-lg ${
          message.includes('successfully') 
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div>
        <nav className="flex space-x-1 md:space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg font-medium whitespace-nowrap relative text-sm md:text-base transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#00274c] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-sm md:text-base">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.name}</span>
              <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
              {hasOpenForm(tab.id) && (
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse absolute -top-1 -right-1" 
                      title="Form is open - you can switch tabs safely" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Sections */}
      {activeTab === 'hero' && (
        <HeroContentSection 
          content={heroContent} 
          onSave={(data) => saveContent('/api/admin/hero', data)}
          saving={saving}
        />
      )}

      {activeTab === 'about' && (
        <AboutContentSection 
          content={aboutContent} 
          onSave={(data) => saveContent('/api/admin/about', data)}
          saving={saving}
        />
      )}

      {activeTab === 'join' && (
        <JoinContentSection 
          content={joinContent} 
          onSave={(data) => saveContent('/api/admin/join', data)}
          saving={saving}
        />
      )}

      {activeTab === 'team' && (
        <TeamMembersSection 
          members={teamMembers} 
          onReload={loadAllContent}
          showForm={showTeamForm}
          setShowForm={setShowTeamForm}
          editingMember={editingTeamMember}
          setEditingMember={setEditingTeamMember}
        />
      )}

      {activeTab === 'projects' && (
        <ProjectsSection 
          projects={projects} 
          onReload={loadAllContent}
          showForm={showProjectForm}
          setShowForm={setShowProjectForm}
          editingProject={editingProject}
          setEditingProject={setEditingProject}
        />
      )}

      {activeTab === 'events' && (
        <EventsSection 
          events={events} 
          onReload={loadAllContent}
          showForm={showEventForm}
          setShowForm={setShowEventForm}
          editingEvent={editingEvent}
          setEditingEvent={setEditingEvent}
          showSubeventForm={showSubeventForm}
          setShowSubeventForm={setShowSubeventForm}
        />
      )}

      {activeTab === 'companies' && (
        <CompaniesSection 
          companies={companies} 
          onReload={loadAllContent}
          showForm={showCompanyForm}
          setShowForm={setShowCompanyForm}
          editingCompany={editingCompany}
          setEditingCompany={setEditingCompany}
        />
      )}

      {activeTab === 'forms' && (
        <FormsSection 
          forms={forms} 
          onReload={loadAllContent}
          showForm={formsActiveView === 'create'}
          setShowForm={(show) => setFormsActiveView(show ? 'create' : 'list')}
          editingForm={formsEditingForm}
          setEditingForm={setFormsEditingForm}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsSection 
          settings={settings} 
          onReload={loadAllContent}
        />
      )}
    </div>
  );
}

// Hero Content Section Component
function HeroContentSection({ content, onSave, saving }) {
  const [formData, setFormData] = useState({
    mainTitle: '',
    subTitle: '',
    thirdTitle: '',
    description: '',
    primaryButtonText: '',
    primaryButtonLink: '',
    secondaryButtonText: '',
    secondaryButtonLink: ''
  });

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleSave = async () => {
    const result = await onSave(formData);
    if (result) {
      setFormData(result);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Current Content Preview */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <EyeIcon className="w-5 h-5" />
          Current Hero Section
        </h3>
        <div className="bg-gradient-to-br from-[#00274c] to-[#1a2c45] text-white p-8 rounded-lg">
          <h1 className="text-3xl font-bold mb-2">
            <div>{content?.mainTitle || 'Loading...'}</div>
            <div className="text-[#BBBBBB]">{content?.subTitle || ''}</div>
            <div>{content?.thirdTitle || ''}</div>
          </h1>
          <p className="text-[#BBBBBB] mb-6">{content?.description || ''}</p>
          <div className="flex gap-4">
            <button className="bg-white text-[#00274c] px-4 py-2 rounded-lg">
              {content?.primaryButtonText || 'Button 1'}
            </button>
            <button className="border border-white text-white px-4 py-2 rounded-lg">
              {content?.secondaryButtonText || 'Button 2'}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <PencilIcon className="w-5 h-5" />
          Edit Hero Content
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Main Title</label>
            <input
              type="text"
              value={formData.mainTitle}
              onChange={(e) => setFormData({...formData, mainTitle: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="AI SHAPES"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sub Title</label>
            <input
              type="text"
              value={formData.subTitle}
              onChange={(e) => setFormData({...formData, subTitle: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="TOMORROW."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Third Title</label>
            <input
              type="text"
              value={formData.thirdTitle}
              onChange={(e) => setFormData({...formData, thirdTitle: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="WE MAKE AI"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="One project at a time..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Button Text</label>
              <input
                type="text"
                value={formData.primaryButtonText}
                onChange={(e) => setFormData({...formData, primaryButtonText: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="See What's Possible"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Button Link</label>
              <input
                type="text"
                value={formData.primaryButtonLink}
                onChange={(e) => setFormData({...formData, primaryButtonLink: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="#join"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Button Text</label>
              <input
                type="text"
                value={formData.secondaryButtonText}
                onChange={(e) => setFormData({...formData, secondaryButtonText: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="Explore Projects"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Button Link</label>
              <input
                type="text"
                value={formData.secondaryButtonLink}
                onChange={(e) => setFormData({...formData, secondaryButtonLink: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="/projects"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#00274c] text-white px-6 py-3 rounded-lg hover:bg-[#003366] disabled:opacity-50 disabled:cursor-not-allowed admin-white-text"
          >
            {saving ? 'Saving...' : 'Save Hero Content'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Join Content Section Component
function JoinContentSection({ content, onSave, saving }: any) {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    option1Title: '',
    option1Description: '',
    option1Benefits: '',
    option1CTA: '',
    option1Link: '',
    option2Title: '',
    option2Description: '',
    option2Benefits: '',
    option2CTA: '',
    option2Link: '',
    option3Title: '',
    option3Description: '',
    option3Benefits: '',
    option3CTA: '',
    contactTitle: '',
    contactEmail1: '',
    contactEmail2: '',
    contactEmail3: ''
  });

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleSave = async () => {
    const result = await onSave(formData);
    if (result) {
      setFormData(result);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Current Content Preview */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <EyeIcon className="w-5 h-5" />
          Current Join Section
        </h3>
        <div className="bg-gradient-to-br from-[#1a2c45] to-[#00274c] text-white p-6 rounded-lg space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{content?.title || 'Loading...'}</h2>
            <p className="text-[#BBBBBB] text-sm">{content?.subtitle || ''}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">{content?.option1Title || 'Option 1'}</h3>
              <p className="text-xs text-[#BBBBBB] mb-2">{content?.option1Description || ''}</p>
              <button className="bg-white text-[#00274c] text-xs px-3 py-1 rounded">
                {content?.option1CTA || 'CTA 1'}
              </button>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">{content?.option2Title || 'Option 2'}</h3>
              <p className="text-xs text-[#BBBBBB] mb-2">{content?.option2Description || ''}</p>
              <button className="border border-white text-white text-xs px-3 py-1 rounded">
                {content?.option2CTA || 'CTA 2'}
              </button>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">{content?.option3Title || 'Option 3'}</h3>
              <p className="text-xs text-[#BBBBBB] mb-2">{content?.option3Description || ''}</p>
              <button className="border border-white text-white text-xs px-3 py-1 rounded">
                {content?.option3CTA || 'CTA 3'}
              </button>
            </div>
          </div>

          <div className="text-center">
            <h3 className="font-semibold mb-2">{content?.contactTitle || 'Contact Us'}</h3>
            <div className="text-xs text-[#BBBBBB] space-y-1">
              <div>{content?.contactEmail1 || 'email1@example.com'}</div>
              <div>{content?.contactEmail2 || 'email2@example.com'}</div>
              <div>{content?.contactEmail3 || 'email3@example.com'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-lg shadow-md p-6 max-h-[600px] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <PencilIcon className="w-5 h-5" />
          Edit Join Content
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Main Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="JOIN THE FUTURE"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
            <textarea
              value={formData.subtitle}
              onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="Ready to shape tomorrow's business landscape?"
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Option 1 - Membership</h4>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.option1Title}
                onChange={(e) => setFormData({...formData, option1Title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="BECOME A MEMBER"
              />
              <input
                type="text"
                value={formData.option1CTA}
                onChange={(e) => setFormData({...formData, option1CTA: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="Apply Now"
              />
            </div>
            <textarea
              value={formData.option1Description}
              onChange={(e) => setFormData({...formData, option1Description: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] mt-2"
              placeholder="Join our core team and work on cutting-edge AI projects..."
            />
            <input
              type="url"
              value={formData.option1Link}
              onChange={(e) => setFormData({...formData, option1Link: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] mt-2"
              placeholder="Link URL (e.g., #)"
            />
            <textarea
              value={formData.option1Benefits}
              onChange={(e) => setFormData({...formData, option1Benefits: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] mt-2"
              placeholder="Benefits (one per line)&#10;Direct project involvement&#10;Mentorship opportunities&#10;Industry networking&#10;Skill development"
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Option 2 - Partnership</h4>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.option2Title}
                onChange={(e) => setFormData({...formData, option2Title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="PARTNER WITH US"
              />
              <input
                type="text"
                value={formData.option2CTA}
                onChange={(e) => setFormData({...formData, option2CTA: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="Explore Partnership"
              />
            </div>
            <textarea
              value={formData.option2Description}
              onChange={(e) => setFormData({...formData, option2Description: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] mt-2"
              placeholder="Collaborate on research, sponsor events, or provide mentorship..."
            />
            <input
              type="url"
              value={formData.option2Link}
              onChange={(e) => setFormData({...formData, option2Link: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] mt-2"
                                    placeholder="Link URL (e.g., mailto:ABGPartnerships@umich.edu)"
            />
            <textarea
              value={formData.option2Benefits}
              onChange={(e) => setFormData({...formData, option2Benefits: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] mt-2"
              placeholder="Benefits (one per line)&#10;Strategic partnerships&#10;Talent pipeline access&#10;Innovation collaboration&#10;Brand visibility"
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Option 3 - Stay Connected</h4>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.option3Title}
                onChange={(e) => setFormData({...formData, option3Title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="STAY CONNECTED"
              />
              <input
                type="text"
                value={formData.option3CTA}
                onChange={(e) => setFormData({...formData, option3CTA: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="Subscribe"
              />
            </div>
            <textarea
              value={formData.option3Description}
              onChange={(e) => setFormData({...formData, option3Description: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] mt-2"
              placeholder="Get updates on our latest projects, events, and opportunities..."
            />
            <textarea
              value={formData.option3Benefits}
              onChange={(e) => setFormData({...formData, option3Benefits: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] mt-2"
              placeholder="Benefits (one per line)&#10;Weekly insights&#10;Event invitations&#10;Project showcases&#10;Industry updates"
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Contact Information</h4>
            <input
              type="text"
              value={formData.contactTitle}
              onChange={(e) => setFormData({...formData, contactTitle: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] mb-2"
              placeholder="Contact Section Title"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="email"
                value={formData.contactEmail1}
                onChange={(e) => setFormData({...formData, contactEmail1: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="General Email"
              />
              <input
                type="email"
                value={formData.contactEmail2}
                onChange={(e) => setFormData({...formData, contactEmail2: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="Partnerships Email"
              />
              <input
                type="email"
                value={formData.contactEmail3}
                onChange={(e) => setFormData({...formData, contactEmail3: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="Recruitment Email"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#00274c] text-white px-6 py-3 rounded-lg hover:bg-[#003366] disabled:opacity-50 disabled:cursor-not-allowed admin-white-text"
          >
            {saving ? 'Saving...' : 'Save Join Content'}
          </button>
        </div>
      </div>
    </div>
  );
}

// About Content Section Component
function AboutContentSection({ content, onSave, saving }) {
  const [formData, setFormData] = useState({
    title: '', subtitle: '', mainTitle: '', description1: '', description2: '',
    primaryButtonText: '', primaryButtonLink: '', secondaryButtonText: '', secondaryButtonLink: '',
    membersCount: '', projectsCount: '', partnersCount: '', missionCount: '',
    value1Title: '', value1Desc: '', value1Icon: '',
    value2Title: '', value2Desc: '', value2Icon: '',
    value3Title: '', value3Desc: '', value3Icon: '',
    // Carousel fields
    collaborationDisplayMode: 'carousel',
    collaborationTitle: 'Innovation Through Collaboration',
    collaborationSubtitle: 'Building the future together',
    carouselSlides: '',
    teamImage: ''
  });

  const [parsedSlides, setParsedSlides] = useState([]);

  useEffect(() => {
    if (content) {
      setFormData(content);
      // Parse carousel slides
      try {
        const slides = content.carouselSlides ? JSON.parse(content.carouselSlides) : [];
        setParsedSlides(slides);
      } catch {
        setParsedSlides([]);
      }
    }
  }, [content]);

  const addSlide = () => {
    const newSlide = {
      title: 'New Slide',
      description: 'Slide description',
      icon: '🌟',
      duration: 30
    };
    const updated = [...parsedSlides, newSlide];
    setParsedSlides(updated);
    setFormData({...formData, carouselSlides: JSON.stringify(updated)});
  };

  const removeSlide = (index) => {
    const updated = parsedSlides.filter((_, i) => i !== index);
    setParsedSlides(updated);
    setFormData({...formData, carouselSlides: JSON.stringify(updated)});
  };

  const updateSlide = (index, field, value) => {
    const updated = [...parsedSlides];
    updated[index] = { ...updated[index], [field]: value };
    setParsedSlides(updated);
    setFormData({...formData, carouselSlides: JSON.stringify(updated)});
  };

  const handleSave = async () => {
    const result = await onSave(formData);
    if (result) {
      setFormData(result);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Current Content Preview */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <EyeIcon className="w-5 h-5" />
          Current About Section
        </h3>
        <div className="bg-gradient-to-br from-[#1a2c45] to-[#00274c] text-white p-6 rounded-lg space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{content?.title || 'Loading...'}</h2>
            <p className="text-[#BBBBBB] text-sm">{content?.subtitle || ''}</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">{content?.mainTitle || ''}</h3>
            <p className="text-[#BBBBBB] text-sm mb-2">{content?.description1 || ''}</p>
            <p className="text-[#BBBBBB] text-sm">{content?.description2 || ''}</p>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <div className="font-bold">{content?.membersCount || '0'}</div>
              <div className="text-[#BBBBBB]">Members</div>
            </div>
            <div>
              <div className="font-bold">{content?.projectsCount || '0'}</div>
              <div className="text-[#BBBBBB]">Projects</div>
            </div>
            <div>
              <div className="font-bold">{content?.partnersCount || '0'}</div>
              <div className="text-[#BBBBBB]">Partners</div>
            </div>
            <div>
              <div className="font-bold">{content?.missionCount || '0'}</div>
              <div className="text-[#BBBBBB]">Mission</div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-lg shadow-md p-6 max-h-[600px] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <PencilIcon className="w-5 h-5" />
          Edit About Content
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Main Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="WHO WE ARE"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
            <textarea
              value={formData.subtitle}
              onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="We're not just another student organization..."
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Members</label>
              <input
                type="text"
                value={formData.membersCount}
                onChange={(e) => setFormData({...formData, membersCount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="25+"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Projects</label>
              <input
                type="text"
                value={formData.projectsCount}
                onChange={(e) => setFormData({...formData, projectsCount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="12"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Partners</label>
              <input
                type="text"
                value={formData.partnersCount}
                onChange={(e) => setFormData({...formData, partnersCount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mission</label>
              <input
                type="text"
                value={formData.missionCount}
                onChange={(e) => setFormData({...formData, missionCount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="1"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Foundation Values (OUR FOUNDATION section)</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Value 1</label>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={formData.value1Icon}
                    onChange={(e) => setFormData({...formData, value1Icon: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    placeholder="🧠"
                  />
                  <input
                    type="text"
                    value={formData.value1Title}
                    onChange={(e) => setFormData({...formData, value1Title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    placeholder="AI-DRIVEN"
                  />
                  <textarea
                    value={formData.value1Desc}
                    onChange={(e) => setFormData({...formData, value1Desc: e.target.value})}
                    rows={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] col-span-2"
                    placeholder="We leverage cutting-edge artificial intelligence..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Value 2</label>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={formData.value2Icon}
                    onChange={(e) => setFormData({...formData, value2Icon: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    placeholder="🚀"
                  />
                  <input
                    type="text"
                    value={formData.value2Title}
                    onChange={(e) => setFormData({...formData, value2Title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    placeholder="IMPACT-FOCUSED"
                  />
                  <textarea
                    value={formData.value2Desc}
                    onChange={(e) => setFormData({...formData, value2Desc: e.target.value})}
                    rows={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] col-span-2"
                    placeholder="Every project we build has measurable business outcomes..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Value 3</label>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={formData.value3Icon}
                    onChange={(e) => setFormData({...formData, value3Icon: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    placeholder="⚡"
                  />
                  <input
                    type="text"
                    value={formData.value3Title}
                    onChange={(e) => setFormData({...formData, value3Title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    placeholder="FUTURE-READY"
                  />
                  <textarea
                    value={formData.value3Desc}
                    onChange={(e) => setFormData({...formData, value3Desc: e.target.value})}
                    rows={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] col-span-2"
                    placeholder="Preparing the next generation of leaders..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Innovation Through Collaboration</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Mode</label>
                <select
                  value={formData.collaborationDisplayMode}
                  onChange={(e) => setFormData({...formData, collaborationDisplayMode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                >
                  <option value="carousel">Carousel</option>
                  <option value="image">Team Image</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose "Carousel" for animated slides or "Team Image" to display a photo
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.collaborationTitle}
                  onChange={(e) => setFormData({...formData, collaborationTitle: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                <textarea
                  value={formData.collaborationSubtitle}
                  onChange={(e) => setFormData({...formData, collaborationSubtitle: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                />
              </div>
              {formData.collaborationDisplayMode === 'carousel' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Carousel Slides</label>
                    <button
                      type="button"
                      onClick={addSlide}
                      className="bg-[#00274c] text-white px-3 py-1 rounded text-sm hover:bg-[#003366] admin-white-text"
                    >
                      + Add Slide
                    </button>
                  </div>
                  
                  {parsedSlides.map((slide, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md mb-3 border">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-sm">Slide {index + 1}</h5>
                        <button
                          type="button"
                          onClick={() => removeSlide(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          ✕ Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Icon</label>
                          <input
                            type="text"
                            value={slide.icon}
                            onChange={(e) => updateSlide(index, 'icon', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            placeholder="🚀"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Duration (seconds)</label>
                          <input
                            type="number"
                            value={slide.duration}
                            onChange={(e) => updateSlide(index, 'duration', parseInt(e.target.value))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            min="10"
                            max="120"
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          value={slide.title}
                          onChange={(e) => updateSlide(index, 'title', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="Slide title"
                        />
                      </div>
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={slide.description}
                          onChange={(e) => updateSlide(index, 'description', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          rows={2}
                          placeholder="Slide description"
                        />
                      </div>
                    </div>
                  ))}
                  
                  {parsedSlides.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm border-2 border-dashed border-gray-300 rounded">
                      No slides yet. Click "Add Slide" to get started.
                    </div>
                  )}
                </div>
              )}
              {formData.collaborationDisplayMode === 'image' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team Image URL</label>
                  <input
                    type="url"
                    value={formData.teamImage}
                    onChange={(e) => setFormData({...formData, teamImage: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    placeholder="https://example.com/team-photo.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL to your team photo. Will be displayed with an overlay.
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#00274c] text-white px-6 py-3 rounded-lg hover:bg-[#003366] disabled:opacity-50 disabled:cursor-not-allowed admin-white-text"
          >
            {saving ? 'Saving...' : 'Save About Content'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Team Members Section Component
function TeamMembersSection({ members, onReload, showForm, setShowForm, editingMember, setEditingMember }) {

  const deleteMember = async (id) => {
    if (confirm('Are you sure you want to delete this team member?')) {
      try {
        const res = await fetch(`/api/admin/team?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          onReload();
        }
      } catch (error) {
        console.error('Error deleting team member:', error);
      }
    }
  };

  const handleAddNew = () => {
    setEditingMember(null);
    setShowForm(true);
    // Save form state to localStorage
    localStorage.setItem('contentAdmin_team_formState', JSON.stringify({
      showForm: true,
      editingId: null
    }));
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setShowForm(true);
    // Save form state to localStorage
    localStorage.setItem('contentAdmin_team_formState', JSON.stringify({
      showForm: true,
      editingId: member.id
    }));
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMember(null);
    // Clear form state from localStorage
    localStorage.removeItem('contentAdmin_team_formState');
  };

  const handleSaveForm = () => {
    onReload();
    setShowForm(false);
    setEditingMember(null);
    // Clear form state from localStorage
    localStorage.removeItem('contentAdmin_team_formState');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h3 className="text-base md:text-lg font-semibold">Team Members ({members.length})</h3>
        {!showForm && (
          <button
            onClick={handleAddNew}
            className="bg-[#00274c] text-white px-3 md:px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[#003366] text-sm md:text-base transition-colors admin-white-text"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>
        )}
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
          <TeamMemberForm 
            member={editingMember}
            onClose={handleCloseForm}
            onSave={handleSaveForm}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <div key={member.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3 mb-3">
              {member.imageUrl ? (
                <img 
                  src={member.imageUrl} 
                  alt={member.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-[#00274c] rounded-full flex items-center justify-center text-white font-bold">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
              )}
              <div>
                <h4 className="font-semibold">{member.name}</h4>
                <p className="text-sm text-gray-600">{member.role}</p>
                <p className="text-xs text-gray-500">{member.year} • {member.major}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-3">{member.bio || 'No bio available'}</p>
            
            <div className="flex justify-between items-center mb-3">
              <span className={`px-2 py-1 rounded text-xs ${member.featured ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {member.featured ? 'Featured' : 'Regular'}
              </span>
              
              <div className="flex gap-1">
                {member.linkedIn && (
                  <a 
                    href={member.linkedIn} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    LinkedIn
                  </a>
                )}
                {member.github && (
                  <a 
                    href={member.github} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-800 text-xs ml-2"
                  >
                    GitHub
                  </a>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleEdit(member)}
                className="text-blue-600 hover:text-blue-800 p-1"
                title="Edit team member"
                disabled={showForm}
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteMember(member.id)}
                className="text-red-600 hover:text-red-800 p-1"
                title="Delete team member"
                disabled={showForm}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        
        {members.length === 0 && !showForm && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <h4 className="text-lg font-medium mb-2">No team members yet</h4>
            <p>Add your first team member to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Projects Section Component
function ProjectsSection({ projects, onReload, showForm, setShowForm, editingProject, setEditingProject }) {

  const deleteProject = async (id) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        const res = await fetch(`/api/admin/projects?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          onReload();
        }
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleAddNew = () => {
    setEditingProject(null);
    setShowForm(true);
    // Save form state to localStorage
    localStorage.setItem('contentAdmin_projects_formState', JSON.stringify({
      showForm: true,
      editingId: null
    }));
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setShowForm(true);
    // Save form state to localStorage
    localStorage.setItem('contentAdmin_projects_formState', JSON.stringify({
      showForm: true,
      editingId: project.id
    }));
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProject(null);
    // Clear form state from localStorage
    localStorage.removeItem('contentAdmin_projects_formState');
  };

  const handleSaveForm = () => {
    onReload();
    setShowForm(false);
    setEditingProject(null);
    // Clear form state from localStorage
    localStorage.removeItem('contentAdmin_projects_formState');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h3 className="text-base md:text-lg font-semibold">Projects ({projects.length})</h3>
        {!showForm && (
          <button
            onClick={handleAddNew}
            className="bg-[#00274c] text-white px-3 md:px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[#003366] text-sm md:text-base transition-colors admin-white-text"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Project</span>
          </button>
        )}
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
          <ProjectForm 
            project={editingProject}
            onClose={handleCloseForm}
            onSave={handleSaveForm}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-semibold text-lg">{project.title}</h4>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEdit(project)}
                  className="text-blue-600 hover:text-blue-800"
                  disabled={showForm}
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteProject(project.id)}
                  className="text-red-600 hover:text-red-800"
                  disabled={showForm}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4 line-clamp-3">{project.description}</p>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Progress:</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#00274c] h-2 rounded-full" 
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className={`px-3 py-1 rounded-full text-sm ${
                project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                project.status === 'PLANNING' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {project.status}
              </span>
              <span className="text-sm text-gray-500">
                {project.budget || 'No budget set'}
              </span>
            </div>
            
            {project.featured && (
              <div className="mt-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                  Featured
                </span>
              </div>
            )}
          </div>
        ))}
        
        {projects.length === 0 && !showForm && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <h4 className="text-lg font-medium mb-2">No projects yet</h4>
            <p>Add your first project to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Events Section Component
function EventsSection({ events, onReload, showForm, setShowForm, editingEvent, setEditingEvent, showSubeventForm, setShowSubeventForm }: any) {

  const deleteEvent = async (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        const res = await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          onReload();
        }
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleAddNew = () => {
    setEditingEvent(null);
    setShowSubeventForm(null);
    setShowForm(true);
    // Save form state to localStorage
    localStorage.setItem('contentAdmin_events_formState', JSON.stringify({
      showForm: true,
      editingId: null,
      subeventParentId: null
    }));
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setShowSubeventForm(null);
    setShowForm(true);
    // Save form state to localStorage
    localStorage.setItem('contentAdmin_events_formState', JSON.stringify({
      showForm: true,
      editingId: event.id,
      subeventParentId: null
    }));
  };

  const handleAddSubevent = (parentEvent) => {
    setEditingEvent(null);
    setShowSubeventForm(parentEvent);
    setShowForm(true);
    // Save form state to localStorage
    localStorage.setItem('contentAdmin_events_formState', JSON.stringify({
      showForm: true,
      editingId: null,
      subeventParentId: parentEvent.id
    }));
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEvent(null);
    setShowSubeventForm(null);
    // Clear form state from localStorage
    localStorage.removeItem('contentAdmin_events_formState');
  };

  const handleSaveForm = () => {
    onReload();
    setShowForm(false);
    setEditingEvent(null);
    setShowSubeventForm(null);
    // Clear form state from localStorage
    localStorage.removeItem('contentAdmin_events_formState');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h3 className="text-base md:text-lg font-semibold">Events ({events.length})</h3>
        {!showForm && (
          <button
            onClick={handleAddNew}
            className="bg-[#00274c] text-white px-3 md:px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[#003366] text-sm md:text-base transition-colors admin-white-text"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        )}
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
          <EventForm 
            event={editingEvent}
            parentEvent={showSubeventForm}
            onClose={handleCloseForm}
            onSave={handleSaveForm}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {events.map((event: any) => (
          <div key={event.id} className="bg-white rounded-lg shadow-md border-2 border-gray-200">
            {/* Main Event */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-lg">{event.title}</h4>
                    {event.subevents && event.subevents.length > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {event.subevents.length} subevents
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mt-1">
                    {new Date(event.eventDate).toLocaleDateString()} • {event.location}
                  </p>
                  {event.featured && (
                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full mt-2">
                      Featured
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAddSubevent(event)}
                    className="text-green-600 hover:text-green-800 text-xs bg-green-50 px-2 py-1 rounded"
                    title="Add Subevent"
                    disabled={showForm}
                  >
                    + Subevent
                  </button>
                  <button 
                    onClick={() => handleEdit(event)}
                    className="text-blue-600 hover:text-blue-800"
                    disabled={showForm}
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deleteEvent(event.id)}
                    className="text-red-600 hover:text-red-800"
                    disabled={showForm}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-600 mb-3 line-clamp-2">{event.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>📅</span>
                  <span>{new Date(event.eventDate).toLocaleDateString()} at {new Date(event.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>📍</span>
                  <span>{event.location}</span>
                </div>
                {event.venue && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>🏢</span>
                    <span>{event.venue}</span>
                  </div>
                )}
                {event.capacity && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>👥</span>
                    <span>Capacity: {event.capacity}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  event.eventType === 'SYMPOSIUM' ? 'bg-purple-100 text-purple-800' : 
                  event.eventType === 'WORKSHOP' ? 'bg-green-100 text-green-800' :
                  event.eventType === 'NETWORKING' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {event.eventType}
                </span>
                
                {event.registrationUrl && (
                  <a 
                    href={event.registrationUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#00274c] hover:underline text-sm"
                  >
                    Register →
                  </a>
                )}
              </div>
            </div>

            {/* Subevents */}
            {event.subevents && event.subevents.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50">
                <div className="p-4">
                  <h5 className="font-medium text-sm text-gray-700 mb-3">Subevents</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {event.subevents.map((subevent: any) => (
                      <div key={subevent.id} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h6 className="font-medium text-sm">{subevent.title}</h6>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(subevent.eventDate).toLocaleDateString()} • {subevent.location}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleEdit(subevent)}
                              className="text-blue-600 hover:text-blue-800"
                              disabled={showForm}
                            >
                              <PencilIcon className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => deleteEvent(subevent.id)}
                              className="text-red-600 hover:text-red-800"
                              disabled={showForm}
                            >
                              <TrashIcon className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">{subevent.description}</p>
                        <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                          <span>{subevent.eventType}</span>
                          <span>{subevent.capacity ? `${subevent.capacity} capacity` : 'No limit'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {events.length === 0 && !showForm && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <h4 className="text-lg font-medium mb-2">No events yet</h4>
            <p>Add your first event to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Project Form Component (Inline with Autosave)
function ProjectForm({ project, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    status: project?.status || 'PLANNING',
    startDate: project?.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
    endDate: project?.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
    budget: project?.budget || '',
    progress: project?.progress || 0,
    objectives: project?.objectives || '',
    outcomes: project?.outcomes || '',
    technologies: project?.technologies || '',
    links: project?.links || '',
    imageUrl: project?.imageUrl || '',
    featured: project?.featured || false
  });

  const [companies, setCompanies] = useState<any[]>([]);
  const [partnerships, setPartnerships] = useState<any[]>([]);
  const [lastSaved, setLastSaved] = useState<string>('');

  // Autosave functionality - works for both new and editing
  useEffect(() => {
    const autoSaveData = () => {
      if (formData.title.trim()) {
        try {
          const draftKey = project ? `projectForm_draft_edit_${project.id}` : 'projectForm_draft_new';
          localStorage.setItem(draftKey, JSON.stringify({
            formData,
            partnerships
          }));
          const now = new Date().toLocaleTimeString();
          setLastSaved(now);
          console.log('✓ Project form autosaved at', now, ':', formData.title, project ? '(editing)' : '(new)');
        } catch (error) {
          console.error('❌ Error autosaving project form:', error);
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
  }, [project]);

  const addPartnership = () => {
    setPartnerships([...partnerships, {
      companyId: '',
      type: 'COLLABORATOR',
      description: ''
    }]);
  };

  const removePartnership = (index: number) => {
    setPartnerships(partnerships.filter((_, i) => i !== index));
  };

  const updatePartnership = (index: number, field: string, value: string) => {
    const updated = [...partnerships];
    updated[index] = { ...updated[index], [field]: value };
    setPartnerships(updated);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    const endpoint = '/api/admin/projects';
    const method = project ? 'PUT' : 'POST';
    const data = project ? { ...formData, id: project.id } : formData;

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        const savedProject = await res.json();
        
        // Save partnerships
        if (partnerships.length > 0) {
          await fetch('/api/admin/partnerships/project', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId: savedProject.id,
              partnerships: partnerships.filter(p => p.companyId) // Only save partnerships with companies selected
            })
          });
        }
        
        // Clear draft on successful save
        const draftKey = project ? `projectForm_draft_edit_${project.id}` : 'projectForm_draft_new';
        localStorage.removeItem(draftKey);
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Error saving project:', error);
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
            {lastSaved ? `✓ Saved at ${lastSaved}` : '⏰ Auto-saving...'}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Progress (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({...formData, progress: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
            <input
              type="text"
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
              placeholder="$10,000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Objectives</label>
            <textarea
              value={formData.objectives}
              onChange={(e) => setFormData({...formData, objectives: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="Enter project objectives (one per line)&#10;Develop NLP model for sentiment analysis&#10;Create real-time data pipeline&#10;Build interactive dashboard"
            />
            <p className="text-xs text-gray-500 mt-1">List project objectives, one per line</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Outcomes (for completed projects)</label>
            <textarea
              value={formData.outcomes}
              onChange={(e) => setFormData({...formData, outcomes: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="Enter project outcomes (one per line)&#10;32% increase in conversion rates&#10;25% reduction in marketing costs&#10;Deployed to 3 partner companies"
            />
            <p className="text-xs text-gray-500 mt-1">List project outcomes/achievements, one per line</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Technologies</label>
            <input
              type="text"
              value={formData.technologies}
              onChange={(e) => setFormData({...formData, technologies: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="Python, TensorFlow, React, AWS, PostgreSQL"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated list of technologies used</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Links</label>
            <input
              type="url"
              value={formData.links}
              onChange={(e) => setFormData({...formData, links: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="https://github.com/project-repo"
            />
            <p className="text-xs text-gray-500 mt-1">Link to project repository, demo, or documentation</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Background Image URL</label>
            <input
              type="url"
              value={formData.imageUrl || ''}
              onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="https://example.com/project-background.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">URL to the project's background image</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="featured"
              checked={formData.featured}
              onChange={(e) => setFormData({...formData, featured: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="featured" className="text-sm font-medium text-gray-700">
              Featured project (shown prominently)
            </label>
          </div>

          {/* Partnerships Section */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-gray-700">Company Partnerships</h4>
              <button
                type="button"
                onClick={addPartnership}
                className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-md"
              >
                + Add Partnership
              </button>
            </div>
            
            {partnerships.map((partnership, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-md mb-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                    <select
                      value={partnership.companyId}
                      onChange={(e) => updatePartnership(index, 'companyId', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
                    >
                      <option value="">Select Company</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Partnership Type</label>
                    <select
                      value={partnership.type}
                      onChange={(e) => updatePartnership(index, 'type', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
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
                      className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                
                <div className="mt-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={partnership.description}
                    onChange={(e) => updatePartnership(index, 'description', e.target.value)}
                    placeholder="Describe the partnership..."
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
                  />
                </div>
              </div>
            ))}
            
            {partnerships.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No partnerships added. Click "Add Partnership" to get started.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#00274c] text-white rounded-lg hover:bg-[#003366] admin-white-text"
            >
              {project ? 'Update' : 'Add'} Project
            </button>
          </div>
        </form>
    </div>
  );
}

// Team Member Form Component
function TeamMemberForm({ member, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: member?.name || '',
    role: member?.role || '',
    year: member?.year || '',
    major: member?.major || '',
    bio: member?.bio || '',
    email: member?.email || '',
    linkedIn: member?.linkedIn || '',
    github: member?.github || '',
    imageUrl: member?.imageUrl || '',
    featured: member?.featured || false
  });

  // Autosave functionality - works for both new and editing
  useEffect(() => {
    const autoSaveData = () => {
      if (formData.name.trim()) {
        try {
          const draftKey = member ? `teamForm_draft_edit_${member.id}` : 'teamForm_draft_new';
          localStorage.setItem(draftKey, JSON.stringify(formData));
          console.log('✓ Team form autosaved:', formData.name, member ? '(editing)' : '(new)');
        } catch (error) {
          console.error('Error autosaving team form:', error);
        }
      }
    };

    const timeoutId = setTimeout(autoSaveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData, member]);

  // Load member data on mount, then check for drafts
  useEffect(() => {
    if (member) {
      // Set member data first
      setFormData({
        name: member.name || '',
        role: member.role || '',
        year: member.year || '',
        major: member.major || '',
        bio: member.bio || '',
        email: member.email || '',
        linkedIn: member.linkedIn || '',
        github: member.github || '',
        imageUrl: member.imageUrl || '',
        featured: member.featured || false
      });
      
      // Check for editing draft
      const editDraftKey = `teamForm_draft_edit_${member.id}`;
      const editDraft = localStorage.getItem(editDraftKey);
      if (editDraft) {
        try {
          const parsedDraft = JSON.parse(editDraft);
          setFormData(parsedDraft);
          console.log('✓ Team editing draft loaded:', parsedDraft.name);
        } catch (error) {
          console.error('Error loading team editing draft:', error);
          localStorage.removeItem(editDraftKey);
        }
      }
    } else {
      // Load draft for new members
      const draftKey = 'teamForm_draft_new';
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft);
          setFormData(parsedDraft);
          console.log('✓ Team form draft loaded:', parsedDraft.name);
        } catch (error) {
          console.error('Error loading team form draft:', error);
          localStorage.removeItem(draftKey);
        }
      }
    }
  }, [member]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const endpoint = member ? '/api/admin/team' : '/api/admin/team';
    const method = member ? 'PUT' : 'POST';
    const data = member ? { ...formData, id: member.id } : formData;

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        const draftKey = member ? `teamForm_draft_edit_${member.id}` : 'teamForm_draft_new';
        localStorage.removeItem(draftKey);
        console.log('✓ Team form saved successfully, draft cleared');
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Error saving team member:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {member ? 'Edit Team Member' : 'Add Team Member'}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
              <select
                required
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              >
                <option value="">Select Year</option>
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
                <option value="Graduate">Graduate</option>
                <option value="Alumni">Alumni</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Major</label>
              <input
                type="text"
                value={formData.major}
                onChange={(e) => setFormData({...formData, major: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="Brief bio about this team member..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image URL</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="https://example.com/profile-image.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">URL to the team member's profile image</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
              <input
                type="url"
                value={formData.linkedIn}
                onChange={(e) => setFormData({...formData, linkedIn: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
              <input
                type="url"
                value={formData.github}
                onChange={(e) => setFormData({...formData, github: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="https://github.com/..."
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="featured"
              checked={formData.featured}
              onChange={(e) => setFormData({...formData, featured: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="featured" className="text-sm font-medium text-gray-700">
              Featured team member (shown prominently)
            </label>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#00274c] text-white rounded-lg hover:bg-[#003366] admin-white-text"
            >
              {member ? 'Update' : 'Add'} Team Member
            </button>
          </div>
        </form>
    </div>
  );
}

// Event Form Component
function EventForm({ event, onClose, onSave, parentEvent }: any) {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    eventDate: event?.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : '',
    endDate: event?.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
    location: event?.location || parentEvent?.location || '',
    venue: event?.venue || '',
    capacity: event?.capacity || '',
    registrationUrl: event?.registrationUrl || '',
    eventType: event?.eventType || 'MEETING',
    imageUrl: event?.imageUrl || '',
    featured: event?.featured || false,
    parentEventId: event?.parentEventId || parentEvent?.id || null,
    attendanceConfirmEnabled: event?.attendanceConfirmEnabled || false,
    attendancePassword: '' // Never show stored password
  });

  const [companies, setCompanies] = useState<any[]>([]);
  const [partnerships, setPartnerships] = useState<any[]>([]);
  const [lastSaved, setLastSaved] = useState<string>('');

  // Autosave functionality - works for both new and editing
  useEffect(() => {
    const autoSaveData = () => {
      if (formData.title.trim()) {
        try {
          const draftKey = event ? `eventForm_draft_edit_${event.id}` : 'eventForm_draft_new';
          localStorage.setItem(draftKey, JSON.stringify({
            formData,
            partnerships
          }));
          const now = new Date().toLocaleTimeString();
          setLastSaved(now);
          console.log('✓ Event form autosaved at', now, ':', formData.title, event ? '(editing)' : '(new)');
        } catch (error) {
          console.error('❌ Error autosaving event form:', error);
        }
      }
    };

    const timeoutId = setTimeout(autoSaveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData, partnerships, event]);

  // Load companies, existing partnerships, or draft
  useEffect(() => {
    const loadData = async () => {
      try {
        const companiesRes = await fetch('/api/admin/companies');
        if (companiesRes.ok) {
          const companiesData = await companiesRes.json();
          setCompanies(companiesData);
        }

        if (event?.id) {
          const partnershipsRes = await fetch(`/api/admin/partnerships/event/${event.id}`);
          if (partnershipsRes.ok) {
            const partnershipsData = await partnershipsRes.json();
            setPartnerships(partnershipsData);
          }
          
          // Check for editing draft
          const editDraftKey = `eventForm_draft_edit_${event.id}`;
          const editDraft = localStorage.getItem(editDraftKey);
          if (editDraft) {
            try {
              const parsedDraft = JSON.parse(editDraft);
              setFormData(parsedDraft.formData);
              setPartnerships(parsedDraft.partnerships || []);
              console.log('✓ Event editing draft loaded:', parsedDraft.formData.title);
            } catch (error) {
              console.error('Error loading event editing draft:', error);
              localStorage.removeItem(editDraftKey);
            }
          }
        } else {
          // Load draft for new events
          const draftKey = 'eventForm_draft_new';
          const draft = localStorage.getItem(draftKey);
          if (draft) {
            try {
              const parsedDraft = JSON.parse(draft);
              setFormData(parsedDraft.formData);
              setPartnerships(parsedDraft.partnerships || []);
              console.log('✓ Event form draft loaded:', parsedDraft.formData.title);
            } catch (error) {
              console.error('Error loading event form draft:', error);
              localStorage.removeItem(draftKey);
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [event]);

  const addPartnership = () => {
    setPartnerships([...partnerships, {
      companyId: '',
      type: 'SPONSOR',
      description: '',
      sponsorshipLevel: ''
    }]);
  };

  const removePartnership = (index: number) => {
    setPartnerships(partnerships.filter((_, i) => i !== index));
  };

  const updatePartnership = (index: number, field: string, value: string) => {
    const updated = [...partnerships];
    updated[index] = { ...updated[index], [field]: value };
    setPartnerships(updated);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    let endpoint = '/api/admin/events';
    let method = event ? 'PUT' : 'POST';
    
    // If this is a subevent, use the subevent endpoint
    if (parentEvent && !event) {
      endpoint = `/api/admin/events/${parentEvent.id}/subevents`;
      method = 'POST';
    }
    
    const data = event ? { ...formData, id: event.id } : formData;

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        const savedEvent = await res.json();
        
        // Save partnerships
        if (partnerships.length > 0) {
          await fetch('/api/admin/partnerships/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId: savedEvent.id,
              partnerships: partnerships.filter(p => p.companyId) // Only save partnerships with companies selected
            })
          });
        }
        
        // Clear draft on successful save
        const draftKey = event ? `eventForm_draft_edit_${event.id}` : 'eventForm_draft_new';
        localStorage.removeItem(draftKey);
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {event ? 'Edit Event' : parentEvent ? 'Add Subevent' : 'Add Event'}
          {parentEvent && (
            <span className="text-sm font-normal text-gray-600 ml-2">
              for "{parentEvent.title}"
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500 bg-green-50 px-2 py-1 rounded">
            {lastSaved ? `✓ Saved at ${lastSaved}` : '⏰ Auto-saving...'}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.eventDate}
                onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date & Time</label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Michigan Ross School of Business"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({...formData, venue: e.target.value})}
                placeholder="Room 1200"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData({...formData, eventType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              >
                <option value="MEETING">Meeting</option>
                <option value="WORKSHOP">Workshop</option>
                <option value="SYMPOSIUM">Symposium</option>
                <option value="NETWORKING">Networking</option>
                <option value="CONFERENCE">Conference</option>
                <option value="SOCIAL">Social</option>
                <option value="RECRUITMENT">Recruitment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
              <input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || ''})}
                placeholder="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Registration URL</label>
            <input
              type="url"
              value={formData.registrationUrl}
              onChange={(e) => setFormData({...formData, registrationUrl: e.target.value})}
              placeholder="https://umich.edu/events/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Background Image URL</label>
            <input
              type="url"
              value={formData.imageUrl || ''}
              onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="https://example.com/event-background.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">URL to the event's background image</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="featured"
              checked={formData.featured}
              onChange={(e) => setFormData({...formData, featured: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="featured" className="text-sm font-medium text-gray-700">
              Featured event (shown prominently on website)
            </label>
          </div>

          {/* Attendance Confirmation Section */}
          <div className="border-t pt-4">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="attendanceConfirmEnabled"
                checked={formData.attendanceConfirmEnabled}
                onChange={(e) => setFormData({...formData, attendanceConfirmEnabled: e.target.checked})}
                className="mr-3"
              />
              <label htmlFor="attendanceConfirmEnabled" className="text-sm font-medium text-gray-700">
                Enable attendance confirmation for this event
              </label>
            </div>

            {formData.attendanceConfirmEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attendance Password</label>
                <input
                  type="password"
                  value={formData.attendancePassword}
                  onChange={(e) => setFormData({...formData, attendancePassword: e.target.value})}
                  placeholder="Enter password for attendance confirmation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                />
                <p className="text-xs text-gray-500 mt-1">Attendees will need this password to confirm their attendance</p>
              </div>
            )}
          </div>

          {/* Event Partnerships Section */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-gray-700">Event Partnerships</h4>
              <button
                type="button"
                onClick={addPartnership}
                className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-md"
              >
                + Add Partnership
              </button>
            </div>
            
            {partnerships.map((partnership, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-md mb-3">
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                    <select
                      value={partnership.companyId}
                      onChange={(e) => updatePartnership(index, 'companyId', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
                    >
                      <option value="">Select Company</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Partnership Type</label>
                    <select
                      value={partnership.type}
                      onChange={(e) => updatePartnership(index, 'type', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
                    >
                      <option value="SPONSOR">Sponsor</option>
                      <option value="COLLABORATOR">Collaborator</option>
                      <option value="MENTOR">Mentor</option>
                      <option value="ADVISOR">Advisor</option>
                      <option value="VENDOR">Vendor</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sponsorship Level</label>
                    <select
                      value={partnership.sponsorshipLevel}
                      onChange={(e) => updatePartnership(index, 'sponsorshipLevel', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
                    >
                      <option value="">Select Level</option>
                      <option value="Platinum">Platinum</option>
                      <option value="Gold">Gold</option>
                      <option value="Silver">Silver</option>
                      <option value="Bronze">Bronze</option>
                      <option value="Supporting">Supporting</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removePartnership(index)}
                      className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                
                <div className="mt-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={partnership.description}
                    onChange={(e) => updatePartnership(index, 'description', e.target.value)}
                    placeholder="Describe the partnership..."
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-black bg-white"
                  />
                </div>
              </div>
            ))}
            
            {partnerships.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No partnerships added. Click "Add Partnership" to get started.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#00274c] text-white rounded-lg hover:bg-[#003366] admin-white-text"
            >
              {event ? 'Update' : 'Add'} Event
            </button>
          </div>
        </form>
    </div>
  );
} 

// Companies Section Component
// Forms Section Component
function FormsSection({ forms, onReload, showForm, setShowForm, editingForm, setEditingForm }) {

  const deleteForm = async (id) => {
    if (confirm('Are you sure you want to delete this form? This will also delete all applications.')) {
      try {
        const res = await fetch(`/api/admin/forms?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          onReload();
        }
      } catch (error) {
        console.error('Error deleting form:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Forms & Applications ({forms.length})</h3>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#00274c] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#003366]"
        >
          <PlusIcon className="w-4 h-4" />
          Add Form
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {forms.map((form) => (
          <div key={form.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-semibold text-lg">{form.title}</h4>
              <div className="flex gap-2">
                <button 
                  onClick={() => setEditingForm(form)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteForm(form.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4 line-clamp-2">{form.description}</p>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Category:</span>
                <span className="font-medium capitalize">{form.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Questions:</span>
                <span className="font-medium">{form._count?.questions || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Applications:</span>
                <span className="font-medium">{form._count?.applications || 0}</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-3">
              <span className={`px-3 py-1 rounded-full text-sm ${
                form.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {form.isActive ? 'Active' : 'Inactive'}
              </span>
              
              <span className={`px-2 py-1 rounded text-xs ${
                form.isPublic ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {form.isPublic ? 'Public' : 'Private'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <a 
                href={`/forms/${form.slug}`}
                target="_blank"
                className="text-[#00274c] hover:underline text-sm"
              >
                View Form →
              </a>
              
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(`/admin/forms/${form.id}/questions`, '_blank')}
                  className="text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-300 rounded"
                >
                  Questions
                </button>
                <button
                  onClick={() => window.open(`/admin/forms/${form.id}/applications`, '_blank')}
                  className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded"
                >
                  Applications
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {forms.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <h4 className="text-lg font-medium mb-2">No forms yet</h4>
            <p>Add your first form to get started!</p>
          </div>
        )}
      </div>

      {/* Inline Form */}
      {(showForm || editingForm) && (
        <FormEditor 
          form={editingForm}
          onClose={() => {
            setShowForm(false);
            setEditingForm(null);
          }}
          onSave={onReload}
        />
      )}
    </div>
  );
}

// Form Editor Component (Inline with Autosave)
function FormEditor({ form, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    title: form?.title || '',
    description: form?.description || '',
    category: form?.category || 'general',
    isActive: form?.isActive ?? true,
    isPublic: form?.isPublic ?? true,
    allowMultiple: form?.allowMultiple ?? false,
    deadline: form?.deadline ? new Date(form.deadline).toISOString().slice(0, 16) : '',
    maxSubmissions: form?.maxSubmissions?.toString() || '',
    notifyOnSubmission: form?.notifyOnSubmission ?? true,
    notificationEmail: form?.notificationEmail || '',
    requireAuth: form?.requireAuth ?? false,
    backgroundColor: form?.backgroundColor || '#00274c',
    textColor: form?.textColor || '#ffffff'
  });

  // Autosave functionality - works for both new and editing
  useEffect(() => {
    const autoSaveData = () => {
      if (formData.title.trim()) {
        const draftKey = form ? `formEditor_draft_edit_${form.id}` : 'formEditor_draft_new';
        localStorage.setItem(draftKey, JSON.stringify(formData));
        console.log('✓ Form editor autosaved:', formData.title, form ? '(editing)' : '(new)');
      }
    };

    const timeoutId = setTimeout(autoSaveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData, form]);

  // Load draft on mount - works for both new and editing
  useEffect(() => {
    const draftKey = 'formEditor_draft_new';
    if (!form) { // Only load draft for new forms to avoid overriding edit data
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft);
          setFormData(parsedDraft);
          console.log('✓ Form editor draft loaded:', parsedDraft.title);
        } catch (error) {
          console.error('Error loading form editor draft:', error);
          localStorage.removeItem(draftKey);
        }
      }
    }
  }, [form]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    const endpoint = '/api/admin/forms';
    const method = form ? 'PUT' : 'POST';
    const data = form ? { ...formData, id: form.id } : formData;

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        // Clear draft on successful save
        const draftKey = form ? `formEditor_draft_edit_${form.id}` : 'formEditor_draft_new';
        localStorage.removeItem(draftKey);
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Error saving form:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-2 border-[#00274c] mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {form ? 'Edit Form' : 'Add Form'}
        </h3>
        <div className="text-xs text-gray-500 bg-green-50 px-2 py-1 rounded">
          ✓ Auto-saving
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
            placeholder="e.g., Membership Application"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
            placeholder="Brief description of this form..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
            <input
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Submissions</label>
            <input
              type="number"
              value={formData.maxSubmissions}
              onChange={(e) => setFormData({...formData, maxSubmissions: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="Leave empty for no limit"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Email</label>
            <input
              type="email"
              value={formData.notificationEmail}
              onChange={(e) => setFormData({...formData, notificationEmail: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="admin@example.com"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Form is active</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Publicly accessible</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.allowMultiple}
              onChange={(e) => setFormData({...formData, allowMultiple: e.target.checked})}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Allow multiple submissions per email</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.requireAuth}
              onChange={(e) => setFormData({...formData, requireAuth: e.target.checked})}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Require UMich authentication</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.notifyOnSubmission}
              onChange={(e) => setFormData({...formData, notifyOnSubmission: e.target.checked})}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Send email notifications on new submissions</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#00274c] text-white rounded-lg hover:bg-[#003366] admin-white-text"
          >
            {form ? 'Update Form' : 'Create Form'}
          </button>
        </div>
      </form>
    </div>
  );
}

function CompaniesSection({ companies, onReload, showForm, setShowForm, editingCompany, setEditingCompany }: any) {

  const deleteCompany = async (id: string) => {
    if (confirm('Are you sure you want to delete this company?')) {
      try {
        const res = await fetch(`/api/admin/companies?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          onReload();
        }
      } catch (error) {
        console.error('Error deleting company:', error);
      }
    }
  };

  const handleAddNew = () => {
    setEditingCompany(null);
    setShowForm(true);
    // Save form state to localStorage
    localStorage.setItem('contentAdmin_companies_formState', JSON.stringify({
      showForm: true,
      editingId: null
    }));
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setShowForm(true);
    // Save form state to localStorage
    localStorage.setItem('contentAdmin_companies_formState', JSON.stringify({
      showForm: true,
      editingId: company.id
    }));
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCompany(null);
    // Clear form state from localStorage
    localStorage.removeItem('contentAdmin_companies_formState');
  };

  const handleSaveForm = () => {
    onReload();
    setShowForm(false);
    setEditingCompany(null);
    // Clear form state from localStorage
    localStorage.removeItem('contentAdmin_companies_formState');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Companies & Partnerships</h3>
        {!showForm && (
          <button
            onClick={handleAddNew}
            className="bg-[#00274c] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#00274c]/90"
          >
            Add Company
          </button>
        )}
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
          <CompanyForm
            company={editingCompany}
            onClose={handleCloseForm}
            onSave={handleSaveForm}
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
                    alt={company.name}
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <div>
                  <h4 className="font-semibold text-gray-900">{company.name}</h4>
                  <p className="text-sm text-gray-500">{company.industry}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(company)}
                  className="text-[#00274c] hover:text-[#003366] p-1"
                  disabled={showForm}
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteCompany(company.id)}
                  className="text-red-600 hover:text-red-800 p-1"
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
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">{company.size}</span>
                </div>
              )}
              {company.location && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Location:</span>
                  <span>{company.location}</span>
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
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">🏢</div>
          <h3 className="text-lg font-medium mb-2">No companies yet</h3>
          <p className="mb-4">Add companies to manage partnerships with projects and events.</p>
          <button
            onClick={handleAddNew}
            className="bg-[#00274c] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#00274c]/90"
          >
            Add First Company
          </button>
        </div>
      )}
    </div>
  );
}

// Company Form Component (Inline with Autosave)
function CompanyForm({ company, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    logoUrl: '',
    website: '',
    industry: '',
    size: '',
    location: '',
    contactEmail: ''
  });

  // Autosave functionality - works for both new and editing
  useEffect(() => {
    const autoSaveData = () => {
      if (formData.name.trim()) {
        const draftKey = company ? `companyForm_draft_edit_${company.id}` : 'companyForm_draft_new';
        localStorage.setItem(draftKey, JSON.stringify(formData));
        console.log('✓ Company form autosaved:', formData.name, company ? '(editing)' : '(new)');
      }
    };

    const timeoutId = setTimeout(autoSaveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData, company]);

  // Load draft on mount or set company data - works for both new and editing
  useEffect(() => {
    if (company) {
      setFormData(company);
      
      // Check for editing draft
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

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    try {
      const method = formData.id ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/companies', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const draftKey = company ? `companyForm_draft_edit_${company.id}` : 'companyForm_draft_new';
        localStorage.removeItem(draftKey);
        console.log('✓ Company form saved successfully, draft cleared');
        onSave();
      } else {
        const error = await res.json();
        alert(error.error || 'Error saving company');
      }
    } catch (error) {
      console.error('Error saving company:', error);
      alert('Error saving company');
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <input
              type="text"
              value={formData.industry}
              onChange={(e) => setFormData({...formData, industry: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL
              </label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white"
                placeholder="https://company.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Size
              </label>
              <select
                value={formData.size}
                onChange={(e) => setFormData({...formData, size: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white"
              >
                <option value="">Select size</option>
                <option value="Startup">Startup (1-50)</option>
                <option value="Small">Small (51-200)</option>
                <option value="Medium">Medium (201-1000)</option>
                <option value="Large">Large (1001-5000)</option>
                <option value="Enterprise">Enterprise (5000+)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white"
                placeholder="City, State/Country"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white"
              placeholder="partnerships@company.com"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#00274c] text-white px-4 py-2 rounded-md hover:bg-[#003366] admin-white-text"
            >
              {company ? 'Update Company' : 'Add Company'}
            </button>
          </div>
        </form>
    </div>
  );
} 

// Settings Section Component
function OtherSettings({ settings, onReload }: any) {
  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalSettings(settings.filter(s => 
      !['site_title', 'site_description', 'site_favicon', 'site_keywords', 'site_author', 'site_theme_color'].includes(s.key)
    ));
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setLocalSettings(prev => 
      prev.map(setting => 
        setting.key === key ? { ...setting, value } : setting
      )
    );
    setHasChanges(true);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      // Find changed settings
      const changedSettings = localSettings.filter(
        local => settings.find(s => s.key === local.key)?.value !== local.value
      );

      // Save all changed settings
      await Promise.all(
        changedSettings.map(setting =>
          fetch('/api/admin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: setting.key, value: setting.value })
          })
        )
      );

      toast.success('Settings saved successfully!');
      onReload();
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Other Settings</h3>
          <p className="text-sm text-gray-600">Manage additional site configuration</p>
        </div>
        <button
          onClick={saveChanges}
          disabled={!hasChanges || saving}
          className={`px-4 py-2 rounded-md text-white ${
            hasChanges
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed'
          } transition-colors`}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {localSettings.map((setting) => (
          <div key={setting.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900 capitalize">
                  {setting.key.replace(/_/g, ' ')}
                </h4>
                {setting.description && (
                  <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {setting.key === 'countdown_display_mode' ? (
                <select
                  value={setting.value}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="next_event">Next Event (any upcoming event)</option>
                  <option value="next_featured">Next Featured Event (only featured events)</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={setting.value}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={`Enter ${setting.key.replace(/_/g, ' ')}`}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Maintenance Settings Component
function MaintenanceSettings({ settings, onReload }: any) {
  const [localSettings, setLocalSettings] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const maintenanceSettings = settings.filter((s: any) => 
      ['maintenance_mode', 'maintenance_message', 'maintenance_exempt_paths'].includes(s.key)
    );
    
    const settingsObj = maintenanceSettings.reduce((acc: any, setting: any) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {
      maintenance_mode: 'false',
      maintenance_message: '',
      maintenance_exempt_paths: '/admin,/api/admin,/auth'
    });
    
    setLocalSettings(settingsObj);
  }, [settings]);

  const handleSave = async (key: string, value: string) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });

      if (response.ok) {
        setLocalSettings((prev: any) => ({ ...prev, [key]: value }));
        toast.success(`${key} updated successfully`);
        await onReload();
      } else {
        toast.error(`Failed to update ${key}`);
      }
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      toast.error(`Error updating ${key}`);
    } finally {
      setSaving(false);
    }
  };

  const maintenanceEnabled = localSettings.maintenance_mode === 'true';

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 text-yellow-600">⚠️</div>
          <h3 className="font-medium text-yellow-800">Maintenance Mode</h3>
        </div>
        <p className="text-sm text-yellow-700">
          When enabled, all users except admins will see a maintenance page instead of the website.
        </p>
      </div>

      {/* Maintenance Mode Toggle */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-medium text-gray-900">Maintenance Mode</h4>
            <p className="text-sm text-gray-600 mt-1">
              Enable to show maintenance page to all non-admin users
            </p>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => handleSave('maintenance_mode', maintenanceEnabled ? 'false' : 'true')}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00274c] focus:ring-offset-2 ${
                maintenanceEnabled ? 'bg-[#00274c]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`${
                  maintenanceEnabled ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition`}
              />
            </button>
            <span className={`ml-3 text-sm font-medium ${maintenanceEnabled ? 'text-[#00274c]' : 'text-gray-600'}`}>
              {maintenanceEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      {/* Maintenance Message */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Maintenance Message</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Message (optional)
            </label>
            <textarea
              value={localSettings.maintenance_message || ''}
              onChange={(e) => setLocalSettings((prev: any) => ({ ...prev, maintenance_message: e.target.value }))}
              placeholder="Enter a custom maintenance message (leave blank for default)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] focus:border-[#00274c]"
            />
          </div>
          <button
            onClick={() => handleSave('maintenance_message', localSettings.maintenance_message || '')}
            disabled={saving}
            className="px-4 py-2 bg-[#00274c] text-white rounded-lg hover:bg-[#003366] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Message'}
          </button>
        </div>
      </div>

      {/* Exempt Paths */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Exempt Paths</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paths that should remain accessible during maintenance
            </label>
            <input
              type="text"
              value={localSettings.maintenance_exempt_paths || ''}
              onChange={(e) => setLocalSettings((prev: any) => ({ ...prev, maintenance_exempt_paths: e.target.value }))}
              placeholder="/admin,/api/admin,/auth"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] focus:border-[#00274c]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Comma-separated paths (e.g., /admin,/api/admin,/auth)
            </p>
          </div>
          <button
            onClick={() => handleSave('maintenance_exempt_paths', localSettings.maintenance_exempt_paths || '/admin,/api/admin,/auth')}
            disabled={saving}
            className="px-4 py-2 bg-[#00274c] text-white rounded-lg hover:bg-[#003366] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Exempt Paths'}
          </button>
        </div>
      </div>

      {/* Current Status */}
      {maintenanceEnabled && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 text-orange-600">🚧</div>
            <h3 className="font-medium text-orange-800">Maintenance Mode is Currently Active</h3>
          </div>
          <p className="text-sm text-orange-700 mt-2">
            Non-admin users are seeing the maintenance page. Remember to disable maintenance mode when ready.
          </p>
        </div>
      )}
    </div>
  );
}

// Settings Section Component
function SettingsSection({ settings, onReload }: any) {
  const [activeSettingsTab, setActiveSettingsTab] = useState('metadata');

  const settingsTabs = [
    { id: 'metadata', name: 'Site Metadata', icon: '🌐' },
    { id: 'maintenance', name: 'Maintenance Mode', icon: '🚧' },
    { id: 'other', name: 'Other Settings', icon: '⚙️' }
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4 pb-4" aria-label="Settings tabs">
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSettingsTab(tab.id)}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeSettingsTab === tab.id
                  ? 'bg-[#00274c] text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {activeSettingsTab === 'metadata' ? (
        <MetadataSettings settings={settings} onReload={onReload} />
      ) : activeSettingsTab === 'maintenance' ? (
        <MaintenanceSettings settings={settings} onReload={onReload} />
      ) : (
        <OtherSettings settings={settings} onReload={onReload} />
      )}
    </div>
  );
}

