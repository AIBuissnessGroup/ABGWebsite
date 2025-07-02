// Google Analytics utilities
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

// Track page views
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Specific event trackers for ABG
export const analytics = {
  // Newsletter events
  newsletter: {
    subscribe: (source: string) => 
      trackEvent('newsletter_subscribe', 'engagement', source),
    
    subscribeSuccess: (source: string) => 
      trackEvent('newsletter_subscribe_success', 'conversion', source),
    
    subscribeError: (source: string, error: string) => 
      trackEvent('newsletter_subscribe_error', 'error', `${source}_${error}`),
  },

  // Navigation events
  navigation: {
    clickAdminLogin: () => 
      trackEvent('admin_login_click', 'navigation', 'header'),
    
    clickLogo: () => 
      trackEvent('logo_click', 'navigation', 'header'),
    
    clickMenuItem: (section: string) => 
      trackEvent('menu_click', 'navigation', section),
  },

  // Content engagement
  content: {
    viewSection: (section: string) => 
      trackEvent('section_view', 'engagement', section),
    
    clickCTA: (button: string, section: string) => 
      trackEvent('cta_click', 'engagement', `${section}_${button}`),
    
    downloadFile: (filename: string) => 
      trackEvent('file_download', 'engagement', filename),
  },

  // Forms and applications
  forms: {
    start: (formName: string) => 
      trackEvent('form_start', 'engagement', formName),
    
    submit: (formName: string) => 
      trackEvent('form_submit', 'conversion', formName),
    
    complete: (formName: string) => 
      trackEvent('form_complete', 'conversion', formName),
    
    error: (formName: string, error: string) => 
      trackEvent('form_error', 'error', `${formName}_${error}`),
  },

  // Events and registration
  events: {
    viewEvent: (eventName: string) => 
      trackEvent('event_view', 'engagement', eventName),
    
    clickRegister: (eventName: string) => 
      trackEvent('event_register_click', 'engagement', eventName),
    
    addToCalendar: (eventName: string) => 
      trackEvent('event_add_calendar', 'engagement', eventName),
  },

  // Projects
  projects: {
    viewProject: (projectName: string) => 
      trackEvent('project_view', 'engagement', projectName),
    
    clickLearnMore: (projectName: string) => 
      trackEvent('project_learn_more', 'engagement', projectName),
  },

  // Team
  team: {
    viewMember: (memberName: string) => 
      trackEvent('team_member_view', 'engagement', memberName),
    
    clickLinkedIn: (memberName: string) => 
      trackEvent('team_linkedin_click', 'social', memberName),
    
    clickGitHub: (memberName: string) => 
      trackEvent('team_github_click', 'social', memberName),
  },

  // Admin tracking (for internal metrics)
  admin: {
    login: (userEmail: string) => 
      trackEvent('admin_login', 'admin', userEmail),
    
    contentEdit: (section: string) => 
      trackEvent('admin_content_edit', 'admin', section),
    
    contentSave: (section: string) => 
      trackEvent('admin_content_save', 'admin', section),
  },
};

// Track user demographics and interests (when available)
export const trackUserProperties = (properties: {
  user_id?: string;
  custom_parameter?: string;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      custom_map: properties,
    });
  }
};

// Track ecommerce events (for future partnership/sponsorship tracking)
export const trackEcommerce = (action: 'purchase' | 'add_to_cart', data: {
  transaction_id?: string;
  value?: number;
  currency?: string;
  items?: any[];
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, data);
  }
}; 