'use client';
import React, { useEffect, useState } from 'react';
import FloatingShapes from '../../components/FloatingShapes';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Team from '../../components/Team';
import '../../app/globals.css';

export default function FluentlyPage() {
  // Load ABG team images to match headshots used on the Team page
  const [teamImages, setTeamImages] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const res = await fetch('/api/public/team');
        if (!res.ok) return;
        const data: any[] = await res.json();
        const names = [
          'Julia Lotz',
          'Nicholas Kozierowski',
          'Michael Koury',
          'Yashish Manohar',
          'Haven Gier',
        ];
        const map: Record<string, string | undefined> = {};
        for (const name of names) {
          const found = data.find(
            (m: any) => m?.name && m.name.toLowerCase().trim() === name.toLowerCase()
          );
          if (found?.imageUrl) map[name] = found.imageUrl as string;
        }
        setTeamImages(map);
      } catch (e) {
        // ignore and fall back to initials
        console.warn('Failed to load team images for Fluently page');
      }
    };
    loadTeam();
  }, []);
  return (
    <>
      <main 
        className="text-white min-h-screen relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, #00274c 0%, #1a2c45 50%, #2d3e5a 100%)`,
        }}
      >
        {/* Animated Background Shapes */}
        <FloatingShapes variant="dense" opacity={0.08} />
        
        {/* Additional Static Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              duration: 20, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute -top-20 sm:-top-40 -right-20 sm:-right-40 w-40 sm:w-80 h-40 sm:h-80 border border-white/10 rounded-full"
          />
          <motion.div
            animate={{ 
              rotate: [360, 0],
              scale: [1, 0.9, 1],
            }}
            transition={{ 
              duration: 25, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute -bottom-16 sm:-bottom-32 -left-16 sm:-left-32 w-32 sm:w-64 h-32 sm:h-64 border-2 border-white/5 rounded-full"
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 relative z-10">
          {/* Hero Section */}
          <section className="flex flex-col items-center mb-12">
            <div className="relative mb-8 group">
              <div className="relative w-[272px] md:w-[416px] h-[152px] md:h-[192px] rounded-2xl bg-white/30 backdrop-blur-md border border-white/25 shadow-2xl ring-1 ring-white/10 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:bg-white/40 group-hover:scale-[1.02]">
                <Image 
                  src="/images/Fluently_Logo_Image.png" 
                  alt="Fluently Logo" 
                  fill
                  sizes="(min-width: 768px) 416px, 272px"
                  priority
                  className="object-contain p-0 drop-shadow-lg scale-[1.5]"
                />
                {/* Decorative corner accents */}
                <span className="absolute -top-2 -left-2 w-6 h-6 rounded-lg bg-gradient-to-br from-white/60 to-transparent opacity-60"></span>
                <span className="absolute -bottom-2 -right-2 w-6 h-6 rounded-lg bg-gradient-to-tl from-white/60 to-transparent opacity-60"></span>
              </div>
              {/* Subtle glow pulse */}
              <div className="absolute inset-0 -z-10 rounded-3xl blur-2xl bg-blue-500/10 animate-pulse" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-3 text-center">Fluently</h1>
            <p className="text-2xl md:text-3xl mb-2 text-center text-blue-200 font-medium">AI-Powered Interview and Job-Matching App</p>
            <p className="text-xl md:text-2xl mb-6 text-center text-blue-300">Making language a bridge, not a barrier.</p>
            <Link href="https://fluently-demo.com" target="_blank">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg text-lg shadow transition">Try Now</button>
            </Link>
          </section>

          {/* Main Content Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 mb-12">
            <div className="glass-card p-8 flex flex-col justify-center">
              <h2 className="text-2xl font-semibold mb-4">Overview</h2>
              <p className="text-lg text-[#BBBBBB]">Fluently is an AI-powered interview and job-matching app helping non-native English speakers communicate confidently and secure meaningful work. Developed under the AI Business Group at the University of Michigan, Fluently bridges business strategy and AI technology to make language a bridge, not a barrier.</p>
            </div>
            <div className="glass-card p-8 flex flex-col justify-center">
              <h2 className="text-2xl font-semibold mb-4">The Problem</h2>
              <p className="text-lg text-[#BBBBBB]">Millions of skilled professionals face language and accent barriers that prevent them from excelling in interviews. Accent bias can lead to unfair hiring outcomes and lost opportunities. Fluently was built to help overcome these barriers through technology and empathy.</p>
            </div>
          </section>

          {/* Solution Cards */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-8 text-center">The Solution</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="glass-card p-8 flex flex-col items-center">
                <span className="text-blue-300 text-4xl mb-2">🗣️</span>
                <h3 className="font-bold mb-2 text-lg">AI Interview Practice</h3>
                <p className="text-center text-blue-100 text-base">Simulates interviews and gives instant speech feedback.</p>
              </div>
              <div className="glass-card p-8 flex flex-col items-center">
                <span className="text-blue-300 text-4xl mb-2">🌐</span>
                <h3 className="font-bold mb-2 text-lg">Guided Transition to English</h3>
                <p className="text-center text-blue-100 text-base">Lets users start in their native language and gradually move to English.</p>
              </div>
              <div className="glass-card p-8 flex flex-col items-center">
                <span className="text-blue-300 text-4xl mb-2">💼</span>
                <h3 className="font-bold mb-2 text-lg">Job Matching Integration</h3>
                <p className="text-center text-blue-100 text-base">Connects users with real job openings that match their skill sets.</p>
              </div>
            </div>
            <hr className="my-10 border-blue-700" />
          </section>

          {/* Origin, Technology, Impact, Next Steps in 2-column grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 mb-12">
            <div className="glass-card p-8 flex flex-col justify-center">
              <h2 className="text-2xl font-semibold mb-4">Origin Story</h2>
              <p className="text-lg text-[#BBBBBB]">Fluently was born within the AI Business Group when Michigan students noticed talented international peers being overlooked due to accent or pacing differences in English interviews. Combining expertise from the Ross School of Business and the College of Engineering, the team set out to create a fairer way for people to be heard and hired.</p>
            </div>
            <div className="glass-card p-8 flex flex-col justify-center">
              <h2 className="text-2xl font-semibold mb-4">Technology</h2>
              <p className="text-lg text-[#BBBBBB]">The app integrates speech recognition, natural language processing, and emotion analysis to assess tone, pacing, and confidence. A job API integration connects users directly with open roles. Fluently is currently in beta testing with 20 active testers.</p>
            </div>
            <div className="glass-card p-8 flex flex-col justify-center">
              <h2 className="text-2xl font-semibold mb-4">Impact and Vision</h2>
              <p className="text-lg text-[#BBBBBB]">Fluently has conducted over 75 user interviews globally, gathering data to improve AI accuracy and fairness. Our vision is to scale internationally, partnering with universities and employers to promote equitable, bias-aware hiring practices.</p>
            </div>
            <div className="glass-card p-8 flex flex-col justify-center">
              <h2 className="text-2xl font-semibold mb-4">Development & Next Steps</h2>
              <p className="text-lg text-[#BBBBBB]"><strong>Stage:</strong> Beta / Prototype<br /><strong>Funding:</strong> Self-funded with university resources.<br /><strong>Next:</strong> Expand beta testing, finalize pricing model, and seek accelerator partnerships.</p>
            </div>
          </section>

          {/* Team Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-8 text-center">Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
              <div className="glass-card p-8 text-center group glow-on-hover">
                {/* Avatar */}
                <div className="relative mb-6">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#BBBBBB]/30 to-[#5e6472]/30 border-4 border-white/20 overflow-hidden relative">
                    {teamImages['Julia Lotz'] ? (
                      <img
                        src={teamImages['Julia Lotz']!}
                        alt="Julia Lotz"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const t = e.target as HTMLImageElement;
                          t.style.display = 'none';
                          t.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-gradient-to-br from-[#00274c] to-[#1a2c45] flex items-center justify-center ${teamImages['Julia Lotz'] ? 'hidden' : ''}`}>
                      <span className="text-2xl font-bold text-white">JL</span>
                    </div>
                  </div>
                </div>
                {/* Member Info */}
                <div className="space-y-3">
                  <h3 className="heading-secondary text-xl text-white">Julia Lotz</h3>
                  <p className="text-[#BBBBBB] font-bold text-sm">Project Lead</p>
                  <p className="text-[#5e6472] text-sm">Product Strategy</p>
                </div>
              </div>

              <div className="glass-card p-8 text-center group glow-on-hover">
                <div className="relative mb-6">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#BBBBBB]/30 to-[#5e6472]/30 border-4 border-white/20 overflow-hidden relative">
                    {teamImages['Nicholas Kozierowski'] ? (
                      <img
                        src={teamImages['Nicholas Kozierowski']!}
                        alt="Nicholas Kozierowski"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const t = e.target as HTMLImageElement;
                          t.style.display = 'none';
                          t.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-gradient-to-br from-[#00274c] to-[#1a2c45] flex items-center justify-center ${teamImages['Nicholas Kozierowski'] ? 'hidden' : ''}`}>
                      <span className="text-2xl font-bold text-white">NK</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="heading-secondary text-xl text-white">Nicholas Kozierowski</h3>
                  <p className="text-[#BBBBBB] font-bold text-sm">Technical Lead</p>
                  <p className="text-[#5e6472] text-sm">Software Engineer</p>
                </div>
              </div>

              <div className="glass-card p-8 text-center group glow-on-hover">
                <div className="relative mb-6">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#BBBBBB]/30 to-[#5e6472]/30 border-4 border-white/20 overflow-hidden relative">
                    {teamImages['Michael Koury'] ? (
                      <img
                        src={teamImages['Michael Koury']!}
                        alt="Michael Koury"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const t = e.target as HTMLImageElement;
                          t.style.display = 'none';
                          t.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-gradient-to-br from-[#00274c] to-[#1a2c45] flex items-center justify-center ${teamImages['Michael Koury'] ? 'hidden' : ''}`}>
                      <span className="text-2xl font-bold text-white">MK</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="heading-secondary text-xl text-white">Michael Koury</h3>
                  <p className="text-[#BBBBBB] font-bold text-sm">Business Analyst</p>
                  <p className="text-[#5e6472] text-sm">Market Research</p>
                </div>
              </div>

              <div className="glass-card p-8 text-center group glow-on-hover">
                <div className="relative mb-6">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#BBBBBB]/30 to-[#5e6472]/30 border-4 border-white/20 overflow-hidden relative">
                    {teamImages['Yashish Manohar'] ? (
                      <img
                        src={teamImages['Yashish Manohar']!}
                        alt="Yashish Manohar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const t = e.target as HTMLImageElement;
                          t.style.display = 'none';
                          t.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-gradient-to-br from-[#00274c] to-[#1a2c45] flex items-center justify-center ${teamImages['Yashish Manohar'] ? 'hidden' : ''}`}>
                      <span className="text-2xl font-bold text-white">YM</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="heading-secondary text-xl text-white">Yashish Manohar</h3>
                  <p className="text-[#BBBBBB] font-bold text-sm">Business Analyst</p>
                  <p className="text-[#5e6472] text-sm">Strategy & Operations</p>
                </div>
              </div>

              <div className="glass-card p-8 text-center group glow-on-hover">
                <div className="relative mb-6">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#BBBBBB]/30 to-[#5e6472]/30 border-4 border-white/20 overflow-hidden relative">
                    {teamImages['Haven Gier'] ? (
                      <img
                        src={teamImages['Haven Gier']!}
                        alt="Haven Gier"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const t = e.target as HTMLImageElement;
                          t.style.display = 'none';
                          t.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-gradient-to-br from-[#00274c] to-[#1a2c45] flex items-center justify-center ${teamImages['Haven Gier'] ? 'hidden' : ''}`}>
                      <span className="text-2xl font-bold text-white">HG</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="heading-secondary text-xl text-white">Haven Gier</h3>
                  <p className="text-[#BBBBBB] font-bold text-sm">Engineering Analyst</p>
                  <p className="text-[#5e6472] text-sm">Software Engineer</p>
                </div>
              </div>
            </div>
          </section>

          {/* Try Fluently CTA */}
          <section className="w-full flex flex-col items-center py-12 relative z-10">
            <Link href="https://fluently-demo.com" target="_blank">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-10 rounded-lg text-xl shadow transition">Try Fluently Now</button>
            </Link>
            <p className="mt-4 text-blue-200 text-center">Experience Fluently’s AI-powered interview simulation.</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
