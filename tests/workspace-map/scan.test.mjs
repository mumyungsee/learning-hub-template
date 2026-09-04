import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rename, rm, utimes, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import { scanWorkspace } from '../../scripts/workspace-map/scan.mjs';
import { mapManifest } from '../../scripts/workspace-map/manifest.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, 'fixtures');

async function tempWorkspace(fixture = 'original') {
  const root = await mkdtemp(join(tmpdir(), 'workspace-map-'));
  await cp(join(fixtures, fixture), root, { recursive: true });
  return root;
}

async function put(root, relativePath, content = '') {
  const path = join(root, ...relativePath.split('/'));
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
  return path;
}

async function setActiveWork(root, artifacts, extensions = [], overrides = {}) {
  const pointer = {
    schemaVersion: 2,
    id: 'inquiry-reply',
    title: '기업 AI 강의 문의 답변 자동화',
    artifacts,
    extensions,
    ...overrides,
  };
  await put(root, '.workspace-map/active-work.json', JSON.stringify(pointer, null, 2));
}

function extension(snapshot, id) {
  const found = snapshot.extensions.find((item) => item.id === id);
  assert.ok(found, `missing extension state: ${id}`);
  return found;
}

function state(snapshot, id) {
  const found = snapshot.nodes.find((node) => node.id === id);
  assert.ok(found, `missing node state: ${id}`);
  return found;
}

test('template files are foundation only and do not count as active work', async (t) => {
  const original = await tempWorkspace('original');
  const personalized = await tempWorkspace('original');
  t.after(() => Promise.all([rm(original, { recursive: true, force: true }), rm(personalized, { recursive: true, force: true })]));
  await cp(join(fixtures, 'personalized'), personalized, { recursive: true });

  const originalState = await scanWorkspace(original);
  assert.equal(originalState.schemaVersion, 3);
  assert.equal(originalState.activeWork, null);
  assert.equal(state(originalState, 'harness').status, 'expected');
  assert.ok(state(originalState, 'harness').foundationPaths.includes('scripts/check-structure.mjs'));
  assert.equal(state(originalState, 'output').status, 'expected');
  assert.ok(state(originalState, 'output').foundationPaths.includes('src/content/wiki/example.md'));

  const personalizedState = await scanWorkspace(personalized);
  assert.equal(state(personalizedState, 'context').status, 'expected');
  assert.deepEqual(state(personalizedState, 'context').foundationPaths, ['AGENTS.md', 'SOUL.md', 'USER.md']);
  assert.deepEqual(state(personalizedState, 'context').workPaths, []);
  assert.equal(state(personalizedState, 'entry').status, 'expected');
  assert.ok(personalizedState.nodes.every((node) => node.workCount === 0));
});

test('a valid pointer connects exact current-work files without copying them', async (t) => {
  const root = await tempWorkspace('personalized');
  t.after(() => rm(root, { recursive: true, force: true }));
  await put(root, 'specs/001-inquiry/spec.md', '# Spec');
  await put(root, '.agents/skills/inquiry-reply/SKILL.md', '# Skill');
  await setActiveWork(root, [
    { nodeId: 'spec', path: 'specs/001-inquiry/spec.md' },
  ], [
    { id: 'inquiry-skill', label: '문의 답변 스킬', type: 'skill', paths: ['.agents/skills/inquiry-reply/SKILL.md'] },
  ]);

  const snapshot = await scanWorkspace(root);
  assert.deepEqual(snapshot.activeWork, {
    status: 'connected',
    id: 'inquiry-reply',
    title: '기업 AI 강의 문의 답변 자동화',
    pointerPath: '.workspace-map/active-work.json',
  });
  assert.equal(state(snapshot, 'owner').status, 'present');
  assert.equal(state(snapshot, 'spec').status, 'present');
  assert.deepEqual(state(snapshot, 'spec').workPaths, ['specs/001-inquiry/spec.md']);
  assert.deepEqual(state(snapshot, 'harness').workPaths, []);
  assert.ok(state(snapshot, 'context').foundationPaths.includes('AGENTS.md'));
  assert.deepEqual(state(snapshot, 'context').workPaths, []);
  assert.equal(extension(snapshot, 'inquiry-skill').status, 'present');
  assert.equal(extension(snapshot, 'inquiry-skill').attachTo, 'harness');
  assert.deepEqual(extension(snapshot, 'inquiry-skill').paths, ['.agents/skills/inquiry-reply/SKILL.md']);
});

test('snapshot exposes only allowlisted relative metadata', async (t) => {
  const root = await tempWorkspace('original');
  t.after(() => rm(root, { recursive: true, force: true }));
  const secret = 'SHOULD_NOT_LEAVE_THE_FILE';
  await put(root, '.env', `TOKEN=${secret}`);
  await put(root, 'node_modules/private.txt', secret);
  await put(root, '.git/config', secret);
  await put(root, 'random/unsupported.md', secret);
  await setActiveWork(root, [{ nodeId: 'output', path: 'C:/Users/private/secret.txt' }]);

  const snapshot = await scanWorkspace(root);
  const serialized = JSON.stringify(snapshot);
  assert.ok(!serialized.includes(root));
  assert.ok(!serialized.includes(secret));
  assert.ok(!serialized.includes('C:/Users/private'));
  assert.ok(!serialized.includes('.env'));
  assert.ok(!serialized.includes('node_modules'));
  assert.ok(!serialized.includes('.git'));
  assert.equal(snapshot.activeWork.status, 'invalid');

  for (const node of snapshot.nodes) {
    for (const path of [...node.foundationPaths, ...node.workPaths, ...node.missingWorkPaths, ...node.evidencePaths]) {
      assert.doesNotMatch(path, /^(?:[A-Za-z]:|\/|\\)/);
      assert.ok(!path.split('/').includes('..'));
      assert.ok(!path.includes('\\'));
    }
  }
});

test('pointer updates track create, edit, rename, move, delete and five artifact types', async (t) => {
  const root = await tempWorkspace('original');
  t.after(() => rm(root, { recursive: true, force: true }));

  assert.equal(state(await scanWorkspace(root), 'spec').status, 'expected');
  const specPath = await put(root, 'specs/001-demo/spec.md', '# Spec');
  await setActiveWork(root, [{ nodeId: 'spec', path: 'specs/001-demo/spec.md' }]);
  let current = await scanWorkspace(root);
  assert.equal(state(current, 'spec').status, 'present');

  const future = new Date(Date.now() + 2000);
  await utimes(specPath, future, future);
  const edited = await scanWorkspace(root);
  assert.notEqual(state(edited, 'spec').latestModifiedAt, state(current, 'spec').latestModifiedAt);

  const renamedPath = join(root, 'specs', '001-demo', 'plan.md');
  await rename(specPath, renamedPath);
  await setActiveWork(root, [{ nodeId: 'spec', path: 'specs/001-demo/plan.md' }]);
  current = await scanWorkspace(root);
  assert.deepEqual(state(current, 'spec').workPaths, ['specs/001-demo/plan.md']);

  const movedPath = join(root, 'specs', '002-demo', 'plan.md');
  await mkdir(dirname(movedPath), { recursive: true });
  await rename(renamedPath, movedPath);
  await setActiveWork(root, [{ nodeId: 'spec', path: 'specs/002-demo/plan.md' }]);
  assert.deepEqual(state(await scanWorkspace(root), 'spec').workPaths, ['specs/002-demo/plan.md']);

  await rm(join(root, 'specs'), { recursive: true, force: true });
  const missing = state(await scanWorkspace(root), 'spec');
  assert.equal(missing.status, 'needs-review');
  assert.deepEqual(missing.missingWorkPaths, ['specs/002-demo/plan.md']);

  const additions = [
    ['output', 'src/pages/tools/live-check.astro', '<h1>Live</h1>'],
    ['handoff', 'HANDOFF.md', '# Handoff'],
  ];
  const artifacts = [];
  for (const [nodeId, path, content] of additions) {
    await put(root, path, content);
    artifacts.push({ nodeId, path });
    await setActiveWork(root, artifacts);
    assert.ok(state(await scanWorkspace(root), nodeId).workPaths.includes(path));
  }

  const extensionFiles = [
    ['live-skill', '업무 스킬', 'skill', '.claude/skills/live-check/SKILL.md', '# Skill'],
    ['live-script', '업무 스크립트', 'script', 'scripts/live-check.py', 'print("ok")'],
    ['live-mcp', '업무 MCP', 'mcp', 'config/mcp/live-check.json', '{}'],
    ['live-db', '업무 DB', 'database', 'data/live-check.db', 'fixture'],
    ['live-pkm', '업무 PKM', 'pkm', 'src/content/wiki/live-check.md', '# Knowledge'],
  ];
  const extensions = [];
  for (const [id, label, type, path, content] of extensionFiles) {
    await put(root, path, content);
    extensions.push({ id, label, type, paths: [path] });
    await setActiveWork(root, artifacts, extensions);
    assert.ok(extension(await scanWorkspace(root), id).paths.includes(path));
  }
});

test('malformed, unsupported, excluded and missing pointer targets stay conservative', async (t) => {
  const root = await tempWorkspace('original');
  t.after(() => rm(root, { recursive: true, force: true }));

  await put(root, '.workspace-map/active-work.json', '{not json');
  let snapshot = await scanWorkspace(root);
  assert.equal(snapshot.activeWork.status, 'invalid');
  assert.equal(state(snapshot, 'owner').status, 'needs-review');

  await setActiveWork(root, [{ nodeId: 'output', path: 'random/unsupported.md' }]);
  snapshot = await scanWorkspace(root);
  assert.equal(snapshot.activeWork.status, 'invalid');
  assert.ok(!JSON.stringify(snapshot).includes('random/unsupported.md'));

  await setActiveWork(root, [{ nodeId: 'output', path: '.env.local' }]);
  snapshot = await scanWorkspace(root);
  assert.equal(snapshot.activeWork.status, 'invalid');
  assert.ok(!JSON.stringify(snapshot).includes('.env.local'));

  await setActiveWork(root, [{ nodeId: 'spec', path: 'specs/001-missing/spec.md' }]);
  snapshot = await scanWorkspace(root);
  assert.equal(snapshot.activeWork.status, 'connected');
  assert.equal(state(snapshot, 'spec').status, 'needs-review');
  assert.deepEqual(state(snapshot, 'spec').missingWorkPaths, ['specs/001-missing/spec.md']);

  await setActiveWork(root, [], [{ id: 'wrong-kind', label: '잘못 연결한 스킬', type: 'skill', paths: ['scripts/not-a-skill.py'] }]);
  snapshot = await scanWorkspace(root);
  assert.equal(snapshot.activeWork.status, 'invalid');
  assert.deepEqual(snapshot.extensions, []);

  await setActiveWork(root, [], [{ id: 'missing-script', label: '아직 없는 스크립트', type: 'script', paths: ['scripts/missing.py'] }]);
  snapshot = await scanWorkspace(root);
  assert.equal(snapshot.activeWork.status, 'connected');
  assert.equal(extension(snapshot, 'missing-script').status, 'needs-review');
  assert.deepEqual(extension(snapshot, 'missing-script').missingPaths, ['scripts/missing.py']);

  await setActiveWork(root, [], [], { unexpected: true });
  snapshot = await scanWorkspace(root);
  assert.equal(snapshot.activeWork.status, 'invalid');
});

test('only current-work checked evidence can produce verified', async (t) => {
  const root = await tempWorkspace('original');
  t.after(() => rm(root, { recursive: true, force: true }));
  const specPath = await put(root, 'specs/001-demo/spec.md', '# Spec');
  const checklistPath = await put(root, 'specs/001-demo/checklists/requirements.md', '- [x] clear\n- [x] measurable\n');

  let snapshot = await scanWorkspace(root);
  assert.equal(state(snapshot, 'spec').status, 'expected');

  await setActiveWork(root, [
    { nodeId: 'spec', path: 'specs/001-demo/spec.md' },
    { nodeId: 'spec', path: 'specs/001-demo/checklists/requirements.md', evidenceKind: 'checked-checklist' },
  ]);
  snapshot = await scanWorkspace(root);
  assert.equal(state(snapshot, 'spec').status, 'verified');
  assert.deepEqual(state(snapshot, 'spec').evidencePaths, ['specs/001-demo/checklists/requirements.md']);

  await writeFile(checklistPath, '- [x] clear\n- [ ] measurable\n', 'utf8');
  assert.equal(state(await scanWorkspace(root), 'spec').status, 'present');

  await writeFile(checklistPath, '- [x] clear\n- [x] measurable\n', 'utf8');
  const old = new Date('2025-01-01T00:00:00Z');
  const recent = new Date('2025-01-02T00:00:00Z');
  await utimes(checklistPath, old, old);
  await utimes(specPath, recent, recent);
  const stale = state(await scanWorkspace(root), 'spec');
  assert.equal(stale.status, 'needs-review');
  assert.match(stale.reason, /오래/);
});

test('bounded foundation scan handles exactly 100 artifacts within one second', async (t) => {
  const root = await tempWorkspace('original');
  t.after(() => rm(root, { recursive: true, force: true }));
  for (let index = 0; index < 99; index += 1) {
    await put(root, `src/content/wiki/page-${String(index).padStart(3, '0')}.md`, '# Fixture');
  }

  const started = performance.now();
  const snapshot = await scanWorkspace(root);
  const elapsed = performance.now() - started;
  assert.ok(elapsed < 1000, `scan took ${elapsed.toFixed(1)}ms`);
  assert.equal(state(snapshot, 'output').foundationCount, 100);
  assert.equal(state(snapshot, 'output').workCount, 0);
  assert.equal(state(snapshot, 'output').status, 'expected');
});

test('scanner never changes a supported file', async (t) => {
  const root = await tempWorkspace('original');
  t.after(() => rm(root, { recursive: true, force: true }));
  const path = join(root, 'README.md');
  const before = await readFile(path, 'utf8');
  await scanWorkspace(root);
  const after = await readFile(path, 'utf8');
  assert.equal(after, before);
});

test('foundation scan issues remain visible without becoming active progress', async (t) => {
  const root = await tempWorkspace('original');
  t.after(() => rm(root, { recursive: true, force: true }));
  const manifest = {
    ...mapManifest,
    nodes: mapManifest.nodes.map((node) => node.id === 'handoff'
      ? {
          ...node,
          probes: [{ id: 'unsafe', type: 'exact', path: '../outside.md', pattern: '', depth: 0, maxMatches: 1 }],
        }
      : node),
  };

  const result = state(await scanWorkspace(root, { manifest }), 'handoff');
  assert.equal(result.status, 'expected');
  assert.match(result.foundationIssues[0], /허용 범위/);
});
