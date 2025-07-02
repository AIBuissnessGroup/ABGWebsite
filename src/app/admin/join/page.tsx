'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { PencilIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function JoinAdmin() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [content, setContent] = useState<any>(null);
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
      const res = await fetch('/api/admin/join');
      const data = await res.json();
      if (data && !data.error) {
        setContent(data);
        setFormData(data);
      }
    } catch (error) {
      console.error('Error loading join content:', error);
      setMessage('Error loading content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/join', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await res.json();
      if (res.ok) {
        setContent(result);
        setFormData(result);
        setMessage('Join content saved successfully!');
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Join Section</h1>
          <p className="text-gray-600 mt-1">Manage the join section content and options</p>
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
            Current Join Section
          </h3>
          <div className="bg-gradient-to-br from-[#00274c] to-[#1a2c45] text-white p-6 rounded-lg space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">{content?.title || 'JOIN THE FUTURE'}</h2>
              <p className="text-[#BBBBBB] text-sm">{content?.subtitle || 'Loading...'}</p>
            </div>
            
            <div className="space-y-3">
              <div className="bg-white/10 p-3 rounded">
                <h4 className="font-semibold text-sm mb-1">{content?.option1Title || 'Option 1'}</h4>
                <p className="text-xs text-[#BBBBBB]">{content?.option1Description || ''}</p>
              </div>
              <div className="bg-white/10 p-3 rounded">
                <h4 className="font-semibold text-sm mb-1">{content?.option2Title || 'Option 2'}</h4>
                <p className="text-xs text-[#BBBBBB]">{content?.option2Description || ''}</p>
              </div>
              <div className="bg-white/10 p-3 rounded">
                <h4 className="font-semibold text-sm mb-1">{content?.option3Title || 'Option 3'}</h4>
                <p className="text-xs text-[#BBBBBB]">{content?.option3Description || ''}</p>
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
              <div className="space-y-3">
                <input
                  type="text"
                  value={formData.option1Title}
                  onChange={(e) => setFormData({...formData, option1Title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                  placeholder="Option 1 Title"
                />
                <textarea
                  value={formData.option1Description}
                  onChange={(e) => setFormData({...formData, option1Description: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                  placeholder="Option 1 Description"
                />
                <textarea
                  value={formData.option1Benefits}
                  onChange={(e) => setFormData({...formData, option1Benefits: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                  placeholder="Benefits (one per line)"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.option1CTA}
                    onChange={(e) => setFormData({...formData, option1CTA: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    placeholder="Button Text"
                  />
                  <input
                    type="text"
                    value={formData.option1Link}
                    onChange={(e) => setFormData({...formData, option1Link: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                    placeholder="Button Link"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Contact Information</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  value={formData.contactTitle}
                  onChange={(e) => setFormData({...formData, contactTitle: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                  placeholder="Contact Section Title"
                />
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
    </div>
  );
} 