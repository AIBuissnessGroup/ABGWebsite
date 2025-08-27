export default function Footer() {
  return (
    <footer className="bg-[#0d1d35]/60 backdrop-blur-md text-[#BBBBBB] py-8 sm:py-12 px-4 sm:px-6 lg:px-12 border-t border-white/10 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#00274c]/20 to-transparent pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 text-center md:text-left mb-6 sm:mb-8">
          {/* Left side */}
          <div>
            <h3 className="heading-secondary text-lg sm:text-xl text-white mb-2">AI BUSINESS GROUP</h3>
            <p className="text-sm text-[#BBBBBB]">
              University of Michigan • Est. 2025
            </p>
            <p className="text-xs text-[#5e6472] mt-1">
            Equipping the next generation to lead with AI
            </p>
          </div>

          {/* Right side (Links or Socials) */}
          <div className="flex flex-wrap justify-center md:justify-end gap-4 sm:gap-6">
            <a href="/#about" className="text-[#BBBBBB] hover:text-white transition text-sm">
              About
            </a>
            <a href="/projects" className="text-[#BBBBBB] hover:text-white transition text-sm">
              Projects
            </a>
            <a href="/events" className="text-[#BBBBBB] hover:text-white transition text-sm">
              Events
            </a>
            <a href="/team" className="text-[#BBBBBB] hover:text-white transition text-sm">
              Team
            </a>
            <a href="/#join" className="text-[#BBBBBB] hover:text-white transition text-sm">
              Join
            </a>
            <a 
              href="https://www.linkedin.com/company/abg-umich" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#BBBBBB] hover:text-white transition text-sm"
            >
              LinkedIn
            </a>
            <a 
              href="https://www.instagram.com/umichaibusiness/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#BBBBBB] hover:text-white transition text-sm"
            >
              Instagram
            </a>
            <a 
              href="https://x.com/AiBusinessUmich" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#BBBBBB] hover:text-white transition text-sm"
            >
              X/Twitter
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-4 sm:pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-xs sm:text-sm text-[#5e6472]">
          <p>© 2025 AI Business Group. All rights reserved.</p>
          <div className="flex gap-4 sm:gap-6">
            <a href="/privacy" className="hover:text-[#BBBBBB] transition">
              Privacy
            </a>
            <a href="/terms" className="hover:text-[#BBBBBB] transition">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
