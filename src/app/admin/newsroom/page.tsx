import Link from 'next/link';
import { NewspaperIcon } from '@heroicons/react/24/outline';

export default function NewsroomAdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Newsroom Management</h1>
          <p className="text-gray-600">
            Create, edit, and manage your newsroom content including articles, podcasts, videos, and more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* All Posts */}
          <Link
            href="/admin/newsroom/posts"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <NewspaperIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">All Posts</h3>
                <p className="text-sm text-gray-500">View and manage all newsroom posts</p>
              </div>
            </div>
          </Link>

          {/* Create New Post */}
          <Link
            href="/admin/newsroom/posts/new"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-bold">+</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Create Post</h3>
                <p className="text-sm text-gray-500">Add a new article, podcast, or video</p>
              </div>
            </div>
          </Link>

          {/* Analytics */}
          <Link
            href="/admin/newsroom/analytics"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-500">View post performance and metrics</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}