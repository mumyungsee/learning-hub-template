import { scanWorkspace } from './scan.mjs';
import { WORKSPACE_MAP_SCHEMA_VERSION } from './manifest.mjs';

const ROUTE = '/__workspace-map/state.json';

function sendJson(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.end(JSON.stringify(body));
}

export function workspaceMapDevPlugin({ root = process.cwd(), scan = scanWorkspace } = {}) {
  return {
    name: 'workspace-map-local-state',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const path = new URL(request.url ?? '/', 'http://localhost').pathname;
        if (path !== ROUTE) {
          next();
          return;
        }
        if (request.method !== 'GET') {
          sendJson(response, 405, {
            schemaVersion: WORKSPACE_MAP_SCHEMA_VERSION,
            error: 'method-not-allowed',
            message: '이 주소는 현재 상태를 읽는 요청만 받을 수 있어요.',
            generatedAt: new Date().toISOString(),
          });
          return;
        }

        try {
          const snapshot = await scan(root);
          sendJson(response, 200, snapshot);
        } catch {
          sendJson(response, 503, {
            schemaVersion: WORKSPACE_MAP_SCHEMA_VERSION,
            error: 'workspace-scan-failed',
            message: '현재 상태를 확인하지 못했어요. 개발 서버를 다시 확인해 주세요.',
            generatedAt: new Date().toISOString(),
          });
        }
      });
    },
  };
}
