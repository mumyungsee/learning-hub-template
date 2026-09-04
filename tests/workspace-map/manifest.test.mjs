import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ACTIVE_WORK_POINTER_PATH,
  WORKSPACE_MAP_SCHEMA_VERSION,
  createBaselineSnapshot,
  mapManifest,
  statusMeta,
} from '../../scripts/workspace-map/manifest.mjs';

test('manifest ids and references are internally consistent', () => {
  const nodeIds = mapManifest.nodes.map((node) => node.id);
  assert.equal(nodeIds.length, 8);
  assert.equal(new Set(nodeIds).size, nodeIds.length);

  const known = new Set(nodeIds);
  assert.equal(mapManifest.edges.length, 8);
  for (const edge of mapManifest.edges) {
    assert.ok(known.has(edge.from), `unknown edge source: ${edge.from}`);
    assert.ok(known.has(edge.to), `unknown edge target: ${edge.to}`);
  }

  assert.equal(mapManifest.optionalExtensions.length, 2);
  assert.equal(mapManifest.knowledgeEdges.length, 2);
  assert.equal(mapManifest.extensionTypes.length, 6);

  assert.equal(mapManifest.views, undefined);
  assert.equal(mapManifest.boundaries.length, 1);
  for (const boundary of mapManifest.boundaries) {
    assert.ok(boundary.nodeIds.length > 0);
    for (const id of boundary.nodeIds) assert.ok(known.has(id), `unknown boundary node: ${id}`);
  }
});

test('manifest defines one stable readable topology', () => {
  for (const node of mapManifest.nodes) {
    assert.ok(Number.isFinite(node.layout.x));
    assert.ok(Number.isFinite(node.layout.y));
    assert.ok(node.layout.width >= 170);
    assert.ok(node.layout.height >= 116);
  }

  const edgeIds = new Set(mapManifest.edges.map((edge) => edge.id));
  assert.ok(edgeIds.has('resume-work'));
  assert.ok(mapManifest.edges.some((edge) => Array.isArray(edge.via) && edge.via.length > 0));
  assert.deepEqual(mapManifest.edges.slice(1, 3).map((edge) => [edge.from, edge.to]), [
    ['entry', 'context'],
    ['context', 'spec'],
  ]);
  assert.deepEqual(mapManifest.knowledgeEdges.map((edge) => [edge.from, edge.to]), [
    ['output', 'optional-pkm'],
    ['optional-pkm', 'context'],
  ]);
});

test('manifest probes stay relative and outside excluded roots', () => {
  const excluded = new Set(mapManifest.excludedRoots);

  for (const node of mapManifest.nodes) {
    for (const probe of node.probes ?? []) {
      assert.doesNotMatch(probe.path, /^(?:[A-Za-z]:|\/|\\)/);
      assert.ok(!probe.path.split('/').includes('..'));
      assert.ok(!excluded.has(probe.path.split('/')[0]));
      assert.ok(probe.depth >= 0 && probe.depth <= 3);
      assert.ok(probe.maxMatches >= 1 && probe.maxMatches <= 100);
    }
  }
  for (const definition of mapManifest.extensionTypes) {
    for (const rule of definition.rules) {
      assert.doesNotMatch(rule.path, /^(?:[A-Za-z]:|\/|\\)/);
      assert.ok(!rule.path.split('/').includes('..'));
      assert.ok(!excluded.has(rule.path.split('/')[0]));
    }
  }
});

test('manifest is reusable and contains no customer or local-machine path', () => {
  const text = JSON.stringify(mapManifest);
  assert.doesNotMatch(text, /테르엔|terren/i);
  assert.doesNotMatch(text, /[A-Za-z]:\\|\\Users\\|\/Users\//);
});

test('baseline and labels describe active work without counting template files', () => {
  assert.equal(WORKSPACE_MAP_SCHEMA_VERSION, 3);
  assert.equal(ACTIVE_WORK_POINTER_PATH, '.workspace-map/active-work.json');
  assert.equal(statusMeta.expected.label, '업무 미연결');
  assert.equal(statusMeta.present.label, '작업 중');
  assert.equal(statusMeta.conceptual, undefined);

  const snapshot = createBaselineSnapshot();
  assert.equal(snapshot.schemaVersion, 3);
  assert.equal(snapshot.activeWork, null);
  assert.ok(snapshot.nodes.every((node) => node.status === 'expected'));
  assert.ok(snapshot.nodes.every((node) => node.workCount === 0));
  assert.ok(snapshot.nodes.every((node) => Array.isArray(node.foundationPaths)));
  assert.ok(snapshot.nodes.every((node) => Array.isArray(node.workPaths)));
  assert.deepEqual(snapshot.extensions, []);
});
