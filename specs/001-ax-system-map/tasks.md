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

**Goal**: Show the approved vertical delegation architecture, real baseline status, roles, and connections in a readable full-width page.

**Independent Test**: In the unpersonalized Git template, open the map and confirm existing files appear as present while root `AGENTS.md`, `SOUL.md`, and `USER.md` appear as expected, not as errors.

### Tests for User Story 1

- [x] T013 [P] [US1] Add baseline fixture expectations for original and personalized file sets in `tests/workspace-map/scan.test.mjs`
- [x] T014 [P] [US1] Add a static page contract test for required views, status text, relative-path details, and no hardcoded duplicate topology in `tests/workspace-map/page.test.mjs`

### Implementation for User Story 1

- [x] T015 [US1] Implement the full-width vertical map, four teaching views, readable cards, connectors, legend, and detail panel in `src/pages/tools/workspace-map.astro`
- [x] T016 [US1] Render baseline node states from `scripts/workspace-map/manifest.mjs` and distinguish conceptual, expected, and present nodes in `src/pages/tools/workspace-map.astro`
- [ ] T017 [US1] Ensure 1920×1080 at 100% zoom has readable labels, no horizontal page scroll, and no connector/text overlap in `src/pages/tools/workspace-map.astro`

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
- [ ] T033 Perform one local browser pass for four views, 1920×1080 readability, live update, stale recovery, and privacy using `specs/001-ax-system-map/quickstart.md`
- [x] T034 Update `HANDOFF.md`, `../docs/계획.md`, and `../docs/worklog/2026-09-03.md` with verified facts, remaining risks, and the next decision without changing project status
- [x] T035 Re-run Spec Kit consistency analysis against `spec.md`, `plan.md`, and `tasks.md`; resolve all critical findings before completion

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

### MVP First

1. Complete Setup and Foundational phases.
2. Complete US1 and open the readable baseline map.
3. Stop briefly at the US1 checkpoint to ensure the approved architecture is still understandable before adding live behavior.

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
