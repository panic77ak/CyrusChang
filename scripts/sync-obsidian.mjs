// Optional repeatable refresh. Keep the read-only repository token server-side.
// Usage: OBSIDIAN_GITHUB_TOKEN=<from secure environment> node scripts/sync-obsidian.mjs
import { mkdir, writeFile, rename } from 'node:fs/promises';
import { authorize, snapshotFile, validManifest } from '../lib/obsidian.mjs';

const repository = 'panic77ak/obsidian-notes';
const token = process.env.OBSIDIAN_GITHUB_TOKEN;
if (!token) throw new Error('Missing server-side OBSIDIAN_GITHUB_TOKEN; no files were changed.');
const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
async function get(resource) {
  const response = await fetch(`https://api.github.com/repos/${repository}/${resource}`, { headers, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`GitHub read failed (${response.status}); snapshot not updated.`);
  return response.json();
}
const revision = (await get('branches/main')).commit.sha;
if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('Invalid revision.');
async function file(path) {
  const item = await get(`contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${revision}`);
  if (item.type !== 'file' || item.encoding !== 'base64' || item.size > 50_000) throw new Error('Unsupported file.');
  return Buffer.from(item.content, 'base64').toString('utf8');
}
const manifest = JSON.parse(await file('ai/_system/manifest.json'));
if (!validManifest(manifest)) throw new Error('Unsupported or unsafe manifest; snapshot not updated.');
const notes = [];
let skipped = 0;
async function visit(path) {
  if (!manifest.allowed_dirs.includes('ai/public') || manifest.denied_dirs.some(dir => path === dir || path.startsWith(dir + '/'))) return;
  const entries = await get(`contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${revision}`);
  if (!Array.isArray(entries) || entries.length > 200) throw new Error('Unsupported directory.');
  for (const entry of entries) {
    if (typeof entry.path !== 'string' || !entry.path.startsWith(path + '/') || entry.path.slice(path.length + 1).includes('/') || /[\\\x00-\x1f]/.test(entry.path) || ['.', '..'].includes(entry.name)) continue;
    if (manifest.denied_dirs.some(dir => entry.path === dir || entry.path.startsWith(dir + '/'))) continue;
    if (entry.type === 'dir') await visit(entry.path);
    // Symlinks, submodules, other extensions and oversized notes are never read.
    else if (entry.type === 'file' && entry.path.endsWith('.md') && entry.size <= 50_000) {
      const raw = await file(entry.path);
      if (authorize(entry.path, raw, manifest)) notes.push({ path: entry.path, raw });
      else skipped += 1;
      if (notes.length > 100) throw new Error('Too many public notes; snapshot not updated.');
    }
  }
}
await visit('ai/public');
const snapshot = { version: 1, repository, revision, syncedAt: new Date().toISOString(), manifest, notes };
await mkdir(new URL('../.local/', import.meta.url), { recursive: true });
const temporary = new URL(`obsidian-public.${process.pid}.tmp`, snapshotFile);
await writeFile(temporary, JSON.stringify(snapshot, null, 2), { mode: 0o600 });
await rename(temporary, snapshotFile);
console.log(`Refreshed ${notes.length} public notes; skipped ${skipped}; revision ${revision.slice(0, 8)}. Context/reference/private were not scanned.`);
