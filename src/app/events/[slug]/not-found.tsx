import Link from 'next/link';

export default function EventNotFound() {
  return (
    <div className="min-h-screen bg-[#00274c] flex items-center justify-center">
      <div className="max-w-md w-full text-center p-8">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-white/30 mb-4">404</h1>
          <h2 className="text-2xl font-bold text-white mb-4">
            Event Not Found
          </h2>
          <p className="text-gray-300 mb-8">
            The event you're looking for doesn't exist or may have been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/events"
            className="block w-full bg-yellow-500 text-gray-900 py-3 px-6 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
          >
            View All Events
          </Link>
          
          <Link 
            href="/"
            className="block w-full bg-white/10 border border-white/20 text-white py-3 px-6 rounded-lg font-semibold hover:bg-white/20 transition-colors"
          >
            Back to Home
          </Link>
        </div>
        
        <div className="mt-8 text-sm text-gray-400">
          <p>Looking for a specific event?</p>
          <p className="mt-2">
            <Link href="/events" className="text-yellow-400 hover:underline">
              Browse our upcoming events
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}