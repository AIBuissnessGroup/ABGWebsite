'use client';
import { motion, useInView } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { FaLinkedin, FaGithub } from 'react-icons/fa';
import { LinkIcon } from '@heroicons/react/24/outline';
import FloatingShapes from './FloatingShapes';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  imageUrl?: string;
  linkedIn?: string;
  github?: string;
  email?: string;
  major?: string;
  project?: string;
  projects?: string[];
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate?: string;
  links?: string;
  imageUrl?: string;
  featured: boolean;
  published: boolean;
}

// Team Member Card for Projects
function ProjectTeamMemberCard({ member, index }: { member: TeamMember; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex flex-col items-center"
    >
      {/* Avatar */}
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00274c] to-[#1a2c45] border-2 border-white/20 overflow-hidden shadow-md mb-2">
        {member.imageUrl ? (
          <img
            src={member.imageUrl}
            alt={member.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-full h-full bg-gradient-to-br from-[#00274c] to-[#1a2c45] flex items-center justify-center ${member.imageUrl ? 'hidden' : ''}`}>
          <span className="text-sm font-bold text-white">
            {member.name.split(' ').map((n: string) => n[0]).join('')}
          </span>
        </div>
      </div>
      
      {/* Name & Role */}
      <h5 className="text-sm font-semibold text-white text-center truncate max-w-[100px]">
        {member.name.split(' ')[0]}
      </h5>
      <p className="text-xs text-[#5e6472] text-center truncate max-w-[100px]">
        {member.role}
      </p>
      
      {/* Social Icons */}
      <div className="flex gap-2 mt-2">
        {member.linkedIn && (
          <a
            href={member.linkedIn}
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 rounded-full bg-white/5 hover:bg-blue-500/30 flex items-center justify-center text-white/40 hover:text-white transition-all duration-300"
          >
            <FaLinkedin className="w-3 h-3" />
          </a>
        )}
        {member.github && (
          <a
            href={member.github}
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 rounded-full bg-white/5 hover:bg-gray-500/30 flex items-center justify-center text-white/40 hover:text-white transition-all duration-300"
          >
            <FaGithub className="w-3 h-3" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

// Project Card Component with reactive gradient
function ProjectCard({ 
  project, 
  members, 
  index, 
  isPast = false 
}: { 
  project: Project; 
  members: TeamMember[]; 
  index: number;
  isPast?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden bg-gradient-to-br ${isPast ? 'from-white/5 to-white/2 opacity-80' : 'from-white/10 to-white/5'} backdrop-blur-lg rounded-3xl p-6 md:p-8 border ${isPast ? 'border-white/10' : 'border-white/20'} shadow-xl hover:shadow-2xl hover:border-white/30 transition-all duration-300`}
    >
      {/* Reactive gradient overlay */}
      {!isPast && (
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 rounded-3xl"
          style={{
            opacity: isHovered ? 0.15 : 0,
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.4), transparent 40%)`,
          }}
        />
      )}
      
      <div className="relative z-10 flex flex-col lg:flex-row gap-6">
        {/* Project Info */}
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {!isPast && (
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 animate-pulse" />
                )}
                {isPast && (
                  <div className="w-3 h-3 rounded-full bg-gray-500" />
                )}
                <h3 className={`text-xl md:text-2xl font-bold ${isPast ? 'text-white/70' : 'text-white'}`}>
                  {project.title}
                </h3>
              </div>
              {project.startDate && (
                <p className="text-xs text-[#5e6472]">
                  {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                  {!project.endDate && ' - Present'}
                </p>
              )}
            </div>
            
            {project.links && (
              <a
                href={project.links}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-[#BBBBBB] hover:text-white transition-all duration-300 text-sm flex-shrink-0"
              >
                <LinkIcon className="w-4 h-4" />
                <span className="hidden sm:inline">View</span>
              </a>
            )}
          </div>
          
          <p className={`text-sm md:text-base leading-relaxed project-description ${isPast ? 'past' : 'active'}`}>
            {project.description}
            <style jsx>{`
              .project-description.active {
                color: #b0b0b0 !important;
              }
              .project-description.past {
                color: #888888 !important;
              }
            `}</style>
          </p>
        </div>
        
        {/* Team Members */}
        {members.length > 0 && (
          <div className="lg:w-auto lg:min-w-[200px]">
            <h4 className={`text-sm font-semibold mb-4 ${isPast ? 'text-white/50' : 'text-white/70'}`}>
              Team ({members.length})
            </h4>
            <div className="flex flex-wrap gap-4 justify-start lg:justify-end">
              {members.slice(0, 6).map((member, idx) => (
                <ProjectTeamMemberCard key={member.id} member={member} index={idx} />
              ))}
              {members.length > 6 && (
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/10 border-2 border-white/20">
                  <span className="text-sm font-bold text-white/60">
                    +{members.length - 6}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  // Load projects and team members
  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsRes, membersRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/public/team')
        ]);
        
        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setProjects(data);
        }
        
        if (membersRes.ok) {
          const data = await membersRes.json();
          setTeamMembers(data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Get members for a project
  const getMembersForProject = (projectTitle: string): TeamMember[] => {
    return teamMembers.filter(member => {
      // Check projects array first
      if (member.projects && member.projects.length > 0) {
        return member.projects.includes(projectTitle);
      }
      // Fall back to single project field
      if (member.project) {
        return member.project === projectTitle;
      }
      return false;
    });
  };

  // Separate active and past projects
  const now = new Date();
  const activeProjects = projects.filter(p => {
    if (!p.endDate) return true;
    return new Date(p.endDate) > now;
  });
  const pastProjects = projects.filter(p => {
    if (!p.endDate) return false;
    return new Date(p.endDate) <= now;
  });

  return (
    <section
      ref={ref}
      className="min-h-screen py-24 px-6 md:px-12 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, #00274c 0%, #0d1d35 50%, #1a2c45 100%)`,
      }}
    >
      {/* Floating Background Shapes */}
      <FloatingShapes variant="default" opacity={0.06} />

      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-40 left-10 w-40 h-40 border border-white rounded-full"></div>
        <div className="absolute top-20 right-20 w-32 h-32 border border-white rounded-lg rotate-45"></div>
        <div className="absolute bottom-40 left-32 w-36 h-36 border border-white rounded-full"></div>
        <div className="absolute bottom-20 right-40 w-28 h-28 border border-white rounded-lg -rotate-12"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
            OUR PROJECTS
          </h1>
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: "180px" } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto mb-8"
          />
          <p className="text-xl md:text-2xl text-[#BBBBBB] max-w-4xl mx-auto leading-relaxed">
            Discover the innovative AI and business solutions we're building to shape the future.
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-6"></div>
            <p className="text-[#BBBBBB] text-lg">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <h3 className="text-2xl sm:text-3xl text-white mb-4">Coming Soon</h3>
            <p className="text-[#BBBBBB] text-lg sm:text-xl mb-8">We're working on exciting new projects!</p>
            <a href="/#join" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white transition-all duration-300">
              Join Our Team
            </a>
          </div>
        ) : (
          <>
            {/* Active Projects */}
            {activeProjects.length > 0 && (
              <div className="mb-20">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-center mb-12"
                >
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                    ACTIVE PROJECTS
                  </h2>
                  <div className="w-24 h-0.5 bg-gradient-to-r from-green-500/50 via-green-400 to-green-500/50 mx-auto mb-4"></div>
                  <p className="text-lg text-[#BBBBBB] max-w-2xl mx-auto">
                    Current initiatives driving innovation across AI and business.
                  </p>
                </motion.div>

                <div className="space-y-8">
                  {activeProjects.map((project, index) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      members={getMembersForProject(project.title)}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past Projects */}
            {pastProjects.length > 0 && (
              <div className="mb-20">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-center mb-12"
                >
                  <h2 className="text-3xl md:text-4xl font-bold text-white/70 mb-3">
                    PAST PROJECTS
                  </h2>
                  <div className="w-24 h-0.5 bg-gradient-to-r from-gray-500/50 via-gray-400 to-gray-500/50 mx-auto mb-4"></div>
                  <p className="text-lg text-[#5e6472] max-w-2xl mx-auto">
                    Completed initiatives and the impact they made.
                  </p>
                </motion.div>

                <div className="space-y-6">
                  {pastProjects.map((project, index) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      members={getMembersForProject(project.title)}
                      index={index}
                      isPast
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center py-16"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Join Our Projects?
          </h2>
          <p className="text-lg text-[#BBBBBB] mb-8 max-w-2xl mx-auto">
            We're always looking for passionate students to contribute to our innovative projects.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/#join" 
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/30 rounded-full text-white font-semibold transition-all duration-300"
            >
              Join ABG
            </a>
            <a 
              href="/team" 
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-transparent hover:bg-white/10 border border-white/20 rounded-full text-[#BBBBBB] hover:text-white font-semibold transition-all duration-300"
            >
              Meet the Team
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
