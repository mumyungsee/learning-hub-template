# Quickstart Validation: 실습용 AX 구조 지도

## Purpose

구현 뒤 다음 순서로 기능을 검증한다. 실제 수강생 파일을 만들거나 지우는 검사는 하지 않고, 생성·이동·삭제 검사는 자동 임시 작업공간에서 수행한다.

## Prerequisites

- Supported Node.js and npm versions from `package.json` and Astro
- Existing project dependencies installed
- Feature implementation tasks completed
- No unrelated development server left running on port 4321

## 1. Lightweight automated checks

```bash
npm run check:map
npm run check
```

Expected:

- Map manifest IDs and connections are internally consistent.
- Fixture cases for missing, present, renamed, deleted, unsupported and malformed artifacts pass.
- No absolute path, file body, excluded directory or environment file appears in a response.
- A file without recognized evidence is never marked `verified`.
- Existing site structure checks still pass.

## 2. Original-template baseline

```bash
npm run dev
```

Open:

```text
http://localhost:4321/tools/workspace-map
```

Expected in the unpersonalized Git template:

- `README.md`, existing `.claude/skills/`, source content and structure check appear as present.
- Root `AGENTS.md`, `SOUL.md`, `USER.md` appear as expected but not yet created.
- The absence of those optional learner-created files is not shown as a system failure.
- The page says live local status is connected and shows a recent confirmed time.

## 3. Personalized-copy validation

After the verified feature patch is applied to a personalized learner copy, run the same `npm run dev` command from that copy and open the same route.

Expected:

- Existing `AGENTS.md`, `SOUL.md`, `USER.md`, `CLAUDE.md` and `GEMINI.md` appear as present.
- Only project-relative paths are shown.
- Personal names, the full computer path and file contents do not appear.
- The personalized copy is not treated as the implementation source; reusable changes remain in the Git template.

## 4. Live update timing

Use the automated fixture mode provided by `npm run check:map` to perform ten representative changes: create, edit, rename, move and delete across supported artifact types.

Expected:

- All ten changes appear in the next two polling cycles and within 5 seconds.
- A changed node is highlighted without changing unrelated nodes.
- An artifact moved outside the allowlisted location disappears from the map rather than remaining as a stale node.
- The scan remains under 1 second for the fixture representing 100 supported artifacts.

## 5. Failure and stale-state behavior

With the map page open, stop the development server without closing the page.

Expected:

- The last successful map remains visible.
- Within 5 seconds the page clearly says it is not current.
- The last confirmed time remains visible.
- No raw exception, absolute path or stack trace is shown.

Restart the server.

Expected:

- Polling recovers without a page reload.
- The stale warning clears only after a new successful snapshot arrives.

## 6. Classroom visual check

At a 1920×1080 browser viewport and 100% zoom, inspect all four views.

Expected:

- Core labels, status badges, relationship labels and detail text are readable without zoom.
- The primary flow reads vertically and does not require horizontal page scrolling.
- Connectors do not cross body text.
- State is distinguishable by label and icon as well as color.
- Selecting a node reveals its role and relative paths without navigating away.

## 7. Static build regression

Before this step, check available memory according to the workspace rule. Run only one build.

```bash
npm run build
```

Expected:

- The existing static site builds without an SSR adapter.
- The built map page contains the reusable baseline explanation.
- The live local state route is not emitted as a public runtime endpoint.
- Existing home, project, wiki and library routes remain available.

## Completion evidence

Record exact command results and the one browser visual result in the project worklog. Do not mark the feature complete from file existence alone. User approval remains a separate final gate.
