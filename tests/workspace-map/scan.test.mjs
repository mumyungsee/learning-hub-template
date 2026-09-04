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

function state(snapshot, id) {
  const found = snapshot.nodes.find((node) => node.id === id);
  assert.ok(found, `missing node state: ${id}`);
  return found;
}

test('original and personalized baselines are distinguished', async (t) => {
  const original = await tempWorkspace('original');
  const personalized = await tempWorkspace('original');
  t.after(() => Promise.all([rm(original, { recursive: true, force: true }), rm(personalized, { recursive: true, force: true })]));
  await cp(join(fixtures, 'personalized'), personalized, { recursive: true });

  const originalState = await scanWorkspace(original);
  assert.equal(state(originalState, 'context').status, 'expected');
  assert.equal(state(originalState, 'harness').status, 'present');
  assert.equal(state(originalState, 'output').status, 'present');

  const personalizedState = await scanWorkspace(personalized);
  assert.equal(state(personalizedState, 'context').status, 'present');
  assert.deepEqual(state(personalizedState, 'context').paths, ['AGENTS.md', 'SOUL.md', 'USER.md']);
  assert.equal(state(personalizedState, 'entry').status, 'present');
});

test('snapshot exposes only allowlisted relative metadata', async (t) => {
  const root = await tempWorkspace('original');
  t.after(() => rm(root, { recursive: true, force: true }));
  const secret = 'SHOULD_NOT_LEAVE_THE_FILE';
  await put(root, '.env', `TOKEN=${secret}`);
  await put(root, 'node_modules/private.txt', secret);
  await put(root, '.git/config', secret);
  await put(root, 'src/content/wiki/secret-example.md', secret);
  await put(root, 'random/unsupported.md', secret);

  const snapshot = await scanWorkspace(root);
  const serialized = JSON.stringify(snapshot);
  assert.ok(!serialized.includes(root));
  assert.ok(!serialized.includes(secret));
  assert.ok(!serialized.includes('.env'));
  assert.ok(!serialized.includes('node_modules'));
  assert.ok(!serialized.includes('.git'));
  assert.ok(!serialized.includes('random/unsupported.md'));

  for (const node of snapshot.nodes) {
    for (const path of [...node.paths, ...node.evidencePaths]) {
      assert.doesNotMatch(path, /^(?:[A-Za-z]:|\/|\\)/);
      assert.ok(!path.split('/').includes('..'));
      assert.ok(!path.includes('\\'));
    }
  }
});

test('ten representative supported changes update the correct nodes immediately', async (t) => {
  const root = await tempWorkspace('original');
  t.after(() => rm(root, { recursive: true, force: true }));

  assert.equal(state(await scanWorkspace(root), 'spec').status, 'expected');

  // 1. create a specification
  const specPath = await put(root, 'specs/001-demo/spec.md', '# Spec');
  let current = await scanWorkspace(root);
  assert.equal(state(current, 'spec').status, 'present');
  assert.ok(state(current, 'spec').paths.includes('specs/001-demo/spec.md'));

  // 2. edit the specification
  const future = new Date(Date.now() + 2000);
  await utimes(specPath, future, future);
  const edited = await scanWorkspace(root);
  assert.notEqual(state(edited, 'spec').latestModifiedAt, state(current, 'spec').latestModifiedAt);

  // 3. rename spec.md to plan.md
  const renamedPath = join(root, 'specs', '001-demo', 'plan.md');
  await rename(specPath, renamedPath);
  current = await scanWorkspace(root);
  assert.ok(state(current, 'spec').paths.includes('specs/001-demo/plan.md'));
  assert.ok(!state(current, 'spec').paths.includes('specs/001-demo/spec.md'));

  // 4. move the plan to another feature folder
  const movedPath = join(root, 'specs', '002-demo', 'plan.md');
  await mkdir(dirname(movedPath), { recursive: true });
  await rename(renamedPath, movedPath);
  current = await scanWorkspace(root);
  assert.ok(state(current, 'spec').paths.includes('specs/002-demo/plan.md'));

  // 5. delete the specification folder
  await rm(join(root, 'specs'), { recursive: true, force: true });
  assert.equal(state(await scanWorkspace(root), 'spec').status, 'expected');

  // 6–10. add one supported artifact to five other map nodes
  await put(root, '.claude/skills/live-check/SKILL.md', '# Skill');
  assert.ok(state(await scanWorkspace(root), 'harness').paths.includes('.claude/skills/live-check/SKILL.md'));
  await put(root, 'scripts/live-check.mjs', 'export default true;');
  assert.ok(state(await scanWorkspace(root), 'harness').paths.includes('scripts/live-check.mjs'));
  await put(root, 'src/pages/tools/live-check.astro', '<h1>Live</h1>');
  assert.ok(state(await scanWorkspace(root), 'output').paths.includes('src/pages/tools/live-check.astro'));
  await put(root, 'src/content/wiki/live-check.md', '# Knowledge');
  assert.ok(state(await scanWorkspace(root), 'knowledge').paths.includes('src/content/wiki/live-check.md'));
  await put(root, 'HANDOFF.md', '# Handoff');
  assert.equal(state(await scanWorkspace(root), 'handoff').status, 'present');
});

test('ten files outside the support boundary never enter the map', async (t) => {
  const root = await tempWorkspace('original');
  t.after(() => rm(root, { recursive: true, force: true }));
  const unsupported = [
    'random/spec.md',
    'notes/plan.md',
    '.git/private.md',
    'node_modules/private.md',
    'dist/private.md',
    'build/private.md',
    'coverage/private.md',
    '.env.local',
    'src/content/wiki/ignored.txt',
    'src/content/deep/a/b/c/too-deep.md',
  ];

  for (const path of unsupported) await put(root, path, 'DO_NOT_EXPOSE');
  const serialized = JSON.stringify(await scanWorkspace(root));
  for (const path of unsupported) assert.ok(!serialized.includes(path), `unexpected path: ${path}`);
});

test('recognized current checklist evidence is required for verified', async (t) => {
  const root = await tempWorkspace('original');
  t.after(() => rm(root, { recursive: true, force: true }));
  await put(root, 'specs/001-demo/spec.md', '# Spec');

  assert.equal(state(await scanWorkspace(root), 'spec').status, 'present');

  await put(root, 'specs/001-demo/checklists/requirements.md', '- [x] clear\n- [ ] measurable\n');
  assert.equal(state(await scanWorkspace(root), 'spec').status, 'present');

  await put(root, 'specs/001-demo/checklists/requirements.md', '- [x] clear\n- [x] measurable\n');
  let checked = state(await scanWorkspace(root), 'spec');
  assert.equal(checked.status, 'verified');
  assert.deepEqual(checked.evidencePaths, ['specs/001-demo/checklists/requirements.md']);

  await put(root, 'specs/001-demo/checklists/requirements.md', 'This claims success without checklist evidence.');
  assert.equal(state(await scanWorkspace(root), 'spec').status, 'needs-review');

  await put(root, 'specs/001-demo/checklists/requirements.md', 'x'.repeat(140 * 1024));
  assert.equal(state(await scanWorkspace(root), 'spec').status, 'needs-review');
});

test('bounded scan handles exactly 100 supported artifacts within one second', async (t) => {
  const root = await tempWorkspace('original');
  t.after(() => rm(root, { recursive: true, force: true }));
  // original fixture의 example.md 1개를 포함해 정확히 100개다.
  for (let index = 0; index < 99; index += 1) {
    await put(root, `src/content/wiki/page-${String(index).padStart(3, '0')}.md`, '# Fixture');
  }

  const started = performance.now();
  const snapshot = await scanWorkspace(root);
  const elapsed = performance.now() - started;
  assert.ok(elapsed < 1000, `scan took ${elapsed.toFixed(1)}ms`);
  assert.equal(state(snapshot, 'knowledge').artifactCount, 100);
  assert.equal(state(snapshot, 'knowledge').status, 'present');
});

test('a completed checklist older than its target artifact needs review', async (t) => {
  const root = await tempWorkspace('original');
  t.after(() => rm(root, { recursive: true, force: true }));
  const specPath = await put(root, 'specs/001-demo/spec.md', '# Newer spec');
  const checklistPath = await put(
    root,
    'specs/001-demo/checklists/requirements.md',
    '- [x] clear\n- [x] measurable\n',
  );

  const old = new Date('2025-01-01T00:00:00Z');
  const recent = new Date('2025-01-02T00:00:00Z');
  await utimes(checklistPath, old, old);
  await utimes(specPath, recent, recent);

  const result = state(await scanWorkspace(root), 'spec');
  assert.equal(result.status, 'needs-review');
  assert.match(result.reason, /오래/);
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

test('a scan issue without any readable artifact still needs review', async (t) => {
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
  assert.equal(result.status, 'needs-review');
  assert.match(result.reason, /허용 범위/);
});
