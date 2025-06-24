'use client';
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Navbar() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { href: "/", label: "Home" },
    { href: "/#about", label: "About" },
    { href: "/projects", label: "Projects" },
    { href: "/events", label: "Events" },
    { href: "/team", label: "Team" },
    { href: "/#join", label: "Join" },
    { href: "https://www.linkedin.com/company/abg-umich", label: "LinkedIn", external: true },
  ];

  if (isAdmin) {
    navigationItems.push({ href: "/admin", label: "Admin" });
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#00274c]/95 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="px-4 sm:px-6 lg:px-12 py-3">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <Link href="/" className="flex items-center">
            <div className="backdrop-blur-sm bg-white border border-white/20 rounded-xl px-2 sm:px-3 py-1 shadow-2xl hover:scale-[1.02] hover:bg-white transition-all duration-300 flex items-center gap-2 sm:gap-3 h-10 sm:h-12">
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
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navigationItems.map((item) => (
              item.external ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white border-b-2 border-transparent hover:border-white/60 transition-all duration-300 pb-1 text-sm lg:text-base font-bold"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`border-b-2 border-transparent hover:border-white/60 transition-all duration-300 pb-1 text-sm lg:text-base font-bold ${
                    item.label === "Admin" 
                      ? "text-yellow-300 hover:text-yellow-100 hover:border-yellow-300/60" 
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              )
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/10">
            <div className="flex flex-col space-y-3 pt-4">
              {navigationItems.map((item) => {
                // Handle admin link specially on mobile
                if (item.label === "Admin") {
                  return (
                    <div key={item.label} className="py-2 px-1">
                      <div className="text-yellow-300/60 text-sm font-bold mb-1">Admin Panel</div>
                      <div className="text-white/50 text-xs">
                        🖥️ Desktop required (screen width ≥ 1024px)
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
                    className="text-white/80 hover:text-white transition-colors duration-200 py-2 px-1 font-bold"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-white/80 hover:text-white transition-colors duration-200 py-2 px-1 font-bold"
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