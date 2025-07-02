'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UserGroupIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Team Member Card Component
function SortableTeamMemberCard({ member, onEdit, onDelete, showForm }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: member.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`bg-white rounded-lg shadow-md p-6 border ${isDragging ? 'border-blue-500 shadow-lg' : 'border-gray-200'}`}
    >
      <div className="flex items-center gap-3 mb-4">
        {/* Drag Handle */}
        <button
          className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors p-1"
          {...attributes}
          {...listeners}
          title="Drag to reorder"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>

        {member.imageUrl ? (
          <img 
            src={member.imageUrl} 
            alt={member.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-[#00274c] rounded-full flex items-center justify-center text-white font-bold">
            {member.name.split(' ').map((n: string) => n[0]).join('')}
          </div>
        )}
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{member.name}</h4>
          <p className="text-sm text-gray-600">{member.role}</p>
          <p className="text-xs text-gray-500">{member.year} • {member.major}</p>
        </div>
      </div>
      
      <p className="text-sm text-gray-700 mb-4 line-clamp-3">{member.bio || 'No bio available'}</p>
      
      <div className="flex justify-between items-center mb-4">
        <span className={`px-2 py-1 rounded text-xs ${
          member.featured ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {member.featured ? 'Featured' : 'Regular'}
        </span>
        
        <div className="flex gap-2">
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
              className="text-gray-600 hover:text-gray-800 text-xs"
            >
              GitHub
            </a>
          )}
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => onEdit(member)}
          className="text-green-600 hover:text-green-900 p-2"
          title="Edit Member"
          disabled={showForm}
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(member.id)}
          className="text-red-600 hover:text-red-900 p-2"
          title="Delete Member"
          disabled={showForm}
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function TeamAdmin() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Restore form state on mount
  useEffect(() => {
    try {
      const savedFormState = localStorage.getItem('teamAdmin_formState');
      if (savedFormState) {
        const { showForm: savedShowForm, editingMemberId } = JSON.parse(savedFormState);
        console.log('🔄 Restoring team form state:', { savedShowForm, editingMemberId, membersLoaded: members.length > 0 });
        if (savedShowForm) {
          setShowForm(true);
          if (editingMemberId) {
            // We'll set the editing member after members are loaded
            const checkForMember = () => {
              if (members.length > 0) {
                const member = members.find(m => m.id === editingMemberId);
                if (member) {
                  setEditingMember(member);
                  console.log('✓ Team editing member restored:', member.name);
                }
              }
            };
            // Check immediately and also set up a timeout
            checkForMember();
            setTimeout(checkForMember, 100);
          } else {
            console.log('✓ Team new form restored');
          }
        }
      }
    } catch (error) {
      console.error('Error restoring form state:', error);
    }
  }, [members]);

  // Save form state whenever it changes
  useEffect(() => {
    try {
      const formState = {
        showForm,
        editingMemberId: editingMember?.id || null
      };
      if (showForm || editingMember) {
        localStorage.setItem('teamAdmin_formState', JSON.stringify(formState));
      } else {
        localStorage.removeItem('teamAdmin_formState');
      }
    } catch (error) {
      console.error('Error saving form state:', error);
    }
  }, [showForm, editingMember]);

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
      return;
    }
    // Let the API handle admin checking - just proceed if logged in
    console.log('User session:', session.user);
  }, [session, status]);

  // Load team members
  useEffect(() => {
    if (session?.user) {
      loadMembers();
    }
  }, [session]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      console.log('Loading team members...');
      const res = await fetch('/api/admin/team');
      console.log('Team API response status:', res.status);
      const data = await res.json();
      console.log('Team API response data:', data);
      if (data && !data.error) {
        setMembers(data);
      } else {
        console.error('Team API error:', data.error);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMember = async (id: string) => {
    if (confirm('Are you sure you want to delete this team member?')) {
      try {
        const res = await fetch(`/api/admin/team?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          loadMembers();
        }
      } catch (error) {
        console.error('Error deleting team member:', error);
      }
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = members.findIndex(member => member.id === active.id);
      const newIndex = members.findIndex(member => member.id === over.id);
      
      const newMembers = arrayMove(members, oldIndex, newIndex);
      
      // Update local state immediately for responsiveness
      setMembers(newMembers);
      
      // Update sort order in database
      setIsSaving(true);
      try {
        const reorderData = newMembers.map((member, index) => ({
          id: member.id,
          sortOrder: index
        }));

        const res = await fetch('/api/admin/team/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: reorderData })
        });

        if (!res.ok) {
          console.error('Failed to save new order');
          // Reload to get correct order from server
          loadMembers();
        }
      } catch (error) {
        console.error('Error saving new order:', error);
        // Reload to get correct order from server
        loadMembers();
      } finally {
        setIsSaving(false);
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600 mt-1">
            Manage team member profiles ({members.length} total)
            {isSaving && <span className="text-blue-600 ml-2">• Saving order...</span>}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            💡 Drag the <Bars3Icon className="w-4 h-4 inline" /> icon to reorder team members
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setEditingMember(null);
              setShowForm(true);
            }}
            className="bg-[#00274c] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#003366] admin-white-text"
          >
            <PlusIcon className="w-4 h-4" />
            Add Team Member
          </button>
        )}
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
          <TeamMemberForm
            member={editingMember}
            onClose={() => {
              setShowForm(false);
              setEditingMember(null);
              // Clear form state from localStorage
              localStorage.removeItem('teamAdmin_formState');
            }}
            onSave={() => {
              loadMembers();
              setShowForm(false);
              setEditingMember(null);
              // Clear form state from localStorage
              localStorage.removeItem('teamAdmin_formState');
            }}
          />
        </div>
      )}

      {/* Sortable Team Members Grid */}
      {members.length > 0 ? (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={members.map(m => m.id)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member: any) => (
                <SortableTeamMemberCard
                  key={member.id}
                  member={member}
                  onEdit={(member: any) => {
                    setEditingMember(member);
                    setShowForm(true);
                  }}
                  onDelete={deleteMember}
                  showForm={showForm}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : !showForm && (
        <div className="text-center py-12">
          <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
          <p className="text-gray-600 mb-4">Add your first team member to get started.</p>
          <button
            onClick={() => {
              setEditingMember(null);
              setShowForm(true);
            }}
            className="bg-[#00274c] text-white px-4 py-2 rounded-lg hover:bg-[#003366] admin-white-text"
          >
            Add Team Member
          </button>
        </div>
      )}
    </div>
  );
}

function TeamMemberForm({ member, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    year: '',
    major: '',
    bio: '',
    email: '',
    linkedIn: '',
    github: '',
    imageUrl: '',
    featured: false,
    active: true
  });
  const [saving, setSaving] = useState(false);

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

  // Load draft on mount or set member data - works for both new and editing
  useEffect(() => {
    if (member) {
      // For editing, first set the member data, then check for editing draft
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
        featured: member.featured || false,
        active: member.active ?? true
      });
      
      // Check for editing draft (modifications to existing member)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = member 
        ? `/api/admin/team?id=${member.id}` 
        : '/api/admin/team';
      
      const method = member ? 'PUT' : 'POST';
      const data = member ? { ...formData, id: member.id } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        // Clear the draft on successful save
        const draftKey = member ? `teamForm_draft_edit_${member.id}` : 'teamForm_draft_new';
        localStorage.removeItem(draftKey);
        console.log('✓ Team form saved successfully, draft cleared');
        onSave();
      } else {
        const error = await res.json();
        alert(error.message || 'Error saving team member');
      }
    } catch (error) {
      console.error('Error saving team member:', error);
      alert('Error saving team member');
    } finally {
      setSaving(false);
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="e.g., Technical Lead"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                required
              >
                <option value="">Select Year</option>
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
                <option value="Graduate">Graduate</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Major</label>
              <input
                type="text"
                value={formData.major}
                onChange={(e) => setFormData({...formData, major: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="e.g., Computer Science"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
              placeholder="Brief description of the team member"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="email@umich.edu"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
              <input
                type="url"
                value={formData.linkedIn}
                onChange={(e) => setFormData({...formData, linkedIn: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="https://linkedin.com/in/username"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
              <input
                type="url"
                value={formData.github}
                onChange={(e) => setFormData({...formData, github: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="https://github.com/username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00274c]"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 mb-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                className="rounded border-gray-300 text-[#00274c] focus:ring-[#00274c]"
              />
              <span className="text-sm text-gray-700">Featured Member</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({...formData, active: e.target.checked})}
                className="rounded border-gray-300 text-[#00274c] focus:ring-[#00274c]"
              />
              <span className="text-sm text-gray-700">Active Member</span>
            </label>
          </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="admin-save-btn px-4 py-2 bg-[#00274c] text-white hover:bg-[#003366] hover:text-white rounded-lg disabled:opacity-50 disabled:text-white font-medium admin-white-text"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
} 