/**
 * Production logging configuration
 * This will override console methods in production to hide client-side logs
 * while maintaining server-side logging through systemd
 */

// Override console methods only in production and only on client-side
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Store original console methods
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug
  };

  // Override console methods to do nothing in production client-side
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.info = () => {};
  console.debug = () => {};

  // Optionally, you can still log errors to an external service
  window.addEventListener('error', (event) => {
    // Here you could send errors to an external logging service
    // like Sentry, LogRocket, or your own endpoint
    // fetch('/api/log-error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     message: event.error?.message,
    //     stack: event.error?.stack,
    //     filename: event.filename,
    //     lineno: event.lineno,
    //     colno: event.colno,
    //     timestamp: new Date().toISOString()
    //   })
    // });
  });

  window.addEventListener('unhandledrejection', (event) => {
    // Handle unhandled promise rejections
    // Similar to above, you could log these to an external service
  });
}

// Server-side logging remains unchanged - all console.* calls will go to systemd journal
// when the application is run as a systemd service