# Tasks: 실습용 AX 구조 지도

**Input**: Design documents from `specs/001-ax-system-map/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: The specification requires deterministic state, privacy, timing, build, and browser checks. Test tasks are included and must fail before the corresponding implementation where practical.

**Organization**: Tasks are grouped by user story. Although `[P]` marks technically independent files, this workspace executes them sequentially unless the user explicitly requests parallel work.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Different files and no dependency on another unfinished task
- **[Story]**: Maps to a user story in `spec.md`
- Every task names the exact file or path it changes or verifies

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add only the reusable folders and commands needed by the map without changing existing content.

- [x] T001 Add `check:map` while preserving existing scripts in `package.json`
- [x] T002 [P] Create the test entry point in `scripts/check-workspace-map.mjs`
- [x] T003 [P] Create shared map module placeholders under `scripts/workspace-map/`
- [x] T004 [P] Create fixture directories under `tests/workspace-map/fixtures/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the one source of truth, bounded scanner, state contract, and local-only endpoint that all stories need.

**⚠️ CRITICAL**: No user story work begins until the scanner can prove it stays inside the project root and never returns contents or absolute paths.

- [x] T005 [P] Write manifest consistency tests for unique node IDs, valid edges/views, safe probes, and customer-neutral labels in `tests/workspace-map/manifest.test.mjs`
- [x] T006 Implement nodes, edges, views, allowlisted probes, exclusions, and Korean status labels in `scripts/workspace-map/manifest.mjs`
- [x] T007 [P] Write scanner contract tests for `expected`, `present`, exclusions, relative paths, match caps, and unreadable artifacts in `tests/workspace-map/scan.test.mjs`
- [x] T008 Implement bounded read-only probe resolution, observation collection, and snapshot summaries in `scripts/workspace-map/scan.mjs`
- [x] T009 [P] Write development endpoint tests for GET, 405, 503 redaction, `no-store`, and schema shape in `tests/workspace-map/dev-plugin.test.mjs`
- [x] T010 Implement the development-only `/__workspace-map/state.json` middleware in `scripts/workspace-map/dev-plugin.mjs`
- [x] T011 Register the workspace-map development plugin without changing static output in `astro.config.mjs`
- [x] T012 Wire the Node test runner and deterministic fixture lifecycle into `scripts/check-workspace-map.mjs`

**Checkpoint**: `npm run check:map` passes for the manifest, scanner, and endpoint without touching `src/content/` or any personalized learner files.

---

## Phase 3: User Story 1 — 템플릿 구조 이해하기 (Priority: P1) 🎯 MVP

**Goal**: Show the initial readable delegation map, real baseline status, roles, and connections in a full-width page. The first tabbed vertical presentation is superseded by Phase 8 after user review.

**Independent Test**: In the unpersonalized Git template, open the map and confirm existing files appear as present while root `AGENTS.md`, `SOUL.md`, and `USER.md` appear as expected, not as errors.

### Tests for User Story 1

- [x] T013 [P] [US1] Add baseline fixture expectations for original and personalized file sets in `tests/workspace-map/scan.test.mjs`
- [x] T014 [P] [US1] Add a static page contract test for required views, status text, relative-path details, and no hardcoded duplicate topology in `tests/workspace-map/page.test.mjs`

### Implementation for User Story 1

- [x] T015 [US1] Implement the first full-width vertical map, four teaching views, readable cards, connectors, legend, and detail panel in `src/pages/tools/workspace-map.astro` (superseded by T038–T041 after user review)
- [x] T016 [US1] Render baseline node states from `scripts/workspace-map/manifest.mjs` and distinguish conceptual, expected, and present nodes in `src/pages/tools/workspace-map.astro`
- [x] T017 [US1] Superseded the first vertical-map visual check with the user-reviewed fixed-topology check in T043

**Checkpoint**: User Story 1 works as a static teaching map even if live scanning is unavailable.

---

## Phase 4: User Story 2 — 실습 진행 상태를 지도에서 확인하기 (Priority: P2)

**Goal**: Reflect supported creation, edit, rename, move, and deletion changes within 5 seconds and show stale state honestly.

**Independent Test**: Run the fixture mutation sequence and confirm ten representative changes update the correct nodes within two polling cycles without manual map editing.

### Tests for User Story 2

- [x] T018 [US2] Add create, edit, rename, move, delete, unsupported-location, and 100-artifact timing cases in `tests/workspace-map/scan.test.mjs`
- [x] T019 [P] [US2] Add polling, non-overlap, hidden-tab pause, stale snapshot, and recovery source-contract checks in `tests/workspace-map/page.test.mjs`

### Implementation for User Story 2

- [x] T020 [US2] Add 2-second polling, request non-overlap, visibility pause/resume, and previous-snapshot comparison in `src/pages/tools/workspace-map.astro`
- [x] T021 [US2] Highlight only changed nodes and expose last successful time and scan duration in `src/pages/tools/workspace-map.astro`
- [x] T022 [US2] Preserve the last good snapshot and show a clear stale/recovery message on endpoint failure in `src/pages/tools/workspace-map.astro`

**Checkpoint**: User Stories 1 and 2 work together, and stopping/restarting the dev server does not turn stale data into current data.

---

## Phase 5: User Story 3 — 증거에 따라 완료 상태 판단하기 (Priority: P3)

**Goal**: Separate existence from verification and never infer completion from a filename or recent modification alone.

**Independent Test**: Compare a present-only fixture with a fully checked current requirements checklist and confirm only the recognized current evidence reaches `verified`.

### Tests for User Story 3

- [x] T023 [US3] Add checked, unchecked, oversized, malformed, unrelated, and stale checklist evidence cases in `tests/workspace-map/scan.test.mjs`

### Implementation for User Story 3

- [x] T024 [US3] Implement capped parsing for recognized evidence and conservative `verified`/`needs-review` transitions in `scripts/workspace-map/scan.mjs`
- [x] T025 [US3] Show evidence paths, judgment reasons, and non-color status labels in the detail panel in `src/pages/tools/workspace-map.astro`

**Checkpoint**: A file with no recognized current evidence remains `present`; malformed or ambiguous evidence cannot produce a false pass.

---

## Phase 6: User Story 4 — 다른 AX 강의에서 재사용하기 (Priority: P4)

**Goal**: Keep the map customer-neutral and make the verified feature usable in a personalized learner copy without creating a second source of truth.

**Independent Test**: Apply the feature patch to a personalized copy and confirm its `AGENTS.md`, `SOUL.md`, and `USER.md` appear as present while no customer name, absolute path, or file content appears.

### Tests for User Story 4

- [x] T026 [P] [US4] Add customer-name, absolute-path, environment-file, and file-content leak guards in `tests/workspace-map/manifest.test.mjs` and `tests/workspace-map/dev-plugin.test.mjs`

### Implementation for User Story 4

- [x] T027 [US4] Add concise local-map usage and privacy guidance without duplicating feature requirements in `README.md`
- [x] T028 [US4] Apply only the verified feature patch to `../../../my-learning-hub/package.json`, `../../../my-learning-hub/astro.config.mjs`, `../../../my-learning-hub/scripts/`, `../../../my-learning-hub/tests/`, and `../../../my-learning-hub/src/pages/tools/workspace-map.astro`
- [x] T029 [US4] Verify personalized `AGENTS.md`, `SOUL.md`, `USER.md`, `CLAUDE.md`, and `GEMINI.md` are detected read-only from `../../../my-learning-hub/`

**Checkpoint**: The Git template remains the implementation source; the classroom copy contains the same verified feature files plus its own learner-created context.

---

## Phase 7: Polish & Cross-Cutting Verification

**Purpose**: Prove requirements across stories, protect the existing site, and leave accurate project state.

- [x] T030 Run `npm run check:map` and `npm run check` in the Git template and record exact results in `../docs/worklog/2026-09-03.md`
- [x] T031 Check CPU and available physical memory, then run one `npm run build` in the Git template and record the result in `../docs/worklog/2026-09-03.md`
- [x] T032 Run the same lightweight checks and one resource-approved build in `../../../my-learning-hub/` without altering its learner content
- [x] T033 Superseded the four-view browser pass with the fixed-topology browser pass in T043 after user review
- [x] T034 Update `HANDOFF.md`, `../docs/계획.md`, and `../docs/worklog/2026-09-03.md` with verified facts, remaining risks, and the next decision without changing project status
- [x] T035 Re-run Spec Kit consistency analysis against `spec.md`, `plan.md`, and `tasks.md`; resolve all critical findings before completion

---

## Phase 8: User-reviewed fixed architecture revision

**Purpose**: Replace the tabbed sequence presentation with one persistent architecture topology while preserving the verified local scanner, privacy boundary, and stale-state behavior.

- [x] T036 [P] [US1] Replace page contract expectations for view tabs with fixed topology, one core boundary, all authored connections, and in-node artifact lists in `tests/workspace-map/page.test.mjs`
- [x] T037 [P] [US1] Add manifest contract expectations for stable layout coordinates, node sizes, one core boundary, and customer-neutral labels in `tests/workspace-map/manifest.test.mjs`
- [x] T038 [US1] Add fixed node layout, sizes, core boundary, and routed connection metadata while removing primary teaching views from `scripts/workspace-map/manifest.mjs`
- [x] T039 [US1] Replace the tabbed vertical sequence with one fixed detailed architecture canvas and readable routed connectors in `src/pages/tools/workspace-map.astro`
- [x] T040 [US2] Render all observed relative paths inside their owning nodes, highlight newly added paths and changed nodes, and keep the detail panel secondary in `src/pages/tools/workspace-map.astro`
- [x] T041 [US2] Remove obsolete view data from the live state response and update its contract in `scripts/workspace-map/scan.mjs`, `specs/001-ax-system-map/contracts/workspace-map-state.schema.json`, and `tests/workspace-map/`
- [x] T042 [US4] Add `npm run map`, `open-workspace-map.cmd`, and concise local-copy guidance in `package.json` and `README.md`
- [ ] T043 Run map and structure checks in the Git template, then perform a resource-approved build and browser inspection of the fixed topology
- [x] T044 [US4] Apply only the verified revised feature files to `../../../my-learning-hub/` and repeat lightweight checks there
- [x] T045 Update `HANDOFF.md`, `../docs/계획.md`, and the current project worklog with verified facts and remaining user visual checks

---

## Phase 9: Template foundation and active-work separation

**Purpose**: Keep the approved fixed topology while ensuring template-provided files explain the foundation and only explicitly linked learner work counts as progress.

- [x] T046 [P] [US1] Add page and manifest contract expectations for separate `기본 제공` and `이번 업무` layers and active-work-only labels in `tests/workspace-map/page.test.mjs` and `tests/workspace-map/manifest.test.mjs`
- [x] T047 [US2] Add failing fixture tests for absent, valid, malformed, out-of-root, excluded, missing, and checked-evidence active-work pointers in `tests/workspace-map/scan.test.mjs`
- [x] T048 [US2] Implement bounded `.workspace-map/active-work.json` parsing and split foundation/work observations in `scripts/workspace-map/scan.mjs`
- [x] T049 [US1] Update status metadata and baseline snapshot semantics for active-work-only progress in `scripts/workspace-map/manifest.mjs`
- [x] T050 [US1] Render active task title, prominent `이번 업무` files, muted `기본 제공` files, and no-task guidance without adding tabs in `src/pages/tools/workspace-map.astro`
- [x] T051 [US3] Update schema and local endpoint documentation for contract version 2 and conservative current-task evidence in `specs/001-ax-system-map/contracts/`
- [x] T052 [US4] Update learner instructions and quickstart validation for creating and maintaining the one active-work pointer in `README.md` and `specs/001-ax-system-map/quickstart.md`
- [x] T053 Run Spec Kit consistency analysis, map tests, and structure checks in the Git template; resolve all critical findings
- [x] T054 [US4] Mirror only verified map feature files to `../../../my-learning-hub/`, leave its active-work pointer absent until a real task is selected, and repeat lightweight checks
- [x] T055 Update `HANDOFF.md`, `../docs/계획.md`, and the current worklog with the semantic split and remaining resource-gated visual checks

---

## Phase 10: Separate-node architecture prototype

**Purpose**: Validate the revised teaching model before changing the existing live scanner or active-work pointer contract.

- [x] T056 [US1] Revise `specs/001-ax-system-map/spec.md`, `plan.md`, `research.md`, and `data-model.md` so fixed template nodes and learner-created logical component nodes are separate
- [x] T057 [P] [US1] Add a static prototype contract test for separate boundaries, visible user nodes, two connector types, hover path preview, click detail, and no node-internal scrolling in `tests/workspace-map/prototype.test.mjs`
- [x] T058 [US1] Implement the customer-neutral static review route without filesystem access in `src/pages/tools/workspace-map-prototype.astro`
- [x] T059 Run `npm run check:map` and `npm run check` in the Git template and resolve prototype regressions
- [x] T060 [US4] Mirror only the prototype page and its test to `../../../my-learning-hub/` and repeat lightweight checks there
- [x] T061 Perform a resource-approved browser inspection at 1920×1080 and open `/tools/workspace-map-prototype` for user review
- [x] T062 Update `HANDOFF.md`, `../docs/계획.md`, and the current worklog with the prototype checkpoint and keep live-contract migration pending
- [x] T063 Close the two-boundary prototype as rejected while preserving `scripts/workspace-map/`, `.workspace-map/active-work.json`, and `/tools/workspace-map`

---

## Phase 11: Integrated branch-node prototype

**Purpose**: Keep one template architecture and show each learner-created component as a local branch attached to the fixed node it extends.

- [x] T064 [US1] Revise `specs/001-ax-system-map/spec.md`, `plan.md`, `research.md`, `data-model.md`, and `quickstart.md` from two boundaries to one integrated branching topology
- [x] T065 [P] [US1] Replace prototype tests with expectations for one integrated canvas, no current-work boundary, local branch connectors, and the actual `CLAUDE.md`/`GEMINI.md` → `AGENTS.md` → `SOUL.md`/`USER.md` chain in `tests/workspace-map/prototype.test.mjs`
- [x] T066 [US1] Rebuild the static review route so instruction files and example spec/skill/script/MCP/database/verification/output/handoff nodes grow around their owning fixed nodes in `src/pages/tools/workspace-map-prototype.astro`
- [x] T067 Run `npm run check:map` and `npm run check` in the Git template, mirror only the revised prototype page and test to `../../../my-learning-hub/`, and repeat both checks there
- [x] T068 Perform a resource-approved browser inspection of the integrated topology, hover path preview, and click details at 1920×1080
- [x] T069 Update `HANDOFF.md`, `../docs/계획.md`, and the current worklog with the rejected two-track concept and the integrated prototype checkpoint
- [x] T070 Close the integrated all-artifact prototype as rejected because duplicating specification, verification, output, handoff, and instruction files created a second workflow

---

## Phase 12: Baseline flow with extension-only branches

**Purpose**: Keep the existing delegation flow exactly once and show separate nodes only for task-specific execution capabilities that the learner actually adds.

- [x] T071 [US1] Revise `spec.md`, `plan.md`, `research.md`, `data-model.md`, and `quickstart.md` so baseline artifacts update fixed-node details while only task-specific extensions create branches
- [x] T072 [P] [US1] Replace prototype expectations with one baseline flow, three active skill/script/MCP extensions, optional DB/PKM examples, and no second workflow in `tests/workspace-map/prototype.test.mjs`
- [x] T073 [US1] Remove duplicate instruction/specification/verification/output/handoff nodes and rebuild `/tools/workspace-map-prototype` with extension-only branches
- [x] T074 [US4] Mirror only the revised prototype page and test to `../../../my-learning-hub/` and pass `npm run check:map` and `npm run check` in both copies
- [x] T075 Perform a resource-approved browser inspection confirming eight fixed nodes, three active extensions, two optional examples, five branches, zero duplicate workflow connectors, and fixed-node detail
- [x] T076 Update `HANDOFF.md`, `../docs/계획.md`, and the current worklog with the rejected all-artifact prototype and extension-only checkpoint
- [x] T077 Record user review that the extension-only direction is acceptable but requires the actual entry-to-context direction and a reusable PKM feedback loop

---

## Phase 13: Actual instruction direction and PKM reuse loop

**Purpose**: Make the fixed flow match how tool adapters read common instructions and show PKM as reusable long-term knowledge rather than a terminal output.

- [x] T078 [US1] Add the `entry → context → specification` and `output → PKM → next context` requirements to `spec.md`, `plan.md`, `research.md`, `data-model.md`, and `quickstart.md`
- [x] T079 [P] [US1] Add failing prototype tests for the real instruction direction, no direct entry-to-specification shortcut, and both labeled PKM knowledge edges
- [x] T080 [US1] Reposition the fixed flow and implement labeled optional PKM refinement/reuse arrows in `src/pages/tools/workspace-map-prototype.astro`
- [x] T081 [US4] Mirror the revised prototype page and test to `../../../my-learning-hub/` and pass `npm run check:map` and `npm run check` in both copies
- [x] T082 Perform a browser inspection confirming eight fixed nodes, three active extensions, two optional examples, four attachment branches, two PKM knowledge edges, and zero duplicate workflow edges
- [x] T083 Update `HANDOFF.md`, `../docs/계획.md`, and the current worklog with the actual instruction direction and PKM feedback checkpoint
- [x] T084 Obtain user approval of the revised visual before changing the live scanner, pointer contract, or `/tools/workspace-map`

---

## Phase 14: Approved model live migration

**Purpose**: Apply the approved single-flow, extension-only model to the real local scanner and `/tools/workspace-map` without treating template files as learner progress.

- [x] T085 [US1] Revise manifest, pointer schema, state schema, and source-contract tests for eight fixed nodes plus task-specific execution extensions
- [x] T086 [US2] Implement bounded schema-version-2 pointer parsing and read-only skill/script/MCP/API/database/PKM extension observation in `scripts/workspace-map/scan.mjs`
- [x] T087 [US1] Replace the rejected in-node file-list live UI with the approved fixed flow, attached extension nodes, optional DB/PKM examples, and PKM reuse loop in `src/pages/tools/workspace-map.astro`
- [x] T088 [US4] Mirror only verified map feature files to `../../../my-learning-hub/` and pass `npm run check:map` plus `npm run check` in both copies
- [x] T089 [US2] Verify in the browser that a temporary script extension appears as a separate harness branch, opens its path detail, then disappears after its pointer and file are removed
- [x] T090 Record the approved contract, live verification evidence, and remaining limits in project plan, worklog, and handoff documents

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 and blocks all user stories.
- **US1 (Phase 3)**: Starts after the foundation and delivers the static MVP.
- **US2 (Phase 4)**: Depends on US1 page and the foundational endpoint.
- **US3 (Phase 5)**: Depends on the scanner and US1 detail panel, but remains independently testable with evidence fixtures.
- **US4 (Phase 6)**: Depends on US1–US3 passing in the Git template before any classroom-copy patch.
- **Polish (Phase 7)**: Depends on all selected stories.
- **Fixed architecture revision (Phase 8)**: Supersedes only the initial US1 presentation layer and depends on the already verified scanner and endpoint foundation.
- **Foundation/current-work separation (Phase 9)**: Depends on the fixed topology and supersedes its file-presence status semantics without changing layout or connections.
- **Separate-node prototype (Phase 10)**: Supersedes the Phase 9 presentation concept, but intentionally leaves the Phase 9 live contract in place until T063 is approved.
- **Integrated branch-node prototype (Phase 11)**: Superseded the rejected Phase 10 two-boundary presentation, then was itself rejected in T070 because it duplicated the baseline workflow.
- **Extension-only prototype (Phase 12)**: Supersedes the rejected Phase 11 all-artifact branches and keeps the Phase 9 live contract unchanged through the T077 user review.
- **Instruction/PKM revision (Phase 13)**: Keeps the Phase 12 extension-only model, corrects its fixed-edge semantics, and keeps the Phase 9 live contract unchanged until T084 is approved.
- **Approved live migration (Phase 14)**: Starts only after T084 and replaces the Phase 9 live presentation and pointer contract with the approved extension-only model.

### User Story Dependencies

- **US1 (P1)**: No other story dependency after Phase 2.
- **US2 (P2)**: Uses US1’s page but has its own mutation and stale-state acceptance tests.
- **US3 (P3)**: Uses the shared scanner but its evidence rules can be tested without live polling.
- **US4 (P4)**: Requires the complete verified feature so the classroom copy is never used as a development experiment.

### Within Each User Story

- Add or extend the smallest failing test first.
- Implement only enough to pass that story’s test and acceptance scenarios.
- Run the map tests at each checkpoint.
- Do not modify the personalized copy before the Git template passes US1–US3.

### Parallel Opportunities

- T002, T003, and T004 affect separate initial paths.
- T005, T007, and T009 are separate test files once the empty module paths exist.
- T013 and T014 are separate scanner/page contracts.
- T018 and T019 are separate scanner/page behavior tests.
- T026 leak guards extend separate test files.
- Actual execution remains sequential under the workspace responsiveness rule.

---

## Parallel Example: User Story 1

```text
Task T013: Define original/personalized baseline scanner expectations in tests/workspace-map/scan.test.mjs
Task T014: Define static page requirements in tests/workspace-map/page.test.mjs
```

## Parallel Example: User Story 2

```text
Task T018: Define filesystem mutation and timing cases in tests/workspace-map/scan.test.mjs
Task T019: Define polling and stale-state source contract in tests/workspace-map/page.test.mjs
```

---

## Implementation Strategy

### Revised MVP

1. Keep the completed bounded scanner and local endpoint.
2. Validate a separate-node teaching architecture in a static prototype without touching the live contract.
3. After approval, migrate live current-work data from raw artifact rows to logical component nodes.
4. Verify the map in the original template before copying the revised live feature to the personalized classroom template.

### Incremental Delivery

1. Baseline teaching map → existing and expected structure is understandable.
2. Live state → current exercise changes appear without manual editing.
3. Evidence semantics → existence and verified completion no longer blur together.
4. Reusable classroom copy → Saturday’s personalized template uses the verified feature.

### Safety Rules

- Preserve all pre-existing dirty files unless a task names the exact file.
- Never return or log file bodies, environment values, absolute paths, usernames, or `.git` data.
- Never run a command supplied by a request to the map endpoint.
- Never scan outside the project root or recurse into excluded directories.
- Never mark an item verified solely because a file exists.
- Do not commit, push, publish, or change project status without separate user direction.
