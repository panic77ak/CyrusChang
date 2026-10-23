const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const root = __dirname;
const localEnv = path.join(root, '.env.local');
if (fs.existsSync(localEnv)) process.loadEnvFile(localEnv);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.pdf': 'application/pdf' };
const chatHandler = import('./api/chat.mjs');
const noteHandler = import('./api/note.mjs');

async function handleChat(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { Allow: 'POST' });
    return res.end('Method not allowed');
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 8_192) {
      res.writeHead(413);
      return res.end('Request too large');
    }
    chunks.push(chunk);
  }
  const request = new Request(`http://127.0.0.1:4173${req.url}`, {
    method: 'POST', headers: req.headers, body: Buffer.concat(chunks)
  });
  const result = await (await chatHandler).POST(request);
  res.writeHead(result.status, Object.fromEntries(result.headers));
  res.flushHeaders();
  await pipeline(Readable.fromWeb(result.body), res);
}

http.createServer(async (req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); return res.end('Bad request'); }
  if (pathname === '/api/chat') {
    try { return await handleChat(req, res); }
    catch { if (!res.headersSent) res.writeHead(500); return res.end(); }
  }
  if (pathname === '/api/note') {
    if (req.method !== 'GET') { res.writeHead(405, { Allow: 'GET' }); return res.end('Method not allowed'); }
    try {
      const result = await (await noteHandler).GET(new Request(`http://127.0.0.1:4173${req.url}`));
      res.writeHead(result.status, Object.fromEntries(result.headers));
      return res.end(Buffer.from(await result.arrayBuffer()));
    } catch { res.writeHead(500); return res.end('Internal error'); }
  }
  if (pathname.startsWith('/.') || pathname.startsWith('/api/') || pathname === '/server.cjs' || pathname === '/chat-knowledge.cjs') {
    res.writeHead(404);
    return res.end('Not found');
  }
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (error, data) => {
    res.writeHead(error ? 404 : 200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(error ? 'Not found' : data);
  });
}).listen(4173, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:4173'));
