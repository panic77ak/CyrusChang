// Decode only the answer string, never expose the surrounding JSON or source IDs.
export function partialAnswer(raw) {
  const match = raw.match(/^\s*\{\s*"answer"\s*:\s*"/);
  if (!match) return '';
  let text = '';
  for (let i = match[0].length; i < raw.length; i++) {
    const char = raw[i];
    if (char === '"') break;
    if (char !== '\\') { text += char; continue; }
    if (++i >= raw.length) break;
    if (raw[i] === 'u') {
      const hex = raw.slice(i + 1, i + 5);
      if (!/^[0-9a-f]{4}$/i.test(hex)) break;
      text += String.fromCharCode(parseInt(hex, 16));
      i += 4;
    } else {
      const escapes = { '"': '"', '\\': '\\', '/': '/', n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' };
      if (!(raw[i] in escapes)) break;
      text += escapes[raw[i]];
    }
  }
  return text.replace(/[\uD800-\uDBFF]$/, '').slice(0, 1000);
}

export function streamReply(upstream, sourceById) {
  const reader = upstream.body.getReader();
  const encoder = new TextEncoder();
  let cancelled = false;
  return new Response(new ReadableStream({
    async start(controller) {
      const emit = data => { if (!cancelled) controller.enqueue(encoder.encode(JSON.stringify(data) + '\n')); };
      let raw = '', buffer = '', answer = '', finish;
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          if (done && buffer) lines.push(buffer);
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (!data || data === '[DONE]') continue;
            const chunk = JSON.parse(data);
            if (chunk.error) throw new Error('upstream_unavailable');
            const choice = chunk.choices?.[0];
            if (choice?.finish_reason) finish = choice.finish_reason;
            raw += choice?.delta?.content || '';
            if (raw.length > 16000) throw new Error('invalid_upstream_response');
            const next = partialAnswer(raw);
            if (next !== answer) { answer = next; emit({ type: 'answer', answer }); }
          }
          if (done) break;
        }
        const result = JSON.parse(raw);
        if (finish !== 'stop' || typeof result.answer !== 'string' || !result.answer.trim()) throw new Error('invalid_upstream_response');
        const sources = [...new Set(Array.isArray(result.source_ids) ? result.source_ids : [])]
          .filter(id => sourceById.has(id)).slice(0, 3)
          .map(id => ({ title: sourceById.get(id).title, href: sourceById.get(id).href }));
        emit({ type: 'done', answer: result.answer.trim().slice(0, 1000), sources });
      } catch {
        emit({ type: 'error', error: 'stream_interrupted' });
      } finally {
        await reader.cancel().catch(() => {});
        if (!cancelled) controller.close();
      }
    },
    cancel() { cancelled = true; return reader.cancel(); }
  }), { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store, no-transform', 'X-Accel-Buffering': 'no', 'X-Content-Type-Options': 'nosniff' } });
}
