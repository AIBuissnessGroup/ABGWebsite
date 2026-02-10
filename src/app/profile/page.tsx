'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  UserIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    // User profile fields
    major: '',
    school: '',
    graduationYear: '',
    phone: '',
    // Team member fields (if linked)
    bio: '',
    linkedIn: '',
    github: '',
    imageUrl: '',
    projects: [] as string[]
  });

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
      return;
    }
  }, [session, status]);

  // Add profile-page class to body
  useEffect(() => {
    document.body.classList.add('profile-page');
    return () => {
      document.body.classList.remove('profile-page');
    };
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        
        // Populate form with existing data
        setFormData({
          major: data.user?.profile?.major || '',
          school: data.user?.profile?.school || '',
          graduationYear: data.user?.profile?.graduationYear || '',
          phone: data.user?.profile?.phone || '',
          bio: data.teamMember?.bio || '',
          linkedIn: data.teamMember?.linkedIn || '',
          github: data.teamMember?.github || '',
          imageUrl: data.teamMember?.imageUrl || '',
          projects: data.teamMember?.projects || []
        });
      } else {
        toast.error('Failed to load profile');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Load profile data
  useEffect(() => {
    if (session?.user) {
      loadProfile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: any = {
        userProfile: {
          major: formData.major,
          school: formData.school,
          graduationYear: formData.graduationYear,
          phone: formData.phone
        }
      };

      // Include team member updates if linked
      if (profile?.teamMember) {
        updateData.teamMember = {
          bio: formData.bio,
          linkedIn: formData.linkedIn,
          github: formData.github,
          imageUrl: formData.imageUrl,
          projects: formData.projects
        };
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        const updatedProfile = await res.json();
        setProfile(updatedProfile);
        setEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to current profile data
    setFormData({
      major: profile?.user?.profile?.major || '',
      school: profile?.user?.profile?.school || '',
      graduationYear: profile?.user?.profile?.graduationYear || '',
      phone: profile?.user?.profile?.phone || '',
      bio: profile?.teamMember?.bio || '',
      linkedIn: profile?.teamMember?.linkedIn || '',
      github: profile?.teamMember?.github || '',
      imageUrl: profile?.teamMember?.imageUrl || '',
      projects: profile?.teamMember?.projects || []
    });
    setEditing(false);
  };

  const handleProjectToggle = (projectTitle: string) => {
    setFormData(prev => {
      const current = prev.projects || [];
      if (current.includes(projectTitle)) {
        // Remove project
        return { ...prev, projects: current.filter(p => p !== projectTitle) };
      } else {
        // Add project
        return { ...prev, projects: [...current, projectTitle] };
      }
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00274c]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 text-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {formData.imageUrl || session?.user?.image ? (
                <img 
                  src={formData.imageUrl || session?.user?.image || ''} 
                  alt={session?.user?.name || 'User'}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-16 h-16 bg-[#00274c] rounded-full flex items-center justify-center ${formData.imageUrl || session?.user?.image ? 'hidden' : ''}`}>
                <UserIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{session?.user?.name}</h1>
                <p className="text-gray-600">{session?.user?.email}</p>
                {profile?.user?.roles && (
                  <div className="flex gap-2 mt-1">
                    {profile.user.roles.map((role: string) => (
                      <span key={role} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {role}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#00274c] text-white rounded-lg hover:bg-[#003366]"
              >
                <PencilIcon className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckIcon className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Basic User Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School/College</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.school}
                  onChange={(e) => setFormData({...formData, school: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] text-gray-900 bg-white"
                  placeholder="e.g., College of Engineering"
                />
              ) : (
                <p className="text-gray-900">{formData.school || 'Not set'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Major</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.major}
                  onChange={(e) => setFormData({...formData, major: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] text-gray-900 bg-white"
                  placeholder="e.g., Computer Science"
                />
              ) : (
                <p className="text-gray-900">{formData.major || 'Not set'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
              {editing ? (
                <input
                  type="number"
                  value={formData.graduationYear}
                  onChange={(e) => setFormData({...formData, graduationYear: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] text-gray-900 bg-white"
                  placeholder="e.g., 2025"
                />
              ) : (
                <p className="text-gray-900">{formData.graduationYear || 'Not set'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] text-gray-900 bg-white"
                  placeholder="e.g., (123) 456-7890"
                />
              ) : (
                <p className="text-gray-900">{formData.phone || 'Not set'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Team Member Info (if linked) */}
        {profile?.teamMember && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold text-gray-900">Team Profile</h2>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                Linked to Team Member
              </span>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Your account is linked to team member: <strong>{profile.teamMember.name}</strong>
              </p>
              <p className="text-sm text-gray-600">
                Role: <strong>{profile.teamMember.role}</strong>
              </p>
            </div>

            {/* Project Assignment for PROJECT_TEAM_MEMBER users */}
            {profile?.user?.roles?.includes('PROJECT_TEAM_MEMBER') && profile?.availableProjects?.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Projects</label>
                {editing ? (
                  <div className="space-y-2">
                    {profile.availableProjects.map((p: any) => {
                      const isSelected = formData.projects?.includes(p.title);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-200'
                          } border hover:bg-blue-50`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleProjectToggle(p.title)}
                            className="mr-3 h-4 w-4 text-blue-600 rounded"
                          />
                          <span className="text-gray-900">{p.title}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-900 font-medium">
                    {formData.projects?.length > 0 
                      ? formData.projects.join(', ') 
                      : 'No projects assigned'}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Select the projects you're currently working on. These will appear on the Team page.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                {editing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] text-gray-900 bg-white"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-gray-900">{formData.bio || 'Not set'}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                  {editing ? (
                    <input
                      type="url"
                      value={formData.linkedIn}
                      onChange={(e) => setFormData({...formData, linkedIn: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] text-gray-900 bg-white"
                      placeholder="https://linkedin.com/in/..."
                    />
                  ) : (
                    formData.linkedIn ? (
                      <a href={formData.linkedIn} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Profile
                      </a>
                    ) : (
                      <p className="text-gray-900">Not set</p>
                    )
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
                  {editing ? (
                    <input
                      type="url"
                      value={formData.github}
                      onChange={(e) => setFormData({...formData, github: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] text-gray-900 bg-white"
                      placeholder="https://github.com/..."
                    />
                  ) : (
                    formData.github ? (
                      <a href={formData.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Profile
                      </a>
                    ) : (
                      <p className="text-gray-900">Not set</p>
                    )
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image URL</label>
                  {editing ? (
                    <div className="space-y-3">
                      <input
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c] text-gray-900 bg-white"
                        placeholder="https://..."
                      />
                      {formData.imageUrl && (
                        <div className="flex items-center gap-3">
                          <img 
                            src={formData.imageUrl} 
                            alt="Profile preview" 
                            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          <span className="text-sm text-gray-500">Preview</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    formData.imageUrl ? (
                      <div className="flex items-center gap-3">
                        <img 
                          src={formData.imageUrl} 
                          alt="Profile" 
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <a href={formData.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                          View Full Size
                        </a>
                      </div>
                    ) : (
                      <p className="text-gray-900">Not set</p>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Not Linked Message */}
        {!profile?.teamMember && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">Team Profile Not Linked</h3>
            <p className="text-yellow-800">
              Your account is not yet linked to a team member profile. Contact an administrator to link your account 
              if you are a member of the team. Once linked, you'll be able to manage your team profile information here.
            </p>
          </div>
        )}

        {/* Projects Link */}
        {profile?.teamMember && (
          <div className="mt-6">
            <Link 
              href="/profile/projects"
              className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">My Projects</h3>
                  <p className="text-gray-600">
                    View and manage your contributions to ABG projects
                  </p>
                </div>
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
