'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import FormsManager from '@/components/admin/FormsManager';

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
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Unified Site Content Management</h1>
        <p className="text-gray-600">Edit all website content, images, team members, projects, and events from one place</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('successfully') 
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8">
        <nav className="flex space-x-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#00274c] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.name}
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
        />
      )}

      {activeTab === 'projects' && (
        <ProjectsSection 
          projects={projects} 
          onReload={loadAllContent}
        />
      )}

      {activeTab === 'events' && (
        <EventsSection 
          events={events} 
          onReload={loadAllContent}
        />
      )}

      {activeTab === 'companies' && (
        <CompaniesSection 
          companies={companies} 
          onReload={loadAllContent}
        />
      )}

      {activeTab === 'forms' && (
        <FormsManager 
          forms={forms} 
          onReload={loadAllContent}
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
            className="w-full bg-[#00274c] text-white px-6 py-3 rounded-lg hover:bg-[#003366] disabled:opacity-50 disabled:cursor-not-allowed"
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
              placeholder="Link URL (e.g., mailto:partnerships@abg-umich.com)"
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
                placeholder="Careers Email"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#00274c] text-white px-6 py-3 rounded-lg hover:bg-[#003366] disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="bg-[#00274c] text-white px-3 py-1 rounded text-sm hover:bg-[#003366]"
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
            className="w-full bg-[#00274c] text-white px-6 py-3 rounded-lg hover:bg-[#003366] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save About Content'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Team Members Section Component
function TeamMembersSection({ members, onReload }) {
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Team Members ({members.length})</h3>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#00274c] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#003366]"
        >
          <PlusIcon className="w-4 h-4" />
          Add Team Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                onClick={() => setEditingMember(member)}
                className="text-blue-600 hover:text-blue-800 p-1"
                title="Edit team member"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteMember(member.id)}
                className="text-red-600 hover:text-red-800 p-1"
                title="Delete team member"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        
        {members.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <h4 className="text-lg font-medium mb-2">No team members yet</h4>
            <p>Add your first team member to get started!</p>
          </div>
        )}
      </div>

      {showForm && (
        <TeamMemberForm 
          member={null}
          onClose={() => setShowForm(false)}
          onSave={onReload}
        />
      )}

      {editingMember && (
        <TeamMemberForm 
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={onReload}
        />
      )}
    </div>
  );
}

// Projects Section Component  
function ProjectsSection({ projects, onReload }) {
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Projects ({projects.length})</h3>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#00274c] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#003366]"
        >
          <PlusIcon className="w-4 h-4" />
          Add Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-semibold text-lg">{project.title}</h4>
              <div className="flex gap-2">
                <button 
                  onClick={() => setEditingProject(project)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteProject(project.id)}
                  className="text-red-600 hover:text-red-800"
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
        
        {projects.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <h4 className="text-lg font-medium mb-2">No projects yet</h4>
            <p>Add your first project to get started!</p>
          </div>
        )}
      </div>

      {(showForm || editingProject) && (
        <ProjectForm 
          project={editingProject}
          onClose={() => {
            setShowForm(false);
            setEditingProject(null);
          }}
          onSave={onReload}
        />
      )}
    </div>
  );
}

// Events Section Component
function EventsSection({ events, onReload }: any) {
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Events ({events.length})</h3>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#00274c] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#003366]"
        >
          <PlusIcon className="w-4 h-4" />
          Add Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((event: any) => (
          <div key={event.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-semibold text-lg">{event.title}</h4>
              <div className="flex gap-2">
                <button 
                  onClick={() => setEditingEvent(event)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteEvent(event.id)}
                  className="text-red-600 hover:text-red-800"
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
            
            {event.featured && (
              <div className="mt-2">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                  Featured
                </span>
              </div>
            )}
          </div>
        ))}
        
        {events.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <h4 className="text-lg font-medium mb-2">No events yet</h4>
            <p>Add your first event to get started!</p>
          </div>
        )}
      </div>

      {(showForm || editingEvent) && (
        <EventForm 
          event={editingEvent}
          onClose={() => {
            setShowForm(false);
            setEditingEvent(null);
          }}
          onSave={onReload}
        />
      )}
    </div>
  );
}

// Project Form Component
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

  // Load companies and existing partnerships
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
        
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {project ? 'Edit Project' : 'Add Project'}
        </h3>
        
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
                className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md"
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
              className="px-4 py-2 bg-[#00274c] text-white rounded-lg hover:bg-[#003366]"
            >
              {project ? 'Update' : 'Add'} Project
            </button>
          </div>
        </form>
      </div>
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
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Error saving team member:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {member ? 'Edit Team Member' : 'Add Team Member'}
        </h3>
        
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
              className="px-4 py-2 bg-[#00274c] text-white rounded-lg hover:bg-[#003366]"
            >
              {member ? 'Update' : 'Add'} Team Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Event Form Component
function EventForm({ event, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    eventDate: event?.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : '',
    endDate: event?.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
    location: event?.location || '',
    venue: event?.venue || '',
    capacity: event?.capacity || '',
    registrationUrl: event?.registrationUrl || '',
    eventType: event?.eventType || 'MEETING',
    imageUrl: event?.imageUrl || '',
    featured: event?.featured || false
  });

  const [companies, setCompanies] = useState<any[]>([]);
  const [partnerships, setPartnerships] = useState<any[]>([]);

  // Load companies and existing partnerships
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
    
    const endpoint = '/api/admin/events';
    const method = event ? 'PUT' : 'POST';
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
        
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {event ? 'Edit Event' : 'Add Event'}
        </h3>
        
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

          {/* Event Partnerships Section */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-gray-700">Event Partnerships</h4>
              <button
                type="button"
                onClick={addPartnership}
                className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md"
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
              className="px-4 py-2 bg-[#00274c] text-white rounded-lg hover:bg-[#003366]"
            >
              {event ? 'Update' : 'Add'} Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 

// Companies Section Component
function CompaniesSection({ companies, onReload }: any) {
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Companies & Partnerships</h3>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#00274c] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#00274c]/90"
        >
          Add Company
        </button>
      </div>

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
                  onClick={() => setEditingCompany(company)}
                  className="text-[#00274c] hover:text-[#003366] p-1"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteCompany(company.id)}
                  className="text-red-600 hover:text-red-800 p-1"
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

      {companies.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">🏢</div>
          <h3 className="text-lg font-medium mb-2">No companies yet</h3>
          <p className="mb-4">Add companies to manage partnerships with projects and events.</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#00274c] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#00274c]/90"
          >
            Add First Company
          </button>
        </div>
      )}

      {/* Company Form Modal */}
      {(showForm || editingCompany) && (
        <CompanyForm
          company={editingCompany}
          onClose={() => {
            setShowForm(false);
            setEditingCompany(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingCompany(null);
            onReload();
          }}
        />
      )}
    </div>
  );
}

// Company Form Component
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

  useEffect(() => {
    if (company) {
      setFormData(company);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {company ? 'Edit Company' : 'Add Company'}
        </h3>

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
              className="bg-[#00274c] text-white px-4 py-2 rounded-md hover:bg-[#003366]"
            >
              {company ? 'Update Company' : 'Add Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 

// Settings Section Component
function SettingsSection({ settings, onReload }: any) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const updateSetting = async (key: string, value: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });

      if (res.ok) {
        setMessage('Setting updated successfully!');
        onReload();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await res.json();
        setMessage(error.error || 'Error updating setting');
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      setMessage('Error updating setting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Site Settings</h3>
          <p className="text-sm text-gray-600">Manage global site configuration and behavior</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('successfully') 
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {settings.map((setting: any) => (
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Countdown Display Mode
                  </label>
                  <select
                    value={setting.value}
                    onChange={(e) => updateSetting(setting.key, e.target.value)}
                    disabled={saving}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] text-black bg-white"
                  >
                    <option value="next_event">Next Event (any upcoming event)</option>
                    <option value="next_featured">Next Featured Event (only featured events)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Controls which event is shown in the countdown timer on the homepage
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value
                  </label>
                  <input
                    type="text"
                    value={setting.value}
                    onChange={(e) => updateSetting(setting.key, e.target.value)}
                    disabled={saving}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] text-black bg-white"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {settings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">⚙️</div>
          <h3 className="text-lg font-medium mb-2">No settings configured</h3>
          <p>Site settings will appear here when they are added to the database.</p>
        </div>
      )}
    </div>
  );
}

// Forms Section Component
function FormsSection({ forms, onReload }: any) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingForm, setEditingForm] = useState<any>(null);
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [showApplications, setShowApplications] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'edit' | 'applications' | 'questions'>('list');

  const [newForm, setNewForm] = useState({
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

  const [newQuestion, setNewQuestion] = useState({
    title: '',
    description: '',
    type: 'TEXT',
    required: false,
    options: '',
    minLength: '',
    maxLength: '',
    pattern: ''
  });

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
        setShowCreateForm(false);
        setActiveView('list');
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

  const updateForm = async (formData: any) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/forms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          deadline: formData.deadline ? new Date(formData.deadline) : null,
          maxSubmissions: formData.maxSubmissions ? parseInt(formData.maxSubmissions) : null
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

  const addQuestion = async (formId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/forms/${formId}/questions`, {
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
          options: '',
          minLength: '',
          maxLength: '',
          pattern: ''
        });
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

  const loadApplications = async (formId: string) => {
    try {
      const res = await fetch(`/api/admin/applications?formId=${formId}`);
      if (res.ok) {
        const apps = await res.json();
        setApplications(apps);
        setActiveView('applications');
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    }
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
        // Reload applications for the current form
        if (selectedForm) {
          loadApplications(selectedForm.id);
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

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Applications View */}
      {showApplications && selectedForm && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Applications for "{selectedForm.title}"
            </h3>
            <button
              onClick={() => setShowApplications(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back to Forms
            </button>
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
                      className="text-sm border rounded px-2 py-1"
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
                      <span className="font-medium">{response.question.title}:</span>
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
                    className="w-full text-sm border rounded px-3 py-2"
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

      {/* Forms List */}
      {!showApplications && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Forms & Applications</h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-[#00274c] text-white px-4 py-2 rounded-lg hover:bg-[#00274c]/90 transition-colors"
            >
              Create New Form
            </button>
          </div>

          {/* Create Form Modal */}
          {showCreateForm && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Create New Form</h3>
                
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                      <input
                        type="text"
                        value={newForm.title}
                        onChange={(e) => setNewForm({...newForm, title: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Membership Application"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={newForm.category}
                        onChange={(e) => setNewForm({...newForm, category: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={newForm.description}
                      onChange={(e) => setNewForm({...newForm, description: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Deadline (Optional)</label>
                      <input
                        type="datetime-local"
                        value={newForm.deadline}
                        onChange={(e) => setNewForm({...newForm, deadline: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Submissions (Optional)</label>
                      <input
                        type="number"
                        value={newForm.maxSubmissions}
                        onChange={(e) => setNewForm({...newForm, maxSubmissions: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Leave empty for unlimited"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-700">Form Settings</h5>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newForm.isActive}
                          onChange={(e) => setNewForm({...newForm, isActive: e.target.checked})}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Form is active</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newForm.isPublic}
                          onChange={(e) => setNewForm({...newForm, isPublic: e.target.checked})}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Publicly accessible</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newForm.allowMultiple}
                          onChange={(e) => setNewForm({...newForm, allowMultiple: e.target.checked})}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Allow multiple submissions per email</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newForm.requireAuth}
                          onChange={(e) => setNewForm({...newForm, requireAuth: e.target.checked})}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Require UMich Google sign-in</span>
                      </label>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notification Email</label>
                      <input
                        type="email"
                        value={newForm.notificationEmail}
                        onChange={(e) => setNewForm({...newForm, notificationEmail: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="admin@abg-umich.com"
                      />
                      <p className="text-xs text-gray-500 mt-1">Get notified when someone submits this form</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={createForm}
                    disabled={saving || !newForm.title}
                    className="bg-[#00274c] text-white px-6 py-2 rounded-lg hover:bg-[#00274c]/90 transition-colors disabled:opacity-50 font-medium"
                  >
                    {saving ? 'Creating...' : 'Create Form'}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Forms List */}
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
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedForm(form);
                        loadApplications(form.id);
                      }}
                      className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100"
                    >
                      View Applications ({form._count?.applications || 0})
                    </button>
                    
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/forms/${form.slug}`;
                        navigator.clipboard.writeText(url);
                        setMessage('Form URL copied to clipboard!');
                        setTimeout(() => setMessage(''), 3000);
                      }}
                      className="text-sm bg-green-50 text-green-600 px-3 py-1 rounded hover:bg-green-100"
                    >
                      Copy URL
                    </button>
                    
                    <button
                      onClick={() => deleteForm(form.id)}
                      className="text-sm bg-red-50 text-red-600 px-3 py-1 rounded hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Questions List */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Questions ({form.questions?.length || 0})</h4>
                  
                  {form.questions && form.questions.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {form.questions.map((question: any, index: number) => (
                        <div key={question.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                          <span>
                            {index + 1}. {question.title} 
                            <span className="text-gray-500 ml-2">({question.type})</span>
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm mb-4">No questions added yet.</p>
                  )}

                  {/* Add Question */}
                  <div className="border-t pt-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-4">Add New Question</h5>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Question Title *</label>
                          <input
                            type="text"
                            value={newQuestion.title}
                            onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Enter your question"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                          <select
                            value={newQuestion.type}
                            onChange={(e) => setNewQuestion({...newQuestion, type: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          >
                            {questionTypes.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <textarea
                          value={newQuestion.description}
                          onChange={(e) => setNewQuestion({...newQuestion, description: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          rows={2}
                          placeholder="Additional context or instructions for this question"
                        />
                      </div>

                      {(['SELECT', 'RADIO', 'CHECKBOX'].includes(newQuestion.type)) && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Options (one per line)</label>
                          <textarea
                            value={newQuestion.options}
                            onChange={(e) => setNewQuestion({...newQuestion, options: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            rows={3}
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={newQuestion.required}
                            onChange={(e) => setNewQuestion({...newQuestion, required: e.target.checked})}
                            className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <span className="text-gray-700">Required question</span>
                        </label>

                        <button
                          onClick={() => addQuestion(form.id)}
                          disabled={saving || !newQuestion.title}
                          className="bg-[#00274c] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#00274c]/90 transition-colors disabled:opacity-50 font-medium"
                        >
                          {saving ? 'Adding...' : 'Add Question'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {forms.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No forms created yet.</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-[#00274c] text-white px-4 py-2 rounded-lg hover:bg-[#00274c]/90 transition-colors"
                >
                  Create Your First Form
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}