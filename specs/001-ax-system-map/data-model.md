# Data Model: 실습용 AX 구조 지도

## Overview

이 기능은 데이터베이스를 사용하지 않는다. 정적인 지도 정의와 매 요청 때 계산하는 현재 상태를 분리한다.

- **지도 정의**: 무엇을 가르치고 어떤 관계로 보여줄지 정하는 정본
- **기본 관찰 결과**: 허용된 위치에서 발견한 템플릿 바탕 파일 메타데이터
- **현재 업무 포인터**: 이번 업무 이름과 구성요소별 실제 파일 경로를 연결하는 작은 정본
- **상태 판정**: 지도 정의와 관찰 결과를 합쳐 만든 교육용 상태
- **지도 스냅샷**: 한 시점의 전체 상태를 브라우저에 전달하는 묶음

> 현재 실행 계약은 상태 스키마 버전 3과 현재 업무 포인터 버전 2다. 승인한 확장 전용 모델이 실시간 스캐너와 지도에 적용되어 있다.

## Entity: MapDefinition

지도 전체의 안정된 교육 구조다.

| Field | Type | Rules |
|---|---|---|
| `schemaVersion` | integer | Current value is `2`; changes only for incompatible manifest shapes |
| `title` | string | Reusable Korean title with no customer name |
| `nodes` | MapNodeDefinition[] | Unique node IDs |
| `edges` | MapEdge[] | Both endpoints must reference existing node IDs |
| `boundaries` | MapBoundary[] | Group labels wrap only existing node IDs |
| `excludedRoots` | string[] | Fixed project-relative directory names that can never be scanned |

### Validation

- No absolute path, drive letter, parent traversal segment, customer name, or private file content is allowed.
- Labels, roles, probes, status rules, fixed layout, boundaries and connections are defined here once; the UI must not keep a second copy.
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
| `layout` | object | Stable `x`, `y`, `width`, and `height` values in the shared map coordinate system |

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

## Entity: ActiveWorkPointer

이번에 위임할 업무와 그 업무가 실제로 만든 파일만 명시적으로 연결한다. 파일 위치가 여러 폴더에 흩어져 있어도 원본을 옮기거나 복사하지 않는다.

| Field | Type | Rules |
|---|---|---|
| `schemaVersion` | integer | Current value is `2` |
| `id` | string | Stable lowercase ASCII task identifier |
| `title` | string | Short learner-facing current task name |
| `artifacts` | ActiveWorkArtifact[] | At most 100 exact path pointers |
| `extensions` | WorkExtensionPointer[] | At most 30 task-specific execution extensions |

### ActiveWorkArtifact

| Field | Type | Rules |
|---|---|---|
| `nodeId` | string | `spec`, `verify`, `output`, or `handoff`; baseline files update only their fixed node |
| `path` | string | Exact project-relative path; no glob, absolute prefix, parent traversal, excluded root, or environment file |
| `evidenceKind` | enum or omitted | Initial supported value is `checked-checklist` |

The descriptor is absent before a learner selects a task. Absence is a normal `not-selected` condition, not an error. A descriptor is read only when it is a regular in-root file smaller than the configured cap.

## Entity: WorkExtension

현재 업무 때문에 기본 흐름에 새로 붙인 실행 능력을 별도 노드로 표현하는 단위다. 명세·검증·결과·인계와 공통 지침 파일은 포함하지 않고 고정 노드의 상태와 상세로 처리한다.

| Field | Type | Rules |
|---|---|---|
| `id` | string | 현재 업무 안에서 고유한 lowercase ASCII 식별자 |
| `label` | string | 지도에 바로 읽히는 짧은 이름 |
| `type` | enum | `skill`, `script`, `mcp`, `api`, `database`, `pkm` |
| `attachTo` | string | 종류별 허용 규칙에서 정하는 템플릿 고정 노드 ID; 포인터가 임의 지정하지 않음 |
| `paths` | string[] | 같은 논리적 구성요소를 이루는 정확한 프로젝트 상대경로; 지도 본문에는 직접 나열하지 않음 |
| `status` | enum | `present`, `needs-review` |

### Target validation

- 하나의 경로가 있다는 이유만으로 구성요소를 자동 분할하지 않는다.
- `attachTo`는 기존 템플릿 고정 노드만 가리킨다.
- 경로가 여러 개여도 노드 본문에 내부 스크롤 목록을 만들지 않는다.
- 업무 전용 확장이 0개인 상태는 정상이며 이때 고정 템플릿 구조만 보인다.
- 업무 전용 확장은 별도 업무 구획으로 이동하지 않고 `attachTo`가 가리키는 고정 노드 주변의 가지 영역에 배치된다.
- 기본 흐름에 이미 자리가 있는 산출물은 `WorkExtension`으로 만들지 않는다.
- `optional: true`인 DB·PKM 같은 예시는 실제 존재나 완료로 집계하지 않는다.

## Entity: ActiveWorkGraph

한 업무의 동적 확장 노드와 고정 흐름의 관계를 묶는 실행 모델이다.

| Field | Type | Rules |
|---|---|---|
| `id` | string | Stable delegated-task identifier |
| `title` | string | Learner-facing task title |
| `extensions` | WorkExtension[] | New task-specific execution capabilities, not baseline artifacts or raw file rows |
| `foundationEdges` | MapEdge[] | Active component → fixed template capability relationship |
| `knowledgeEdges` | MapEdge[] | Optional `output → PKM` refinement and `PKM → context` reuse relationships; excluded from progress until PKM exists |

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
| `status` | enum | `expected`, `present`, `verified`, `needs-review`; it describes active work only |
| `reason` | string | Plain Korean explanation; no private details |
| `foundationPaths` | string[] | Sorted template-provided project-relative paths; explanatory only |
| `workPaths` | string[] | Sorted paths explicitly connected by the current work pointer and found on disk |
| `missingWorkPaths` | string[] | Safe declared paths that are absent; creates `needs-review` |
| `foundationCount` | integer | Number of returned template-provided paths |
| `workCount` | integer | Number of existing active-work paths; the only count used for progress |
| `latestModifiedAt` | ISO timestamp or null | Newest observation time |
| `evidencePaths` | string[] | Only recognized relative evidence paths |

### State transitions

```text
expected ── valid current-work pointer and artifact appears ──> present
present  ── current explicit evidence ──> verified
verified ── target changes/evidence stale ──> needs-review
present or verified ── malformed/ambiguous/unreadable ──> needs-review
needs-review ── issue resolved, no proof ──> present
needs-review ── issue resolved with proof ──> verified
present/verified/needs-review ── pointer removed or node paths disconnected ──> expected
```

Foundation files can appear or disappear without changing this active-work transition. The owner node follows whether a valid current task is selected rather than filesystem presence.

## Entity: MapEdge

두 구성요소가 위임 흐름에서 어떻게 이어지는지 보여준다.

| Field | Type | Rules |
|---|---|---|
| `id` | string | Unique lowercase ASCII identifier |
| `from` | string | Existing node ID |
| `to` | string | Existing node ID |
| `label` | string | Short Korean relationship phrase |
| `style` | enum | `normal`, `emphasis`, `feedback`, or `future` |
| `fromSide` | enum | Optional `top`, `right`, `bottom`, or `left` exit side |
| `toSide` | enum | Optional `top`, `right`, `bottom`, or `left` entry side |
| `via` | point[] | Optional authored route points that keep loops away from node text |
| `labelAt` | point | Optional authored label anchor in the shared map coordinate system |

## Entity: MapBoundary

항상 보이는 지도 안에서 관련 구성요소를 하나의 시스템 영역으로 묶는다.

| Field | Type | Rules |
|---|---|---|
| `id` | string | Unique lowercase ASCII identifier |
| `label` | string | Learner-facing group label |
| `nodeIds` | string[] | Existing fixed node IDs; the initial core wraps the seven main-flow nodes |
| `padding` | integer | Non-negative map-space padding around wrapped nodes |

## Entity: MapSnapshot

한 번의 응답으로 전달되는 전체 상태다.

| Field | Type | Rules |
|---|---|---|
| `schemaVersion` | integer | `3` for the fixed-flow and task-extension contract |
| `mode` | enum | `live` or `baseline` |
| `generatedAt` | ISO timestamp | Time this scan completed |
| `rootLabel` | string | Project folder name only, never an absolute path |
| `staleAfterMs` | integer | `5000` initially |
| `durationMs` | integer | Non-negative scan duration |
| `activeWork` | object or null | Selected task ID, title, pointer path, or null when no task is connected |
| `nodes` | NodeState[] | Exactly one state per manifest node |
| `extensions` | WorkExtension[] | Only current task-specific execution extensions |
| `edges` | MapEdge[] | From the manifest SSOT |
| `summary` | object | Counts by state; total equals node count |
| `extensionSummary` | object | Counts only actual task-specific extensions; optional examples are excluded |

## Client-only state

The following is intentionally not part of the server snapshot:

- previous successful snapshot
- IDs and relative paths changed since the previous poll
- last successful time shown after a request failure
- expanded detail card

Keeping these in the browser prevents temporary UI state from being mistaken for workspace truth.
