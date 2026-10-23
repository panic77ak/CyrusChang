// Prepare a separate prebuilt Vercel preview, without changing the live site.
import { mkdir, readdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourcesFromSnapshot } from '../lib/obsidian.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const snapshot = JSON.parse(await readFile(new URL('../.local/obsidian-public.json', import.meta.url), 'utf8'));
if (sourcesFromSnapshot(snapshot).length !== snapshot.notes.length) throw new Error('Snapshot failed authorization.');
const staging = await import('node:fs/promises').then(fs => fs.mkdtemp(path.join(root, '.local/remote-preview-')));
const output = path.join(staging, '.vercel/output');
const publicRoot = path.join(output, 'static');
await mkdir(publicRoot, { recursive: true });
let staticFiles = 0;
const publicExtensions = new Set(['.html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg', '.ico', '.pdf', '.woff', '.woff2', '.ttf', '.otf', '.mp4', '.webm', '.mp3', '.wav']);
async function copyPublic(relative) {
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const name = path.join(relative, entry.name);
    if (entry.isDirectory()) await copyPublic(name);
    else if (entry.isFile() && publicExtensions.has(path.extname(entry.name))) {
      await mkdir(path.dirname(path.join(publicRoot, name)), { recursive: true });
      await copyFile(path.join(root, name), path.join(publicRoot, name));
      staticFiles += 1;
    }
  }
}
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.isFile() && /\.(html|css|js)$/.test(entry.name)) {
    await copyFile(path.join(root, entry.name), path.join(publicRoot, entry.name));
    staticFiles += 1;
  }
}
await copyPublic('assets');
await copyPublic('demos');
for (const [name, method] of [['chat', 'POST'], ['note', 'GET']]) {
  const dir = path.join(output, 'functions/api', name + '.func');
  await mkdir(path.join(dir, 'api'), { recursive: true });
  await mkdir(path.join(dir, 'lib'), { recursive: true });
  await mkdir(path.join(dir, '.local'), { recursive: true });
  for (const source of ['api/chat.mjs', 'api/note.mjs', 'lib/stream.mjs', 'lib/obsidian.mjs', 'chat-knowledge.cjs']) {
    await copyFile(path.join(root, source), path.join(dir, source));
  }
  await writeFile(path.join(dir, '.local/obsidian-public.json'), JSON.stringify(snapshot));
  await writeFile(path.join(dir, '.vc-config.json'), JSON.stringify({ runtime: 'nodejs22.x', handler: 'index.mjs', launcherType: 'Nodejs', maxDuration: 30 }));
  const handler = `import { ${method} as handle } from './api/${name}.mjs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
export default async function(req,res) {
  if(req.method !== '${method}') { res.writeHead(405,{'Allow':'${method}'}); return res.end('Method not allowed'); }
  try {
    const chunks=[]; let length=0;
    for await(const chunk of req) { length+=chunk.length; if(length>8192){res.writeHead(413);return res.end('Request too large');} chunks.push(chunk); }
    const headers=new Headers();
    for(const [key,value] of Object.entries(req.headers)){if(value !== undefined)headers.set(key,Array.isArray(value)?value.join(','):value);}
    const request=new Request('https://preview.local'+req.url,{method:req.method,headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})});
    const response=await handle(request);
    res.writeHead(response.status,Object.fromEntries(response.headers));
    res.flushHeaders();
    await pipeline(Readable.fromWeb(response.body),res);
  } catch {if (!res.headersSent) res.writeHead(500);res.end();}
}
`;
  await writeFile(path.join(dir, 'index.mjs'), handler);
}
await writeFile(path.join(output, 'config.json'), JSON.stringify({ version: 3, routes: [
  { src: '^/$', dest: '/home-chat-preview.html' },
  { src: '/(.*)', headers: { 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff' }, continue: true },
  { handle: 'filesystem' }
] }));
console.log(JSON.stringify({ staging, staticFiles, publicNotes: snapshot.notes.length, secretsIncluded: false }));
