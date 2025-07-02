import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function AnalyticsWidget() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5" />
          Website Analytics
        </h2>
        <p className="text-sm text-gray-600 mt-1">Access full ABG team analytics via Google Analytics</p>
      </div>
      <div className="p-6">
        <div className="text-center">
          <a 
            href="https://analytics.google.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#00274c] hover:text-[#003366] hover:underline transition-colors"
          >
            Click here to open Google Analytics →
          </a>
        </div>
      </div>
    </div>
  );
} 