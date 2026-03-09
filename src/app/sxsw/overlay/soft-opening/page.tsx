'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { OverlayWrapper, ABGLogoBox, AUSTIN_COLOR } from '../components';
import { FaLinkedin, FaInstagram } from 'react-icons/fa';

// Speaker type for headshots
interface Speaker {
  name: string;
  title: string;
  image?: string;
}

// Schedule item type
interface ScheduleItem {
  title: string;
  time: string;
  description?: string;
  speakers?: Speaker[];
  isUpNext?: boolean;
}

// Parse speakers from URL param format: "Name|Title|imageUrl,Name2|Title2|imageUrl2"
function parseSpeakers(speakerParam: string | null): Speaker[] {
  if (!speakerParam) return [];
  return speakerParam.split(',').map(s => {
    const [name, title, image] = s.split('|');
    return { name: name?.trim() || '', title: title?.trim() || '', image: image?.trim() };
  }).filter(s => s.name);
}

// Trivia Questions (UMich + ABG facts)
const TRIVIA_QUESTIONS = [
  // UMich Questions
  { question: "What year was the University of Michigan founded?", answer: "1817" },
  { question: "How many seats are in Michigan Stadium?", answer: "107,601" },
  { question: "What are Michigan's official colors?", answer: "Maize & Blue" },
  { question: "Who is the famous Google co-founder that attended UMich?", answer: "Larry Page" },
  { question: "What is the Michigan fight song called?", answer: "The Victors" },
  { question: "Which U.S. President announced the Peace Corps at Michigan?", answer: "JFK (1960)" },
  { question: "What is Michigan's stadium nickname?", answer: "The Big House" },
  { question: "How many student organizations does UMich have?", answer: "1,600+" },
  { question: "Michigan was founded how many years before Michigan became a state?", answer: "20 years" },
  { question: "How many living alumni does UMich have worldwide?", answer: "630,000+" },
  { question: "What year was 'The Victors' fight song written?", answer: "1898" },
  { question: "How many astronauts are UMich alumni?", answer: "8" },
  { question: "Which president is the Ford School of Public Policy named after?", answer: "Gerald R. Ford" },
  { question: "How much has 'The Michigan Difference' raised in philanthropy?", answer: "$5 billion+" },
  { question: "What rank is Michigan Engineering among public engineering schools?", answer: "#1" },
  { question: "Which famous deli in Ann Arbor has been visited by 3 U.S. presidents?", answer: "Zingerman's" },
  { question: "What year were Michigan's Maize and Blue colors adopted?", answer: "1867" },
  { question: "What years did Tom Brady play for Michigan Football?", answer: "1995-1999" },
  { question: "How many acres does the Ann Arbor campus span?", answer: "3,200+ acres" },
  { question: "Which UMich location has one of the largest early American document collections?", answer: "Clements Library" },
  // ABG Questions
  { question: "How many project team members does ABG currently have?", answer: "62 members" },
  { question: "How many active projects is ABG working on?", answer: "10 projects" },
  { question: "How many industry partners does ABG have?", answer: "20+" },
  { question: "What does ABG stand for?", answer: "AI Business Group" },
  { question: "Which schools at UMich is ABG affiliated with?", answer: "College of Engineering, School of Information & Ross" },
  { question: "What is ABG's Instagram handle?", answer: "@umichaibusiness" },
  { question: "What city is ABG presenting in at SXSW 2026?", answer: "Austin, Texas" },
  { question: "What is the name of ABG's signature event?", answer: "Hail to the Innovators" },
];

function SoftOpeningContent() {
  const searchParams = useSearchParams();
  
  // URL Parameters for vMix control
  const eventTitle = searchParams.get('title') || 'HAIL TO THE INNOVATORS';
  const eventSubtitle = searchParams.get('subtitle') || 'AI Business Group @ SXSW 2026';
  const countdownMinutes = parseInt(searchParams.get('minutes') || '14');
  const countdownSeconds = parseInt(searchParams.get('seconds') || '32');
  const upNextIndex = parseInt(searchParams.get('upnext') || '0'); // Which schedule item is up next (0-indexed)
  
  // Individual schedule item params
  const e1Title = searchParams.get('e1_title') || 'Preshow & Networking';
  const e1Time = searchParams.get('e1_time') || '10:30 AM';
  const e1Desc = searchParams.get('e1_desc') || '';
  const e1Speakers = parseSpeakers(searchParams.get('e1_speakers'));
  const e2Title = searchParams.get('e2_title') || 'Panel 1: AI Transformation';
  const e2Time = searchParams.get('e2_time') || '11:00 AM';
  const e2Desc = searchParams.get('e2_desc') || '';
  const e2Speakers = parseSpeakers(searchParams.get('e2_speakers'));
  const e3Title = searchParams.get('e3_title') || 'Panel 2: Student Builders';
  const e3Time = searchParams.get('e3_time') || '12:00 PM';
  const e3Desc = searchParams.get('e3_desc') || '';
  const e3Speakers = parseSpeakers(searchParams.get('e3_speakers'));
  const e4Title = searchParams.get('e4_title') || 'Lunch & Demos';
  const e4Time = searchParams.get('e4_time') || '1:00 PM';
  const e4Desc = searchParams.get('e4_desc') || '';
  const e4Speakers = parseSpeakers(searchParams.get('e4_speakers'));
  
  // State for countdown
  const [timeLeft, setTimeLeft] = useState({ minutes: countdownMinutes, seconds: countdownSeconds });
  
  // State for trivia - shows every other minute
  const [currentTriviaIndex, setCurrentTriviaIndex] = useState(0);
  const [showTrivia, setShowTrivia] = useState(false); // Whether trivia card is visible
  const [showTriviaAnswer, setShowTriviaAnswer] = useState(false);
  const [triviaProgress, setTriviaProgress] = useState(100); // 100% to 0% over 15 seconds
  
  // Build schedule from params
  const schedule: ScheduleItem[] = [
    { title: e1Title, time: e1Time, description: e1Desc, speakers: e1Speakers, isUpNext: upNextIndex === 0 },
    { title: e2Title, time: e2Time, description: e2Desc, speakers: e2Speakers, isUpNext: upNextIndex === 1 },
    { title: e3Title, time: e3Time, description: e3Desc, speakers: e3Speakers, isUpNext: upNextIndex === 2 },
    { title: e4Title, time: e4Time, description: e4Desc, speakers: e4Speakers, isUpNext: upNextIndex === 3 },
  ].filter(item => item.title); // Filter out empty items
  
  // Check if we're within 5 minutes
  const isHappeningSoon = timeLeft.minutes < 5 || (timeLeft.minutes === 5 && timeLeft.seconds === 0);
  
  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.minutes === 0 && prev.seconds === 0) {
          return prev;
        }
        if (prev.seconds === 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Helper function to get random trivia index
  const getRandomTriviaIndex = (currentIndex: number) => {
    let newIndex = Math.floor(Math.random() * TRIVIA_QUESTIONS.length);
    // Avoid showing same question twice in a row
    while (newIndex === currentIndex && TRIVIA_QUESTIONS.length > 1) {
      newIndex = Math.floor(Math.random() * TRIVIA_QUESTIONS.length);
    }
    return newIndex;
  };
  
  // Trivia timer: Shows every 30 seconds for 20 seconds (15s question + 5s answer)
  useEffect(() => {
    const TRIVIA_INTERVAL = 30000; // 30 seconds between trivia
    const QUESTION_DURATION = 15000; // 15 seconds for question
    const ANSWER_DURATION = 5000; // 5 seconds for answer
    const PROGRESS_INTERVAL = 50; // Update progress every 50ms
    
    let triviaElapsed = 0;
    let phase: 'waiting' | 'question' | 'answer' = 'waiting';
    let phaseElapsed = 0;
    
    // Start with first trivia immediately (randomized)
    setTimeout(() => {
      setShowTrivia(true);
      phase = 'question';
      phaseElapsed = 0;
      setTriviaProgress(100);
      setCurrentTriviaIndex(getRandomTriviaIndex(-1));
    }, 3000); // Show first trivia after 3 seconds
    
    const triviaTimer = setInterval(() => {
      triviaElapsed += PROGRESS_INTERVAL;
      phaseElapsed += PROGRESS_INTERVAL;
      
      if (phase === 'waiting') {
        // Check if it's time for next trivia (every 30 seconds)
        if (triviaElapsed >= TRIVIA_INTERVAL) {
          triviaElapsed = 0;
          phase = 'question';
          phaseElapsed = 0;
          setShowTrivia(true);
          setTriviaProgress(100);
          setCurrentTriviaIndex(prev => getRandomTriviaIndex(prev));
        }
      } else if (phase === 'question') {
        // Update progress bar (100 to 0 over 15 seconds)
        const newProgress = Math.max(0, 100 - (phaseElapsed / QUESTION_DURATION) * 100);
        setTriviaProgress(newProgress);
        
        if (phaseElapsed >= QUESTION_DURATION) {
          phase = 'answer';
          phaseElapsed = 0;
          setShowTriviaAnswer(true);
        }
      } else if (phase === 'answer') {
        // Show answer for 5 seconds then hide trivia
        if (phaseElapsed >= ANSWER_DURATION) {
          phase = 'waiting';
          phaseElapsed = 0;
          setShowTrivia(false);
          setShowTriviaAnswer(false);
        }
      }
    }, PROGRESS_INTERVAL);
    
    return () => clearInterval(triviaTimer);
  }, []);
  
  // Update countdown when URL params change
  useEffect(() => {
    setTimeLeft({ minutes: countdownMinutes, seconds: countdownSeconds });
  }, [countdownMinutes, countdownSeconds]);
  
  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <OverlayWrapper>
      <div className="relative h-full flex flex-col p-6">
        
        {/* Main Title - HAIL TO THE INNOVATORS - Front and Center */}
        <div className="absolute top-16 left-0 right-0 text-center z-20">
          <h1 
            className="text-8xl font-bold tracking-tight"
            style={{ 
              background: 'linear-gradient(135deg, #ffffff 0%, #bf5a36 25%, #FFCB05 50%, #ffffff 75%, #bf5a36 100%)',
              backgroundSize: '400% 400%',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))',
              animation: 'shimmer 12s ease infinite',
            }}
          >
            {eventTitle}
          </h1>
          {/* Divider line - spans title width */}
          <div className="flex justify-center mt-3">
            <div className="w-[700px] h-[2px] rounded-full bg-white/40" />
          </div>
        </div>
        
        {/* Main Content - 4 Panel Grid */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="grid grid-cols-2 gap-7 w-full max-w-[1450px]">
            {schedule.map((item, index) => {
              const isActive = item.isUpNext;
              return (
                <div 
                  key={index}
                  className={`p-7 rounded-xl transition-all duration-500 ${
                    isActive
                      ? isHappeningSoon
                        ? 'bg-[#bf5a36]/20 border-2 border-[#bf5a36]/50 scale-[1.02]'
                        : 'bg-[#bf5a36]/15 border-2 border-[#bf5a36]/40 scale-[1.02]'
                      : 'bg-[#0B1C2D]/70 border border-white/10 opacity-50 scale-[0.98]'
                  }`}
                >
                  {isActive && (
                    <p className={`text-lg font-semibold mb-1 ${
                      isHappeningSoon 
                        ? 'text-[#bf5a36] animate-pulse' 
                        : 'text-[#bf5a36]'
                    }`}>
                      {isHappeningSoon ? 'HAPPENING SOON' : 'UP NEXT'}
                    </p>
                  )}
                  <p className={`${isActive ? 'text-white text-2xl' : 'text-white/80 text-xl'} font-bold`}>
                    {item.title}
                  </p>
                  <p className={`${isActive ? 'text-white/60' : 'text-white/40'} text-lg mt-1`}>{item.time}</p>
                  
                  {/* Speakers */}
                  {item.speakers && item.speakers.length > 0 && (
                    <div className={`flex flex-wrap items-center gap-4 mt-4 pt-3 border-t ${isActive ? 'border-white/15' : 'border-white/5'}`}>
                      {item.speakers.map((speaker, sIndex) => (
                        <div key={sIndex} className="flex items-center gap-2">
                          {speaker.image ? (
                            <img 
                              src={speaker.image} 
                              alt={speaker.name} 
                              className={`rounded-full object-cover border ${isActive ? 'w-11 h-11 border-white/20' : 'w-8 h-8 border-white/10'}`}
                            />
                          ) : (
                            <div className={`rounded-full bg-white/10 flex items-center justify-center font-medium ${isActive ? 'w-11 h-11 text-white/50 text-sm' : 'w-8 h-8 text-white/30 text-xs'}`}>
                              {speaker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                          )}
                          <div className="leading-tight">
                            <p className={`font-semibold ${isActive ? 'text-white text-base' : 'text-white/60 text-sm'}`}>{speaker.name}</p>
                            {speaker.title && (
                              <p className={`${isActive ? 'text-white/50 text-sm' : 'text-white/30 text-xs'}`}>{speaker.title}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Bottom Left - Countdown + Social Links + Trivia */}
        <div className="absolute bottom-6 left-8 z-20">
          {/* Countdown + Trivia row */}
          <div className="flex items-end mb-3">
            {/* Countdown */}
            <div className="bg-[#0B1C2D]/90 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20 shadow-xl">
              <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Starting in</p>
              <p className="text-4xl font-bold text-white tabular-nums tracking-tight leading-none">
                {formatTime(timeLeft.minutes, timeLeft.seconds)}
              </p>
            </div>
            
            {/* Trivia - Slides out from the right side of countdown */}
            <div className={`transition-all duration-700 ease-out ${
              showTrivia 
                ? 'opacity-100 translate-x-0 ml-3' 
                : 'opacity-0 -translate-x-8 ml-0 w-0 overflow-hidden pointer-events-none'
            }`}>
              <div className="bg-gradient-to-br from-[#0B1C2D] to-[#00274C]/80 rounded-lg px-4 py-3 border border-[#bf5a36]/50 w-[320px] shadow-lg">
                {/* Header */}
                <p className="text-[#bf5a36] text-[10px] font-bold uppercase tracking-wider mb-1">Trivia</p>
                
                {/* Question */}
                <p className="text-white text-sm font-medium mb-2">{TRIVIA_QUESTIONS[currentTriviaIndex].question}</p>
                
                {/* Progress Bar */}
                <div className="relative h-1 bg-white/10 rounded-full overflow-hidden mb-1.5">
                  <div 
                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-100 ${
                      triviaProgress > 30 ? 'bg-[#bf5a36]' : triviaProgress > 10 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${triviaProgress}%` }}
                  />
                </div>
                
                {/* Answer (revealed after timer) */}
                <div className={`overflow-hidden transition-all duration-500 ${showTriviaAnswer ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="bg-[#bf5a36]/20 rounded px-2 py-1 border border-[#bf5a36]/40">
                    <p className="text-[#bf5a36] text-base font-bold">{TRIVIA_QUESTIONS[currentTriviaIndex].answer}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Social Links below countdown */}
          <div className="flex items-center gap-4">
            <a href="https://www.linkedin.com/company/abgumich/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors">
              <FaLinkedin className="text-lg" />
              <span className="text-xs">@abgumich</span>
            </a>
            <a href="https://www.instagram.com/umichaibusiness/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors">
              <FaInstagram className="text-lg" />
              <span className="text-xs">@umichaibusiness</span>
            </a>
          </div>
          
          {/* AI Business Group @ SXSW 2026 */}
          <p className="text-white/40 text-sm mt-2">{eventSubtitle}</p>
        </div>
        
        {/* Bottom Right - ABG Logo + Partner Logo */}
        <div className="absolute bottom-6 right-6 flex items-end gap-4 z-20">
          <ABGLogoBox size="large" />
          {/* Partner Logo Box */}
          <div className="bg-white rounded-lg px-3 py-2 shadow-lg">
            <img 
              src="/o142.png" 
              alt="O1-42 Productions"
              className="h-10 w-auto"
            />
          </div>
        </div>
      </div>
    </OverlayWrapper>
  );
}

export default function SoftOpeningOverlay() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-[#0B1C2D]" />}>
      <SoftOpeningContent />
    </Suspense>
  );
}

/*
vMix URL Parameters:
- title: Event title (default: "HAIL TO THE INNOVATORS")
- subtitle: Event subtitle (default: "University of Michigan @ SXSW")
- minutes: Countdown minutes (default: 14)
- seconds: Countdown seconds (default: 32)
- e1_title, e2_title, etc: Session titles
- e1_time, e2_time, etc: Session times  
- e1_desc, e2_desc, etc: Session descriptions
- e1_speakers, e2_speakers, etc: Speakers in format "Name|Title|ImageURL,Name2|Title2|ImageURL2"
- upnext: Index of current session (0-3)

Speaker Example:
e1_speakers=John+Doe|CEO+Acme|/images/john.jpg,Jane+Smith|CTO+Tech|/images/jane.jpg

Full Example:
/sxsw/overlay/soft-opening?title=HAIL%20TO%20THE%20INNOVATORS&minutes=30&seconds=0&e1_speakers=John|CEO|/img.jpg
*/
