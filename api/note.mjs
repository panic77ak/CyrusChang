import { loadObsidianSources } from '../lib/obsidian.mjs';

const escape = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export async function GET(request) {
  const id = new URL(request.url).searchParams.get('id');
  const note = (await loadObsidianSources()).find(item => item.id === id);
  const headers = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'" };
  if (!note) return new Response('Not found', { status: 404, headers });
  const fromChat = new URL(request.url).searchParams.get('via') === 'chat';
  return new Response(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(note.title)}</title><style>body{max-width:580px;margin:48px auto;padding:0 24px;font:15px/1.9 system-ui;color:#27282c}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}small{color:#6b6b6b}a{color:#4a5b96;text-underline-offset:4px;font-size:13px}h1{font-size:24px;line-height:1.5;margin-top:32px;font-weight:500}a:focus-visible{outline:2px solid #4a5b96;outline-offset:5px}</style><a href="${fromChat ? '/index.html' : '/index.html'}">← ${fromChat ? '返回对话' : '返回首页'}</a><h1>${escape(note.title)}</h1><small>已授权公开笔记 · ${note.owner === 'mixed' ? '混合资料整理，并非完全原创理论' : note.owner === 'external' ? '外部资料，不代表常宸的观点' : '常宸的原创内容'}</small><pre>${escape(note.facts)}</pre></html>`, { headers });
}
