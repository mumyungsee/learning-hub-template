import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pagePath = new URL('../../src/pages/tools/workspace-map.astro', import.meta.url);
const packagePath = new URL('../../package.json', import.meta.url);
const launcherPath = new URL('../../open-workspace-map.cmd', import.meta.url);

test('page keeps one fixed workflow and renders only task-specific extensions as extra nodes', async () => {
  const source = await readFile(pagePath, 'utf8');
  assert.match(source, /mapManifest/);
  assert.match(source, /data-map-canvas/);
  assert.match(source, /data-node-id/);
  assert.match(source, /data-boundary-id/);
  assert.match(source, /data-edge-id/);
  assert.match(source, /data-live-extension-nodes/);
  assert.match(source, /data-live-extension-edges/);
  assert.match(source, /data-optional-node/);
  assert.match(source, /새 실행 능력만 별도 네모로 추가/);
  assert.match(source, /HANDOFF는 재진입, PKM은 다음 업무 재사용/);
  assert.match(source, /이번에 위임할 업무는 아직 연결되지 않았어요/);
  assert.match(source, /data-detail-work/);
  assert.match(source, /data-detail-foundation/);
  assert.match(source, /aria-live/);
  assert.match(source, /<Base[^>]+full/);
  assert.doesNotMatch(source, /data-work-list/);
  assert.doesNotMatch(source, /data-foundation-list/);
  assert.doesNotMatch(source, /artifact-layers/);
  assert.doesNotMatch(source, /data-view-id/);
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
  assert.match(source, /renderExtensions/);
  assert.match(source, /renderedExtensionsFingerprint/);
  assert.match(source, /rememberSnapshotChanges/);
  assert.match(source, /CHANGE_HIGHLIGHT_MS/);
  assert.match(source, /clearTimeout/);
  assert.match(source, /currentSnapshot\.extensions/);
  assert.match(source, /extension\.paths/);
  assert.match(source, /state\.foundationPaths/);
  assert.match(source, /sessionStorage/);
  assert.match(source, /stored\?\.schemaVersion\s*===\s*3/);
  assert.match(source, /stale/);
});

test('page styles use shared variables and keep a bounded architecture canvas', async () => {
  const source = await readFile(pagePath, 'utf8');
  assert.doesNotMatch(source, /#[0-9a-fA-F]{3,8}\b/);
  assert.doesNotMatch(source, /min-width:\s*[2-9]\d{3}px/);
  assert.match(source, /--map-node-title-size:1\.18rem/);
  assert.match(source, /overflow-x:auto/);
  assert.match(source, /node-tooltip/);
});

test('learner copy has a one-action local map entry', async () => {
  const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
  const launcher = await readFile(launcherPath, 'utf8');
  assert.equal(packageJson.scripts.map, 'astro dev --open /tools/workspace-map');
  assert.match(launcher, /npm run map/);
  assert.doesNotMatch(launcher, /call npm install/);
});
