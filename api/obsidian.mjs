import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export const snapshotFile = new URL('../.local/obsidian-public.json', import.meta.url);
const roots = ['ai/public', 'ai/context', 'ai/reference'];
const owners = ['me', 'mixed', 'external'];
const types = ['original', 'summary', 'clipped', 'imported', 'transcript'];

function canonical(path) {
  return typeof path === 'string' && !/[\\\x00-\x1f]/.test(path)
    && !path.startsWith('/') && path.split('/').every(part => part && part !== '.' && part !== '..');
}
const inside = (path, root) => path === root || path.startsWith(root + '/');

export function validManifest(policy) {
  return policy?.default_policy === 'deny'
    && Array.isArray(policy.allowed_dirs) && policy.allowed_dirs.every(root => roots.includes(root))
    && Array.isArray(policy.denied_dirs) && policy.denied_dirs.every(canonical)
    && policy.denied_dirs.includes('ai/private')
    && Array.isArray(policy.required_frontmatter)
    && ['ai_access', 'source_type', 'owner'].every(key => policy.required_frontmatter.includes(key));
}

// Deliberately accept only the simple frontmatter subset used by this vault.
// Unknown YAML structures, duplicate keys and malformed headers fail closed.
export function frontmatter(raw) {
  if (typeof raw !== 'string' || Buffer.byteLength(raw) > 50_000) return null;
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(raw);
  if (!match || match[1].length > 4_000) return null;
  const metadata = Object.create(null);
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const entry = /^([a-z_]+):\s*(.*?)\s*$/.exec(line);
    if (!entry || Object.hasOwn(metadata, entry[1])) return null;
    let value = entry[2].replace(/\s+#.*$/, '').trim();
    if (/^\[[^\[\]{}]*\]$/.test(value)) {
      value = value.slice(1, -1).split(',').map(item => item.trim().replace(/^(['"])(.*?)\1$/, '$2')).filter(Boolean);
    } else {
      value = value.replace(/^(['"])(.*?)\1$/, '$2');
      if (!value || /[\[\]{}&*!|>]/.test(value)) return null;
    }
    metadata[entry[1]] = value;
  }
  return { metadata, body: raw.slice(match[0].length).trim() };
}

export function authorize(path, raw, policy) {
  if (!validManifest(policy) || !canonical(path) || !path.endsWith('.md')) return null;
  if (inside(path, 'ai/private') || policy.denied_dirs.some(root => inside(path, root))) return null;
  const root = roots.find(root => inside(path, root));
  if (!root || !policy.allowed_dirs.includes(root)) return null;
  const parsed = frontmatter(raw);
  if (!parsed) return null;
  const m = parsed.metadata;
  if (!policy.required_frontmatter.every(key => Object.hasOwn(m, key))) return null;
  if (m.ai_access !== root.split('/')[1] || !owners.includes(m.owner) || !types.includes(m.source_type)) return null;
  if (!Array.isArray(m.use_for)) return null;
  // The initial integration only ingests public answer material. Context stays
  // out of the model input and of public endpoints; reference needs citation review.
  if (m.ai_access !== 'public' || !m.use_for.includes('website') || !m.use_for.includes('qa')) return null;
  return parsed;
}

export function noteSource(path, parsed) {
  const id = 'obsidian-' + createHash('sha256').update(path).digest('hex').slice(0, 16);
  const title = /^#\s+(.+)$/m.exec(parsed.body)?.[1] || path.split('/').at(-1).slice(0, -3);
  // Do not traverse wiki links or carry internal link targets into public answers.
  const facts = parsed.body.replace(/\n## 相关页面[\s\S]*$/, '')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_all, target, label) => label || target.split('/').at(-1));
  return { id, title: `Obsidian · ${title}`, href: `/api/note?id=${id}`, facts,
    owner: parsed.metadata.owner, sourceType: parsed.metadata.source_type };
}

export function sourcesFromSnapshot(snapshot) {
  if (!validManifest(snapshot?.manifest) || !Array.isArray(snapshot?.notes)) return [];
  if (!/^[a-f0-9]{40}$/.test(snapshot.revision || '') || snapshot.notes.length > 100) return [];
  const seen = new Set();
  return snapshot.notes.flatMap(note => {
    const parsed = authorize(note.path, note.raw, snapshot.manifest);
    if (!parsed || seen.has(note.path)) return [];
    seen.add(note.path);
    return [noteSource(note.path, parsed)];
  });
}

export async function loadObsidianSources() {
  try { return sourcesFromSnapshot(JSON.parse(await readFile(snapshotFile, 'utf8'))); }
  catch { return []; }
}

// Lightweight retrieval for the initial small Chinese/English corpus. No
// embeddings, full-vault scans, external link following, or additional uploads.
export function retrieve(sources, query, limit = 3) {
  const normalized = String(query).toLowerCase().replace(/\s+/g, '');
  const terms = normalized.match(/[a-z][a-z0-9]+|[\u3400-\u9fff]{2,}/g) || [];
  const tokens = [...new Set(terms.flatMap(term => /^[a-z]/.test(term) ? [term]
    : Array.from({ length: term.length - 1 }, (_, i) => term.slice(i, i + 2))))];
  return sources.map(source => {
    const title = source.title.toLowerCase().replace(/\s+/g, '');
    const body = source.facts.toLowerCase().replace(/\s+/g, '');
    const score = tokens.reduce((sum, token) => sum + (title.includes(token) ? 5 : 0) + (body.includes(token) ? 1 : 0), 0);
    return { source, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map(item => item.source);
}
