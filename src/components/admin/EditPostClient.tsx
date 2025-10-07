'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PostEditor from './PostEditor';
import { NewsroomPost } from '@/types/newsroom';

interface EditPostClientProps {
  postId: string;
}

export default function EditPostClient({ postId }: EditPostClientProps) {
  const [post, setPost] = useState<NewsroomPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/newsroom?id=${postId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Post not found');
          } else if (response.status === 401) {
            setError('Unauthorized access');
          } else {
            setError('Failed to fetch post');
          }
          return;
        }
        
        const data = await response.json();
        if (data.post) {
          setPost(data.post);
        } else {
          setError('Post not found');
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to fetch post');
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#00274c] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#00274c] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/admin/newsroom')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Newsroom
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#00274c] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Post Not Found</h1>
          <p className="text-gray-300 mb-6">The requested post could not be found.</p>
          <button
            onClick={() => router.push('/admin/newsroom')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Newsroom
          </button>
        </div>
      </div>
    );
  }

  return <PostEditor post={post} isEditing={true} />;
}