'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { CogIcon } from '@heroicons/react/24/outline';

export default function SettingsAdmin() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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

  // Load settings
  useEffect(() => {
    if (session?.user) {
      loadSettings();
    }
  }, [session]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data && !data.error) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => prev.map((setting: any) => 
      setting.key === key ? { ...setting, value } : setting
    ));
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });

      if (res.ok) {
        setMessage('Settings saved successfully!');
        loadSettings();
      } else {
        setMessage('Error saving settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings');
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Site Settings</h1>
          <p className="text-gray-600 mt-1">Manage global site configuration</p>
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

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CogIcon className="w-5 h-5" />
          Configuration Settings
        </h3>
        
        <div className="space-y-6">
          {settings.map((setting: any) => (
            <div key={setting.key} className="border-b border-gray-200 pb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {setting.key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </label>
                  {setting.description && (
                    <p className="text-xs text-gray-500 mt-1">{setting.description}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 uppercase">{setting.type}</span>
              </div>
              
              {setting.type === 'BOOLEAN' ? (
                <select
                  value={setting.value}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              ) : setting.type === 'NUMBER' ? (
                <input
                  type="number"
                  value={setting.value}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                />
              ) : setting.type === 'JSON' ? (
                <textarea
                  value={setting.value}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] font-mono text-sm"
                  placeholder="Enter valid JSON"
                />
              ) : (
                <input
                  type={setting.type === 'IMAGE' ? 'url' : 'text'}
                  value={setting.value}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                  placeholder={setting.type === 'IMAGE' ? 'https://example.com/image.jpg' : 'Enter value'}
                />
              )}
            </div>
          ))}

          {settings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No settings configured yet.
            </div>
          )}

          <button
            onClick={saveChanges}
            disabled={saving}
            className="w-full bg-[#00274c] text-white px-6 py-3 rounded-lg hover:bg-[#003366] disabled:opacity-50 disabled:cursor-not-allowed admin-white-text"
          >
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </div>
    </div>
  );
} 