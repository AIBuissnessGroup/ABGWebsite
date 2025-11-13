'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchJobs, analyzeJobs, translateText, getInterviewTips, getBehavioralQuestions, Job, AnalyzedJob } from '@/lib/projectStartup';

type MessageType = 'bot' | 'user' | 'system';

interface Message {
  id: string;
  type: MessageType;
  content: string;
  jobs?: Job[];
  analyzedJobs?: AnalyzedJob[];
}

type ConversationStep = 
  | 'welcome'
  | 'get_name'
  | 'get_location' 
  | 'get_language'
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
  const [step, setStep] = useState<ConversationStep>('welcome');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdCounter = useRef(0);

  // User data collected during conversation
  const [userData, setUserData] = useState({
    name: '',
    location: '',
    language: 'English',
    skills: '',
  });

  // Job data
  const [jobs, setJobs] = useState<Job[]>([]);
  const [analyzedJobs, setAnalyzedJobs] = useState<AnalyzedJob[]>([]);
  const [selectedJobIndex, setSelectedJobIndex] = useState<number | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Start conversation
    addBotMessage('👋 Welcome! I\'m your AI career assistant. I\'ll help you find the perfect job match and prepare for interviews.\n\nWhat\'s your name?');
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    setInput('');
    addUserMessage(userInput);
    setIsLoading(true);

    try {
      await processInput(userInput);
    } catch (error: any) {
      addBotMessage(`❌ Sorry, I encountered an error: ${error.message}. Please try again.`);
      setIsLoading(false);
    }
  };

  const processInput = async (userInput: string) => {
    switch (step) {
      case 'welcome':
        // Collect name
        setUserData(prev => ({ ...prev, name: userInput }));
        setStep('get_location');
        addBotMessage(`Nice to meet you, ${userInput}! 🎯\n\nWhat city or location are you looking for jobs in?`);
        break;

      case 'get_location':
        // Collect location
        setUserData(prev => ({ ...prev, location: userInput }));
        setStep('get_language');
        addBotMessage('🌍 What language would you like me to use? (e.g., English, Spanish, Chinese, etc.)');
        break;

      case 'get_language':
        // Collect language
        setUserData(prev => ({ ...prev, language: userInput }));
        setStep('get_skills');
        const translatedSkillsPrompt = await translateText(
          'Great! Now tell me about your skills and experience. What kind of work are you looking for?',
          userInput
        );
        addBotMessage(`💼 ${translatedSkillsPrompt}`);
        break;

      case 'get_skills':
        // Collect skills and search jobs
        setUserData(prev => ({ ...prev, skills: userInput }));
        setStep('searching_jobs');
        addSystemMessage('🔍 Searching for jobs...');
        
        try {
          const jobResults = await searchJobs(userData.location, userInput, 20);
          setJobs(jobResults.jobs);

          if (jobResults.jobs.length === 0) {
            addBotMessage('😔 I couldn\'t find any jobs matching your criteria. Try broadening your search terms or location.');
            setStep('complete');
            setIsLoading(false);
            return;
          }

          addSystemMessage(`✅ Found ${jobResults.jobs.length} jobs! Analyzing matches...`);

          // Analyze jobs with AI
          const analysis = await analyzeJobs(jobResults.jobs, userInput, userData.language);
          setAnalyzedJobs(analysis.analyzed_jobs);

          // Show top 10 ranked jobs
          const topJobs = analysis.ranked_jobs.slice(0, 10).map(index => ({
            ...jobResults.jobs[index],
            analysis: analysis.analyzed_jobs.find(aj => aj.job_index === index),
          }));

          let jobListMessage = '🎯 Here are your top job matches:\n\n';
          topJobs.forEach((job, idx) => {
            const matchScore = job.analysis?.match_score || 0;
            jobListMessage += `**${idx + 1}. ${job.title}** at ${job.company}\n`;
            jobListMessage += `   📍 ${job.location} | Match: ${matchScore}%\n`;
            if (job.analysis?.match_reasons && job.analysis.match_reasons.length > 0) {
              jobListMessage += `   ✨ ${job.analysis.match_reasons[0]}\n`;
            }
            jobListMessage += '\n';
          });

          jobListMessage += '\n💡 Type a number (1-10) to learn more about a job and get interview tips!';

          addBotMessage(jobListMessage, { 
            jobs: topJobs.map(j => ({ ...j, analysis: undefined })),
            analyzedJobs: analysis.analyzed_jobs 
          });
          setStep('select_job');
        } catch (error: any) {
          addBotMessage(`❌ Error searching jobs: ${error.message}`);
          setStep('complete');
        }
        break;

      case 'select_job':
        // User selects a job
        const jobNum = parseInt(userInput);
        if (isNaN(jobNum) || jobNum < 1 || jobNum > Math.min(10, jobs.length)) {
          addBotMessage('Please enter a valid job number (1-10).');
          setIsLoading(false);
          return;
        }

        setSelectedJobIndex(jobNum - 1);
        const selectedJob = jobs[jobNum - 1];
        const analysis = analyzedJobs.find(aj => aj.job_index === jobNum - 1);

        addSystemMessage(`📋 Getting interview tips for ${selectedJob.title}...`);
        setStep('show_tips');

        try {
          const tips = await getInterviewTips(
            selectedJob.title,
            selectedJob.company,
            userData.language
          );

          let detailMessage = `**${selectedJob.title}** at ${selectedJob.company}\n`;
          detailMessage += `📍 ${selectedJob.location}\n\n`;
          
          if (analysis) {
            detailMessage += `**Match Score:** ${analysis.match_score}%\n\n`;
            if (analysis.match_reasons.length > 0) {
              detailMessage += `**Why you're a good fit:**\n`;
              analysis.match_reasons.forEach(reason => {
                detailMessage += `✓ ${reason}\n`;
              });
              detailMessage += '\n';
            }
            if (analysis.missing_skills.length > 0) {
              detailMessage += `**Skills to highlight:**\n`;
              analysis.missing_skills.forEach(skill => {
                detailMessage += `• ${skill}\n`;
              });
              detailMessage += '\n';
            }
          }

          detailMessage += `**🎯 Interview Tips:**\n${tips}`;

          addBotMessage(detailMessage);
          setStep('ask_questions');
          addBotMessage('Would you like me to generate behavioral interview questions for this role? (yes/no)');
        } catch (error: any) {
          addBotMessage(`❌ Error getting interview tips: ${error.message}`);
          setStep('complete');
        }
        break;

      case 'ask_questions':
        const wantsQuestions = userInput.toLowerCase().includes('yes') || 
                               userInput.toLowerCase().includes('y');
        
        if (wantsQuestions && selectedJobIndex !== null) {
          const selectedJob = jobs[selectedJobIndex];
          addSystemMessage('💭 Generating behavioral interview questions...');
          setStep('show_questions');

          try {
            const questions = await getBehavioralQuestions(
              selectedJob.title,
              selectedJob.company,
              userData.language
            );

            addBotMessage(`**Behavioral Interview Questions:**\n\n${questions}`);
            setStep('complete');
            addBotMessage('🎉 Great! You\'re now prepared for your interview. Good luck!\n\nRefresh to start over or close this window.');
          } catch (error: any) {
            addBotMessage(`❌ Error generating questions: ${error.message}`);
            setStep('complete');
          }
        } else {
          addBotMessage('🎉 Great! You\'re now prepared for your interview. Good luck!\n\nRefresh to start over or close this window.');
          setStep('complete');
        }
        break;

      case 'complete':
        addBotMessage('Our session is complete. Refresh to start a new session!');
        break;

      default:
        addBotMessage('Something went wrong. Please refresh and try again.');
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-blue-800/30 backdrop-blur-sm border-b border-blue-700/50 px-6 py-4">
        <h2 className="text-2xl font-bold text-white">🚀 Career Assistant</h2>
        <p className="text-blue-200 text-sm mt-1">Your AI-powered job matching & interview prep tool</p>
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
            disabled={isLoading || step === 'complete'}
            placeholder={isLoading ? 'Processing...' : step === 'complete' ? 'Session complete' : 'Type your message...'}
            className="flex-1 bg-slate-800/50 text-white border border-slate-700/50 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || step === 'complete'}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
