'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { PencilIcon, EyeIcon } from '@heroicons/react/24/outline';
import { isAdmin } from '@/lib/admin';

export default function HeroAdmin() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [content, setContent] = useState<any>(null);
  const [formData, setFormData] = useState({
    mainTitle: '',
    subTitle: '',
    thirdTitle: '',
    description: '',
    primaryButtonText: '',
    primaryButtonLink: '',
    secondaryButtonText: '',
    secondaryButtonLink: '',
    backgroundImage: ''
  });

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
    }
    if (!isAdmin(session?.user)) {
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
      const res = await fetch('/api/admin/hero');
      const data = await res.json();
      if (data && !data.error) {
        setContent(data);
        setFormData(data);
      }
    } catch (error) {
      console.error('Error loading hero content:', error);
      setMessage('Error loading content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await res.json();
      if (res.ok) {
        setContent(result);
        setFormData(result);
        setMessage('Hero content saved successfully!');
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Hero Section</h1>
          <p className="text-gray-600 mt-1">Manage the main hero section content</p>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Background Image URL (Optional)</label>
              <input
                type="url"
                value={formData.backgroundImage}
                onChange={(e) => setFormData({...formData, backgroundImage: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="https://example.com/background.jpg"
              />
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
    </div>
  );
} 