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
- Fixture cases for absent, valid, malformed, renamed, deleted, unsupported, excluded and missing current-work pointers pass.
- No absolute path, file body, excluded directory or environment file appears in a response.
- A file without recognized evidence is never marked `verified`.
- Existing site structure checks still pass.

## 2. Original-template baseline

```bash
npm run map
```

Windows에서는 `open-workspace-map.cmd`를 한 번 실행해도 같은 동작을 해야 한다.

Open:

```text
http://localhost:4321/tools/workspace-map
```

Expected in the unpersonalized Git template:

- `README.md`, existing skills, source content and structure checks appear under muted `기본 제공` lists.
- Every node remains `업무 미연결`; foundation files do not become active progress.
- The page says “기본 환경은 준비됐어요. 이번에 위임할 업무는 아직 연결되지 않았어요.” and shows a recent confirmed time.

## 3. Personalized-copy validation

After the verified feature patch is applied to a personalized learner copy, run the same `npm run dev` command from that copy and open the same route.

Expected:

- Existing `AGENTS.md`, `SOUL.md`, `USER.md`, `CLAUDE.md` and `GEMINI.md` remain in the fixed entry/context node details and never become separate current-work nodes.
- Only project-relative paths are shown.
- Personal names, the full computer path and file contents do not appear.
- The personalized copy is not treated as the implementation source; reusable changes remain in the Git template.

## 4. Connect one real delegated task

After the learner chooses a real task, create `.workspace-map/active-work.json` through the learning mate. Do not add this file to the distributed blank template.

Minimal example:

```json
{
  "schemaVersion": 2,
  "id": "inquiry-reply",
  "title": "기업 AI 강의 문의 답변 자동화",
  "artifacts": [
    { "nodeId": "spec", "path": "specs/001-inquiry/spec.md" },
    { "nodeId": "output", "path": "src/pages/tools/inquiry-reply.astro" }
  ],
  "extensions": [
    {
      "id": "inquiry-reply-skill",
      "label": "문의 답변 스킬",
      "type": "skill",
      "paths": [".agents/skills/inquiry-reply/SKILL.md"]
    }
  ]
}
```

Expected:

- The current task title appears in the live status area.
- The spec and output update their existing fixed-node details.
- Only the task-specific skill appears as a separate attached node beside the harness.
- A missing, excluded, outside-root, duplicate, or unsupported pointer is never treated as progress.

## 5. Live update timing

Use the automated fixture mode provided by `npm run check:map` to perform ten representative changes: create, edit, rename, move and delete across supported artifact types.

Expected:

- All ten changes appear in the next two polling cycles and within 5 seconds.
- A newly connected execution extension appears as its own node without changing unrelated fixed nodes.
- An extension removed from the pointer disappears from the map instead of remaining as a stale node.
- The scan remains under 1 second for the fixture representing 100 supported artifacts.

## 6. Failure and stale-state behavior

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

## 7. Classroom visual check

At a 1920×1080 browser viewport and 100% zoom, inspect the one fixed architecture map.

Expected:

- All eight fixed nodes, the single-flow boundary, and all authored connections remain visible without switching tabs.
- Core labels, status badges, and relationship labels are readable without zoom.
- Actual extensions, optional examples, and the fixed flow are visually distinct without extra tabs.
- The architecture topology matches the approved reference and does not turn into a vertical sequence.
- Connectors do not cross body text.
- Added spec, verification, output, and handoff files update fixed-node details; skill, script, MCP, API, database, and PKM links become separate extension nodes.
- State is distinguishable by label and icon as well as color.
- Selecting a node reveals its role and relative paths without navigating away.

### Approved architecture prototype checkpoint

Before changing the live scanner or pointer contract, open:

```text
http://localhost:4321/tools/workspace-map-prototype
```

Expected:

- One integrated template topology is visible; there is no separate current-work track or large current-work boundary.
- The existing `업무 선택 → 명세 → 하네스 → 검증 → 결과물 → 인계` flow appears exactly once.
- Common instruction files and baseline spec/output/handoff artifacts stay in the fixed-node details; they are not duplicated as new learner nodes.
- Only task-specific skill, script, and MCP examples appear as newly attached nodes around the harness foundation.
- DB and PKM appear only as visually distinct optional future additions and do not look implemented.
- The fixed entry/context detail explains that `CLAUDE.md` and `GEMINI.md` point to `AGENTS.md`, and `AGENTS.md` connects to `SOUL.md`, `USER.md`, and skill-routing rules.
- The fixed arrows run `도구별 입구 → 공통 지침·맥락 → 명세 만들기`; there is no direct entry-to-specification shortcut.
- Optional PKM has both `결과물 → 정제·저장 → PKM` and `PKM → 다음 업무의 공통 지침·맥락` arrows, so it does not look like an endpoint.
- Node bodies contain no long file list and no internal scrollbar.
- Hovering a work node reveals a short path preview; selecting it reveals all example paths and status in the detail panel.
- The page explicitly says it is a static prototype and does not imply that example files exist.
- This screen was approved on 2026-09-04 and its structure is now the live-map contract.

## 8. Static build regression

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
