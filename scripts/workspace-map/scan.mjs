import { lstat, readFile, readdir, realpath, stat } from 'node:fs/promises';
import { basename, isAbsolute, relative, resolve, sep } from 'node:path';
import { performance } from 'node:perf_hooks';

import {
  ACTIVE_WORK_POINTER_PATH,
  WORKSPACE_MAP_SCHEMA_VERSION,
  countStatuses,
  mapManifest,
} from './manifest.mjs';

const DEFAULT_EVIDENCE_LIMIT = 131072;
const ACTIVE_WORK_POINTER_LIMIT = 65536;
const ACTIVE_WORK_ARTIFACT_LIMIT = 100;
const ACTIVE_WORK_EXTENSION_LIMIT = 30;
const EXTENSION_PATH_LIMIT = 20;
const BASELINE_WORK_NODE_IDS = new Set(['spec', 'verify', 'output', 'handoff']);

function normalizeRelative(path) {
  return path.split(sep).join('/');
}

function isSafeRelativePath(path) {
  if (!path || typeof path !== 'string' || path.length > 500 || isAbsolute(path) || /^[A-Za-z]:/.test(path) || path.includes('://')) return false;
  return !path.replaceAll('\\', '/').split('/').includes('..');
}

function hasOnlyKeys(value, allowed) {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function isInside(root, candidate) {
  const offset = relative(root, candidate);
  return offset === '' || (!offset.startsWith('..' + sep) && offset !== '..' && !isAbsolute(offset));
}

function isExcluded(relativePath, manifest) {
  const normalized = relativePath.replaceAll('\\', '/');
  const parts = normalized.split('/');
  if (parts.some((part) => manifest.excludedRoots.includes(part))) return true;
  const name = parts.at(-1) ?? '';
  return manifest.excludedFilePrefixes.some((prefix) => name.startsWith(prefix));
}

function globToRegExp(glob) {
  let output = '^';
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    if (char === '*' && glob[index + 1] === '*') {
      if (glob[index + 2] === '/') {
        output += '(?:.*/)?';
        index += 2;
      } else {
        output += '.*';
        index += 1;
      }
    } else if (char === '*') {
      output += '[^/]*';
    } else if (char === '?') {
      output += '[^/]';
    } else {
      output += char.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
    }
  }
  return new RegExp(output + '$');
}

function matchesRule(relativePath, rule) {
  const normalized = relativePath.replaceAll('\\', '/');
  if (rule.type === 'exact') return normalized === rule.path;
  const prefix = rule.path ? `${rule.path}/` : '';
  if (!normalized.startsWith(prefix)) return false;
  return globToRegExp(rule.pattern).test(normalized.slice(prefix.length));
}

function isAllowedActiveArtifact(node, artifact) {
  if (!BASELINE_WORK_NODE_IDS.has(node.id)) return false;
  const rules = artifact.evidenceKind ? (node.evidenceRules ?? []) : (node.probes ?? []);
  return rules.some((rule) => {
    if (artifact.evidenceKind && rule.kind !== artifact.evidenceKind) return false;
    return matchesRule(artifact.path, rule);
  });
}

async function safeObservation(root, realRoot, absolutePath, relativePath, artifactType) {
  try {
    const info = await lstat(absolutePath);
    if (info.isSymbolicLink()) {
      return { issue: `${normalizeRelative(relativePath)} 심볼릭 링크는 자동으로 따라가지 않아요.` };
    }
    const resolved = await realpath(absolutePath);
    if (!isInside(realRoot, resolved)) {
      return { issue: '프로젝트 밖을 가리키는 항목은 확인하지 않았어요.' };
    }
    return {
      observation: {
        relativePath: normalizeRelative(relativePath),
        artifactType,
        modifiedAt: info.mtime.toISOString(),
        readable: true,
        ...(info.isFile() ? { size: info.size } : {}),
      },
    };
  } catch (error) {
    if (error?.code === 'ENOENT') return {};
    return { issue: `${normalizeRelative(relativePath)} 상태를 읽지 못했어요.` };
  }
}

async function collectPattern(root, realRoot, probe, manifest) {
  const observations = [];
  const issues = [];
  const base = resolve(root, ...probe.path.split('/'));
  if (!isInside(root, base) || !isSafeRelativePath(probe.path) || isExcluded(probe.path, manifest)) {
    return { observations, issues: ['허용 범위를 벗어난 지도 규칙을 건너뛰었어요.'] };
  }

  try {
    const baseInfo = await lstat(base);
    if (baseInfo.isSymbolicLink()) return { observations, issues: ['심볼릭 링크 폴더는 자동으로 따라가지 않아요.'] };
    const resolvedBase = await realpath(base);
    if (!isInside(realRoot, resolvedBase)) return { observations, issues: ['프로젝트 밖 폴더는 확인하지 않았어요.'] };
  } catch (error) {
    if (error?.code === 'ENOENT') return { observations, issues };
    return { observations, issues: ['허용된 폴더 상태를 읽지 못했어요.'] };
  }

  const matcher = globToRegExp(probe.pattern);
  let totalMatches = 0;

  async function walk(directory, relativeFromBase, depth) {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      issues.push('허용된 폴더 안의 항목을 읽지 못했어요.');
      return;
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const fromBase = relativeFromBase ? `${relativeFromBase}/${entry.name}` : entry.name;
      const fromRoot = probe.path ? `${probe.path}/${fromBase}` : fromBase;
      if (isExcluded(fromRoot, manifest)) continue;
      const absolute = resolve(directory, entry.name);

      if (entry.isSymbolicLink()) {
        issues.push(`${fromRoot} 심볼릭 링크는 자동으로 따라가지 않아요.`);
        continue;
      }
      if (entry.isDirectory()) {
        if (depth < probe.depth) await walk(absolute, fromBase, depth + 1);
        continue;
      }
      if (!entry.isFile() || !matcher.test(fromBase)) continue;

      totalMatches += 1;
      if (observations.length >= probe.maxMatches) continue;
      const result = await safeObservation(root, realRoot, absolute, fromRoot, probe.id);
      if (result.observation) observations.push(result.observation);
      if (result.issue) issues.push(result.issue);
    }
  }

  await walk(base, '', 0);
  if (totalMatches > probe.maxMatches) {
    issues.push(`표시 한도 ${probe.maxMatches}개를 넘는 항목이 있어 범위를 확인해야 해요.`);
  }
  return { observations, issues };
}

async function collectProbe(root, realRoot, probe, manifest) {
  if (!isSafeRelativePath(probe.path) || isExcluded(probe.path, manifest)) {
    return { observations: [], issues: ['허용 범위를 벗어난 지도 규칙을 건너뛰었어요.'] };
  }
  if (probe.type === 'pattern') return collectPattern(root, realRoot, probe, manifest);

  const absolute = resolve(root, ...probe.path.split('/'));
  if (!isInside(root, absolute)) return { observations: [], issues: ['프로젝트 밖 항목은 확인하지 않았어요.'] };
  const result = await safeObservation(root, realRoot, absolute, probe.path, probe.id);
  return {
    observations: result.observation ? [result.observation] : [],
    issues: result.issue ? [result.issue] : [],
  };
}

function invalidActiveWork(reason) {
  return {
    publicState: {
      status: 'invalid',
      id: null,
      title: null,
      pointerPath: ACTIVE_WORK_POINTER_PATH,
      reason,
    },
    artifacts: [],
    extensions: [],
  };
}

async function readActiveWork(root, realRoot, manifest) {
  const absolute = resolve(root, ...ACTIVE_WORK_POINTER_PATH.split('/'));
  try {
    const info = await lstat(absolute);
    if (info.isSymbolicLink() || !info.isFile()) return invalidActiveWork('현재 업무 연결 파일 형식을 확인해 주세요.');
    if (info.size > ACTIVE_WORK_POINTER_LIMIT) return invalidActiveWork('현재 업무 연결 파일이 너무 커서 읽지 않았어요.');
    const resolved = await realpath(absolute);
    if (!isInside(realRoot, resolved)) return invalidActiveWork('프로젝트 밖의 현재 업무 연결은 읽지 않았어요.');

    let value;
    try {
      value = JSON.parse(await readFile(absolute, 'utf8'));
    } catch {
      return invalidActiveWork('현재 업무 연결 파일의 JSON 형식을 확인해 주세요.');
    }

    if (!value || !hasOnlyKeys(value, ['schemaVersion', 'id', 'title', 'artifacts', 'extensions']) || value.schemaVersion !== 2 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.id ?? '')) {
      return invalidActiveWork('현재 업무의 버전이나 ID 형식을 확인해 주세요.');
    }
    if (typeof value.title !== 'string' || value.title.trim().length === 0 || value.title.length > 120) {
      return invalidActiveWork('현재 업무 제목을 120자 이내로 적어 주세요.');
    }
    if (!Array.isArray(value.artifacts) || value.artifacts.length > ACTIVE_WORK_ARTIFACT_LIMIT) {
      return invalidActiveWork('현재 업무 파일 목록 형식을 확인해 주세요.');
    }
    if (!Array.isArray(value.extensions) || value.extensions.length > ACTIVE_WORK_EXTENSION_LIMIT) {
      return invalidActiveWork('현재 업무 실행 확장 목록 형식을 확인해 주세요.');
    }

    const nodeById = new Map(manifest.nodes.map((node) => [node.id, node]));
    const seen = new Set();
    const artifacts = [];
    for (const candidate of value.artifacts) {
      if (!candidate || !hasOnlyKeys(candidate, ['nodeId', 'path', 'evidenceKind']) || typeof candidate.nodeId !== 'string' || typeof candidate.path !== 'string') {
        return invalidActiveWork('현재 업무 파일 항목의 형식을 확인해 주세요.');
      }
      const path = candidate.path.replaceAll('\\', '/');
      const evidenceKind = candidate.evidenceKind;
      if (evidenceKind !== undefined && evidenceKind !== 'checked-checklist') {
        return invalidActiveWork('지원하지 않는 검증 근거 형식이 있어요.');
      }
      if (!isSafeRelativePath(path) || /[*?]/.test(path) || isExcluded(path, manifest)) {
        return invalidActiveWork('허용 범위를 벗어난 현재 업무 경로가 있어요.');
      }
      const node = nodeById.get(candidate.nodeId);
      if (!node || !isAllowedActiveArtifact(node, { path, evidenceKind })) {
        return invalidActiveWork('구성요소와 맞지 않는 현재 업무 경로가 있어요.');
      }
      const key = `${candidate.nodeId}\u0000${path}`;
      if (seen.has(key)) return invalidActiveWork('현재 업무 파일 목록에 중복 경로가 있어요.');
      seen.add(key);
      artifacts.push({ nodeId: candidate.nodeId, path, ...(evidenceKind ? { evidenceKind } : {}) });
    }

    const extensionTypeById = new Map(manifest.extensionTypes.map((definition) => [definition.type, definition]));
    const extensionIds = new Set();
    const extensionPaths = new Set();
    const extensions = [];
    for (const candidate of value.extensions) {
      if (!candidate || !hasOnlyKeys(candidate, ['id', 'label', 'type', 'paths']) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate.id ?? '')) {
        return invalidActiveWork('실행 확장 ID 형식을 확인해 주세요.');
      }
      if (extensionIds.has(candidate.id)) return invalidActiveWork('실행 확장 ID가 중복됐어요.');
      if (typeof candidate.label !== 'string' || candidate.label.trim().length === 0 || candidate.label.length > 80) {
        return invalidActiveWork('실행 확장 이름을 80자 이내로 적어 주세요.');
      }
      const definition = extensionTypeById.get(candidate.type);
      if (!definition || !Array.isArray(candidate.paths) || candidate.paths.length === 0 || candidate.paths.length > EXTENSION_PATH_LIMIT) {
        return invalidActiveWork('지원하지 않는 실행 확장 형식이 있어요.');
      }
      const paths = [];
      for (const rawPath of candidate.paths) {
        if (typeof rawPath !== 'string') return invalidActiveWork('실행 확장 경로 형식을 확인해 주세요.');
        const path = rawPath.replaceAll('\\', '/');
        if (!isSafeRelativePath(path) || /[*?]/.test(path) || isExcluded(path, manifest)) {
          return invalidActiveWork('허용 범위를 벗어난 실행 확장 경로가 있어요.');
        }
        if (!definition.rules.some((rule) => matchesRule(path, rule))) {
          return invalidActiveWork('실행 확장 종류와 맞지 않는 경로가 있어요.');
        }
        if (extensionPaths.has(path)) return invalidActiveWork('실행 확장 목록에 중복 경로가 있어요.');
        extensionPaths.add(path);
        paths.push(path);
      }
      extensionIds.add(candidate.id);
      extensions.push({ id: candidate.id, label: candidate.label.trim(), type: candidate.type, paths });
    }

    return {
      publicState: {
        status: 'connected',
        id: value.id,
        title: value.title.trim(),
        pointerPath: ACTIVE_WORK_POINTER_PATH,
      },
      artifacts,
      extensions,
    };
  } catch (error) {
    if (error?.code === 'ENOENT') return { publicState: null, artifacts: [], extensions: [] };
    return invalidActiveWork('현재 업무 연결 파일을 읽지 못했어요.');
  }
}

async function extensionState(root, realRoot, extension, manifest) {
  const definition = manifest.extensionTypes.find((item) => item.type === extension.type);
  const observations = [];
  const issues = [];
  const missingPaths = [];
  for (const path of extension.paths) {
    const absolute = resolve(root, ...path.split('/'));
    const result = await safeObservation(root, realRoot, absolute, path, `extension-${extension.type}`);
    if (result.observation) observations.push(result.observation);
    else if (result.issue) issues.push(result.issue);
    else missingPaths.push(path);
  }
  const status = issues.length > 0 || missingPaths.length > 0 ? 'needs-review' : 'present';
  return {
    id: extension.id,
    label: extension.label,
    type: extension.type,
    role: definition.role,
    attachTo: definition.attachTo,
    status,
    reason: status === 'present'
      ? `이번 업무에서 새로 연결한 ${definition.label} 파일 ${observations.length}개를 확인했어요.`
      : issues[0] ?? '이번 업무에 연결한 실행 확장 파일을 찾지 못했어요.',
    paths: observations.map((item) => item.relativePath).sort(),
    missingPaths: [...new Set(missingPaths)].sort(),
    latestModifiedAt: latestTimestamp(observations),
  };
}

function latestTimestamp(observations) {
  if (observations.length === 0) return null;
  return observations.map((item) => item.modifiedAt).sort().at(-1);
}

async function evaluateActiveChecklist(root, observation, targetLatest) {
  const issues = [];
  if ((observation.size ?? 0) > DEFAULT_EVIDENCE_LIMIT) {
    return { verified: false, issues: ['검증 체크리스트가 너무 커서 자동 판정하지 않았어요.'] };
  }
  try {
    const content = await readFile(resolve(root, ...observation.relativePath.split('/')), 'utf8');
    const items = [...content.matchAll(/^- \[([ xX])\]/gm)];
    if (items.length === 0) return { verified: false, issues: [`${observation.relativePath}에서 체크 항목을 찾지 못했어요.`] };
    if (items.some((match) => match[1] === ' ')) return { verified: false, issues };
    if (targetLatest && observation.modifiedAt < targetLatest) {
      return { verified: false, issues: [`${observation.relativePath}가 이번 업무 파일보다 오래되어 다시 확인해야 해요.`] };
    }
    return { verified: true, issues };
  } catch {
    return { verified: false, issues: [`${observation.relativePath} 검증 내용을 읽지 못했어요.`] };
  }
}

async function foundationState(root, realRoot, node, manifest) {
  const observations = [];
  const issues = [];
  for (const probe of node.probes ?? []) {
    const collected = await collectProbe(root, realRoot, probe, manifest);
    observations.push(...collected.observations);
    issues.push(...collected.issues);
  }
  return {
    observations: [...new Map(observations.map((item) => [item.relativePath, item])).values()]
      .sort((a, b) => a.relativePath.localeCompare(b.relativePath)),
    issues: [...new Set(issues)],
  };
}

async function nodeState(root, realRoot, node, manifest, activeWork) {
  if (node.kind === 'conceptual') {
    const invalid = activeWork.publicState?.status === 'invalid';
    const connected = activeWork.publicState?.status === 'connected';
    return {
      id: node.id,
      status: invalid ? 'needs-review' : connected ? 'present' : 'expected',
      reason: invalid
        ? activeWork.publicState.reason
        : connected
          ? `이번 업무로 “${activeWork.publicState.title}”을 선택했어요.`
          : '이번에 위임할 업무를 고르면 여기가 시작돼요.',
      foundationPaths: [],
      workPaths: [],
      missingWorkPaths: [],
      foundationCount: 0,
      workCount: 0,
      latestModifiedAt: null,
      evidencePaths: [],
      foundationIssues: [],
    };
  }

  const foundation = await foundationState(root, realRoot, node, manifest);
  const declared = activeWork.artifacts.filter((artifact) => artifact.nodeId === node.id);
  const workObservations = [];
  const workIssues = [];
  const missingWorkPaths = [];

  for (const artifact of declared) {
    const absolute = resolve(root, ...artifact.path.split('/'));
    const result = await safeObservation(root, realRoot, absolute, artifact.path, 'active-work');
    if (result.observation) workObservations.push({ ...result.observation, evidenceKind: artifact.evidenceKind });
    else if (result.issue) workIssues.push(result.issue);
    else missingWorkPaths.push(artifact.path);
  }

  const workPaths = workObservations.map((item) => item.relativePath).sort();
  const activePathSet = new Set(declared.map((item) => item.path));
  const foundationPaths = foundation.observations
    .map((item) => item.relativePath)
    .filter((path) => !activePathSet.has(path));
  const ordinary = workObservations.filter((item) => !item.evidenceKind);
  const targetLatest = latestTimestamp(ordinary.length > 0 ? ordinary : workObservations);
  const evidencePaths = [];
  let evidenceCount = 0;

  for (const observation of workObservations.filter((item) => item.evidenceKind === 'checked-checklist')) {
    evidenceCount += 1;
    const result = await evaluateActiveChecklist(root, observation, targetLatest);
    if (result.verified) evidencePaths.push(observation.relativePath);
    workIssues.push(...result.issues);
  }

  let statusName = 'expected';
  if (workObservations.length > 0) statusName = 'present';
  if (evidenceCount > 0 && evidencePaths.length === evidenceCount) statusName = 'verified';
  if (missingWorkPaths.length > 0 || workIssues.length > 0) statusName = 'needs-review';

  const reason = statusName === 'expected'
    ? '이번 업무에 연결된 파일이 아직 없어요.'
    : statusName === 'verified'
      ? `이번 업무 파일 ${workPaths.length}개와 연결된 검증 근거를 확인했어요.`
      : statusName === 'needs-review'
        ? workIssues[0] ?? '이번 업무 포인터가 가리키는 파일을 찾지 못했어요.'
        : `이번 업무 파일 ${workPaths.length}개를 확인했어요. 검증 완료와는 구분해요.`;

  return {
    id: node.id,
    status: statusName,
    reason,
    foundationPaths,
    workPaths,
    missingWorkPaths: [...new Set(missingWorkPaths)].sort(),
    foundationCount: foundationPaths.length,
    workCount: workPaths.length,
    latestModifiedAt: latestTimestamp(workObservations),
    evidencePaths: [...new Set(evidencePaths)].sort(),
    foundationIssues: foundation.issues,
  };
}

export async function scanWorkspace(projectRoot, { manifest = mapManifest } = {}) {
  const started = performance.now();
  const root = resolve(projectRoot);
  const rootInfo = await stat(root);
  if (!rootInfo.isDirectory()) throw new Error('Workspace root must be a directory.');
  const realRoot = await realpath(root);
  const activeWork = await readActiveWork(root, realRoot, manifest);

  const nodes = [];
  for (const node of [...manifest.nodes].sort((a, b) => a.order - b.order)) {
    nodes.push(await nodeState(root, realRoot, node, manifest, activeWork));
  }

  const extensions = [];
  for (const extension of activeWork.extensions) {
    extensions.push(await extensionState(root, realRoot, extension, manifest));
  }

  return {
    schemaVersion: WORKSPACE_MAP_SCHEMA_VERSION,
    mode: 'live',
    generatedAt: new Date().toISOString(),
    rootLabel: basename(root),
    staleAfterMs: 5000,
    durationMs: Math.max(0, Math.round(performance.now() - started)),
    activeWork: activeWork.publicState,
    nodes,
    extensions,
    edges: manifest.edges,
    summary: countStatuses(nodes),
    extensionSummary: {
      present: extensions.filter((item) => item.status === 'present').length,
      needsReview: extensions.filter((item) => item.status === 'needs-review').length,
      total: extensions.length,
    },
  };
}
