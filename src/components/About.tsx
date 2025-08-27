'use client';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import FloatingShapes from './FloatingShapes';
import CollaborationCarousel from './CollaborationCarousel';

interface AboutContent {
  title: string;
  subtitle: string;
  mainTitle: string;
  description1: string;
  description2: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  membersCount: string;
  projectsCount: string;
  partnersCount: string;
  missionCount: string;
  value1Title: string;
  value1Desc: string;
  value1Icon: string;
  value2Title: string;
  value2Desc: string;
  value2Icon: string;
  value3Title: string;
  value3Desc: string;
  value3Icon: string;
  collaborationDisplayMode: 'carousel' | 'image';
  collaborationTitle: string;
  collaborationSubtitle: string;
  carouselSlides: string;
  teamImage?: string;
}

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  const [content, setContent] = useState<AboutContent>({
    title: "WHO WE ARE",
    subtitle: "We're not just another student organization. We're the bridge between artificial intelligence and business impact at the University of Michigan.",
    mainTitle: "BUILDING THE FUTURE",
    description1: "AI Business Group is a platform for students from all backgrounds to explore and apply AI to their work, goals, and careers, equipping every member with the tools to adapt and innovate in their field.",
    description2: "We are not just another student org, we’re redefining career readiness in an AI-driven world by turning ideas into real-world projects with measurable impact.",    
    primaryButtonText: "Explore Projects",
    primaryButtonLink: "/events",
    secondaryButtonText: "Meet the Team",
    secondaryButtonLink: "/team",
    membersCount: "25+",
    projectsCount: "12",
    partnersCount: "3",
    missionCount: "1",
    value1Title: "AI-DRIVEN",
    value1Desc: "We leverage cutting-edge artificial intelligence to solve real business challenges.",
    value1Icon: "🧠",
    value2Title: "IMPACT-FOCUSED",
    value2Desc: "Every project we build has measurable business outcomes and real-world applications.",
    value2Icon: "🚀",
    value3Title: "FUTURE-READY",
    value3Desc: "Preparing the next generation of leaders for an AI-first business landscape.",
    value3Icon: "⚡",
    collaborationDisplayMode: 'carousel',
    collaborationTitle: "Innovation Through Collaboration",
    collaborationSubtitle: "Team photo coming soon",
    carouselSlides: "",
    teamImage: ""
  });

  useEffect(() => {
    fetch('/api/about')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setContent(data);
        }
      })
      .catch(err => console.error('Failed to load about content:', err));
  }, []);

  const values = [
    {
      title: content.value1Title,
      description: content.value1Desc,
      icon: content.value1Icon
    },
    {
      title: content.value2Title,
      description: content.value2Desc,
      icon: content.value2Icon
    },
    {
      title: content.value3Title,
      description: content.value3Desc,
      icon: content.value3Icon
    }
  ];

  return (
    <section 
      id="about" 
      ref={ref}
      className="min-h-screen pt-8 sm:pt-12 lg:pt-16 pb-16 sm:pb-20 lg:pb-24 px-4 sm:px-6 lg:px-12 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, #1a2c45 0%, #00274c 50%, #0d1d35 100%)`,
      }}
    >
      {/* Floating Background Shapes */}
      <FloatingShapes variant="minimal" opacity={0.06} />

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 sm:top-20 left-10 sm:left-20 w-16 sm:w-32 h-16 sm:h-32 border border-white rounded-lg rotate-12"></div>
        <div className="absolute top-20 sm:top-40 right-16 sm:right-32 w-12 sm:w-24 h-12 sm:h-24 border border-white rounded-full"></div>
        <div className="absolute bottom-16 sm:bottom-32 left-20 sm:left-40 w-14 sm:w-28 h-14 sm:h-28 border border-white rounded-lg -rotate-45"></div>
        <div className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-10 sm:w-20 h-10 sm:h-20 border border-white rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="heading-primary text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white mb-4 sm:mb-6">
            {content.title}
          </h2>
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: "120px" } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-1 bg-gradient-to-r from-[#BBBBBB] to-white mx-auto mb-6 sm:mb-8"
          />
          <p className="body-text text-lg sm:text-xl lg:text-2xl text-[#BBBBBB] max-w-4xl mx-auto leading-relaxed px-4">
            {content.subtitle}
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center mb-16 sm:mb-20">
          
          {/* Left Column - Story */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-6 sm:space-y-8"
          >
            <div className="space-y-4 sm:space-y-6">
              <h3 className="heading-secondary text-xl sm:text-2xl lg:text-3xl text-white">
                {content.mainTitle}
              </h3>
              <p className="body-text text-base sm:text-lg text-[#BBBBBB] leading-relaxed">
                {content.description1}
              </p>
              <p className="body-text text-base sm:text-lg text-[#BBBBBB] leading-relaxed">
                {content.description2}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <a href={content.primaryButtonLink} className="btn-primary text-center">
                {content.primaryButtonText}
              </a>
              <a href={content.secondaryButtonLink} className="btn-secondary text-center">
                {content.secondaryButtonText}
              </a>
            </div>
          </motion.div>

          {/* Right Column - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="relative mt-8 lg:mt-0"
          >
            <CollaborationCarousel
              displayMode={content.collaborationDisplayMode}
              title={content.collaborationTitle}
              subtitle={content.collaborationSubtitle}
              slides={(() => {
                try {
                  return content.carouselSlides ? JSON.parse(content.carouselSlides) : [];
                } catch {
                  return [];
                }
              })()}
              teamImage={content.teamImage}
            />
          </motion.div>
        </div>

        {/* Values Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <h3 className="heading-secondary text-2xl sm:text-3xl lg:text-4xl text-center text-white mb-8 sm:mb-12">
            OUR FOUNDATION
          </h3>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 1.0 + (index * 0.2) }}
                className="glass-card p-6 sm:p-8 text-center group glow-on-hover"
              >
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{value.icon}</div>
                <h4 className="heading-secondary text-lg sm:text-xl text-white mb-3 sm:mb-4">
                  {value.title}
                </h4>
                <p className="body-text text-sm sm:text-base text-[#BBBBBB] leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="mt-20 glass-card p-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="heading-primary text-3xl md:text-4xl text-white mb-2">{content.membersCount}</div>
              <p className="text-[#BBBBBB] text-sm uppercase tracking-wider">Active Members</p>
            </div>
            <div>
              <div className="heading-primary text-3xl md:text-4xl text-white mb-2">{content.projectsCount}</div>
              <p className="text-[#BBBBBB] text-sm uppercase tracking-wider">Live Projects</p>
            </div>
            <div>
              <div className="heading-primary text-3xl md:text-4xl text-white mb-2">{content.partnersCount}</div>
              <p className="text-[#BBBBBB] text-sm uppercase tracking-wider">Industry Partners</p>
            </div>
            <div>
              <div className="heading-primary text-3xl md:text-4xl text-white mb-2">{content.missionCount}</div>
              <p className="text-[#BBBBBB] text-sm uppercase tracking-wider">Mission</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
