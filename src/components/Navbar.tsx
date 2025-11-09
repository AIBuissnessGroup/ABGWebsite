'use client';
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { InstagramIcon, XIcon, LinkedInIcon } from "./SocialIcons";
import { isAdmin } from "@/lib/roles";

export default function Navbar() {
  const { data: session } = useSession();
  const userIsAdmin = isAdmin(session?.user?.roles || []);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems: Array<{
    href: string;
    label: string;
    external?: boolean;
    icon?: React.ReactNode;
  }> = [
    { href: "/", label: "Home" },
    { href: "/projects", label: "Projects" },
    { href: "/events", label: "Events" },
    { href: "/newsroom", label: "Newsroom" },
    { href: "/recruitment", label: "Recruitment" },
    { href: "/internships", label: "Internships" },
    { href: "/team", label: "Team" },
      { href: "/fluently", label: "Fluently" },
    { 
      href: "https://www.instagram.com/umichaibusiness/", 
      label: "Instagram", 
      external: true,
      icon: <InstagramIcon className="w-5 h-5" />
    },
    { 
      href: "https://x.com/AiBusinessUmich", 
      label: "X", 
      external: true,
      icon: <XIcon className="w-5 h-5" />
    },
    { 
      href: "https://www.linkedin.com/company/michigan-ai-business-group", 
      label: "LinkedIn", 
      external: true,
      icon: <LinkedInIcon className="w-5 h-5" />
    },
  ];

  if (userIsAdmin) {
    navigationItems.push({ href: "/admin", label: "Admin" });
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#00274c]/95 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="px-6 sm:px-8 lg:px-12 py-4 sm:py-3">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <Link href="/" className="flex items-center">
            <div className="backdrop-blur-sm bg-white border border-white/20 rounded-xl px-2 sm:px-3 py-1 shadow-2xl hover:scale-[1.02] hover:bg-white transition-all duration-300 flex items-center gap-2 sm:gap-3 h-10 sm:h-12 mr-2 sm:mr-4 lg:mr-6">
              {/* ABG Logo */}
              <div className="flex items-center">
                <Image 
                  src="/logo.png" 
                  alt="ABG Logo" 
                  width={60} 
                  height={60} 
                  className="h-8 sm:h-10 lg:h-12 w-auto object-contain" 
                />
              </div>
              
              {/* University Affiliations - Hidden on mobile, visible on lg+ */}
              <div className="hidden lg:flex items-center gap-3">
                <span className="text-[#00274c] text-xs font-bold uppercase tracking-wider">
                  Proudly affiliated with
                </span>
                <div className="flex items-center w-48 xl:w-60 h-16 xl:h-20">
                  <Image 
                    src="/affiliationLogos.png" 
                    alt="Michigan Ross and Michigan Engineering" 
                    width={1000} 
                    height={400} 
                    className="object-contain w-full h-full"
                    priority
                    quality={100}
                    unoptimized
                  />
                </div>
              </div>
              
              {/* Mobile/Tablet simplified text */}
              <div className="hidden sm:block lg:hidden">
                <span className="text-[#00274c] text-xs font-bold">
                  University of Michigan
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 lg:gap-5">
            {/* Text navigation items */}
            <div className="flex items-center gap-6 lg:gap-8">
              {navigationItems
                .filter(item => !item.icon)
                .map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`border-b-2 border-transparent hover:border-white/60 transition-all duration-300 pb-1 text-xs lg:text-sm font-bold ${
                      item.label === "Admin" 
                        ? "text-yellow-300 hover:text-yellow-100 hover:border-yellow-300/60" 
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))
              }
            </div>
            
            {/* Social media icons with tighter spacing */}
            <div className="flex items-center gap-2">
              {navigationItems
                .filter(item => item.icon)
                .map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-white hover:scale-110 p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
                    title={item.label}
                  >
                    {item.icon}
                  </a>
                ))
              }
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200 min-h-[48px] min-w-[48px] flex items-center justify-center"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="w-7 h-7" />
            ) : (
              <Bars3Icon className="w-7 h-7" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-6 pb-6 border-t border-white/10">
            <div className="flex flex-col space-y-1 pt-6">
              {navigationItems.map((item) => {
                // Handle admin link specially on mobile
                if (item.label === "Admin") {
                  return (
                    <div key={item.label} className="py-3 px-2">
                      <div className="text-yellow-300/60 text-base font-bold mb-2">Admin Panel</div>
                      <div className="text-white/50 text-sm">
                        📱 Tablet+ required (screen width ≥ 768px)
                      </div>
                    </div>
                  );
                }
                
                return item.external ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 py-4 px-2 font-bold text-base rounded-lg min-h-[56px] flex items-center gap-3"
                  >
                    {item.icon && <span className="text-white/90">{item.icon}</span>}
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 py-4 px-2 font-bold text-base rounded-lg min-h-[56px] flex items-center"
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 