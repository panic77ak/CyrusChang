import test from 'node:test';
import assert from 'node:assert/strict';
import { authorize, frontmatter, noteSource, retrieve, sourcesFromSnapshot } from '../api/obsidian.mjs';

const manifest = { default_policy: 'deny', allowed_dirs: ['ai/public', 'ai/context', 'ai/reference'],
  denied_dirs: ['ai/private', 'raw', 'ai/public/blocked'], required_frontmatter: ['ai_access', 'source_type', 'owner'] };
const raw = '---\nai_access: public\nsource_type: original\nowner: me\nuse_for: [website, qa]\n---\n# 游戏 UX 到 AI UX\n游戏 UX 处理状态反馈和用户控制感。\n\n## 相关页面\n[[raw/secret]]';
const path = 'ai/public/method.md';

test('requires both directory permission and compliant per-note metadata', () => {
  assert.ok(authorize(path, raw, manifest));
  for (const badPath of ['raw/method.md', 'ai/private/method.md', 'ai/public/../private/method.md', '/ai/public/a.md', 'ai/public/blocked/a.md', 'ai/public/a\\b.md']) {
    assert.equal(authorize(badPath, raw, manifest), null);
  }
  for (const invalid of [raw.replace('owner: me\n', ''), raw.replace('owner: me', 'owner: unknown'),
    raw.replace('ai_access: public', 'ai_access: private'), raw.replace('use_for: [website, qa]', 'use_for: [personal]'),
    raw.replace('owner: me', 'owner: me\nowner: external'), raw.replace('source_type: original', 'source_type: unknown')]) {
    assert.equal(authorize(path, invalid, manifest), null);
  }
  assert.equal(authorize(path, raw, { ...manifest, default_policy: 'allow' }), null);
  assert.equal(authorize(path, raw, { ...manifest, allowed_dirs: ['raw'] }), null);
});

test('context and reference never become public answer sources or note pages', () => {
  const snapshot = { manifest, revision: 'a'.repeat(40), notes: [
    { path, raw },
    { path: 'ai/context/tone.md', raw: raw.replace('ai_access: public', 'ai_access: context') },
    { path: 'ai/reference/external.md', raw: raw.replace('ai_access: public', 'ai_access: reference') },
    { path: 'ai/private/private.md', raw }
  ] };
  assert.equal(sourcesFromSnapshot(snapshot).length, 1);
  assert.deepEqual(sourcesFromSnapshot({ ...snapshot, manifest: null }), []);
});

test('retains ownership, removes internal link targets, and retrieves relevant public material', () => {
  const mixed = authorize(path, raw.replace('owner: me', 'owner: mixed'), manifest);
  const source = noteSource(path, mixed);
  assert.equal(source.owner, 'mixed');
  assert.equal(source.sourceType, 'original');
  assert.match(source.href, /^\/api\/note\?id=obsidian-[a-f0-9]{16}$/);
  assert.doesNotMatch(source.facts, /raw\/secret/);
  assert.equal(retrieve([source], '游戏 UX 到 AI UX 的方法')[0].id, source.id);
  assert.deepEqual(retrieve([source], '量子化学'), []);
  assert.equal(frontmatter('no metadata'), null);
});
