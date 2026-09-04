# Contract: Local Development Workspace Map Endpoint

## Purpose

The endpoint gives the map page a read-only snapshot of supported artifacts in the current learning-hub project. It exists only while the local development server is running.

## Route

```text
GET /__workspace-map/state.json
```

- No query parameter, request body, path parameter, cookie or authentication value is accepted.
- Any alternate method returns `405 Method Not Allowed`.
- A production/static build does not expose this live route. The map page falls back to its baseline teaching view.

## Successful response

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Cache-Control: no-store
```

The body must validate against [workspace-map-state.schema.json](workspace-map-state.schema.json).

Example:

```json
{
  "schemaVersion": 1,
  "mode": "live",
  "generatedAt": "2026-09-03T07:30:00.000Z",
  "rootLabel": "my-learning-hub",
  "staleAfterMs": 5000,
  "durationMs": 14,
  "nodes": [
    {
      "id": "context",
      "status": "present",
      "reason": "공통 지침 파일 3개를 확인했어요.",
      "paths": ["AGENTS.md", "SOUL.md", "USER.md"],
      "artifactCount": 3,
      "latestModifiedAt": "2026-08-28T10:20:30.000Z",
      "evidencePaths": []
    }
  ],
  "edges": [],
  "views": [],
  "summary": {
    "conceptual": 1,
    "expected": 2,
    "present": 5,
    "verified": 0,
    "needsReview": 1,
    "total": 9
  }
}
```

## Failed response

```http
HTTP/1.1 503 Service Unavailable
Content-Type: application/json; charset=utf-8
Cache-Control: no-store
```

```json
{
  "schemaVersion": 1,
  "error": "workspace-scan-failed",
  "message": "현재 상태를 확인하지 못했어요. 개발 서버를 다시 확인해 주세요.",
  "generatedAt": "2026-09-03T07:30:00.000Z"
}
```

### Error requirements

- `error` is one of a small documented category set; it is not an exception message.
- `message` contains no absolute path, stack trace, file body, username, environment value or Git metadata.
- The browser keeps the previous successful snapshot, labels it stale, and displays its last confirmed time.

## Security and privacy invariants

1. The endpoint derives its root from the running project; callers cannot choose a path.
2. Every returned path is relative to that root and uses `/` separators.
3. Returned paths cannot begin with `/`, a drive letter, a URI scheme or `..`.
4. No response field contains file content.
5. Excluded directories and environment files never appear, even if a broad future probe is misconfigured.
6. Response generation performs no write, move, delete, command execution or network request.

## Refresh behavior

- The browser requests this route every 2 seconds while the page is visible.
- It pauses polling while the document is hidden and requests immediately when visible again.
- Overlapping requests are not allowed; a slow request must finish or fail before another starts.
- Responses are not cached.
