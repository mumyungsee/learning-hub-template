export const WORKSPACE_MAP_SCHEMA_VERSION = 3;
export const ACTIVE_WORK_POINTER_PATH = '.workspace-map/active-work.json';

export const statusMeta = Object.freeze({
  expected: { label: '업무 미연결', symbol: '◇' },
  present: { label: '작업 중', symbol: '●' },
  verified: { label: '검증됨', symbol: '✓' },
  'needs-review': { label: '확인 필요', symbol: '!' },
});

const exact = (id, path) => ({ id, type: 'exact', path, pattern: '', depth: 0, maxMatches: 1 });
const pattern = (id, path, filePattern, depth, maxMatches) => ({ id, type: 'pattern', path, pattern: filePattern, depth, maxMatches });

export const mapManifest = Object.freeze({
  schemaVersion: 2,
  title: '나의 업무 위임 시스템',
  description: '기본 위임 흐름은 한 번만 두고, 이번 업무에서 새로 만든 실행 능력만 가지처럼 붙여 봅니다.',
  canvas: { width: 1470, height: 860 },
  excludedRoots: ['.git', '.astro', 'node_modules', 'dist', 'build', 'coverage'],
  excludedFilePrefixes: ['.env'],
  nodes: [
    { id: 'owner', label: '업무 고르기', role: '무엇을 왜 위임할지 정해요.', category: 'external', kind: 'conceptual', order: 10, layout: { x: 30, y: 420, width: 170, height: 116 }, probes: [], evidenceRules: [] },
    { id: 'entry', label: '도구별 입구', role: '각 AI가 공통 지침으로 들어와요.', category: 'entry', kind: 'artifact-group', order: 20, layout: { x: 220, y: 420, width: 180, height: 116 }, probes: [exact('entry-claude', 'CLAUDE.md'), exact('entry-gemini', 'GEMINI.md')], evidenceRules: [] },
    { id: 'context', label: '공통 지침 · 맥락', role: '규칙과 사용자 맥락을 읽어요.', category: 'context', kind: 'artifact-group', order: 30, layout: { x: 420, y: 420, width: 200, height: 116 }, probes: [exact('context-agents', 'AGENTS.md'), exact('context-soul', 'SOUL.md'), exact('context-user', 'USER.md')], evidenceRules: [] },
    {
      id: 'spec', label: '명세 만들기', role: '결과와 완료 조건을 정해요.', category: 'specification', kind: 'artifact-group', order: 40, layout: { x: 640, y: 420, width: 180, height: 116 },
      probes: [exact('spec-feature-pointer', '.specify/feature.json'), pattern('spec-docs', 'specs', '**/spec.md', 2, 20), pattern('plan-docs', 'specs', '**/plan.md', 2, 20), pattern('task-docs', 'specs', '**/tasks.md', 2, 20)],
      evidenceRules: [{ id: 'spec-quality-checklist', kind: 'checked-checklist', path: 'specs', pattern: '**/checklists/requirements.md', depth: 3, maxMatches: 20, maxBytes: 131072, currentness: 'not-older-than-target' }],
    },
    {
      id: 'harness', label: '하네스 구성하기', role: '필요한 실행 도구를 붙여요.', category: 'harness', kind: 'artifact-group', order: 50, layout: { x: 840, y: 420, width: 190, height: 116 },
      probes: [pattern('claude-skills', '.claude/skills', '**/SKILL.md', 2, 40), pattern('agent-skills', '.agents/skills', '**/SKILL.md', 2, 40), pattern('scripts-mjs', 'scripts', '**/*.mjs', 3, 100), pattern('scripts-py', 'scripts', '**/*.py', 3, 100), exact('mcp-root', 'mcp.json'), exact('mcp-hidden', '.mcp.json'), exact('dockerfile', 'Dockerfile'), exact('compose', 'compose.yml')],
      evidenceRules: [],
    },
    { id: 'verify', label: '검증하기', role: '작동 여부를 증거로 확인해요.', category: 'verification', kind: 'artifact-group', order: 60, layout: { x: 1050, y: 420, width: 180, height: 116 }, probes: [exact('structure-check', 'scripts/check-structure.mjs'), exact('map-check', 'scripts/check-workspace-map.mjs'), pattern('tests', 'tests', '**/*.test.mjs', 3, 100), pattern('checklists', 'specs', '**/checklists/*.md', 3, 40)], evidenceRules: [] },
    { id: 'output', label: '결과물 만들기', role: '사람이 사용할 산출물을 만들어요.', category: 'output', kind: 'artifact-group', order: 70, layout: { x: 1250, y: 420, width: 190, height: 116 }, probes: [pattern('content-output', 'src/content', '**/*.md', 3, 100), pattern('tool-output', 'src/pages/tools', '*.astro', 1, 40)], evidenceRules: [] },
    { id: 'handoff', label: '인계 · 재진입', role: '다른 사람·AI·세션이 이어받아요.', category: 'handoff', kind: 'artifact-group', order: 80, layout: { x: 1050, y: 680, width: 180, height: 116 }, probes: [exact('handoff', 'HANDOFF.md')], evidenceRules: [] },
  ],
  boundaries: [{ id: 'delegation-core', label: '기존 템플릿 흐름 · 한 번만 표시', nodeIds: ['owner', 'entry', 'context', 'spec', 'harness', 'verify', 'output'], points: [[18, 372], [1452, 372], [1452, 558], [18, 558]] }],
  edges: [
    { id: 'request', from: 'owner', to: 'entry', label: '반복 업무 요청', style: 'emphasis', fromSide: 'right', toSide: 'left' },
    { id: 'read-context', from: 'entry', to: 'context', label: '공통 지침 읽기', style: 'normal', fromSide: 'right', toSide: 'left' },
    { id: 'define-work', from: 'context', to: 'spec', label: '완료 기준 정하기', style: 'normal', fromSide: 'right', toSide: 'left' },
    { id: 'build-harness', from: 'spec', to: 'harness', label: '승인된 작업 구현', style: 'emphasis', fromSide: 'right', toSide: 'left' },
    { id: 'submit-evidence', from: 'harness', to: 'verify', label: '결과와 근거 제출', style: 'emphasis', fromSide: 'right', toSide: 'left' },
    { id: 'publish-result', from: 'verify', to: 'output', label: '사람 승인 후 반영', style: 'normal', fromSide: 'right', toSide: 'left' },
    { id: 'record-state', from: 'verify', to: 'handoff', label: '현재 상태 기록', style: 'normal', fromSide: 'bottom', toSide: 'top' },
    { id: 'resume-work', from: 'handoff', to: 'entry', label: '새 세션이 이어받기', style: 'feedback', fromSide: 'left', toSide: 'bottom', via: [[1040, 835], [310, 835]] },
  ],
  extensionTypes: [
    { type: 'skill', label: '업무용 스킬', role: '이 업무에 맞춘 반복 절차예요.', attachTo: 'harness', layout: { x: 680, y: 180, width: 190, height: 124 }, rules: [pattern('extension-skill-claude', '.claude/skills', '**/SKILL.md', 3, 40), pattern('extension-skill-agent', '.agents/skills', '**/SKILL.md', 3, 40)] },
    { type: 'script', label: '업무용 스크립트', role: '정확하게 반복할 계산과 변환을 맡아요.', attachTo: 'harness', layout: { x: 840, y: 680, width: 190, height: 124 }, rules: [pattern('extension-script-mjs', 'scripts', '**/*.mjs', 4, 100), pattern('extension-script-py', 'scripts', '**/*.py', 4, 100)] },
    { type: 'mcp', label: '업무용 MCP', role: '업무에 필요한 외부 도구를 연결해요.', attachTo: 'harness', layout: { x: 890, y: 180, width: 190, height: 124 }, rules: [exact('extension-mcp-root', 'mcp.json'), exact('extension-mcp-hidden', '.mcp.json'), pattern('extension-mcp-config', 'config/mcp', '**/*.json', 3, 40)] },
    { type: 'api', label: '업무용 API', role: '정해진 방식으로 외부 서비스와 데이터를 주고받아요.', attachTo: 'harness', layout: { x: 1100, y: 180, width: 190, height: 124 }, rules: [pattern('extension-api', 'src/pages/api', '**/*.*', 3, 40), pattern('extension-api-config', 'config/api', '**/*.json', 3, 40)] },
    { type: 'database', label: 'DB 연결', role: '기록을 오래 저장해야 할 때 붙여요.', attachTo: 'harness', layout: { x: 1100, y: 180, width: 190, height: 124 }, rules: [pattern('extension-db', 'data', '**/*.db', 3, 40), pattern('extension-sqlite', 'data', '**/*.sqlite', 3, 40), pattern('extension-db-config', 'config/database', '**/*.json', 3, 40)] },
    { type: 'pkm', label: 'PKM 연계', role: '결과를 장기 지식으로 남기고 다음 업무에서 다시 불러와요.', attachTo: 'output', layout: { x: 1250, y: 680, width: 190, height: 124 }, rules: [pattern('extension-wiki', 'src/content/wiki', '**/*.md', 3, 100), exact('extension-pkm-adapter', '.workspace-map/pkm-adapter.json')] },
  ],
  optionalExtensions: [
    { id: 'optional-db', type: 'database', label: 'DB 연결', status: '필요할 때만', role: '기록을 오래 저장해야 할 때 추가할 수 있어요.', attachTo: 'harness', layout: { x: 1100, y: 180, width: 190, height: 124 }, paths: ['data/{업무명}.db'] },
    { id: 'optional-pkm', type: 'pkm', label: 'PKM 연계', status: '필요할 때만', role: '결과를 장기 지식으로 남기고 다음 업무에서 다시 불러와요.', attachTo: 'output', layout: { x: 1250, y: 680, width: 190, height: 124 }, paths: ['.workspace-map/pkm-adapter.json'] },
  ],
  knowledgeEdges: [
    { id: 'distill-knowledge', from: 'output', to: 'optional-pkm', label: '정제·저장', style: 'future', fromSide: 'bottom', toSide: 'top', labelAt: [1260, 620] },
    { id: 'reuse-knowledge', from: 'optional-pkm', to: 'context', label: '다음 업무에서 관련 지식 불러오기', style: 'future', fromSide: 'right', toSide: 'top', via: [[1450, 742], [1450, 105], [520, 105]], labelAt: [710, 90] },
  ],
});

export function createBaselineSnapshot(rootLabel = 'learning-hub-template') {
  const nodes = mapManifest.nodes.map((node) => ({
    id: node.id,
    status: 'expected',
    reason: node.kind === 'conceptual' ? '이번에 위임할 업무를 고르면 여기가 시작돼요.' : '이번 업무에 연결된 파일이 아직 없어요.',
    foundationPaths: [], workPaths: [], missingWorkPaths: [], foundationCount: 0, workCount: 0,
    latestModifiedAt: null, evidencePaths: [], foundationIssues: [],
  }));
  return {
    schemaVersion: WORKSPACE_MAP_SCHEMA_VERSION,
    mode: 'baseline',
    generatedAt: new Date().toISOString(),
    rootLabel,
    staleAfterMs: 5000,
    durationMs: 0,
    activeWork: null,
    nodes,
    extensions: [],
    edges: mapManifest.edges,
    summary: countStatuses(nodes),
    extensionSummary: { present: 0, needsReview: 0, total: 0 },
  };
}

export function countStatuses(nodes) {
  const summary = { expected: 0, present: 0, verified: 0, needsReview: 0, total: nodes.length };
  for (const node of nodes) {
    if (node.status === 'needs-review') summary.needsReview += 1;
    else if (Object.hasOwn(summary, node.status)) summary[node.status] += 1;
  }
  return summary;
}
