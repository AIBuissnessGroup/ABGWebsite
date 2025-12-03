'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchJobs, analyzeJobs, getInterviewTips, getBehavioralQuestions, Job, AnalyzedJob } from '@/lib/projectStartup';
import { SupportedLanguage, t, getLanguageName, getNativeLanguageName, SUPPORTED_LANGUAGES, TranslationKey } from '@/lib/fluentlyTranslations';
import LanguageSelector from './LanguageSelector';

type MessageType = 'bot' | 'user' | 'system' | 'language-selector';

interface Message {
  id: string;
  type: MessageType;
  content: string;
  jobs?: Job[];
  analyzedJobs?: AnalyzedJob[];
}

type ConversationStep = 
  | 'select_language'
  | 'get_name'
  | 'get_location' 
  | 'get_skills'
  | 'searching_jobs'
  | 'show_jobs'
  | 'select_job'
  | 'show_tips'
  | 'ask_questions'
  | 'show_questions'
  | 'complete';

export default function ProjectStartupChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<ConversationStep>('select_language');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdCounter = useRef(0);
  const hasInitialized = useRef(false);

  // Helper function for translations - uses current language state
  const translate = useCallback((key: TranslationKey, params?: Record<string, string | number>) => {
    return t(key, language, params);
  }, [language]);

  // User data collected during conversation
  const [userData, setUserData] = useState({
    name: '',
    location: '',
    skills: '',
  });

  // Job data
  const [jobs, setJobs] = useState<Job[]>([]);
  const [analyzedJobs, setAnalyzedJobs] = useState<AnalyzedJob[]>([]);
  const [selectedJobIndex, setSelectedJobIndex] = useState<number | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Start conversation with language selection (use default English for initial prompt)
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    // Add welcome message and language selector using English (default)
    const welcomeMsg = t('welcome_message', 'en');
    const selectLangPrompt = t('select_language_prompt', 'en');
    addBotMessage(welcomeMsg + '\n\n' + selectLangPrompt);
    addLanguageSelectorMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (type: MessageType, content: string, extra?: Partial<Message>) => {
    messageIdCounter.current += 1;
    const newMessage: Message = {
      id: `msg-${messageIdCounter.current}-${Date.now()}`,
      type,
      content,
      ...extra,
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const addBotMessage = (content: string, extra?: Partial<Message>) => {
    return addMessage('bot', content, extra);
  };

  const addUserMessage = (content: string) => {
    return addMessage('user', content);
  };

  const addSystemMessage = (content: string) => {
    return addMessage('system', content);
  };

  const addLanguageSelectorMessage = () => {
    return addMessage('language-selector', '');
  };

  // Handle language selection from the LanguageSelector component
  const handleLanguageSelect = (selectedLang: SupportedLanguage) => {
    if (isLoading || step !== 'select_language') return;
    
    setLanguage(selectedLang);
    
    // Add user message showing their selection
    const langName = getNativeLanguageName(selectedLang);
    addUserMessage(langName);
    
    // Confirm selection and ask for name in the selected language
    const confirmMsg = t('language_selected', selectedLang, { language: langName });
    const askNameMsg = t('ask_name', selectedLang);
    addBotMessage(confirmMsg + '\n\n' + askNameMsg);
    
    setStep('get_name');
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    // Don't allow text input during language selection step
    if (step === 'select_language') return;

    const userInput = input.trim();
    setInput('');
    addUserMessage(userInput);
    setIsLoading(true);

    try {
      await processInput(userInput);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addBotMessage(translate('error_message', { error: errorMessage }));
      setIsLoading(false);
    }
  };

  const processInput = async (userInput: string) => {
    switch (step) {
      case 'get_name':
        // Collect name
        setUserData(prev => ({ ...prev, name: userInput }));
        setStep('get_location');
        addBotMessage(translate('nice_to_meet', { name: userInput }) + '\n\n' + translate('ask_location'));
        break;

      case 'get_location':
        // Collect location
        setUserData(prev => ({ ...prev, location: userInput }));
        setStep('get_skills');
        addBotMessage(translate('ask_skills'));
        break;

      case 'get_skills':
        // Collect skills and search jobs
        setUserData(prev => ({ ...prev, skills: userInput }));
        setStep('searching_jobs');
        addSystemMessage(translate('searching_jobs'));
        
        try {
          const jobResults = await searchJobs(userData.location, userInput, 20);
          setJobs(jobResults.jobs);

          if (jobResults.jobs.length === 0) {
            addBotMessage(translate('no_jobs_found'));
            setStep('complete');
            setIsLoading(false);
            return;
          }

          addSystemMessage(translate('found_jobs', { count: jobResults.jobs.length }));

          // Analyze jobs with AI - pass the full language name for the API
          const langName = getLanguageName(language);
          const analysis = await analyzeJobs(jobResults.jobs, userInput, langName);
          setAnalyzedJobs(analysis.analyzed_jobs);

          // Show top 10 ranked jobs
          const topJobs = analysis.ranked_jobs.slice(0, 10).map(index => ({
            ...jobResults.jobs[index],
            analysis: analysis.analyzed_jobs.find(aj => aj.job_index === index),
          }));

          let jobListMessage = translate('top_matches_header') + '\n\n';
          topJobs.forEach((job, idx) => {
            const matchScore = job.analysis?.match_score || 0;
            jobListMessage += `**${idx + 1}. ${job.title}** at ${job.company}\n`;
            jobListMessage += `   📍 ${job.location} | ${translate('match_label')}: ${matchScore}%\n`;
            if (job.analysis?.match_reasons && job.analysis.match_reasons.length > 0) {
              jobListMessage += `   ✨ ${job.analysis.match_reasons[0]}\n`;
            }
            jobListMessage += '\n';
          });

          jobListMessage += '\n' + translate('select_job_prompt');

          addBotMessage(jobListMessage, { 
            jobs: topJobs.map(j => ({ ...j, analysis: undefined })),
            analyzedJobs: analysis.analyzed_jobs 
          });
          setStep('select_job');
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          addBotMessage(translate('error_message', { error: errorMessage }));
          setStep('complete');
        }
        break;

      case 'select_job':
        // User selects a job
        const jobNum = parseInt(userInput);
        if (isNaN(jobNum) || jobNum < 1 || jobNum > Math.min(10, jobs.length)) {
          addBotMessage(translate('enter_valid_job_number'));
          setIsLoading(false);
          return;
        }

        setSelectedJobIndex(jobNum - 1);
        const selectedJob = jobs[jobNum - 1];
        const jobAnalysis = analyzedJobs.find(aj => aj.job_index === jobNum - 1);

        addSystemMessage(translate('getting_tips', { jobTitle: selectedJob.title }));
        setStep('show_tips');

        try {
          const langName = getLanguageName(language);
          const tips = await getInterviewTips(
            selectedJob.title,
            selectedJob.company,
            langName
          );

          let detailMessage = `**${selectedJob.title}** at ${selectedJob.company}\n`;
          detailMessage += `📍 ${selectedJob.location}\n\n`;
          
          if (jobAnalysis) {
            detailMessage += `**${translate('match_score')}:** ${jobAnalysis.match_score}%\n\n`;
            if (jobAnalysis.match_reasons.length > 0) {
              detailMessage += `**${translate('why_good_fit')}:**\n`;
              jobAnalysis.match_reasons.forEach(reason => {
                detailMessage += `✓ ${reason}\n`;
              });
              detailMessage += '\n';
            }
            if (jobAnalysis.missing_skills.length > 0) {
              detailMessage += `**${translate('skills_to_highlight')}:**\n`;
              jobAnalysis.missing_skills.forEach(skill => {
                detailMessage += `• ${skill}\n`;
              });
              detailMessage += '\n';
            }
          }

          detailMessage += `**${translate('interview_tips')}:**\n${tips}`;

          addBotMessage(detailMessage);
          setStep('ask_questions');
          addBotMessage(translate('want_questions'));
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          addBotMessage(translate('error_message', { error: errorMessage }));
          setStep('complete');
        }
        break;

      case 'ask_questions':
        // Check for affirmative response in multiple languages
        const input_lower = userInput.toLowerCase();
        const wantsQuestions = input_lower.includes('yes') || 
                               input_lower.includes('y') ||
                               input_lower.includes('sí') ||
                               input_lower.includes('si') ||
                               input_lower.includes('oui');
        
        if (wantsQuestions && selectedJobIndex !== null) {
          const selectedJob = jobs[selectedJobIndex];
          addSystemMessage(translate('generating_questions'));
          setStep('show_questions');

          try {
            const langName = getLanguageName(language);
            const questions = await getBehavioralQuestions(
              selectedJob.title,
              selectedJob.company,
              langName
            );

            addBotMessage(`**${translate('behavioral_questions')}:**\n\n${questions}`);
            setStep('complete');
            addBotMessage(translate('session_complete') + '\n\n' + translate('refresh_to_restart'));
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            addBotMessage(translate('error_message', { error: errorMessage }));
            setStep('complete');
          }
        } else {
          addBotMessage(translate('session_complete') + '\n\n' + translate('refresh_to_restart'));
          setStep('complete');
        }
        break;

      case 'complete':
        addBotMessage(translate('refresh_to_restart'));
        break;

      default:
        addBotMessage(translate('error_message', { error: 'Something went wrong' }));
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Determine input placeholder based on step and language
  const getInputPlaceholder = () => {
    if (isLoading) return translate('processing');
    if (step === 'complete') return translate('refresh_to_restart');
    if (step === 'select_language') return translate('select_language_prompt');
    return translate('type_message');
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-blue-800/30 backdrop-blur-sm border-b border-blue-700/50 px-6 py-4">
        <h2 className="text-2xl font-bold text-white">{translate('career_assistant')}</h2>
        <p className="text-blue-200 text-sm mt-1">{translate('career_assistant_desc')}</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'language-selector' ? (
                <div className="w-full py-2">
                  <LanguageSelector 
                    onSelect={handleLanguageSelect}
                    disabled={isLoading || step !== 'select_language'}
                  />
                </div>
              ) : (
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.type === 'system'
                      ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30'
                      : 'bg-slate-800/70 text-white border border-slate-700/50'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {message.content}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-slate-800/70 rounded-2xl px-5 py-3 border border-slate-700/50">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-blue-700/50 bg-blue-800/20 backdrop-blur-sm px-6 py-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading || step === 'complete' || step === 'select_language'}
            placeholder={getInputPlaceholder()}
            className="flex-1 bg-slate-800/50 text-white border border-slate-700/50 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || step === 'complete' || step === 'select_language'}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            {translate('send_button')}
          </button>
        </div>
      </div>
    </div>
  );
}
