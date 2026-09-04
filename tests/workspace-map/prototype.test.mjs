import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pagePath = new URL('../../src/pages/tools/workspace-map-prototype.astro', import.meta.url);

test('prototype keeps the existing delegation flow once and only adds task-specific extensions', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /data-integrated-map/);
  assert.match(source, /data-template-core/);
  assert.match(source, /data-template-node/);
  assert.match(source, /data-work-node/);
  assert.match(source, /data-optional-node/);
  assert.match(source, /data-branch-edge/);
  assert.match(source, /기존 흐름은 그대로, 업무 전용 도구만 붙어요/);
  assert.match(source, /업무용 스킬/);
  assert.match(source, /업무용 스크립트/);
  assert.match(source, /업무용 MCP/);
  assert.match(source, /PKM 연계/);
  assert.match(source, /필요할 때만/);
  assert.doesNotMatch(source, /data-work-boundary/);
  assert.doesNotMatch(source, /data-workflow-edge|data-reference-edge/);
  assert.doesNotMatch(source, /이번에 사용자가 만드는 실제 업무/);
  assert.doesNotMatch(source, /문의 답변 명세|답변 확인 화면|샘플 문의 검사/);
  assert.doesNotMatch(source, /data-work-list|data-foundation-list|artifact-list/);
  assert.doesNotMatch(source, /__workspace-map\/state\.json/);
  assert.doesNotMatch(source, /테르엔|terren/i);
});

test('prototype keeps existing instruction files inside the fixed flow instead of duplicating them as new nodes', async () => {
  const source = await readFile(pagePath, 'utf8');

  for (const file of ['AGENTS.md', 'SOUL.md', 'USER.md', 'CLAUDE.md', 'GEMINI.md']) {
    assert.match(source, new RegExp(file.replace('.', '\\.')));
  }
  assert.match(source, /기존 구성은 고정 흐름의 상세에서 확인/);
  assert.match(source, /\{ from: 'entry', to: 'context'/);
  assert.match(source, /\{ from: 'context', to: 'spec'/);
  assert.doesNotMatch(source, /\{ from: 'entry', to: 'spec'/);
  assert.doesNotMatch(source, /id: 'claude-adapter'|id: 'agents-rules'|id: 'soul-context'|id: 'user-context'/);
});

test('prototype shows optional PKM as a reusable knowledge loop, not an endpoint', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /data-knowledge-edge/);
  assert.match(source, /\{ from: 'output', to: 'optional-pkm'/);
  assert.match(source, /\{ from: 'optional-pkm', to: 'context'/);
  assert.match(source, /정제·저장/);
  assert.match(source, /다음 업무에서 관련 지식 불러오기/);
});

test('prototype keeps file paths in hover and selection details, not node bodies', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /class="node-tooltip"/);
  assert.match(source, /data-detail-panel/);
  assert.match(source, /data-detail-paths/);
  assert.match(source, /data-component-id/);
  assert.match(source, /aria-describedby/);
  assert.match(source, /addEventListener\(['"]click['"]/);
  assert.doesNotMatch(source, /\.prototype-node[^}]*overflow-y\s*:\s*(?:auto|scroll)/s);
});

test('prototype is readable and clearly marked as a non-live review screen', async () => {
  const source = await readFile(pagePath, 'utf8');

  assert.match(source, /시안 · 실제 파일과 아직 연결되지 않음/);
  assert.match(source, /<Base[^>]+full/);
  assert.match(source, /--prototype-node-title-size:\s*1\.1[2-9]rem|--prototype-node-title-size:\s*1\.[2-9]rem/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{3,8}\b/);
});
