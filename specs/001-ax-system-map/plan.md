# Implementation Plan: 실습용 AX 구조 지도

**Branch**: `001-ax-system-map` *(Spec Kit feature identifier; Git branch not created)* | **Date**: 2026-09-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-ax-system-map/spec.md`

## Summary

기존 Astro 학습허브의 로컬 미리보기 안에 읽기 전용 AX 구조 지도 화면을 둔다. 지도는 하나의 정본 매니페스트에 정의된 여덟 고정 구성요소, 실제 업무 확장, 선택 예시와 재사용 연결을 함께 보여준다. 개발 서버가 현재 프로젝트 루트 아래의 허용 위치만 확인하고, 브라우저는 이 정보를 2초 간격으로 갱신한다.

표현 구조는 하나의 통합 지도다. 템플릿의 공통 지침·도구별 입구·명세 방식·하네스 기반·검증 방식·결과·인계 노드는 기존 업무 흐름으로 한 번만 남는다. 명세·검증·결과·인계 파일과 공통 지침 파일은 별도 신규 노드로 복제하지 않고 고정 노드의 상세와 상태를 갱신한다. 수강생이 현재 업무 때문에 새로 만든 업무 전용 스킬·스크립트·MCP 같은 실행 확장만 대응하는 고정 노드 주변에 가지처럼 추가한다. DB·PKM처럼 아직 연결하지 않은 선택 요소는 실제 확장과 다른 ‘추가 가능’ 예시로 표시한다.

고정 흐름의 지침 방향은 `도구별 입구 → 공통 지침·맥락 → 명세`다. PKM은 끝 노드가 아니라 `결과물 → 정제·저장 → PKM → 다음 업무의 공통 지침·맥락`으로 되돌아오는 선택적 지식 순환이다. PKM이 실제로 연결되기 전에는 노드와 두 연결을 모두 선택 예시로 표시한다.

2026-09-04에 정적 시안을 승인받아 `.workspace-map/active-work.json` 포인터 버전 2와 실시간 상태 계약 버전 3으로 이전했다. 기본 산출물은 고정 노드 상세를 갱신하고 `extensions`에 명시한 실행 능력만 별도 노드가 된다.

## Technical Context

**Language/Version**: JavaScript ESM, TypeScript in Astro page scripts, Node.js `^18.17.1 || ^20.3.0 || >=21.0.0`

**Primary Dependencies**: Existing Astro 4.16.19 and Node.js built-in modules only; no new runtime package

**Storage**: No database. A source-controlled map definition describes fixed template nodes and their relationships. An optional project-local pointer describes fixed-node artifacts and active logical extensions by exact relative paths; live snapshots remain in memory and are not persisted.

**Testing**: Node built-in test runner for scanner and state contract; existing `npm run check`; Astro build; one local browser visual pass

**Target Platform**: Desktop local development environment in a modern browser; Windows is the classroom baseline, with normalized paths for macOS/Linux copies

**Project Type**: Static Astro learning-hub plus a development-only, read-only local inspection endpoint

**Performance Goals**: A supported workspace change appears within 5 seconds; each bounded scan completes within 1 second for a normal student template; polling must not make the editor or browser noticeably sluggish

**Constraints**: One `npm run dev` process; no Astro server adapter; no full-drive or unrestricted repository scan; no file writes by the map; no absolute paths or file contents in browser responses; no new install step for students

**Scale/Scope**: One instructor and one learner per local workspace; fewer than 100 supported artifacts across predefined root files and small directories; one fixed template architecture whose local branches grow around their owning nodes with no primary view tabs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

The generated `.specify/memory/constitution.md` is still an unratified placeholder. It is not treated as project policy and is not filled without user approval. The applicable workspace and project rules produce these gates:

- **PASS — One source of truth**: map labels, probes, statuses, layout, boundaries, and connections are defined once in `scripts/workspace-map/manifest.mjs`; the UI and scanner consume that definition.
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
│   ├── active-work-pointer.schema.json
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
    ├── manifest.mjs                 # node, edge, layout, boundary, probe and status SSOT
    ├── scan.mjs                     # bounded read-only workspace inspection
    └── dev-plugin.mjs               # development-only same-origin state endpoint

src/pages/tools/
├── workspace-map.astro              # current live map; unchanged until prototype approval
└── workspace-map-prototype.astro    # separate static architecture review page

tests/workspace-map/
├── fixtures/                        # small artificial workspaces only
├── manifest.test.mjs
├── prototype.test.mjs               # static prototype contract
└── scan.test.mjs
```

**Structure Decision**: Keep the reusable feature in the Git template at the repository root. The personalized classroom copy is a validation target, not a second source tree. During the visual checkpoint, the prototype is a separate static route with example data and does not consume or change the live scanner. After approval, the manifest and pointer contract become the single source for fixed template nodes, active logical components, and both kinds of connections.

## Phase 0 Research Decisions

Research is consolidated in [research.md](research.md). All technical unknowns are resolved:

1. Use the existing Astro dev server with a development-only middleware endpoint, rather than adding SSR or a second server.
2. Poll the bounded scanner every 2 seconds, rather than relying on filesystem watcher behavior.
3. Recreate the approved Archify architecture topology as one fixed local map with accessible HTML nodes and routed connectors; do not require Archify at runtime or split the topology into tabs.
4. Define conservative four-state semantics: `expected`, `present`, `verified`, `needs-review`.
5. Return only project-relative paths and metadata through a versioned state contract.
6. Validate the scanner with temporary fixtures and the final layout with one browser pass after lightweight checks succeed.
7. Validate the revised node semantics with a separate static prototype before migrating the live scanner and pointer contract.

## Phase 1 Design

### Runtime Flow

1. `npm run dev` loads the existing Astro site and registers the development-only map endpoint.
2. The endpoint resolves the current process root once and asks the scanner for a snapshot.
3. The scanner evaluates only probes declared in the manifest and normalizes all returned paths to project-relative `/` notation.
4. The endpoint validates that no absolute path or content field is present and returns the versioned state response.
5. After visual approval, the map page keeps the baseline flow fixed, updates baseline artifacts inside their owning fixed-node details, and creates separate nodes only for active task-specific execution extensions. Each extension references its template foundation while path details remain outside the node body.
6. If a request fails, the page keeps the last successful snapshot but marks it stale and shows the last confirmed time.
7. In a production/static build, the page shows the reusable baseline map and explains that live state is available in local preview; it does not attempt to inspect the deployment host.

### Fixed Template and Active Work Layout

- Preserve the approved template topology as one fixed architecture. Do not create a separate current-work track or boundary.
- Keep specification, verification, output, handoff, and common-instruction artifacts inside the existing fixed flow through node status and detail; do not render duplicate learner nodes for them.
- Render only new task-specific execution extensions—such as a domain skill, script, MCP, API, database, or PKM link—as separate rectangles beside the fixed node whose capability they extend.
- Connect each extension to its fixed template node with a visually distinct branch connector. Do not create a second workflow track between extension nodes.
- Keep the actual learning-mate chain in the fixed entry/context node detail: Codex enters through `AGENTS.md`; `CLAUDE.md` and `GEMINI.md` point to `AGENTS.md`; `AGENTS.md` instructs the runtime to read `SOUL.md` and `USER.md` and routes matching work to skills.
- Style unimplemented DB/PKM examples as optional future additions and exclude them from progress.
- Route the fixed flow from tool entry to common context and then to specification; do not bypass context with a direct entry-to-specification edge.
- Show optional PKM with two labeled arrows: validated output is refined and stored into PKM, and relevant knowledge returns from PKM to the common context of a later task.
- Do not place expandable file lists or internal scrolling inside map nodes. Show a short relative-path summary on hover and full paths, status, and evidence in the selected-node detail panel.
- When extensions multiply, grow the local branch area and preserve readable spacing; do not squeeze text or change to tabs.
- Add a cross-platform `npm run map` entry and a Windows one-click launcher that start the existing local server and open the map; they add no second background service.

### Visual Prototype Gate

1. Keep `/tools/workspace-map` and all scanner contracts unchanged.
2. Add `/tools/workspace-map-prototype` with representative, customer-neutral example nodes and no filesystem access.
3. Verify one integrated topology, no duplicated baseline-flow nodes, locally attached execution extensions, distinct optional examples, hover path preview, click detail, text size, and absence of node-internal scroll at 1920×1080.
4. Ask for user approval of the prototype.
5. Only after approval, revise the active-work pointer, scanner output, manifest, and live page to the logical-component model.

### State Rules

- `expected`: the current task does not point to an artifact for this component. Foundation files may still be present.
- `present`: at least one current-task artifact exists, but no current explicit verification evidence proves completion.
- `verified`: a component-specific evidence rule recognizes an explicit current passing artifact. File existence alone never produces this state.
- `needs-review`: a supported artifact exists but is unreadable, malformed, ambiguous, or has stale/mismatched evidence.
- The owner node becomes `present` only when a valid current task pointer names the delegated task; without one it remains `expected`.
- Foundation observations never promote `expected` to `present` or `verified`.

### Active Work Pointer

The following describes the currently implemented active-work pointer version 2 contract. Its live snapshot schema is version 3.

- Optional path: `.workspace-map/active-work.json`.
- Required fields when present: schema version, stable task ID, learner-facing title, a fixed-node artifact list, and an execution-extension list.
- Each artifact entry may update only specification, verification, output, or handoff fixed-node details.
- Each extension declares one logical ID, label, supported type, and one or more exact relative paths. Its type determines the fixed node it attaches to.
- Paths are pointers only. The scanner never copies, moves, edits, or executes the referenced file.
- Absolute paths, parent traversal, excluded roots, environment files, unknown node IDs, duplicates, oversized descriptors, and missing targets produce a bounded `needs-review` explanation.
- The scanner does not guess task membership from modification time, directory location, or filename.

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

- **PASS**: the design keeps one manifest, one active-work pointer, one scanner, one UI and one endpoint responsibility; layout and task membership are not duplicated in the page.
- **PASS**: no source/content duplication or personalized-copy fork is introduced.
- **PASS**: static deployment stays intact and local state never becomes a public endpoint.
- **PASS**: the scan is bounded, read-only, testable, and conservative about verification.
- **PASS**: the plan adds no package and no second long-running process.
- **PASS**: the visual checkpoint prevents an unapproved presentation model from forcing a scanner or pointer migration.

## Complexity Tracking

No gate violation requires an exception.
