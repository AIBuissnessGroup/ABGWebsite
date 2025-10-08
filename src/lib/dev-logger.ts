// Development-only logging utilities
// These will be automatically removed in production builds by Next.js

export const devLog = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(...args);
    }
  },
  
  // Always log errors, even in production
  error: (...args: any[]) => {
    console.error(...args);
  }
};

// Alternative: Simple conditional logging
export const isDev = process.env.NODE_ENV === 'development';

// Usage examples:
// devLog.log('This only logs in development');
// isDev && console.log('Alternative syntax');