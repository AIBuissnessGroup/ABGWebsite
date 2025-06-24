'use client';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  PauseCircleIcon,
  LinkIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import FloatingShapes from './FloatingShapes';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate?: string;
  budget?: string;
  progress: number;
  objectives: string;
  outcomes?: string;
  technologies: string;
  links?: string;
  imageUrl?: string;
  featured: boolean;
  published: boolean;
  teamMembers?: any[];
  funding?: any[];
  partnerships?: any[];
}



const statusConfig: any = {
  ACTIVE: { 
    icon: PlayCircleIcon, 
    color: 'text-green-400', 
    bg: 'bg-green-400/20', 
    label: 'Active' 
  },
  COMPLETED: { 
    icon: CheckCircleIcon, 
    color: 'text-blue-400', 
    bg: 'bg-blue-400/20', 
    label: 'Completed' 
  },
  PLANNING: { 
    icon: ClockIcon, 
    color: 'text-blue-300', 
    bg: 'bg-blue-300/20', 
    label: 'Planning' 
  },
  ON_HOLD: { 
    icon: PauseCircleIcon, 
    color: 'text-gray-400', 
    bg: 'bg-gray-400/20', 
    label: 'On Hold' 
  },
  CANCELLED: { 
    icon: PauseCircleIcon, 
    color: 'text-red-400', 
    bg: 'bg-red-400/20', 
    label: 'Cancelled' 
  }
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Load projects from database
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetch('/api/admin/projects');
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);
  return (
    <main className="bg-[#00274c] min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative py-16 sm:py-20 lg:py-24 overflow-hidden px-4 sm:px-6"
        style={{
          background: `linear-gradient(135deg, #00274c 0%, #1a2c45 50%, #2d3e5a 100%)`,
        }}
      >
        <FloatingShapes variant="minimal" opacity={0.06} />
        
        <div className="max-w-7xl mx-auto lg:px-6 xl:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-4 sm:space-y-6"
          >
            <h1 className="heading-primary text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-white">
              Our <span className="text-[#BBBBBB]">Projects</span>
            </h1>
            <p className="body-text text-lg sm:text-xl lg:text-2xl text-[#BBBBBB] max-w-3xl mx-auto px-4">
              Discover the innovative AI and business solutions we're building to shape the future. 
              From market analysis to supply chain optimization, our projects drive real-world impact.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-[#BBBBBB]">Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <h3 className="text-2xl sm:text-3xl text-white mb-4">Coming Soon</h3>
              <p className="text-[#BBBBBB] text-lg sm:text-xl mb-8">We're working on exciting new projects!</p>
              <a href="/#join" className="btn-primary">
                Join Our Team
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12">
              {projects.map((project: any, index: number) => {
              const StatusIcon = statusConfig[project.status].icon;
              
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className="glass-card p-4 sm:p-6 lg:p-8 hover:scale-[1.02] transition-all duration-300 relative overflow-hidden"
                >
                  {/* Background Image */}
                  {project.imageUrl && (
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-5 hover:opacity-10 transition-opacity duration-300"
                      style={{ backgroundImage: `url(${project.imageUrl})` }}
                    />
                  )}
                  <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 relative z-10">
                    {/* Project Info */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <h3 className="heading-secondary text-xl sm:text-2xl text-white leading-tight">
                            {project.title}
                          </h3>
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig[project.status].bg} self-start`}>
                            <StatusIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${statusConfig[project.status].color}`} />
                            <span className={`text-xs sm:text-sm font-medium ${statusConfig[project.status].color}`}>
                              {statusConfig[project.status].label}
                            </span>
                          </div>
                        </div>
                        
                        <p className="body-text text-sm sm:text-base text-[#BBBBBB] leading-relaxed">
                          {project.description}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-[#BBBBBB]">Progress</span>
                          <span className="text-white font-medium">{project.progress}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${project.progress}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="bg-gradient-to-r from-[#BBBBBB] to-white h-2 rounded-full"
                          />
                        </div>
                      </div>

                      {/* Objectives/Outcomes */}
                      <div className="space-y-2 sm:space-y-3">
                        <h4 className="text-white font-semibold text-sm sm:text-base">
                          {project.status === 'COMPLETED' ? 'Outcomes' : 'Objectives'}
                        </h4>
                        <ul className="space-y-1 sm:space-y-2">
                          {(() => {
                            const content = project.outcomes || project.objectives;
                            if (!content) return [];
                            
                            // Try to parse as JSON first (for legacy data)
                            try {
                              const parsed = JSON.parse(content);
                              if (Array.isArray(parsed)) {
                                return parsed.slice(0, 3).map((item: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2 text-[#BBBBBB] text-xs sm:text-sm">
                                    <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                    {item.trim()}
                                  </li>
                                ));
                              }
                            } catch (e) {
                              // Not JSON, treat as newline-separated text
                            }
                            
                            // Handle newline-separated text
                            return content.split('\n').filter((item: string) => item.trim()).slice(0, 3).map((item: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-[#BBBBBB] text-xs sm:text-sm">
                                <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                {item.trim()}
                              </li>
                            ));
                          })()}
                        </ul>
                      </div>

                      {/* Technologies */}
                      {project.technologies && (
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex items-center gap-2">
                            <TagIcon className="w-3 h-3 sm:w-4 sm:h-4 text-[#BBBBBB]" />
                            <h4 className="text-white font-semibold text-sm sm:text-base">Technologies</h4>
                          </div>
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {(() => {
                              // Try to parse as JSON first (for legacy data)
                              try {
                                const parsed = JSON.parse(project.technologies);
                                if (Array.isArray(parsed)) {
                                  return parsed.slice(0, 4).map((tech: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="px-2 sm:px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-[#BBBBBB] text-xs sm:text-sm"
                                    >
                                      {tech.trim()}
                                    </span>
                                  ));
                                }
                              } catch (e) {
                                // Not JSON, treat as comma-separated text
                              }
                              
                              // Handle comma-separated text
                              return project.technologies.split(',').slice(0, 4).map((tech: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 sm:px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-[#BBBBBB] text-xs sm:text-sm"
                                >
                                  {tech.trim()}
                                </span>
                              ));
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Links - Mobile */}
                      {project.links && (
                        <div className="lg:hidden">
                          <a
                            href={project.links}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-[#BBBBBB] hover:text-white transition-all duration-300 text-sm"
                          >
                            <LinkIcon className="w-4 h-4" />
                            View Project
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-4 sm:space-y-6">
                      {/* Timeline */}
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 text-[#BBBBBB]" />
                          <h4 className="text-white font-semibold text-sm sm:text-base">Timeline</h4>
                        </div>
                        <div className="text-[#BBBBBB] text-xs sm:text-sm space-y-1">
                          <div>Start: {new Date(project.startDate).toLocaleDateString()}</div>
                          {project.endDate && (
                            <div>End: {new Date(project.endDate).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>

                      {/* Budget */}
                      {project.budget && (
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex items-center gap-2">
                            <CurrencyDollarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-[#BBBBBB]" />
                            <h4 className="text-white font-semibold text-sm sm:text-base">Budget</h4>
                          </div>
                          <div className="text-[#BBBBBB] text-xs sm:text-sm">{project.budget}</div>
                        </div>
                      )}

                      {/* Team */}
                      {project.teamMembers && project.teamMembers.length > 0 && (
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex items-center gap-2">
                            <UserGroupIcon className="w-3 h-3 sm:w-4 sm:h-4 text-[#BBBBBB]" />
                            <h4 className="text-white font-semibold text-sm sm:text-base">Team</h4>
                          </div>
                          <div className="space-y-2 sm:space-y-3">
                            {project.teamMembers.slice(0, 3).map((member: any, idx: number) => (
                              <div key={idx} className="space-y-1">
                                <div className="text-white text-xs sm:text-sm font-medium">{member.name}</div>
                                <div className="text-[#5e6472] text-xs">{member.role} • {member.year}</div>
                                {member.linkedIn && (
                                  <a
                                    href={member.linkedIn}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[#BBBBBB] hover:text-white text-xs transition-colors"
                                  >
                                    <span>LinkedIn</span>
                                    <span>→</span>
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Company Partnerships */}
                      {project.partnerships && project.partnerships.length > 0 && (
                        <div className="space-y-2 sm:space-y-3">
                          <h4 className="text-white font-semibold text-sm sm:text-base">Partners</h4>
                          <div className="space-y-2 sm:space-y-3">
                            {project.partnerships.slice(0, 2).map((partnership: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/5 rounded-lg border border-white/10">
                                {partnership.company.logoUrl && (
                                  <img 
                                    src={partnership.company.logoUrl} 
                                    alt={partnership.company.name}
                                    className="w-6 h-6 sm:w-8 sm:h-8 object-contain flex-shrink-0"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                    <span className="text-white text-xs sm:text-sm font-medium truncate">{partnership.company.name}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs self-start flex-shrink-0 ${
                                      partnership.type === 'SPONSOR' ? 'bg-purple-400/20 text-purple-400' :
                                      partnership.type === 'CLIENT' ? 'bg-blue-400/20 text-blue-400' :
                                      partnership.type === 'COLLABORATOR' ? 'bg-green-400/20 text-green-400' :
                                      'bg-gray-400/20 text-gray-400'
                                    }`}>
                                      {partnership.type}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Links - Desktop */}
                      {project.links && (
                        <div className="hidden lg:block">
                          <a
                            href={project.links}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-[#BBBBBB] hover:text-white transition-all duration-300 text-sm"
                          >
                            <LinkIcon className="w-4 h-4" />
                            View Project
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-[#00274c] to-[#1a2c45]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-4 sm:space-y-6"
          >
            <h2 className="heading-secondary text-2xl sm:text-3xl lg:text-4xl text-white">
              Ready to Join Our Projects?
            </h2>
            <p className="body-text text-lg sm:text-xl lg:text-2xl text-[#BBBBBB] px-4">
              We're always looking for passionate students to contribute to our innovative projects.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <a href="/#join" className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4">
                Join ABG
              </a>
              <a href="/team" className="btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4">
                Meet the Team
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
} 