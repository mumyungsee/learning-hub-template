import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { workspaceMapDevPlugin } from '../../scripts/workspace-map/dev-plugin.mjs';

function getMiddleware(options) {
  let middleware;
  const plugin = workspaceMapDevPlugin(options);
  plugin.configureServer({
    middlewares: {
      use(handler) {
        middleware = handler;
      },
    },
  });
  assert.equal(typeof middleware, 'function');
  return middleware;
}

async function invoke(middleware, { url = '/__workspace-map/state.json', method = 'GET' } = {}) {
  const headers = new Map();
  let body = '';
  let nextCalled = false;
  const response = {
    statusCode: 200,
    setHeader(name, value) {
      headers.set(name.toLowerCase(), String(value));
    },
    end(chunk = '') {
      body += String(chunk);
    },
  };
  await middleware({ url, method }, response, () => {
    nextCalled = true;
  });
  return { statusCode: response.statusCode, headers, body, nextCalled };
}

test('GET returns a no-store live snapshot', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'workspace-map-endpoint-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'README.md'), '# Fixture', 'utf8');
  const result = await invoke(getMiddleware({ root }));
  assert.equal(result.statusCode, 200);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.match(result.headers.get('content-type'), /^application\/json/);
  const body = JSON.parse(result.body);
  assert.equal(body.schemaVersion, 3);
  assert.equal(body.activeWork, null);
  assert.equal(body.mode, 'live');
  assert.ok(Array.isArray(body.nodes));
  assert.ok(Array.isArray(body.edges));
  assert.equal(body.views, undefined);
});

test('non-GET method is rejected and unrelated route passes through', async () => {
  const middleware = getMiddleware({ root: process.cwd() });
  const post = await invoke(middleware, { method: 'POST' });
  assert.equal(post.statusCode, 405);
  const other = await invoke(middleware, { url: '/other' });
  assert.equal(other.nextCalled, true);
});

test('scan failure response redacts internal details', async () => {
  const privateDetail = 'C:\\Users\\private\\secret.txt';
  const scan = async () => {
    throw new Error(privateDetail);
  };
  const result = await invoke(getMiddleware({ root: process.cwd(), scan }));
  assert.equal(result.statusCode, 503);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.ok(!result.body.includes(privateDetail));
  assert.ok(!result.body.includes('stack'));
  const body = JSON.parse(result.body);
  assert.equal(body.error, 'workspace-scan-failed');
});
