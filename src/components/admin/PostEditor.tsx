'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NewsroomPost, NewsroomPostType, NewsroomPostStatus } from '@/types/newsroom';
import Image from 'next/image';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import RichTextEditor from './RichTextEditor';

interface PostEditorProps {
  post?: NewsroomPost;
  isEditing?: boolean;
}

export default function PostEditor({ post, isEditing = false }: PostEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: post?.title || '',
    type: post?.type || 'blog' as NewsroomPostType,
    status: post?.status || 'draft' as NewsroomPostStatus,
    thumbnail: post?.thumbnail || '',
    description: post?.description || '',
    body: post?.body || '',
    mediaEmbedLink: post?.mediaEmbedLink || '',
    featured: post?.featured || false,
    tags: post?.tags || [] as string[],
    seoTitle: post?.seoTitle || '',
    seoDescription: post?.seoDescription || '',
    openGraphImage: post?.openGraphImage || '',
  });
  
  const [newTag, setNewTag] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Basic validation
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }
      if (!formData.body.trim()) {
        throw new Error('Content body is required');
      }
      
      const url = isEditing 
        ? '/api/admin/newsroom' 
        : '/api/admin/newsroom';
        
      const method = isEditing ? 'PUT' : 'POST';
      const payload = isEditing ? { ...formData, _id: post?._id } : formData;
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save post');
      }
      
      const result = await response.json();
      setSuccess(true);
      
      // Redirect to the post list after successful save
      setTimeout(() => {
        if (formData.status === 'published') {
          router.push(`/newsroom/${result.slug}`);
        } else {
          router.push('/admin/newsroom/posts');
        }
      }, 1500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      const tag = newTag.trim().toLowerCase();
      if (!formData.tags.includes(tag)) {
        handleInputChange('tags', [...formData.tags, tag]);
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handlePublish = () => {
    setFormData(prev => ({ ...prev, status: 'published' }));
  };

  const handleSaveDraft = () => {
    setFormData(prev => ({ ...prev, status: 'draft' }));
  };

  // Auto-fill SEO fields if empty
  useEffect(() => {
    if (formData.title && !formData.seoTitle) {
      handleInputChange('seoTitle', formData.title);
    }
    if (formData.description && !formData.seoDescription) {
      handleInputChange('seoDescription', formData.description);
    }
  }, [formData.title, formData.description]);

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isEditing ? 'Post Updated!' : 'Post Created!'}
          </h3>
          <p className="text-gray-600">
            {formData.status === 'published' 
              ? 'Your post has been published and is now live.'
              : 'Your post has been saved as a draft.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Post' : 'Create New Post'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Update your newsroom post' : 'Create a new article, podcast, video, or update'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter post title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value as NewsroomPostType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="blog">Article</option>
                  <option value="podcast">Podcast</option>
                  <option value="video">Video</option>
                  <option value="member-spotlight">Member Spotlight</option>
                  <option value="project-update">Project Update</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as NewsroomPostStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the post..."
              />
            </div>

            <div className="mt-6 flex items-center">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => handleInputChange('featured', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="featured" className="ml-2 text-sm font-medium text-gray-700">
                Mark as Featured Post
              </label>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Content</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Body *
              </label>
              <RichTextEditor
                content={formData.body}
                onChange={(content) => handleInputChange('body', content)}
              />
              <p className="mt-2 text-sm text-gray-500">
                Use the toolbar above to format your content. You can add headings, lists, links, images, and more.
              </p>
            </div>
          </div>

          {/* Media */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Media & Links</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thumbnail Image URL
                </label>
                <input
                  type="url"
                  value={formData.thumbnail}
                  onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
                {formData.thumbnail && (
                  <div className="mt-2">
                    <Image
                      src={formData.thumbnail}
                      alt="Thumbnail preview"
                      width={200}
                      height={120}
                      className="rounded-lg object-cover"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Media Embed Link
                </label>
                <input
                  type="url"
                  value={formData.mediaEmbedLink}
                  onChange={(e) => handleInputChange('mediaEmbedLink', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="YouTube, Spotify, or other media URL"
                />
                <p className="mt-1 text-sm text-gray-500">
                  YouTube videos and Spotify podcasts will be automatically embedded.
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Tags</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Tags
              </label>
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type a tag and press Enter"
              />
              <p className="mt-1 text-sm text-gray-500">
                Press Enter to add tags. Tags help categorize and filter posts.
              </p>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SEO */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Title
                </label>
                <input
                  type="text"
                  value={formData.seoTitle}
                  onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="SEO optimized title (auto-filled from post title)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Description
                </label>
                <textarea
                  value={formData.seoDescription}
                  onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="SEO description (auto-filled from post description)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Open Graph Image URL
                </label>
                <input
                  type="url"
                  value={formData.openGraphImage}
                  onChange={(e) => handleInputChange('openGraphImage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Image for social media sharing (defaults to thumbnail)"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              onClick={() => setFormData(prev => ({ ...prev, status: 'published' }))}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Saving...' : isEditing ? 'Update & Publish' : 'Publish Post'}
            </button>
            
            <button
              type="submit"
              disabled={loading}
              onClick={() => setFormData(prev => ({ ...prev, status: 'draft' }))}
              className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Saving...' : 'Save as Draft'}
            </button>
            
            <button
              type="button"
              onClick={() => router.push('/admin/newsroom/posts')}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}