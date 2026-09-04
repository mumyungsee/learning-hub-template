import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pagePath = new URL('../../src/pages/tools/workspace-map.astro', import.meta.url);

test('page keeps topology in the manifest and exposes the teaching controls', async () => {
  const source = await readFile(pagePath, 'utf8');
  assert.match(source, /mapManifest/);
  assert.match(source, /data-node-id/);
  assert.match(source, /data-view-id/);
  assert.match(source, /detail-incoming-list/);
  assert.match(source, /detail-outgoing-list/);
  assert.match(source, /aria-live/);
  assert.match(source, /<Base[^>]+full/);
  assert.doesNotMatch(source, /테르엔|terren/i);
  assert.doesNotMatch(source, /공통 지침과 사용자 맥락/);
});

test('page polling is bounded, visibility-aware, and recovers from stale state', async () => {
  const source = await readFile(pagePath, 'utf8');
  assert.match(source, /__workspace-map\/state\.json/);
  assert.match(source, /POLL_INTERVAL_MS\s*=\s*2_000|POLL_INTERVAL_MS\s*=\s*2000/);
  assert.match(source, /CHANGE_HIGHLIGHT_MS\s*=\s*10_000|CHANGE_HIGHLIGHT_MS\s*=\s*10000/);
  assert.match(source, /document\.hidden/);
  assert.match(source, /inFlight/);
  assert.match(source, /lastSuccessful/);
  assert.match(source, /highlightTimers/);
  assert.match(source, /clearTimeout/);
  assert.match(source, /sessionStorage/);
  assert.match(source, /before\.mode\s*!==\s*['"]live['"]/);
  assert.match(source, /stale/);
});

test('page styles use shared variables and avoid fixed horizontal canvas', async () => {
  const source = await readFile(pagePath, 'utf8');
  assert.doesNotMatch(source, /#[0-9a-fA-F]{3,8}\b/);
  assert.doesNotMatch(source, /min-width:\s*[2-9]\d{3}px/);
  assert.match(source, /font-size:\s*(?:1\.1|1\.2|1\.25|1\.3)rem/);
  assert.match(source, /overflow-x:\s*(?:clip|hidden)/);
});
