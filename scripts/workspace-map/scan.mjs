import { lstat, readFile, readdir, realpath, stat } from 'node:fs/promises';
import { basename, isAbsolute, relative, resolve, sep } from 'node:path';
import { performance } from 'node:perf_hooks';

import { countStatuses, mapManifest } from './manifest.mjs';

const DEFAULT_EVIDENCE_LIMIT = 131072;

function normalizeRelative(path) {
  return path.split(sep).join('/');
}

function isSafeRelativePath(path) {
  if (!path || isAbsolute(path) || /^[A-Za-z]:/.test(path) || path.includes('://')) return false;
  return !path.replaceAll('\\', '/').split('/').includes('..');
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

async function safeObservation(root, realRoot, absolutePath, relativePath, probeId) {
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
        artifactType: probeId,
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

function latestTimestamp(observations) {
  if (observations.length === 0) return null;
  return observations.map((item) => item.modifiedAt).sort().at(-1);
}

async function evaluateChecklistEvidence(root, realRoot, rule, targetLatest, manifest) {
  const probe = { ...rule, id: rule.id, type: 'pattern' };
  const collected = await collectPattern(root, realRoot, probe, manifest);
  const evidencePaths = [];
  const issues = [...collected.issues];

  for (const observation of collected.observations) {
    if ((observation.size ?? 0) > (rule.maxBytes ?? DEFAULT_EVIDENCE_LIMIT)) {
      issues.push('검증 체크리스트가 너무 커서 자동 판정하지 않았어요.');
      continue;
    }
    const absolute = resolve(root, ...observation.relativePath.split('/'));
    try {
      const content = await readFile(absolute, 'utf8');
      const items = [...content.matchAll(/^- \[([ xX])\]/gm)];
      if (items.length === 0) {
        issues.push(`${observation.relativePath}에서 체크 항목을 찾지 못했어요.`);
        continue;
      }
      const unchecked = items.some((match) => match[1] === ' ');
      if (unchecked) continue;
      if (targetLatest && observation.modifiedAt < targetLatest) {
        issues.push(`${observation.relativePath}가 작업 문서보다 오래되어 다시 확인해야 해요.`);
        continue;
      }
      evidencePaths.push(observation.relativePath);
    } catch {
      issues.push(`${observation.relativePath} 검증 내용을 읽지 못했어요.`);
    }
  }

  return { evidencePaths, issues };
}

async function nodeState(root, realRoot, node, manifest) {
  if (node.kind === 'conceptual') {
    return {
      id: node.id,
      status: 'conceptual',
      reason: '수업에서 실제 업무를 하나 고르면 시작돼요.',
      paths: [],
      artifactCount: 0,
      latestModifiedAt: null,
      evidencePaths: [],
    };
  }

  const observations = [];
  const issues = [];
  for (const probe of node.probes) {
    const collected = await collectProbe(root, realRoot, probe, manifest);
    observations.push(...collected.observations);
    issues.push(...collected.issues);
  }

  const unique = [...new Map(observations.map((item) => [item.relativePath, item])).values()]
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  const targetLatest = latestTimestamp(unique);
  const evidencePaths = [];

  for (const rule of node.evidenceRules ?? []) {
    if (rule.kind !== 'checked-checklist') continue;
    const evidence = await evaluateChecklistEvidence(root, realRoot, rule, targetLatest, manifest);
    evidencePaths.push(...evidence.evidencePaths);
    issues.push(...evidence.issues);
  }

  let statusName = 'expected';
  if (unique.length > 0) statusName = 'present';
  if (evidencePaths.length > 0) statusName = 'verified';
  if (issues.length > 0) statusName = 'needs-review';

  const reason = statusName === 'expected'
    ? '아직 이 유형의 파일을 만들지 않았어요.'
    : statusName === 'verified'
      ? `파일 ${unique.length}개와 현재 검증 근거를 확인했어요.`
      : statusName === 'needs-review'
        ? issues[0]
        : `지원되는 파일 ${unique.length}개를 확인했어요. 검증 완료와는 구분해요.`;

  return {
    id: node.id,
    status: statusName,
    reason,
    paths: unique.map((item) => item.relativePath),
    artifactCount: unique.length,
    latestModifiedAt: targetLatest,
    evidencePaths: [...new Set(evidencePaths)].sort(),
  };
}

export async function scanWorkspace(projectRoot, { manifest = mapManifest } = {}) {
  const started = performance.now();
  const root = resolve(projectRoot);
  const rootInfo = await stat(root);
  if (!rootInfo.isDirectory()) throw new Error('Workspace root must be a directory.');
  const realRoot = await realpath(root);

  const nodes = [];
  for (const node of [...manifest.nodes].sort((a, b) => a.order - b.order)) {
    nodes.push(await nodeState(root, realRoot, node, manifest));
  }

  return {
    schemaVersion: 1,
    mode: 'live',
    generatedAt: new Date().toISOString(),
    rootLabel: basename(root),
    staleAfterMs: 5000,
    durationMs: Math.max(0, Math.round(performance.now() - started)),
    nodes,
    edges: manifest.edges,
    views: manifest.views,
    summary: countStatuses(nodes),
  };
}
