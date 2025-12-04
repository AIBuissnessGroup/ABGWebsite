/**
 * Translation system for the Fluently career assistant flow.
 * Supports English (default), Spanish, and French.
 * Falls back to English if a translation is missing.
 */

export type SupportedLanguage = 'en' | 'es' | 'fr';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
];

/**
 * Translation keys used in the Fluently flow
 */
export type TranslationKey =
  | 'welcome_title'
  | 'welcome_message'
  | 'select_language_prompt'
  | 'language_selected'
  | 'ask_name'
  | 'nice_to_meet'
  | 'ask_location'
  | 'ask_skills'
  | 'searching_jobs'
  | 'found_jobs'
  | 'analyzing_matches'
  | 'no_jobs_found'
  | 'top_matches_header'
  | 'select_job_prompt'
  | 'enter_valid_job_number'
  | 'getting_tips'
  | 'match_score'
  | 'why_good_fit'
  | 'skills_to_highlight'
  | 'interview_tips'
  | 'want_questions'
  | 'generating_questions'
  | 'behavioral_questions'
  | 'session_complete'
  | 'refresh_to_restart'
  | 'error_message'
  | 'send_button'
  | 'processing'
  | 'type_message'
  | 'career_assistant'
  | 'career_assistant_desc'
  | 'location_label'
  | 'match_label';

type TranslationMap = Record<TranslationKey, string>;

const translations: Record<SupportedLanguage, TranslationMap> = {
  en: {
    welcome_title: '🚀 Career Assistant',
    welcome_message: "👋 Welcome! I'm your AI career assistant. I'll help you find the perfect job match and prepare for interviews.",
    select_language_prompt: 'Please select your preferred language:',
    language_selected: 'Great! You selected {language}.',
    ask_name: "What's your name?",
    nice_to_meet: 'Nice to meet you, {name}! 🎯',
    ask_location: 'What city or location are you looking for jobs in?',
    ask_skills: '💼 Great! Now tell me about your skills and experience. What kind of work are you looking for?',
    searching_jobs: '🔍 Searching for jobs...',
    found_jobs: '✅ Found {count} jobs! Analyzing matches...',
    analyzing_matches: 'Analyzing matches...',
    no_jobs_found: "😔 I couldn't find any jobs matching your criteria. Try broadening your search terms or location.",
    top_matches_header: '🎯 Here are your top job matches:',
    select_job_prompt: '💡 Type a number (1-10) to learn more about a job and get interview tips!',
    enter_valid_job_number: 'Please enter a valid job number (1-10).',
    getting_tips: '📋 Getting interview tips for {jobTitle}...',
    match_score: 'Match Score',
    why_good_fit: "Why you're a good fit",
    skills_to_highlight: 'Skills to highlight',
    interview_tips: '🎯 Interview Tips',
    want_questions: 'Would you like me to generate behavioral interview questions for this role? (yes/no)',
    generating_questions: '💭 Generating behavioral interview questions...',
    behavioral_questions: 'Behavioral Interview Questions',
    session_complete: "🎉 Great! You're now prepared for your interview. Good luck!",
    refresh_to_restart: 'Refresh to start over or close this window.',
    error_message: '❌ Sorry, I encountered an error: {error}. Please try again.',
    send_button: 'Send',
    processing: 'Processing...',
    type_message: 'Type your message...',
    career_assistant: '🚀 Career Assistant',
    career_assistant_desc: 'Your AI-powered job matching & interview prep tool',
    location_label: 'Location',
    match_label: 'Match',
  },
  es: {
    welcome_title: '🚀 Asistente de Carrera',
    welcome_message: '👋 ¡Bienvenido! Soy tu asistente de carrera con IA. Te ayudaré a encontrar el trabajo perfecto y a prepararte para las entrevistas.',
    select_language_prompt: 'Por favor selecciona tu idioma preferido:',
    language_selected: '¡Excelente! Seleccionaste {language}.',
    ask_name: '¿Cuál es tu nombre?',
    nice_to_meet: '¡Mucho gusto, {name}! 🎯',
    ask_location: '¿En qué ciudad o ubicación estás buscando trabajo?',
    ask_skills: '💼 ¡Genial! Ahora cuéntame sobre tus habilidades y experiencia. ¿Qué tipo de trabajo estás buscando?',
    searching_jobs: '🔍 Buscando trabajos...',
    found_jobs: '✅ ¡Encontré {count} trabajos! Analizando coincidencias...',
    analyzing_matches: 'Analizando coincidencias...',
    no_jobs_found: '😔 No pude encontrar trabajos que coincidan con tus criterios. Intenta ampliar tus términos de búsqueda o ubicación.',
    top_matches_header: '🎯 Aquí están tus mejores coincidencias de trabajo:',
    select_job_prompt: '💡 ¡Escribe un número (1-10) para saber más sobre un trabajo y obtener consejos de entrevista!',
    enter_valid_job_number: 'Por favor ingresa un número de trabajo válido (1-10).',
    getting_tips: '📋 Obteniendo consejos de entrevista para {jobTitle}...',
    match_score: 'Puntuación de Coincidencia',
    why_good_fit: 'Por qué eres una buena opción',
    skills_to_highlight: 'Habilidades a destacar',
    interview_tips: '🎯 Consejos de Entrevista',
    want_questions: '¿Te gustaría que genere preguntas de entrevista de comportamiento para este puesto? (sí/no)',
    generating_questions: '💭 Generando preguntas de entrevista de comportamiento...',
    behavioral_questions: 'Preguntas de Entrevista de Comportamiento',
    session_complete: '🎉 ¡Genial! Ya estás preparado para tu entrevista. ¡Buena suerte!',
    refresh_to_restart: 'Actualiza para comenzar de nuevo o cierra esta ventana.',
    error_message: '❌ Lo siento, encontré un error: {error}. Por favor intenta de nuevo.',
    send_button: 'Enviar',
    processing: 'Procesando...',
    type_message: 'Escribe tu mensaje...',
    career_assistant: '🚀 Asistente de Carrera',
    career_assistant_desc: 'Tu herramienta de búsqueda de empleo y preparación de entrevistas con IA',
    location_label: 'Ubicación',
    match_label: 'Coincidencia',
  },
  fr: {
    welcome_title: '🚀 Assistant Carrière',
    welcome_message: "👋 Bienvenue ! Je suis votre assistant carrière IA. Je vous aiderai à trouver l'emploi parfait et à vous préparer pour les entretiens.",
    select_language_prompt: 'Veuillez sélectionner votre langue préférée :',
    language_selected: 'Parfait ! Vous avez sélectionné {language}.',
    ask_name: 'Quel est votre nom ?',
    nice_to_meet: 'Enchanté, {name} ! 🎯',
    ask_location: 'Dans quelle ville ou quel endroit cherchez-vous du travail ?',
    ask_skills: '💼 Super ! Maintenant, parlez-moi de vos compétences et de votre expérience. Quel type de travail recherchez-vous ?',
    searching_jobs: "🔍 Recherche d'emplois...",
    found_jobs: '✅ {count} emplois trouvés ! Analyse des correspondances...',
    analyzing_matches: 'Analyse des correspondances...',
    no_jobs_found: "😔 Je n'ai pas trouvé d'emplois correspondant à vos critères. Essayez d'élargir vos termes de recherche ou votre localisation.",
    top_matches_header: "🎯 Voici vos meilleures correspondances d'emploi :",
    select_job_prompt: "💡 Tapez un numéro (1-10) pour en savoir plus sur un emploi et obtenir des conseils d'entretien !",
    enter_valid_job_number: "Veuillez entrer un numéro d'emploi valide (1-10).",
    getting_tips: "📋 Obtention des conseils d'entretien pour {jobTitle}...",
    match_score: 'Score de Correspondance',
    why_good_fit: 'Pourquoi vous êtes un bon candidat',
    skills_to_highlight: 'Compétences à mettre en avant',
    interview_tips: "🎯 Conseils d'Entretien",
    want_questions: "Voulez-vous que je génère des questions d'entretien comportementales pour ce poste ? (oui/non)",
    generating_questions: "💭 Génération des questions d'entretien comportementales...",
    behavioral_questions: "Questions d'Entretien Comportementales",
    session_complete: '🎉 Super ! Vous êtes maintenant préparé pour votre entretien. Bonne chance !',
    refresh_to_restart: 'Actualisez pour recommencer ou fermez cette fenêtre.',
    error_message: "❌ Désolé, j'ai rencontré une erreur : {error}. Veuillez réessayer.",
    send_button: 'Envoyer',
    processing: 'Traitement...',
    type_message: 'Tapez votre message...',
    career_assistant: '🚀 Assistant Carrière',
    career_assistant_desc: "Votre outil de recherche d'emploi et de préparation d'entretien alimenté par l'IA",
    location_label: 'Localisation',
    match_label: 'Correspondance',
  },
};

/**
 * Get a translated string for the given key and language.
 * Falls back to English if the translation is missing.
 * Logs a console warning if a translation is missing.
 * 
 * @param key - The translation key
 * @param language - The target language code
 * @param params - Optional parameters to interpolate into the string
 * @returns The translated string with interpolated parameters
 */
export function t(
  key: TranslationKey,
  language: SupportedLanguage = 'en',
  params?: Record<string, string | number>
): string {
  let translation = translations[language]?.[key];
  
  // Fallback to English if translation is missing
  if (!translation) {
    translation = translations.en[key];
    if (language !== 'en') {
      console.warn(`[Fluently] Missing translation for key "${key}" in language "${language}". Falling back to English.`);
    }
  }
  
  // If still no translation, return the key as a fallback
  if (!translation) {
    console.warn(`[Fluently] No translation found for key "${key}" in any language.`);
    return key;
  }
  
  // Interpolate parameters
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      translation = translation.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
    });
  }
  
  return translation;
}

/**
 * Get the full language name from a language code
 */
export function getLanguageName(code: SupportedLanguage): string {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang?.name || 'English';
}

/**
 * Get the native language name from a language code
 */
export function getNativeLanguageName(code: SupportedLanguage): string {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang?.nativeName || 'English';
}

/**
 * Map common language names to language codes
 */
export function detectLanguageCode(input: string): SupportedLanguage {
  const normalized = input.toLowerCase().trim();
  
  // Check for Spanish variants
  if (normalized.includes('español') || normalized.includes('spanish') || normalized.includes('espanol')) {
    return 'es';
  }
  
  // Check for French variants
  if (normalized.includes('français') || normalized.includes('french') || normalized.includes('francais')) {
    return 'fr';
  }
  
  // Default to English
  return 'en';
}
