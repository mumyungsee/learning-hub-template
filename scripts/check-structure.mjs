// 구조 점검 — 사이트를 고친 뒤 "구조가 무너지지 않았나"를 기계가 본다.
//
// 왜 필요한가: 주인은 코드를 못 읽는다. 화면이 잘 보이면 괜찮다고 생각하는데,
// 실제로는 같은 값이 두 군데로 갈라졌거나 데이터 읽기가 화면 파일로 새어 나갔을 수 있다.
// 그런 건 당장은 안 깨지고 나중에 "한쪽 고치니 다른 쪽이 망가지는" 형태로 터진다.
//
// 쓰는 법:  npm run check
// (고친 뒤 npm run build 와 함께 돌리면 된다)

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const problems = [];
const notes = [];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const rel = (p) => relative(ROOT, p).replace(/\\/g, '/');
const screens = walk(join(ROOT, 'src/pages')).concat(
  walk(join(ROOT, 'src/components')),
  walk(join(ROOT, 'src/layouts')),
).filter((p) => p.endsWith('.astro'));

// ① 글 읽기가 화면 파일로 새어 나갔나
//    (화면에서 getCollection을 직접 부르면, 나중에 글 항목이 바뀔 때 고칠 자리가 흩어진다)
for (const p of screens) {
  const t = readFileSync(p, 'utf-8');
  if (t.includes('getCollection(')) {
    problems.push(`${rel(p)} — 화면에서 글을 직접 읽고 있어요. src/lib/content.ts 의 함수를 쓰세요`);
  }
}

// ② 같은 이름표 표가 두 군데 이상 생겼나
const labelMaps = screens.filter((p) => /const\s+\S*표시\S*\s*:/.test(readFileSync(p, 'utf-8')));
if (labelMaps.length > 0) {
  problems.push(
    `이름표 표가 화면 파일에 있어요 (${labelMaps.map(rel).join(', ')}) — src/lib/labels.ts 한 곳에서만 정하세요`,
  );
}

// ③ 색을 직접 박았나 (변수 대신 #hex)
//    책 표지처럼 일부러 고정한 색은 예외로 둔다.
const 색예외 = ['src/components/BookCover.astro'];
for (const p of screens) {
  if (색예외.includes(rel(p))) continue;
  const t = readFileSync(p, 'utf-8');
  const style = t.slice(t.indexOf('<style>'));
  const hits = [...style.matchAll(/#[0-9a-fA-F]{3,6}\b/g)].map((m) => m[0]);
  // 흰색·검정은 흔하게 쓰이니 경고만
  const real = hits.filter((h) => !['#fff', '#ffffff', '#000', '#000000'].includes(h.toLowerCase()));
  if (real.length > 0) {
    notes.push(`${rel(p)} — 색을 직접 썼어요 (${[...new Set(real)].join(', ')}). var(--fg) 같은 변수를 쓰면 나중에 한 곳에서 바꿀 수 있어요`);
  }
}

// ④ 위키 종류가 세 곳에서 같은지 (config · labels · 정렬)
try {
  const cfg = readFileSync(join(ROOT, 'src/content/config.ts'), 'utf-8');
  const labels = readFileSync(join(ROOT, 'src/lib/labels.ts'), 'utf-8');
  const content = readFileSync(join(ROOT, 'src/lib/content.ts'), 'utf-8');

  const enumM = cfg.match(/종류:\s*z\.enum\(\[([^\]]+)\]\)/);
  if (enumM) {
    const kinds = [...enumM[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    for (const k of kinds) {
      if (!labels.includes(`${k}:`)) problems.push(`종류 '${k}' 의 이름표가 src/lib/labels.ts 에 없어요`);
      if (!new RegExp(`${k}:\\s*\\d`).test(content)) problems.push(`종류 '${k}' 의 정렬 순서가 src/lib/content.ts 의 종류순서에 없어요`);
    }
  }
} catch {
  notes.push('종류 목록을 확인 못 했어요 (파일 이름이 바뀌었나요?)');
}

// ⑤ 개인 학습일지가 git에서 빠져 있나 (7/29 사고 재발 방지)
try {
  const ignore = readFileSync(join(ROOT, '.gitignore'), 'utf-8');
  if (!ignore.includes('journal')) {
    problems.push('.gitignore 에 journal 이 없어요 — 개인 학습일지가 저장소에 올라갑니다');
  }
} catch {
  problems.push('.gitignore 가 없어요 — 개인 학습일지가 저장소에 올라갑니다');
}

// ─── 출력 ──────────────────────────────────────────────────────────
console.log(`\n화면 파일 ${screens.length}개 확인했어요.\n`);

if (problems.length === 0 && notes.length === 0) {
  console.log('구조 이상 없어요. 이대로 올려도 됩니다.\n');
} else {
  if (problems.length > 0) {
    console.log('고쳐야 할 것:');
    for (const m of problems) console.log('  ✗ ' + m);
    console.log('');
  }
  if (notes.length > 0) {
    console.log('봐두면 좋을 것 (당장 안 깨져요):');
    for (const m of notes) console.log('  · ' + m);
    console.log('');
  }
  console.log('무슨 말인지 모르겠으면 학습메이트한테 "구조 점검 결과 좀 봐줘"라고 하세요.\n');
}

process.exit(problems.length > 0 ? 1 : 0);
