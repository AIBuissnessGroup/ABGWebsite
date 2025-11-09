import { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { useAdminApi } from '@/hooks/useAdminApi';

interface SiteSetting {
  id?: string;
  key: string;
  value: string;
  description?: string;
}

interface MetadataSettingsProps {
  settings: SiteSetting[];
  onReload: () => void;
}

export default function MetadataSettings({ settings, onReload }: MetadataSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState<SiteSetting[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const { put } = useAdminApi();

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const metadataKeys = [
    'site_title',
    'site_description',
    'site_favicon',
    'site_keywords',
    'site_author',
    'site_theme_color'
  ];

  const metadataSettings = localSettings.filter((s) => metadataKeys.includes(s.key));

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
        changedSettings.map((setting) =>
          put('/api/admin/settings', { key: setting.key, value: setting.value }, { skipErrorToast: true })
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
          <h3 className="text-lg font-medium text-gray-900">Site Metadata</h3>
          <p className="text-sm text-gray-600">
            Manage how your site appears in browsers and search engines
          </p>
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
        {metadataSettings.map((setting) => (
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
              {setting.key === 'site_favicon' ? (
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={setting.value}
                    onChange={(e) => handleChange(setting.key, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="/favicon.ico"
                  />
                  {setting.value && (
                    <Image
                      src={setting.value}
                      alt="Favicon preview"
                      width={32}
                      height={32}
                      className="rounded border border-gray-200"
                      unoptimized
                    />
                  )}
                </div>
              ) : setting.key === 'site_theme_color' ? (
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={setting.value}
                    onChange={(e) => handleChange(setting.key, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="#00274c"
                  />
                  <input
                    type="color"
                    value={setting.value}
                    onChange={(e) => handleChange(setting.key, e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer"
                  />
                </div>
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

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Preview</h4>
          <div className="bg-white p-4 rounded border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              {localSettings.find(s => s.key === 'site_favicon')?.value && (
                <Image
                  src={localSettings.find(s => s.key === 'site_favicon')?.value as string}
                  alt="Tab favicon"
                  width={16}
                  height={16}
                  className="rounded"
                  unoptimized
                />
              )}
              <span className="font-medium">
                {localSettings.find(s => s.key === 'site_title')?.value || 'Site Title'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {localSettings.find(s => s.key === 'site_description')?.value || 'Site description'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
