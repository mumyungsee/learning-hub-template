# Data Model: 실습용 AX 구조 지도

## Overview

이 기능은 데이터베이스를 사용하지 않는다. 정적인 지도 정의와 매 요청 때 계산하는 현재 상태를 분리한다.

- **지도 정의**: 무엇을 가르치고 어떤 관계로 보여줄지 정하는 정본
- **관찰 결과**: 허용된 위치에서 실제로 발견한 파일 메타데이터
- **상태 판정**: 지도 정의와 관찰 결과를 합쳐 만든 교육용 상태
- **지도 스냅샷**: 한 시점의 전체 상태를 브라우저에 전달하는 묶음

## Entity: MapDefinition

지도 전체의 안정된 교육 구조다.

| Field | Type | Rules |
|---|---|---|
| `schemaVersion` | integer | Initial value is `1`; changes only for incompatible manifest shapes |
| `title` | string | Reusable Korean title with no customer name |
| `nodes` | MapNodeDefinition[] | Unique node IDs |
| `edges` | MapEdge[] | Both endpoints must reference existing node IDs |
| `views` | MapView[] | At least one view; node IDs must exist |
| `excludedRoots` | string[] | Fixed project-relative directory names that can never be scanned |

### Validation

- No absolute path, drive letter, parent traversal segment, customer name, or private file content is allowed.
- Labels, roles, probes, status rules, connections and views are defined here once; the UI must not keep a second copy.
- All paths use `/` separators in the definition even on Windows.

## Entity: MapNodeDefinition

한 박스가 무엇을 뜻하고 어디를 확인할지 정의한다.

| Field | Type | Rules |
|---|---|---|
| `id` | string | Lowercase ASCII identifier; unique |
| `label` | string | Short learner-facing name |
| `role` | string | One-sentence explanation of why it exists |
| `category` | enum | `entry`, `context`, `specification`, `harness`, `verification`, `output`, `handoff`, `knowledge`, `external` |
| `kind` | enum | `conceptual` or `artifact-group` |
| `probes` | Probe[] | Empty only for conceptual nodes |
| `evidenceRules` | EvidenceRule[] | Optional and conservative |
| `order` | integer | Stable vertical teaching order |

## Entity: Probe

스캐너가 확인해도 되는 범위를 표현한다.

| Field | Type | Rules |
|---|---|---|
| `type` | enum | `exact`, `children`, or `pattern` |
| `path` | string | Project-relative allowlisted root; no `..`, absolute prefix or excluded root |
| `pattern` | string | Optional simple filename pattern within `path`; cannot widen the root |
| `depth` | integer | `0` to `3`; defaults to the smallest useful value |
| `maxMatches` | integer | `1` to `100`; overflow produces `needs-review` rather than an unbounded result |

## Entity: ArtifactObservation

한 번의 제한된 탐색에서 발견한 파일 또는 폴더의 메타데이터다.

| Field | Type | Rules |
|---|---|---|
| `relativePath` | string | Project-relative `/` path only |
| `artifactType` | string | Derived from the matched probe, not guessed from content |
| `modifiedAt` | ISO timestamp | From filesystem metadata |
| `readable` | boolean | Whether required metadata or capped evidence content could be read |
| `size` | integer | Non-negative bytes for files; omitted for directories |

### Privacy rules

- Absolute root and operating-system username never become fields.
- File bodies are not stored in the observation.
- Known evidence files may be read internally up to a fixed size, but their body is never returned.

## Entity: EvidenceRule

무엇을 ‘검증됨’으로 인정할지 구성요소별로 제한한다.

| Field | Type | Rules |
|---|---|---|
| `id` | string | Identifies the allowlisted evidence rule |
| `kind` | enum | Initial value is `checked-checklist` |
| `path` | string | Project-relative allowlisted root |
| `pattern` | string | Checklist filename pattern inside `path` |
| `depth` | integer | `0` to `3` |
| `maxMatches` | integer | Capped number of evidence files to inspect |
| `maxBytes` | integer | Maximum checklist body size read internally |
| `currentness` | enum | Initial value is `not-older-than-target` |

### Initial evidence behavior

- A requirements checklist is verified only when it contains no unchecked requirement item and can be associated with its feature specification.
- A check script’s mere existence proves only that a verification mechanism exists; it does not prove that its latest execution passed.
- Unknown logs, prose claims and recently modified files do not create verified status.
- When currentness cannot be established, the target remains `present` or becomes `needs-review`; it never advances to `verified` by guesswork.

## Entity: NodeState

브라우저가 한 지도 박스에 표시하는 현재 판정이다.

| Field | Type | Rules |
|---|---|---|
| `id` | string | Matches a MapNodeDefinition ID |
| `status` | enum | `conceptual`, `expected`, `present`, `verified`, `needs-review` |
| `reason` | string | Plain Korean explanation; no private details |
| `paths` | string[] | Sorted unique project-relative paths; capped at the node limit |
| `artifactCount` | integer | Number of returned supported paths after the display cap; overflow separately becomes `needs-review` |
| `latestModifiedAt` | ISO timestamp or null | Newest observation time |
| `evidencePaths` | string[] | Only recognized relative evidence paths |

### State transitions

```text
conceptual                          (no filesystem transition)

expected ── supported artifact appears ──> present
present  ── current explicit evidence ──> verified
verified ── target changes/evidence stale ──> needs-review
present or verified ── malformed/ambiguous/unreadable ──> needs-review
needs-review ── issue resolved, no proof ──> present
needs-review ── issue resolved with proof ──> verified
present/verified/needs-review ── all matching artifacts and scan issues removed ──> expected
```

## Entity: MapEdge

두 구성요소가 위임 흐름에서 어떻게 이어지는지 보여준다.

| Field | Type | Rules |
|---|---|---|
| `id` | string | Unique lowercase ASCII identifier |
| `from` | string | Existing node ID |
| `to` | string | Existing node ID |
| `label` | string | Short Korean relationship phrase |
| `style` | enum | `normal`, `emphasis`, `feedback`, or `future` |

## Entity: MapView

같은 구조에서 수업 목적에 맞는 부분만 강조하는 보기다.

| Field | Type | Rules |
|---|---|---|
| `id` | string | Unique lowercase ASCII identifier |
| `label` | string | Learner-facing tab label |
| `description` | string | What to notice in this view |
| `focusNodeIds` | string[] | Existing node IDs |

Initial views:

1. `current-template` — 기본 템플릿과 지난 실습에서 생긴 요소
2. `class-build` — 명세에서 실행·검증·인계까지 이번 수업에서 만드는 흐름
3. `run-state` — 존재·검증·확인 필요와 최근 변경
4. `future-system` — 다른 도구와 PKM으로 확장 가능한 연결

## Entity: MapSnapshot

한 번의 응답으로 전달되는 전체 상태다.

| Field | Type | Rules |
|---|---|---|
| `schemaVersion` | integer | `1` for the initial contract |
| `mode` | enum | `live` or `baseline` |
| `generatedAt` | ISO timestamp | Time this scan completed |
| `rootLabel` | string | Project folder name only, never an absolute path |
| `staleAfterMs` | integer | `5000` initially |
| `durationMs` | integer | Non-negative scan duration |
| `nodes` | NodeState[] | Exactly one state per manifest node |
| `edges` | MapEdge[] | From the manifest SSOT |
| `views` | MapView[] | From the manifest SSOT |
| `summary` | object | Counts by state; total equals node count |

## Client-only state

The following is intentionally not part of the server snapshot:

- previous successful snapshot
- IDs changed since the previous poll
- last successful time shown after a request failure
- selected teaching view
- expanded detail card

Keeping these in the browser prevents temporary UI state from being mistaken for workspace truth.
