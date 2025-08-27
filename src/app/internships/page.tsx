'use client';
import { motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { useInView } from 'framer-motion';
import FloatingShapes from '@/components/FloatingShapes';
import { 
  AcademicCapIcon, 
  BriefcaseIcon, 
  ClockIcon, 
  UsersIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function InternshipsPage() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  // Dynamic content state
  const [pageContent, setPageContent] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      // Load page content
      const contentRes = await fetch('/api/admin/internships/content');
      const contentData = await contentRes.json();
      if (contentData && !contentData.error) {
        setPageContent(contentData);
      }

      // Load projects
      const projectsRes = await fetch('/api/admin/internships/projects');
      const projectsData = await projectsRes.json();
      if (projectsData && !projectsData.error) {
        setProjects(projectsData.filter((p: any) => p.active));
      }

      // Load companies
      const companiesRes = await fetch('/api/admin/internships/companies');
      const companiesData = await companiesRes.json();
      if (companiesData && !companiesData.error) {
        setCompanies(companiesData);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  // Always use fallback content to ensure something renders
  const content = pageContent || {
    badgeText: 'AI Business Group Applied AI Internship Program',
    heroTitle: 'Launch Your AI Career',
    heroSubtitle: 'High-impact, real-world AI internship opportunities through Michigan Ross/COE recruitment pipelines and industry partnerships',
    missionTitle: 'Program Mission',
    missionText: 'To provide high-impact, real-world AI internship opportunities to ABG students by partnering with Michigan Ross/COE recruitment pipelines and company demand for applied AI talent.',
    phases: [],
    timelineTitle: 'Program Timeline',
    timelineSubtitle: 'Typical UMich semester spans ~15 weeks with 1 finals week',
    timeline: [],
    benefitsTitle: 'Benefits for All Stakeholders',
    benefits: { students: [], companies: [], university: [] },
    opportunitiesTitle: 'Current Opportunities',
    opportunitiesSubtitle: 'Explore available internship positions with our partner companies',
    ctaTitle: 'Ready to Join the Program?',
    ctaSubtitle: 'Get involved with AI Business Group projects to qualify for our internship program.',
    published: true
  };

  // Get phase icon based on index
  const getPhaseIcon = (index: number) => {
    const icons = [AcademicCapIcon, BriefcaseIcon, UsersIcon];
    return icons[index] || AcademicCapIcon;
  };

  return (
    <div className="main-page min-h-screen bg-gradient-to-br from-[#1a2c45] via-[#00274c] to-[#0d1d35]">
      {/* Hero Section */}
      <section ref={ref} className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-12 overflow-hidden">
        <FloatingShapes variant="dense" opacity={0.05} />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm mb-6" style={{color: 'white'}}>
              <SparklesIcon className="w-4 h-4" style={{color: 'white'}} />
              <span style={{color: 'white'}}>{content.badgeText}</span>
            </div>
            
            <h1 className="heading-primary text-4xl sm:text-5xl lg:text-6xl xl:text-7xl mb-6" style={{color: 'white'}}>
              {content.heroTitle}
            </h1>
            
            <motion.div
              initial={{ width: 0 }}
              animate={isInView ? { width: "200px" } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-1 bg-gradient-to-r from-white to-gray-300 mx-auto mb-8"
            />
            
            <p className="body-text text-lg sm:text-xl lg:text-2xl max-w-4xl mx-auto leading-relaxed" style={{color: 'white'}}>
              {content.heroSubtitle}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Program Overview */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass-card p-8 mb-16"
          >
            <h2 className="heading-secondary text-2xl sm:text-3xl lg:text-4xl mb-6 text-center" style={{color: 'white'}}>
              {content.missionTitle}
            </h2>
            <p className="body-text text-lg text-center max-w-4xl mx-auto leading-relaxed" style={{color: '#BBBBBB'}}>
              {content.missionText}
            </p>
          </motion.div>

          {/* Three Phase Structure */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {content.phases.map((phase: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="glass-card p-6 h-full"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-white/30 to-white/10 rounded-full flex items-center justify-center mb-4">
                    {(() => {
                      const IconComponent = getPhaseIcon(index);
                      return <IconComponent className="w-8 h-8" style={{color: 'white'}} />;
                    })()}
                  </div>
                  <h3 className="heading-secondary text-xl mb-2" style={{color: 'white'}}>{phase.title}</h3>
                  <div className="flex items-center justify-center gap-2 text-sm mb-4" style={{color: '#BBBBBB'}}>
                    <ClockIcon className="w-4 h-4" />
                    <span>{phase.duration}</span>
                  </div>
                  <p className="body-text text-sm leading-relaxed mb-6" style={{color: '#BBBBBB'}}>
                    {phase.description}
                  </p>
                </div>
                
                <ul className="space-y-3">
                  {phase.details.map((detail: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircleIcon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm leading-relaxed" style={{color: '#BBBBBB'}}>{detail}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-12 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="heading-secondary text-2xl sm:text-3xl lg:text-4xl mb-6" style={{color: 'white'}}>
              {content.timelineTitle}
            </h2>
            <p className="body-text text-lg max-w-3xl mx-auto" style={{color: '#BBBBBB'}}>
              {content.timelineSubtitle}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {content.timeline.map((item: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-6 text-center"
              >
                <div className="w-8 h-8 mx-auto bg-white/20 rounded-full flex items-center justify-center font-bold text-sm mb-4" style={{color: 'white'}}>
                  {index + 1}
                </div>
                <h3 className="font-semibold mb-2 text-sm" style={{color: 'white'}}>{item.phase}</h3>
                <p className="text-xs" style={{color: '#BBBBBB'}}>{item.timing}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="heading-secondary text-2xl sm:text-3xl lg:text-4xl mb-6" style={{color: 'white'}}>
              {content.benefitsTitle}
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="glass-card p-6"
            >
              <h3 className="font-bold text-lg mb-4 flex items-center gap-3" style={{color: 'white'}}>
                <AcademicCapIcon className="w-6 h-6" />
                For Students
              </h3>
              <ul className="space-y-3">
                {content.benefits.students.map((benefit: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <ArrowRightIcon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm" style={{color: '#BBBBBB'}}>{benefit}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="glass-card p-6"
            >
              <h3 className="font-bold text-lg mb-4 flex items-center gap-3" style={{color: 'white'}}>
                <BriefcaseIcon className="w-6 h-6" />
                For Companies
              </h3>
              <ul className="space-y-3">
                {content.benefits.companies.map((benefit: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <ArrowRightIcon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm" style={{color: '#BBBBBB'}}>{benefit}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="glass-card p-6"
            >
              <h3 className="font-bold text-lg mb-4 flex items-center gap-3" style={{color: 'white'}}>
                <ChartBarIcon className="w-6 h-6" />
                For Ross/COE
              </h3>
              <ul className="space-y-3">
                {content.benefits.university.map((benefit: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <ArrowRightIcon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm" style={{color: '#BBBBBB'}}>{benefit}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Available Opportunities */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-12 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="heading-secondary text-2xl sm:text-3xl lg:text-4xl mb-6" style={{color: 'white'}}>
              {content.opportunitiesTitle}
            </h2>
            <p className="body-text text-lg max-w-3xl mx-auto" style={{color: '#BBBBBB'}}>
              {content.opportunitiesSubtitle}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {projects.length === 0 ? (
              <div className="col-span-2 text-center py-12">
                <BriefcaseIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2" style={{color: 'white'}}>No Open Opportunities</h3>
                <p style={{color: '#BBBBBB'}}>Check back soon for new internship opportunities!</p>
              </div>
            ) : (
              projects.map((project: any, index: number) => {
                const company = companies.find(c => c.id === project.companyId);
                const skills = project.skills ? JSON.parse(project.skills) : [];
                
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.2 }}
                    viewport={{ once: true }}
                    className="glass-card p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg mb-1" style={{color: 'white'}}>{project.title}</h3>
                        <p className="text-sm" style={{color: '#BBBBBB'}}>{company?.name || 'Unknown Company'}</p>
                      </div>
                      <span 
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          project.status === 'OPEN' ? 'bg-green-600' : 
                          project.status === 'CLOSED' ? 'bg-red-600' : 
                          project.status === 'FILLED' ? 'bg-yellow-600' : 'bg-gray-600'
                        }`}
                        style={{color: 'white'}}
                      >
                        {project.status}
                      </span>
                    </div>
                    
                    <p className="text-sm mb-4" style={{color: '#BBBBBB'}}>
                      {project.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="font-medium" style={{color: 'white'}}>Duration:</span>
                        <p style={{color: '#BBBBBB'}}>{project.duration || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium" style={{color: 'white'}}>Location:</span>
                        <p style={{color: '#BBBBBB'}}>{project.location || 'N/A'}</p>
                      </div>
                    </div>
                    
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {skills.slice(0, 3).map((skill: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-blue-600 text-xs rounded-full" style={{color: 'white'}}>
                            {skill}
                          </span>
                        ))}
                        {skills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-600 text-xs rounded-full" style={{color: 'white'}}>
                            +{skills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    {project.status === 'OPEN' && project.linkedForm ? (
                      <a
                        href={`/forms/${project.linkedForm}`}
                        className="block w-full bg-white hover:bg-gray-100 py-2 rounded-lg transition-colors text-center font-medium"
                        style={{color: '#00274c'}}
                      >
                        Apply Now
                      </a>
                    ) : project.status === 'FILLED' ? (
                      <button disabled className="w-full bg-gray-500 py-2 rounded-lg opacity-50 cursor-not-allowed" style={{color: 'white'}}>
                        Position Filled
                      </button>
                    ) : project.status === 'CLOSED' ? (
                      <button disabled className="w-full bg-gray-500 py-2 rounded-lg opacity-50 cursor-not-allowed" style={{color: 'white'}}>
                        Applications Closed
                      </button>
                    ) : (
                      <button disabled className="w-full bg-gray-500 py-2 rounded-lg opacity-50 cursor-not-allowed" style={{color: 'white'}}>
                        Application Coming Soon
                      </button>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass-card p-8 text-center"
          >
            <h2 className="heading-secondary text-2xl sm:text-3xl mb-6" style={{color: 'white'}}>
              {content.ctaTitle}
            </h2>
            <p className="body-text text-lg mb-8 leading-relaxed" style={{color: '#BBBBBB'}}>
              {content.ctaSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/#join" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#ffffff',
                  color: '#000000',
                  fontWeight: '700',
                  padding: '12px 32px',
                  borderRadius: '50px',
                  textDecoration: 'none',
                  border: '2px solid #00274c',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}
              >

              </a>
              <a 
                href="mailto:ABGContact@umich.edu" 
                className="btn-secondary inline-flex items-center justify-center"
                style={{color: 'white'}}
              >
                <span>Contact Us</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 