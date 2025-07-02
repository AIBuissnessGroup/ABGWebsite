'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { PencilIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function AboutAdmin() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [content, setContent] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    mainTitle: '',
    description1: '',
    description2: '',
    primaryButtonText: '',
    primaryButtonLink: '',
    secondaryButtonText: '',
    secondaryButtonLink: '',
    membersCount: '',
    projectsCount: '',
    partnersCount: '',
    missionCount: '',
    value1Title: '',
    value1Desc: '',
    value1Icon: '',
    value2Title: '',
    value2Desc: '',
    value2Icon: '',
    value3Title: '',
    value3Desc: '',
    value3Icon: ''
  });

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

  // Load content
  useEffect(() => {
    if (session?.user) {
      loadContent();
    }
  }, [session]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/about');
      const data = await res.json();
      if (data && !data.error) {
        setContent(data);
        setFormData(data);
      }
    } catch (error) {
      console.error('Error loading about content:', error);
      setMessage('Error loading content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await res.json();
      if (res.ok) {
        setContent(result);
        setFormData(result);
        setMessage('About content saved successfully!');
      } else {
        setMessage(result.error || 'Error saving content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      setMessage('Error saving content');
    } finally {
      setSaving(false);
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">About Section</h1>
          <p className="text-gray-600 mt-1">Manage the about section content</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Content Preview */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <EyeIcon className="w-5 h-5" />
            Current About Section
          </h3>
          <div className="bg-gradient-to-br from-[#00274c] to-[#1a2c45] text-white p-6 rounded-lg space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">{content?.title || 'WHO WE ARE'}</h2>
              <p className="text-[#BBBBBB] text-sm">{content?.subtitle || 'Loading...'}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">{content?.mainTitle || 'BUILDING THE FUTURE'}</h3>
              <p className="text-[#BBBBBB] text-sm mb-2">{content?.description1 || ''}</p>
              <p className="text-[#BBBBBB] text-sm">{content?.description2 || ''}</p>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <div className="font-bold">{content?.membersCount || '25+'}</div>
                <div className="text-[#BBBBBB]">Members</div>
              </div>
              <div>
                <div className="font-bold">{content?.projectsCount || '12'}</div>
                <div className="text-[#BBBBBB]">Projects</div>
              </div>
              <div>
                <div className="font-bold">{content?.partnersCount || '3'}</div>
                <div className="text-[#BBBBBB]">Partners</div>
              </div>
              <div>
                <div className="font-bold">{content?.missionCount || '1'}</div>
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
              <h4 className="font-medium mb-3">Foundation Values</h4>
              
              <div className="space-y-4">
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
    </div>
  );
} 