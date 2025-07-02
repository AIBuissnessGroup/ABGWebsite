'use client';
import { motion } from 'framer-motion';
import { useRef } from 'react';
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

  const phases = [
    {
      title: "Internal Project Phase",
      description: "Students complete a vetted project under AI Business Group mentorship.",
      duration: "8–10 weeks",
      icon: AcademicCapIcon,
      details: [
        "Eligibility: Ross/COE/LSA students involved in AI Business Group projects",
        "High-quality, original, and impactful AI work with business relevance",
        "Project report, working model/prototype, and executive summary/pitch deck"
      ]
    },
    {
      title: "Internship Matching Phase", 
      description: "Top performers are referred to company partners for internship opportunities.",
      duration: "2-3 weeks",
      icon: BriefcaseIcon,
      details: [
        "Past projects evaluation and project feedback forms",
        "PM direct input and club participation assessment",
        "Company intake with detailed project descriptions",
        "Interview process and final selection"
      ]
    },
    {
      title: "Internal Support Phase",
      description: "Technical preparation and mentorship before internships begin.",
      duration: "2-4 weeks",
      icon: UsersIcon,
      details: [
        "Technical prep with ABG mentor/eBoard/VP Education",
        "Skill development and project preparation",
        "Industry readiness and professional development"
      ]
    }
  ];

  const timeline = [
    { phase: "New Member Recruitment", timing: "Weeks 1-4" },
    { phase: "Project Groups Decided", timing: "Week 5" },
    { phase: "Project Work Period", timing: "Weeks 6–14" },
    { phase: "Project Review + Selection", timing: "Weeks 13–14" },
    { phase: "Internship Matching Outreach", timing: "Weeks 15–16" },
    { phase: "Internship Period", timing: "Summer or following term" },
    { phase: "Feedback", timing: "Post-internship" }
  ];

  const benefits = {
    students: [
      "Get practical AI experience",
      "Build resumes with real company exposure", 
      "Access Ross/COE recruiting pipelines",
      "Work on cutting-edge AI projects",
      "Receive mentorship from industry professionals"
    ],
    companies: [
      "Access to pre-vetted, passionate AI students",
      "Reduced risk via project-based screening",
      "Collaboration with a premier university program",
      "Early access to top AI talent",
      "Flexible internship structures"
    ],
    university: [
      "Enhanced student career outcomes",
      "Strengthened industry ties in AI",
      "Encourages interdisciplinary, entrepreneurial student work",
      "Bridges academic learning with industry application"
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2c45] via-[#00274c] to-[#0d1d35]">
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-[#BBBBBB] text-sm mb-6">
              <SparklesIcon className="w-4 h-4" />
              <span>AI Business Group Applied AI Internship Program</span>
            </div>
            
            <h1 className="heading-primary text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white mb-6">
              Launch Your AI Career
            </h1>
            
            <motion.div
              initial={{ width: 0 }}
              animate={isInView ? { width: "200px" } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-1 bg-gradient-to-r from-[#BBBBBB] to-white mx-auto mb-8"
            />
            
            <p className="body-text text-lg sm:text-xl lg:text-2xl text-[#BBBBBB] max-w-4xl mx-auto leading-relaxed">
              High-impact, real-world AI internship opportunities through Michigan Ross/COE recruitment pipelines and industry partnerships
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
            <h2 className="heading-secondary text-2xl sm:text-3xl lg:text-4xl text-white mb-6 text-center">
              Program Mission
            </h2>
            <p className="body-text text-lg text-[#BBBBBB] text-center max-w-4xl mx-auto leading-relaxed">
              To provide high-impact, real-world AI internship opportunities to ABG students by partnering with 
              Michigan Ross/COE recruitment pipelines and company demand for applied AI talent.
            </p>
          </motion.div>

          {/* Three Phase Structure */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {phases.map((phase, index) => (
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
                    <phase.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="heading-secondary text-xl text-white mb-2">{phase.title}</h3>
                  <div className="flex items-center justify-center gap-2 text-[#BBBBBB] text-sm mb-4">
                    <ClockIcon className="w-4 h-4" />
                    <span>{phase.duration}</span>
                  </div>
                  <p className="body-text text-[#BBBBBB] text-sm leading-relaxed mb-6">
                    {phase.description}
                  </p>
                </div>
                
                <ul className="space-y-3">
                  {phase.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircleIcon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-[#BBBBBB] text-sm leading-relaxed">{detail}</span>
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
            <h2 className="heading-secondary text-2xl sm:text-3xl lg:text-4xl text-white mb-6">
              Program Timeline
            </h2>
            <p className="body-text text-lg text-[#BBBBBB] max-w-3xl mx-auto">
              Typical UMich semester spans ~15 weeks with 1 finals week
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {timeline.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-6 text-center"
              >
                <div className="w-8 h-8 mx-auto bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm mb-4">
                  {index + 1}
                </div>
                <h3 className="text-white font-semibold mb-2 text-sm">{item.phase}</h3>
                <p className="text-[#BBBBBB] text-xs">{item.timing}</p>
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
            <h2 className="heading-secondary text-2xl sm:text-3xl lg:text-4xl text-white mb-6">
              Benefits for All Stakeholders
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
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-3">
                <AcademicCapIcon className="w-6 h-6" />
                For Students
              </h3>
              <ul className="space-y-3">
                {benefits.students.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <ArrowRightIcon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-[#BBBBBB] text-sm">{benefit}</span>
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
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-3">
                <BriefcaseIcon className="w-6 h-6" />
                For Companies
              </h3>
              <ul className="space-y-3">
                {benefits.companies.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <ArrowRightIcon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-[#BBBBBB] text-sm">{benefit}</span>
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
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-3">
                <ChartBarIcon className="w-6 h-6" />
                For Ross/COE
              </h3>
              <ul className="space-y-3">
                {benefits.university.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <ArrowRightIcon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-[#BBBBBB] text-sm">{benefit}</span>
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
            <h2 className="heading-secondary text-2xl sm:text-3xl lg:text-4xl text-white mb-6">
              Current Opportunities
            </h2>
            <p className="body-text text-lg text-[#BBBBBB] max-w-3xl mx-auto">
              Explore available internship positions with our partner companies
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Mock Opportunity 1 */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="glass-card p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">AI Research Intern</h3>
                  <p className="text-[#BBBBBB] text-sm">TechCorp Inc.</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Open
                </span>
              </div>
              
              <p className="text-[#BBBBBB] text-sm mb-4">
                Work on cutting-edge NLP projects and machine learning model development.
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-white font-medium">Duration:</span>
                  <p className="text-[#BBBBBB]">12 weeks</p>
                </div>
                <div>
                  <span className="text-white font-medium">Location:</span>
                  <p className="text-[#BBBBBB]">Remote</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {['Python', 'PyTorch', 'NLP'].map((skill, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
              
              <button className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg transition-colors">
                Apply Now
              </button>
            </motion.div>

            {/* Mock Opportunity 2 */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="glass-card p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">ML Engineering Intern</h3>
                  <p className="text-[#BBBBBB] text-sm">StartupAI</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  Filled
                </span>
              </div>
              
              <p className="text-[#BBBBBB] text-sm mb-4">
                Build production ML pipelines and deploy AI models at scale.
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-white font-medium">Duration:</span>
                  <p className="text-[#BBBBBB]">10 weeks</p>
                </div>
                <div>
                  <span className="text-white font-medium">Location:</span>
                  <p className="text-[#BBBBBB]">San Francisco</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {['Python', 'Docker', 'AWS'].map((skill, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
              
              <button disabled className="w-full bg-gray-500 text-white py-2 rounded-lg opacity-50 cursor-not-allowed">
                Position Filled
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Application Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass-card p-8"
          >
            <h2 className="heading-secondary text-2xl sm:text-3xl text-white mb-6 text-center">
              Apply to the Program
            </h2>
            <p className="body-text text-lg text-[#BBBBBB] mb-8 text-center leading-relaxed">
              Submit your application to join our Applied AI Internship Program
            </p>
            
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-[#BBBBBB] focus:outline-none focus:border-white/50"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-[#BBBBBB] focus:outline-none focus:border-white/50"
                    placeholder="your.email@umich.edu"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-medium mb-2">Year</label>
                  <select className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/50">
                    <option value="">Select your year</option>
                    <option value="freshman">Freshman</option>
                    <option value="sophomore">Sophomore</option>
                    <option value="junior">Junior</option>
                    <option value="senior">Senior</option>
                    <option value="graduate">Graduate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Major</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-[#BBBBBB] focus:outline-none focus:border-white/50"
                    placeholder="e.g., Computer Science"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Previous ABG Projects</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-[#BBBBBB] focus:outline-none focus:border-white/50"
                  placeholder="List any ABG projects you've been involved with..."
                />
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Technical Skills</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-[#BBBBBB] focus:outline-none focus:border-white/50"
                  placeholder="e.g., Python, Machine Learning, Data Analysis"
                />
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Why are you interested in this program?</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-[#BBBBBB] focus:outline-none focus:border-white/50"
                  placeholder="Tell us about your motivation and goals..."
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-white text-[#00274c] py-3 rounded-lg font-bold hover:bg-white/90 transition-colors"
              >
                Submit Application
              </button>
            </form>
          </motion.div>
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
            <h2 className="heading-secondary text-2xl sm:text-3xl text-white mb-6">
              Ready to Join the Program?
            </h2>
            <p className="body-text text-lg text-[#BBBBBB] mb-8 leading-relaxed">
              Get involved with AI Business Group projects to qualify for our internship program.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/#join" 
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                <span>Join ABG</span>
                <ArrowRightIcon className="w-4 h-4" />
              </a>
              <a 
                href="mailto:aibusinessgroup@umich.edu" 
                className="btn-secondary inline-flex items-center justify-center gap-2"
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