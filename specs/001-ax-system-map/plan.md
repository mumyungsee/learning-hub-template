# Implementation Plan: 실습용 AX 구조 지도

**Branch**: `001-ax-system-map` *(Spec Kit feature identifier; Git branch not created)* | **Date**: 2026-09-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-ax-system-map/spec.md`

## Summary

기존 Astro 학습허브의 로컬 미리보기 안에 읽기 전용 AX 구조 지도 화면을 추가한다. 지도는 하나의 정본 매니페스트에 정의된 구성요소와 연결 관계를 사용하고, 개발 서버가 현재 프로젝트 루트 아래의 허용 위치만 확인해 상태 정보를 제공한다. 브라우저는 이 정보를 2초 간격으로 갱신하여 명세·계획·작업·스킬·스크립트·검증·인계 파일의 생성과 변경을 5초 안에 반영한다.

원본 템플릿에는 아직 없는 개인화 파일을 ‘오류’가 아니라 ‘아직 만들지 않음’으로 표시한다. 지난 수업에서 개인화한 복사본에 `AGENTS.md`, `SOUL.md`, `USER.md`가 있으면 실제 존재 상태로 표시한다. 검증 근거가 없는 파일은 존재 여부만 보여주며 검증 완료로 올리지 않는다.

## Technical Context

**Language/Version**: JavaScript ESM, TypeScript in Astro page scripts, Node.js `^18.17.1 || ^20.3.0 || >=21.0.0`

**Primary Dependencies**: Existing Astro 4.16.19 and Node.js built-in modules only; no new runtime package

**Storage**: No database. A source-controlled map manifest defines supported nodes and relationships; live snapshots remain in memory and are not persisted.

**Testing**: Node built-in test runner for scanner and state contract; existing `npm run check`; Astro build; one local browser visual pass

**Target Platform**: Desktop local development environment in a modern browser; Windows is the classroom baseline, with normalized paths for macOS/Linux copies

**Project Type**: Static Astro learning-hub plus a development-only, read-only local inspection endpoint

**Performance Goals**: A supported workspace change appears within 5 seconds; each bounded scan completes within 1 second for a normal student template; polling must not make the editor or browser noticeably sluggish

**Constraints**: One `npm run dev` process; no Astro server adapter; no full-drive or unrestricted repository scan; no file writes by the map; no absolute paths or file contents in browser responses; no new install step for students

**Scale/Scope**: One instructor and one learner per local workspace; fewer than 100 supported artifacts across predefined root files and small directories; one map page with four teaching views

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

The generated `.specify/memory/constitution.md` is still an unratified placeholder. It is not treated as project policy and is not filled without user approval. The applicable workspace and project rules produce these gates:

- **PASS — One source of truth**: map labels, probes, statuses, views, and connections are defined once in `scripts/workspace-map/manifest.mjs`; the UI and scanner consume that definition.
- **PASS — Bounded and read-only**: only project-relative allowlisted paths are inspected. `.git`, `node_modules`, `dist`, `.astro`, environment files, and files outside the project root are excluded.
- **PASS — Preserve the existing static site**: live status is available only during local development. The existing static build and deployment mode remain unchanged.
- **PASS — No unnecessary dependency**: existing Astro and Node.js facilities are sufficient. The static Archify artifact is a visual reference, not a required runtime.
- **PASS — Existing content remains untouched**: implementation does not rewrite `src/content/` or the personalized learner files it observes.
- **PASS — Existing visual rules**: the page reuses global CSS variables and keeps repeated map definitions out of the page.
- **PASS — Naming**: new machine-read files and routes use lowercase ASCII and hyphens.
- **PASS — Verifiable completion**: deterministic fixture tests cover presence, absence, rename, deletion, unsupported paths, conservative verification, and path privacy before browser inspection.

## Project Structure

### Documentation (this feature)

```text
specs/001-ax-system-map/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── dev-endpoint.md
│   └── workspace-map-state.schema.json
├── checklists/
│   └── requirements.md
└── tasks.md                         # created later by speckit-tasks
```

### Source Code (repository root)

```text
astro.config.mjs                     # registers the local-development map endpoint
package.json                         # adds the map-specific verification command

scripts/
├── check-structure.mjs              # existing site integrity check
├── check-workspace-map.mjs          # map contract and fixture verification entry
└── workspace-map/
    ├── manifest.mjs                 # node, edge, view, probe and status SSOT
    ├── scan.mjs                     # bounded read-only workspace inspection
    └── dev-plugin.mjs               # development-only same-origin state endpoint

src/pages/tools/
└── workspace-map.astro              # full-width teaching map and live status UI

tests/workspace-map/
├── fixtures/                        # small artificial workspaces only
├── manifest.test.mjs
└── scan.test.mjs
```

**Structure Decision**: Keep the reusable feature in the Git template at the repository root. The personalized classroom copy is a validation target, not a second source tree. The dev plugin keeps live filesystem access local without changing Astro’s static deployment model. The manifest is pure data so both scanner and page can consume the same labels and relationships.

## Phase 0 Research Decisions

Research is consolidated in [research.md](research.md). All technical unknowns are resolved:

1. Use the existing Astro dev server with a development-only middleware endpoint, rather than adding SSR or a second server.
2. Poll the bounded scanner every 2 seconds, rather than relying on filesystem watcher behavior.
3. Recreate the approved vertical Archify map structure with accessible HTML and lightweight connectors; do not require Archify at runtime.
4. Define conservative four-state semantics: `expected`, `present`, `verified`, `needs-review`.
5. Return only project-relative paths and metadata through a versioned state contract.
6. Validate the scanner with temporary fixtures and the final layout with one browser pass after lightweight checks succeed.

## Phase 1 Design

### Runtime Flow

1. `npm run dev` loads the existing Astro site and registers the development-only map endpoint.
2. The endpoint resolves the current process root once and asks the scanner for a snapshot.
3. The scanner evaluates only probes declared in the manifest and normalizes all returned paths to project-relative `/` notation.
4. The endpoint validates that no absolute path or content field is present and returns the versioned state response.
5. The map page requests a snapshot every 2 seconds, compares it with the previous successful snapshot, and highlights nodes that actually changed.
6. If a request fails, the page keeps the last successful snapshot but marks it stale and shows the last confirmed time.
7. In a production/static build, the page shows the reusable baseline map and explains that live state is available in local preview; it does not attempt to inspect the deployment host.

### State Rules

- `expected`: the manifest teaches this component, but no matching supported artifact exists.
- `present`: at least one supported artifact exists, but no current explicit verification evidence proves completion.
- `verified`: a component-specific evidence rule recognizes an explicit current passing artifact. File existence alone never produces this state.
- `needs-review`: a supported artifact exists but is unreadable, malformed, ambiguous, or has stale/mismatched evidence.
- Concept-only nodes such as the person’s real work use a separate `conceptual` marker and are not falsely treated as files.

### Initial Supported Probes

- Root context and entry files: `AGENTS.md`, `SOUL.md`, `USER.md`, `CLAUDE.md`, `GEMINI.md`, `HANDOFF.md`, `README.md`
- Existing and Spec Kit skills: `.claude/skills/*/SKILL.md`, `.agents/skills/*/SKILL.md`
- Specification flow: `.specify/`, `specs/*/spec.md`, `plan.md`, `tasks.md`, `checklists/*.md`
- Harness parts: allowlisted files under `scripts/workspace-map/`, other top-level `scripts/*.mjs`, and recognized tool-connection filenames when present
- Outputs: supported entries under `src/content/` and `src/pages/tools/`
- Verification: the existing structure check, map fixture tests, and fully checked feature requirement checklists; unsupported logs are shown only as present, never passed

### Privacy and Failure Boundaries

- The endpoint accepts no filesystem path from the request.
- Each candidate is resolved against the fixed project root and rejected if it escapes that root.
- File contents are not returned. Limited content reading is allowed only for known small evidence files and is capped before parsing.
- Error responses contain a plain Korean category and recovery hint, not stack traces or absolute paths.
- A failed scan does not replace the last successful snapshot.

### Post-Design Constitution Re-check

- **PASS**: the design keeps one manifest, one scanner, one UI and one endpoint responsibility.
- **PASS**: no source/content duplication or personalized-copy fork is introduced.
- **PASS**: static deployment stays intact and local state never becomes a public endpoint.
- **PASS**: the scan is bounded, read-only, testable, and conservative about verification.
- **PASS**: the plan adds no package and no second long-running process.

## Complexity Tracking

No gate violation requires an exception.
