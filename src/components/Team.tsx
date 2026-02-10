'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import FloatingShapes from './FloatingShapes';
import { FaLinkedin, FaGithub, FaEnvelope } from 'react-icons/fa';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  year: string;
  major?: string;
  bio?: string;
  email?: string;
  linkedIn?: string;
  github?: string;
  imageUrl?: string;
  featured: boolean;
  active: boolean;
  memberType?: 'exec' | 'analyst';
  project?: string;
  projects?: string[];
}

interface ProjectInfo {
  id: string;
  title: string;
  endDate?: string;
  status?: string;
}

// Role hierarchy for sorting
const roleHierarchy: Record<string, number> = {
  'president': 1,
  'co-founder': 2,
  'vp': 3,
  'vice president': 3,
  'director': 4,
  'project manager': 5,
  'pm': 5,
  'lead': 6,
  'analyst': 7,
  'member': 8,
};

function getRolePriority(role: string): number {
  const lowerRole = role.toLowerCase();
  for (const [key, priority] of Object.entries(roleHierarchy)) {
    if (lowerRole.includes(key)) return priority;
  }
  return 10;
}

function getRoleBadge(role: string): { label: string; color: string } {
  const lowerRole = role.toLowerCase();
  if (lowerRole.includes('president') && !lowerRole.includes('vice')) {
    return { label: 'President', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' };
  }
  if (lowerRole.includes('co-founder')) {
    return { label: 'Co-Founder', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
  }
  if (lowerRole.includes('vp') || lowerRole.includes('vice president')) {
    return { label: 'VP', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
  }
  if (lowerRole.includes('project manager') || lowerRole.includes('pm')) {
    return { label: 'PM', color: 'bg-green-500/20 text-green-300 border-green-500/30' };
  }
  if (lowerRole.includes('lead')) {
    return { label: 'Lead', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
  }
  if (lowerRole.includes('analyst')) {
    return { label: 'Analyst', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' };
  }
  return { label: '', color: '' };
}

// Leadership Card Component (Used for all exec members)
function LeadershipCard({ member, index }: { member: TeamMember; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 + index * 0.08 }}
      className="relative group"
    >
      <motion.div
        whileHover={{ y: -6, scale: 1.02 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-xl hover:shadow-2xl hover:border-white/30 transition-all duration-300 h-full"
      >
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <motion.div
            whileHover={{ scale: 1.08 }}
            className="w-28 h-28 rounded-full bg-gradient-to-br from-[#00274c] to-[#1a2c45] border-4 border-white/20 overflow-hidden shadow-lg mb-5"
          >
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
              <span className="text-3xl font-bold text-white">
                {member.name.split(' ').map((n: string) => n[0]).join('')}
              </span>
            </div>
          </motion.div>

          {/* Info */}
          <h3 className="text-xl font-bold text-white mb-1">
            {member.name}
          </h3>
          <p className="text-sm text-[#BBBBBB] font-semibold mb-2">
            {member.role}
          </p>
          {member.major && (
            <p className="text-xs text-[#5e6472]">
              {member.major}
            </p>
          )}

          {/* Social Icons */}
          <div className="flex gap-3 mt-4">
            {member.linkedIn && (
              <a
                href={member.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-blue-500/30 flex items-center justify-center text-white/60 hover:text-white transition-all duration-300"
              >
                <FaLinkedin className="w-4 h-4" />
              </a>
            )}
            {member.github && (
              <a
                href={member.github}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-gray-500/30 flex items-center justify-center text-white/60 hover:text-white transition-all duration-300"
              >
                <FaGithub className="w-4 h-4" />
              </a>
            )}
            {member.email && (
              <a
                href={`mailto:${member.email}`}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-green-500/30 flex items-center justify-center text-white/60 hover:text-white transition-all duration-300"
              >
                <FaEnvelope className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Project Team Member Card Component (More polished)
function ProjectMemberCard({ member, index }: { member: TeamMember; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
      className="relative group"
    >
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.25 }}
        className="bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-sm rounded-2xl p-5 border border-white/15 hover:border-white/25 hover:from-white/12 hover:to-white/6 transition-all duration-300"
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00274c] to-[#1a2c45] border-2 border-white/20 overflow-hidden flex-shrink-0 shadow-md"
          >
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
              <span className="text-lg font-bold text-white">
                {member.name.split(' ').map((n: string) => n[0]).join('')}
              </span>
            </div>
          </motion.div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h5 className="text-base font-bold text-white truncate">
              {member.name}
            </h5>
            <p className="text-sm text-[#BBBBBB] truncate">
              {member.role}
            </p>
            {member.major && (
              <p className="text-xs text-[#5e6472] truncate">
                {member.major}
              </p>
            )}
          </div>

          {/* Social Icons */}
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {member.linkedIn && (
              <a
                href={member.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-blue-500/30 flex items-center justify-center text-white/40 hover:text-white transition-all duration-300"
              >
                <FaLinkedin className="w-3.5 h-3.5" />
              </a>
            )}
            {member.github && (
              <a
                href={member.github}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-gray-500/30 flex items-center justify-center text-white/40 hover:text-white transition-all duration-300"
              >
                <FaGithub className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Team() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  // Load team members and projects from database
  useEffect(() => {
    const loadData = async () => {
      try {
        const [membersRes, projectsRes] = await Promise.all([
          fetch('/api/public/team'),
          fetch('/api/projects')
        ]);
        
        if (membersRes.ok) {
          const data = await membersRes.json();
          setTeamMembers(data);
        }
        
        if (projectsRes.ok) {
          const projectData = await projectsRes.json();
          setProjects(projectData);
        }
      } catch (error) {
        console.error('Failed to load team data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Categorize members by role hierarchy
  const execMembers = teamMembers.filter(m => !m.memberType || m.memberType === 'exec');

  // All leadership (President, Co-founders, VPs, Directors)
  const leadership = execMembers
    .filter(m => {
      const role = m.role.toLowerCase();
      return role.includes('president') || 
             role.includes('co-founder') ||
             role.includes('vp') || 
             role.includes('vice president') || 
             role.includes('director');
    })
    .sort((a, b) => getRolePriority(a.role) - getRolePriority(b.role));

  // Project Managers
  const projectManagers = execMembers
    .filter(m => {
      const role = m.role.toLowerCase();
      return role.includes('project manager') || (role.includes('pm') && !role.includes('vp'));
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Other exec members (leads, etc.)
  const otherExec = execMembers
    .filter(m => {
      const role = m.role.toLowerCase();
      return !role.includes('president') &&
             !role.includes('co-founder') &&
             !role.includes('vp') &&
             !role.includes('vice president') &&
             !role.includes('director') &&
             !role.includes('project manager') &&
             !(role.includes('pm') && !role.includes('vp'));
    })
    .sort((a, b) => getRolePriority(a.role) - getRolePriority(b.role));

  // Determine which projects are active vs past
  const now = new Date();
  const activeProjects = projects.filter(p => {
    if (!p.endDate) return true;
    return new Date(p.endDate) > now;
  });
  const pastProjects = projects.filter(p => {
    if (!p.endDate) return false;
    return new Date(p.endDate) <= now;
  });

  // Get member's assigned projects (supporting multiple projects per member)
  const getMemberProjects = (member: TeamMember): string[] => {
    if (member.projects && member.projects.length > 0) {
      return member.projects;
    }
    if (member.project) {
      return [member.project];
    }
    return ['General'];
  };

  // Get all members who have projects assigned (both exec and analysts)
  const membersWithProjects = teamMembers.filter(m => {
    const projects = getMemberProjects(m);
    return projects.length > 0 && projects[0] !== 'General';
  });

  // Active project members (includes exec members too)
  const activeProjectNames = new Set(activeProjects.map(p => p.title));
  const membersByActiveProject = membersWithProjects.reduce((groups, member) => {
    const memberProjects = getMemberProjects(member);
    memberProjects.forEach(projectName => {
      if (activeProjectNames.has(projectName)) {
        if (!groups[projectName]) {
          groups[projectName] = [];
        }
        if (!groups[projectName].find(m => m.id === member.id)) {
          groups[projectName].push(member);
        }
      }
    });
    return groups;
  }, {} as Record<string, TeamMember[]>);

  // Past project members
  const pastProjectNames = new Set(pastProjects.map(p => p.title));
  const membersByPastProject = membersWithProjects.reduce((groups, member) => {
    const memberProjects = getMemberProjects(member);
    memberProjects.forEach(projectName => {
      if (pastProjectNames.has(projectName)) {
        if (!groups[projectName]) {
          groups[projectName] = [];
        }
        if (!groups[projectName].find(m => m.id === member.id)) {
          groups[projectName].push(member);
        }
      }
    });
    return groups;
  }, {} as Record<string, TeamMember[]>);

  return (
    <section
      id="team"
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
            OUR TEAM
          </h1>
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: "180px" } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto mb-8"
          />
          <p className="text-xl md:text-2xl text-[#BBBBBB] max-w-4xl mx-auto leading-relaxed">
            The innovators, builders, and visionaries driving ABG's mission to shape the future of AI in business.
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-6"></div>
            <p className="text-[#BBBBBB] text-lg">Loading team members...</p>
          </div>
        ) : (
          <>
            {/* Leadership Section */}
            {leadership.length > 0 && (
              <div className="mb-20">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-center mb-10"
                >
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    LEADERSHIP
                  </h2>
                  <div className="w-20 h-0.5 bg-gradient-to-r from-blue-500/50 via-blue-400 to-blue-500/50 mx-auto"></div>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {leadership.map((member, index) => (
                    <LeadershipCard key={member.id} member={member} index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* Project Managers Section */}
            {projectManagers.length > 0 && (
              <div className="mb-20">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-center mb-10"
                >
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    PROJECT MANAGERS
                  </h2>
                  <div className="w-20 h-0.5 bg-gradient-to-r from-green-500/50 via-green-400 to-green-500/50 mx-auto"></div>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {projectManagers.map((member, index) => (
                    <LeadershipCard key={member.id} member={member} index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* Other Exec Members */}
            {otherExec.length > 0 && (
              <div className="mb-20">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-center mb-10"
                >
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    TEAM LEADS
                  </h2>
                  <div className="w-20 h-0.5 bg-gradient-to-r from-cyan-500/50 via-cyan-400 to-cyan-500/50 mx-auto"></div>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {otherExec.map((member, index) => (
                    <LeadershipCard key={member.id} member={member} index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* Active Project Teams */}
            {Object.keys(membersByActiveProject).length > 0 && (
              <div id="analysts-section" className="mb-20">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="text-center mb-12"
                >
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                    ACTIVE PROJECTS
                  </h2>
                  <div className="w-24 h-0.5 bg-gradient-to-r from-purple-500/50 via-purple-400 to-purple-500/50 mx-auto mb-4"></div>
                  <p className="text-lg text-[#BBBBBB] max-w-2xl mx-auto">
                    Our team members working on current AI initiatives across different business sectors.
                  </p>
                </motion.div>

                <div className="space-y-10">
                  {Object.entries(membersByActiveProject).map(([projectName, members], projectIndex) => (
                    <motion.div
                      key={projectName}
                      initial={{ opacity: 0, y: 30 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.6, delay: 0.6 + projectIndex * 0.1 }}
                      className="bg-gradient-to-br from-white/8 to-white/3 rounded-2xl p-6 md:p-8 border border-white/15"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 animate-pulse"></div>
                        <h3 className="text-xl md:text-2xl font-bold text-white">
                          {projectName}
                        </h3>
                        <span className="text-sm text-[#5e6472] bg-white/5 px-3 py-1 rounded-full">
                          {members.length} member{members.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {members.map((member, index) => (
                          <ProjectMemberCard key={member.id} member={member} index={index} />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Project Teams */}
            {Object.keys(membersByPastProject).length > 0 && (
              <div className="mb-20">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="text-center mb-12"
                >
                  <h2 className="text-3xl md:text-4xl font-bold text-white/70 mb-3">
                    PAST PROJECTS
                  </h2>
                  <div className="w-24 h-0.5 bg-gradient-to-r from-gray-500/50 via-gray-400 to-gray-500/50 mx-auto mb-4"></div>
                  <p className="text-lg text-[#5e6472] max-w-2xl mx-auto">
                    Completed initiatives and the teams that made them happen.
                  </p>
                </motion.div>

                <div className="space-y-8">
                  {Object.entries(membersByPastProject).map(([projectName, members], projectIndex) => (
                    <motion.div
                      key={projectName}
                      initial={{ opacity: 0, y: 30 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.6, delay: 0.8 + projectIndex * 0.1 }}
                      className="bg-white/3 rounded-2xl p-6 md:p-8 border border-white/10 opacity-80"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                        <h3 className="text-xl md:text-2xl font-bold text-white/70">
                          {projectName}
                        </h3>
                        <span className="text-sm text-[#5e6472] bg-white/5 px-3 py-1 rounded-full">
                          {members.length} member{members.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-gray-500 ml-auto">Completed</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {members.map((member, index) => (
                          <ProjectMemberCard key={member.id} member={member} index={index} />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Join Team CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 1 }}
              className="text-center mt-24"
            >
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-10 md:p-14 max-w-4xl mx-auto border border-white/20">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Want to Join Our Team?
                </h3>
                <p className="text-lg text-[#BBBBBB] mb-8 max-w-2xl mx-auto leading-relaxed">
                  We're always looking for passionate builders, strategic thinkers, and innovative minds to help shape the future of AI in business.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/#join"
                    className="px-8 py-4 bg-white text-[#00274c] font-bold rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    Apply Now
                  </a>
                  <a
                    href="mailto:ABGRecruitment@umich.edu"
                    className="px-8 py-4 bg-white/10 text-white font-bold rounded-full border border-white/30 hover:bg-white/20 transition-all duration-300 hover:scale-105"
                  >
                    Contact Us
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}
