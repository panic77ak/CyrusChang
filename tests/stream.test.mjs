import test from 'node:test';
import assert from 'node:assert/strict';
import { partialAnswer, streamReply } from '../api/stream.mjs';

test('partial JSON hides metadata and handles split escapes', () => {
  assert.equal(partialAnswer('{"answer":"你好\\u4'), '你好');
  assert.equal(partialAnswer('{"answer":"你好\\u4e16\\n\\"界\\"","source_ids":['), '你好世\n"界"');
});

test('streams before completion, parses split UTF8 and filters source IDs', async () => {
  let source;
  const upstream = new Response(new ReadableStream({ start(c) { source = c; } }));
  const response = streamReply(upstream, new Map([['about', { title: '关于我', href: 'about.html' }]]));
  const reader = response.body.getReader();
  const encoder = new TextEncoder();
  const event = (content, finish_reason = null) => encoder.encode('data: ' + JSON.stringify({ choices: [{ delta: { content }, finish_reason }] }) + '\n\n');
  const first = event('{"answer":"你好');
  for (const byte of first) source.enqueue(Uint8Array.of(byte));
  const chunk = await reader.read();
  assert.equal(JSON.parse(new TextDecoder().decode(chunk.value)).answer, '你好');
  source.enqueue(event('世界","source_ids":["about","private","about"]}', 'stop'));
  source.close();
  let rest = '';
  for (;;) { const { done, value } = await reader.read(); if (done) break; rest += new TextDecoder().decode(value); }
  const final = JSON.parse(rest.trim().split('\n').at(-1));
  assert.equal(final.type, 'done');
  assert.deepEqual(final.sources, [{ title: '关于我', href: 'about.html' }]);
});

test('truncated upstream emits an error, never a completed answer', async () => {
  const response = streamReply(new Response('data: {"choices":[{"delta":{"content":"{\\"answer\\":\\"你好"}}]}\n\n'), new Map());
  const events = (await response.text()).trim().split('\n').map(JSON.parse);
  assert.equal(events[0].type, 'answer');
  assert.equal(events.at(-1).type, 'error');
  assert.ok(!events.some(event => event.type === 'done'));
});
