import test from 'node:test';
import assert from 'node:assert/strict';

import { mapManifest } from '../../scripts/workspace-map/manifest.mjs';

test('manifest ids and references are internally consistent', () => {
  const nodeIds = mapManifest.nodes.map((node) => node.id);
  assert.equal(new Set(nodeIds).size, nodeIds.length);

  const known = new Set(nodeIds);
  for (const edge of mapManifest.edges) {
    assert.ok(known.has(edge.from), `unknown edge source: ${edge.from}`);
    assert.ok(known.has(edge.to), `unknown edge target: ${edge.to}`);
  }

  for (const view of mapManifest.views) {
    assert.ok(view.focusNodeIds.length > 0);
    for (const id of view.focusNodeIds) assert.ok(known.has(id), `unknown view node: ${id}`);
  }
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
});

test('manifest is reusable and contains no customer or local-machine path', () => {
  const text = JSON.stringify(mapManifest);
  assert.doesNotMatch(text, /테르엔|terren/i);
  assert.doesNotMatch(text, /[A-Za-z]:\\|\\Users\\|\/Users\//);
});
