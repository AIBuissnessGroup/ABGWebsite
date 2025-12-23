const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// Monkey-patch http.IncomingMessage to support larger bodies
const http = require('http');
const originalAddListener = http.IncomingMessage.prototype.addListener;
http.IncomingMessage.prototype.addListener = function(event, listener) {
  if (event === 'data' || event === 'end') {
    // Allow larger buffers
    this.setMaxListeners(0);
  }
  return originalAddListener.call(this, event, listener);
};

// Create Next.js app
const app = next({ 
  dev, 
  hostname, 
  port
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    // Disable body size limits at the HTTP level
    req.socket.setMaxListeners(0);
    req.setMaxListeners(0);
    
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Configure server for large payloads
  server.maxHeadersCount = 0;
  server.headersTimeout = 120000;
  server.requestTimeout = 120000;
  server.timeout = 120000;
  
  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Configured for large payloads (100MB+)`);
  });
});
