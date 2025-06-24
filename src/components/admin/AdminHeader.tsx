'use client';
import { useSession, signOut } from 'next-auth/react';
import { BellIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function AdminHeader() {
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your ABG website content
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="p-2 text-gray-400 hover:text-gray-600 relative">
            <BellIcon className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {session?.user?.email}
                </p>
              </div>
              <div className="w-8 h-8 bg-[#00274c] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {session?.user?.name?.charAt(0)}
                </span>
              </div>
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <a
                  href="/"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  View Website
                </a>
                <a
                  href="/admin/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Profile Settings
                </a>
                <hr className="my-2" />
                <button
                  onClick={() => signOut()}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 