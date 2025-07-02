'use client';
import { useSession, signOut } from 'next-auth/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function AdminHeader() {
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 px-3 md:px-6 py-3 md:py-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg md:text-2xl font-semibold text-gray-900 truncate">
            Admin Dashboard
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1 hidden sm:block">
            Manage your ABG website content
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 md:gap-3 p-1 md:p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate max-w-32">
                  {session?.user?.email}
                </p>
              </div>
              <div className="w-7 h-7 md:w-8 md:h-8 bg-[#00274c] rounded-full flex items-center justify-center flex-shrink-0 admin-white-text">
                <span className="text-white text-xs md:text-sm font-medium">
                  {session?.user?.name?.charAt(0)}
                </span>
              </div>
              <ChevronDownIcon className="w-3 h-3 md:w-4 md:h-4 text-gray-400 hidden sm:block" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100 md:hidden">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {session?.user?.email}
                  </p>
                </div>
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