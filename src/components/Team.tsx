'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import FloatingShapes from './FloatingShapes';

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
}

const teams = [
  { id: "all", label: "ALL MEMBERS" },
  { id: "business", label: "BUSINESS" },
  { id: "co-founders", label: "CO-FOUNDERS" },
  { id: "technical", label: "TECHNICAL" }
];

export default function Team() {
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [hoveredMember, setHoveredMember] = useState<number | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  // Load team members from database
  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        const res = await fetch('/api/admin/team');
        if (res.ok) {
          const data = await res.json();
          setTeamMembers(data);
        }
      } catch (error) {
        console.error('Failed to load team members:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTeamMembers();
  }, []);

  const getFilteredMembers = () => {
    if (selectedTeam === "all") return teamMembers;
    if (selectedTeam === "featured") return teamMembers.filter(member => member.featured);
    if (selectedTeam === "business") return teamMembers.filter(member => 
      member.major?.toLowerCase().includes('business')
    );
    if (selectedTeam === "co-founders") return teamMembers.filter(member => 
      member.role.toLowerCase().includes('co-founder')
    );
    if (selectedTeam === "technical") return teamMembers.filter(member => 
      member.major?.toLowerCase().includes('computer') || 
      member.major?.toLowerCase().includes('data') ||
      member.major?.toLowerCase().includes('technical') ||
      member.major?.toLowerCase().includes('engineer') ||
      member.major?.toLowerCase().includes('developer') ||
      member.major?.toLowerCase().includes('software') ||
      member.major?.toLowerCase().includes('ai') ||
      member.major?.toLowerCase().includes('machine') ||
      member.major?.toLowerCase().includes('learning') ||
      member.major?.toLowerCase().includes('data') ||
      member.major?.toLowerCase().includes('analytics') ||
      member.major?.toLowerCase().includes('science') ||
      member.major?.toLowerCase().includes('math') ||
      member.major?.toLowerCase().includes('software') 
    );
    return teamMembers;
  };

  const filteredMembers = getFilteredMembers();

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
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-40 left-10 w-40 h-40 border border-white rounded-full"></div>
        <div className="absolute top-20 right-20 w-32 h-32 border border-white rounded-lg rotate-45"></div>
        <div className="absolute bottom-40 left-32 w-36 h-36 border border-white rounded-full"></div>
        <div className="absolute bottom-20 right-40 w-28 h-28 border border-white rounded-lg -rotate-12"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="heading-primary text-5xl md:text-6xl lg:text-7xl text-white mb-6">
            MEET THE TEAM
          </h2>
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: "140px" } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-1 bg-gradient-to-r from-[#BBBBBB] to-white mx-auto mb-8"
          />
          <p className="body-text text-xl md:text-2xl text-[#BBBBBB] max-w-4xl mx-auto leading-relaxed">
            The innovators, builders, and visionaries driving ABG's mission forward. Each bringing unique expertise to shape the future of AI in business.
          </p>
        </motion.div>

        {/* Team Filter */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-4 mb-16"
        >
          {teams.map((team, index) => (
            <motion.button
              key={team.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedTeam(team.id)}
              className={`px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wider transition-all duration-300 ${
                selectedTeam === team.id
                  ? 'bg-white text-[#00274c] shadow-lg'
                  : 'bg-white/10 text-[#BBBBBB] hover:bg-white/20 hover:text-white'
              }`}
            >
              {team.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Team Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-[#BBBBBB]">Loading team members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#BBBBBB] text-xl">No team members found.</p>
            <p className="text-[#5e6472] mt-2">Add team members through the admin panel.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
          {filteredMembers.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 + (index * 0.1) }}
              className="relative"
              onMouseEnter={() => setHoveredMember(index)}
              onMouseLeave={() => setHoveredMember(null)}
            >
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                className="glass-card p-8 text-center group glow-on-hover"
              >
                {/* Avatar */}
                <div className="relative mb-6">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#BBBBBB]/30 to-[#5e6472]/30 border-4 border-white/20 overflow-hidden relative"
                  >
                    {member.imageUrl ? (
                      <img 
                        src={member.imageUrl} 
                        alt={member.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    {/* Fallback initials */}
                    <div className={`w-full h-full bg-gradient-to-br from-[#00274c] to-[#1a2c45] flex items-center justify-center ${member.imageUrl ? 'hidden' : ''}`}>
                      <span className="text-2xl font-bold text-white">
                        {member.name.split(' ').map((n: string) => n[0]).join('')}
                      </span>
                    </div>
                    
                      </motion.div>
                </div>

                {/* Member Info */}
                <div className="space-y-3">
                  <h3 className="heading-secondary text-xl text-white">
                    {member.name}
                  </h3>
                  <p className="text-[#BBBBBB] font-bold text-sm">
                    {member.role}
                  </p>
                  <p className="text-[#5e6472] text-sm">
                    {member.major || member.year}
                  </p>
                </div>

                {/* Bio and Social Links */}
                <div className="mt-6 pt-6 border-t border-[#5e6472]/30">
                  <motion.p 
                    initial={{ opacity: 0.2 }}
                    animate={{ opacity: hoveredMember === index ? 1 : 0.2 }}
                    transition={{ duration: 0.3 }}
                    className="text-[#BBBBBB] text-sm mb-4 leading-relaxed"
                  >
                    {member.bio}
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredMember === index ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-center gap-4"
                  >
                    {member.linkedIn && (
                      <a 
                        href={member.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[#BBBBBB] hover:text-white transition text-sm"
                      >
                        <span>LinkedIn</span>
                        <span>→</span>
                      </a>
                    )}
                    {member.github && (
                      <a 
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[#BBBBBB] hover:text-white transition text-sm"
                      >
                        <span>GitHub</span>
                        <span>→</span>
                      </a>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          ))}
          </motion.div>
        )}

        {/* Join Team CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="text-center mt-20"
        >
          <div className="glass-card p-12 max-w-3xl mx-auto">
            <h3 className="heading-secondary text-3xl md:text-4xl text-white mb-6">
              JOIN THE MISSION
            </h3>
            <p className="body-text text-xl text-[#BBBBBB] mb-8 leading-relaxed">
              Ready to shape the future of AI in business? We're always looking for passionate builders, strategic thinkers, and innovative minds to join our team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/#join" className="btn-primary text-lg px-8 py-4">
                See What's Possible
              </a>
              <a href="mailto:careers@abg-umich.com" className="btn-secondary text-lg px-8 py-4">
                Explore Opportunities
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 