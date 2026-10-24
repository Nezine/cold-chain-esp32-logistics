const { createProxyMiddleware } = require('http-proxy-middleware');

// Explicit /api routing also works when CRA binds to a loopback HOST.
module.exports = function setupProxy(app) {
  app.use('/api', createProxyMiddleware({
    target: 'http://127.0.0.1:8080',
    changeOrigin: true,
    proxyTimeout: 15000,
    onError(error, req, res) {
      if (!res.headersSent) res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Backend unavailable. Start the backend and retry.' }));
    },
  }));
};
