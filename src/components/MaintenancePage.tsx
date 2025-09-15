export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00274c] to-[#1a2c45] flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* ABG Logo/Title */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            AI Business Group
          </h1>
          <div className="h-1 bg-gradient-to-r from-[#BBBBBB] to-white mx-auto w-32"></div>
        </div>

        {/* Maintenance Message */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 mb-8">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Scheduled Maintenance
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              We're currently performing scheduled maintenance to improve your experience. 
              We'll be back online shortly.
            </p>
          </div>
        </div>

        {/* Mass Meeting Information */}
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-300/30 rounded-xl p-8">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Don't Miss Our Mass Meeting!
            </h3>
            <div className="text-white space-y-2">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-lg font-medium">Thursday, September 11th</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg font-medium">7:00 - 8:00 PM</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-lg font-medium">Robertson Auditorium</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-white/80">
                <span>Ross School of Business</span>
              </div>
            </div>
          </div>
          
          <p className="text-white/90 text-sm">
            Join us for an exciting overview of ABG's upcoming projects, opportunities, and how you can get involved!
          </p>
        </div>

        {/* Contact Information */}
        <div className="mt-8 text-white/60 text-sm">
          <p>Questions? Contact us at <a href="mailto:info@abg-umich.com" className="text-blue-300 hover:text-blue-200 underline">info@abg-umich.com</a></p>
        </div>
      </div>
    </div>
  );
}
