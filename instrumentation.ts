export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Patch the body size limit at the Node.js level
    const http = require('http');
    
    // Override the default IncomingMessage to handle larger bodies
    const originalEmit = http.IncomingMessage.prototype.emit;
    http.IncomingMessage.prototype.emit = function(event: any, ...args: any[]) {
      if (event === 'data' || event === 'end') {
        this.setMaxListeners(0);
      }
      return originalEmit.call(this, event, ...args);
    };
    
    console.log('✓ Instrumentation: Configured for large request bodies');
    
    // Start scheduled emails cron job
    const { startScheduledEmailsCron } = await import('./src/lib/scheduled-emails-cron');
    startScheduledEmailsCron();

    // Start Gmail token refresh cron job (runs every 12 hours)
    const { refreshGmailToken } = await import('./src/lib/email');
    refreshGmailToken(); // Initial check
    setInterval(() => {
      refreshGmailToken();
    }, 12 * 60 * 60 * 1000);
  }
}
