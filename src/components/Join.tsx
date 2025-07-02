'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import FloatingShapes from './FloatingShapes';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface JoinContent {
  title: string;
  subtitle: string;
  option1Title: string;
  option1Description: string;
  option1Benefits: string;
  option1CTA: string;
  option1Link: string;
  option2Title: string;
  option2Description: string;
  option2Benefits: string;
  option2CTA: string;
  option2Link: string;
  option3Title: string;
  option3Description: string;
  option3Benefits: string;
  option3CTA: string;
  contactTitle: string;
  contactEmail1: string;
  contactEmail2: string;
  contactEmail3: string;
}

export default function Join() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [content, setContent] = useState<JoinContent>({
    title: "JOIN THE FUTURE",
    subtitle: "Ready to shape tomorrow's business landscape? Multiple ways to get involved with ABG's mission to revolutionize how AI and business intersect.",
    option1Title: "BECOME A MEMBER",
    option1Description: "Join our core team and work on cutting-edge AI projects that solve real business problems.",
    option1Benefits: "Direct project involvement\nMentorship opportunities\nIndustry networking\nSkill development",
    option1CTA: "Apply Now",
    option1Link: "#",
    option2Title: "PARTNER WITH US",
    option2Description: "Collaborate on research, sponsor events, or provide mentorship to our growing community.",
    option2Benefits: "Strategic partnerships\nTalent pipeline access\nInnovation collaboration\nBrand visibility",
    option2CTA: "Explore Partnership",
    option2Link: "mailto:ABGPartnerships@umich.edu",
    option3Title: "STAY CONNECTED",
    option3Description: "Get updates on our latest projects, events, and opportunities in the AI business space.",
    option3Benefits: "Weekly insights\nEvent invitations\nProject showcases\nIndustry updates",
    option3CTA: "Subscribe",
    contactTitle: "QUESTIONS? LET'S CONNECT",
    contactEmail1: "aibusinessgroup@umich.edu",
    contactEmail2: "ABGPartnerships@umich.edu",
    contactEmail3: "ABGRecruitment@umich.edu"
  });
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  // Load join content from API
  useEffect(() => {
    fetch('/api/admin/join')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setContent(data);
        }
      })
      .catch(err => console.error('Failed to load join content:', err));
  }, []);

  // Create joinOptions from content
  const joinOptions = [
    {
      title: content.option1Title,
      description: content.option1Description,
      benefits: content.option1Benefits.split('\n'),
      cta: content.option1CTA,
      link: content.option1Link,
      type: "primary",
      icon: "🚀"
    },
    {
      title: content.option2Title,
      description: content.option2Description,
      benefits: content.option2Benefits.split('\n'),
      cta: content.option2CTA,
      link: content.option2Link,
      type: "secondary",
      icon: "🤝"
    },
    {
      title: content.option3Title,
      description: content.option3Description,
      benefits: content.option3Benefits.split('\n'),
      cta: content.option3CTA,
      type: "newsletter",
      icon: "📧"
    }
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setTimeout(() => {
        setIsSubscribed(false);
        setEmail('');
      }, 3000);
    }
  };

  return (
    <section 
      id="join" 
      ref={ref}
      className="min-h-screen py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-12 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, #1a2c45 0%, #00274c 50%, #0d1d35 100%)`,
      }}
    >
      {/* Floating Background Shapes */}
      <FloatingShapes variant="dense" opacity={0.05} />

      {/* Background Effects */}
      <div className="absolute inset-0">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute top-10 sm:top-20 left-10 sm:left-20 w-48 sm:w-96 h-48 sm:h-96 bg-gradient-to-r from-[#BBBBBB]/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-40 sm:w-80 h-40 sm:h-80 bg-gradient-to-l from-[#5e6472]/20 to-transparent rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 sm:mb-20"
        >
          <h2 className="heading-primary text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white mb-4 sm:mb-6">
            {content.title}
          </h2>
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: "180px" } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-1 bg-gradient-to-r from-[#BBBBBB] to-white mx-auto mb-6 sm:mb-8"
          />
          <p className="body-text text-lg sm:text-xl lg:text-2xl text-[#BBBBBB] max-w-4xl mx-auto leading-relaxed px-4">
            {content.subtitle}
          </p>
        </motion.div>

        {/* Join Options Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16 sm:mb-20">
          {joinOptions.map((option, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 + (index * 0.2) }}
              className="relative"
              onMouseEnter={() => setSelectedOption(index)}
              onMouseLeave={() => setSelectedOption(null)}
            >
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                className={`glass-card p-6 sm:p-8 h-full relative overflow-hidden ${
                  option.type === 'primary' ? 'border-white/30' : ''
                }`}
              >
                {/* Premium Badge for Primary Option */}
                {option.type === 'primary' && (
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 px-2 sm:px-3 py-1 bg-white text-[#00274c] text-xs font-bold rounded-full uppercase">
                    Most Popular
                  </div>
                )}

                {/* Icon */}
                <div className="text-center mb-6 sm:mb-8">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-white/30 to-white/10 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                    <span className="text-2xl sm:text-3xl">{option.icon}</span>
                  </div>
                  <h3 className="heading-secondary text-xl sm:text-2xl text-white mb-3 sm:mb-4">
                    {option.title}
                  </h3>
                  <p className="body-text text-sm sm:text-base text-[#BBBBBB] leading-relaxed mb-4 sm:mb-6">
                    {option.description}
                  </p>
                </div>

                {/* Benefits */}
                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  <h4 className="text-white font-semibold text-sm sm:text-base mb-2 sm:mb-3">What you get:</h4>
                  <ul className="space-y-2 sm:space-y-3">
                    {option.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 sm:gap-3">
                        <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-[#BBBBBB] text-xs sm:text-sm leading-relaxed">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-auto"
                >
                  {option.type === 'newsletter' ? (
                    <div className="space-y-3 sm:space-y-4">
                      <input
                        type="email"
                        placeholder="Enter your email"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-[#BBBBBB] focus:outline-none focus:border-white/50 text-sm sm:text-base"
                      />
                      <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-lg py-2 sm:py-3 text-white font-medium transition-all duration-300 text-sm sm:text-base">
                        {option.cta}
                      </button>
                    </div>
                  ) : (
                    <a
                      href={option.link}
                      className={`block w-full text-center py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-bold text-sm sm:text-base transition-all duration-300 ${
                        option.type === 'primary' 
                          ? 'bg-white text-[#00274c] hover:bg-white/90 hover:scale-105' 
                          : 'bg-white/20 text-white border border-white/30 hover:bg-white/30 hover:scale-105'
                      }`}
                    >
                      {option.cta}
                    </a>
                  )}
                </motion.div>

                {/* Hover Glow Effect */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: selectedOption === index ? 0.2 : 0 }}
                  className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg pointer-events-none"
                />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="text-center"
        >
          <div className="glass-card p-6 sm:p-8 max-w-4xl mx-auto">
            <h3 className="heading-secondary text-xl sm:text-2xl lg:text-3xl text-white mb-4 sm:mb-6">
              {content.contactTitle}
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 text-center">
              <div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-lg sm:text-xl">💬</span>
                </div>
                <h4 className="text-white font-bold mb-2 text-sm sm:text-base">General Inquiries</h4>
                <a href={`mailto:${content.contactEmail1}`} className="text-[#BBBBBB] hover:text-white transition text-xs sm:text-sm break-all">
                  {content.contactEmail1}
                </a>
              </div>
              <div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-lg sm:text-xl">🤝</span>
                </div>
                <h4 className="text-white font-bold mb-2 text-sm sm:text-base">Partnerships</h4>
                <a href={`mailto:${content.contactEmail2}`} className="text-[#BBBBBB] hover:text-white transition text-xs sm:text-sm break-all">
                  {content.contactEmail2}
                </a>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-lg sm:text-xl">💼</span>
                </div>
                <h4 className="text-white font-bold mb-2 text-sm sm:text-base">Recruitment</h4>
                <a href={`mailto:${content.contactEmail3}`} className="text-[#BBBBBB] hover:text-white transition text-xs sm:text-sm break-all">
                  {content.contactEmail3}
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
