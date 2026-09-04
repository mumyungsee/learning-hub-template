export const statusMeta = Object.freeze({
  conceptual: { label: '개념', symbol: '○' },
  expected: { label: '아직 만들지 않음', symbol: '◇' },
  present: { label: '존재함', symbol: '●' },
  verified: { label: '검증됨', symbol: '✓' },
  'needs-review': { label: '확인 필요', symbol: '!' },
});

const exact = (id, path) => ({ id, type: 'exact', path, pattern: '', depth: 0, maxMatches: 1 });
const pattern = (id, path, filePattern, depth, maxMatches) => ({
  id,
  type: 'pattern',
  path,
  pattern: filePattern,
  depth,
  maxMatches,
});

export const mapManifest = Object.freeze({
  schemaVersion: 1,
  title: '나의 업무 위임 시스템',
  description: '지침에서 명세·실행·검증·인계로 이어지는 구조와 지금 만들어진 부분을 함께 봅니다.',
  excludedRoots: ['.git', '.astro', 'node_modules', 'dist', 'build', 'coverage'],
  excludedFilePrefixes: ['.env'],
  nodes: [
    {
      id: 'owner',
      label: '사람의 실제 업무',
      role: '오늘 AI에게 넘겨볼 반복 업무 하나와 실제 입력을 정합니다.',
      category: 'external',
      kind: 'conceptual',
      order: 10,
      probes: [],
      evidenceRules: [],
    },
    {
      id: 'entry',
      label: '도구별 입구',
      role: 'Claude·Codex·Gemini 같은 도구가 같은 공통 규칙으로 들어오게 연결합니다.',
      category: 'entry',
      kind: 'artifact-group',
      order: 20,
      probes: [
        exact('entry-agents', 'AGENTS.md'),
        exact('entry-claude', 'CLAUDE.md'),
        exact('entry-gemini', 'GEMINI.md'),
      ],
      evidenceRules: [],
    },
    {
      id: 'context',
      label: '공통 지침과 사용자 맥락',
      role: 'AI가 어떤 태도로 누구를 위해 어떤 규칙을 지킬지 매번 읽게 합니다.',
      category: 'context',
      kind: 'artifact-group',
      order: 30,
      probes: [
        exact('context-agents', 'AGENTS.md'),
        exact('context-soul', 'SOUL.md'),
        exact('context-user', 'USER.md'),
      ],
      evidenceRules: [],
    },
    {
      id: 'spec',
      label: '업무 명세와 실행 계획',
      role: '원하는 결과와 완료 조건을 먼저 정하고 구현 방법과 작업 순서를 이어 붙입니다.',
      category: 'specification',
      kind: 'artifact-group',
      order: 40,
      probes: [
        exact('spec-feature-pointer', '.specify/feature.json'),
        pattern('spec-docs', 'specs', '**/spec.md', 2, 20),
        pattern('plan-docs', 'specs', '**/plan.md', 2, 20),
        pattern('task-docs', 'specs', '**/tasks.md', 2, 20),
      ],
      evidenceRules: [
        {
          id: 'spec-quality-checklist',
          kind: 'checked-checklist',
          path: 'specs',
          pattern: '**/checklists/requirements.md',
          depth: 3,
          maxMatches: 20,
          maxBytes: 131072,
          currentness: 'not-older-than-target',
        },
      ],
    },
    {
      id: 'harness',
      label: '반복 실행 하네스',
      role: '스킬·스크립트·외부 연결처럼 일을 같은 절차로 다시 실행할 부품을 모읍니다.',
      category: 'harness',
      kind: 'artifact-group',
      order: 50,
      probes: [
        pattern('claude-skills', '.claude/skills', '**/SKILL.md', 2, 40),
        pattern('agent-skills', '.agents/skills', '**/SKILL.md', 2, 40),
        pattern('scripts', 'scripts', '**/*.mjs', 3, 100),
        exact('mcp-root', 'mcp.json'),
        exact('mcp-hidden', '.mcp.json'),
        exact('dockerfile', 'Dockerfile'),
        exact('compose', 'compose.yml'),
      ],
      evidenceRules: [],
    },
    {
      id: 'verify',
      label: '검증과 사람 승인',
      role: '파일이 있다는 사실과 실제로 통과했다는 근거를 구분하고 사람이 마지막 판단을 합니다.',
      category: 'verification',
      kind: 'artifact-group',
      order: 60,
      probes: [
        exact('structure-check', 'scripts/check-structure.mjs'),
        exact('map-check', 'scripts/check-workspace-map.mjs'),
        pattern('tests', 'tests', '**/*.test.mjs', 3, 100),
        pattern('checklists', 'specs', '**/checklists/*.md', 3, 40),
      ],
      evidenceRules: [],
    },
    {
      id: 'output',
      label: '업무 결과와 학습허브',
      role: '작성한 콘텐츠와 실제로 작동하는 작은 도구를 사람이 확인하는 자리입니다.',
      category: 'output',
      kind: 'artifact-group',
      order: 70,
      probes: [
        pattern('content-output', 'src/content', '**/*.md', 3, 100),
        pattern('tool-output', 'src/pages/tools', '*.astro', 1, 40),
      ],
      evidenceRules: [],
    },
    {
      id: 'knowledge',
      label: '정리된 지식과 다음 재사용',
      role: '실습에서 얻은 원칙과 사례를 학습위키에 남기고 나중에는 PKM과 연결합니다.',
      category: 'knowledge',
      kind: 'artifact-group',
      order: 80,
      probes: [pattern('wiki-knowledge', 'src/content/wiki', '*.md', 1, 100)],
      evidenceRules: [],
    },
    {
      id: 'handoff',
      label: '상태 인계와 재진입',
      role: '현재 상태·다음 행동·정본 위치를 남겨 새 세션이나 다른 AI가 이어받게 합니다.',
      category: 'handoff',
      kind: 'artifact-group',
      order: 90,
      probes: [exact('handoff', 'HANDOFF.md')],
      evidenceRules: [],
    },
  ],
  edges: [
    { id: 'request', from: 'owner', to: 'entry', label: '반복 업무 요청', style: 'emphasis' },
    { id: 'read-context', from: 'entry', to: 'context', label: '공통 지침과 맥락 읽기', style: 'normal' },
    { id: 'define-work', from: 'context', to: 'spec', label: '판단 기준 제공', style: 'normal' },
    { id: 'build-harness', from: 'spec', to: 'harness', label: '승인된 작업 구현', style: 'emphasis' },
    { id: 'submit-evidence', from: 'harness', to: 'verify', label: '결과와 근거 제출', style: 'emphasis' },
    { id: 'publish-result', from: 'verify', to: 'output', label: '사람 승인 후 반영', style: 'normal' },
    { id: 'distill-knowledge', from: 'output', to: 'knowledge', label: '재사용할 지식 정리', style: 'future' },
    { id: 'reuse-knowledge', from: 'knowledge', to: 'context', label: '다음 업무에 재사용', style: 'feedback' },
    { id: 'record-state', from: 'verify', to: 'handoff', label: '현재 상태 기록', style: 'normal' },
    { id: 'resume-work', from: 'handoff', to: 'entry', label: '새 세션이 이어받기', style: 'feedback' },
    { id: 'repair-loop', from: 'verify', to: 'spec', label: '실패를 명세와 계획에 반영', style: 'feedback' },
  ],
  views: [
    {
      id: 'current-template',
      label: '현재 템플릿',
      description: '지금 이 폴더에서 실제로 확인된 지침·스킬·콘텐츠·인계 파일을 봅니다.',
      focusNodeIds: ['entry', 'context', 'harness', 'output', 'handoff'],
    },
    {
      id: 'class-build',
      label: '이번 수업',
      description: '실제 업무 하나를 명세하고 실행 부품과 검증·인계를 연결하는 흐름입니다.',
      focusNodeIds: ['owner', 'entry', 'context', 'spec', 'harness', 'verify', 'handoff'],
    },
    {
      id: 'run-state',
      label: '실행 상태',
      description: '무엇이 있고, 무엇이 검증됐고, 어디를 다시 확인해야 하는지 봅니다.',
      focusNodeIds: ['spec', 'harness', 'verify', 'output', 'handoff'],
    },
    {
      id: 'future-system',
      label: '확장 후',
      description: '같은 위임 코어를 다른 도구와 장기 지식에 다시 연결하는 모습을 봅니다.',
      focusNodeIds: ['entry', 'context', 'harness', 'verify', 'output', 'knowledge', 'handoff'],
    },
  ],
});

export function createBaselineSnapshot(rootLabel = 'learning-hub-template') {
  const nodes = mapManifest.nodes.map((node) => ({
    id: node.id,
    status: node.kind === 'conceptual' ? 'conceptual' : 'expected',
    reason: node.kind === 'conceptual' ? '수업에서 실제 업무를 하나 고르면 시작돼요.' : '로컬 상태 연결을 기다리고 있어요.',
    paths: [],
    artifactCount: 0,
    latestModifiedAt: null,
    evidencePaths: [],
  }));
  const summary = countStatuses(nodes);
  return {
    schemaVersion: 1,
    mode: 'baseline',
    generatedAt: new Date().toISOString(),
    rootLabel,
    staleAfterMs: 5000,
    durationMs: 0,
    nodes,
    edges: mapManifest.edges,
    views: mapManifest.views,
    summary,
  };
}

export function countStatuses(nodes) {
  const summary = { conceptual: 0, expected: 0, present: 0, verified: 0, needsReview: 0, total: nodes.length };
  for (const node of nodes) {
    if (node.status === 'needs-review') summary.needsReview += 1;
    else if (Object.hasOwn(summary, node.status)) summary[node.status] += 1;
  }
  return summary;
}
