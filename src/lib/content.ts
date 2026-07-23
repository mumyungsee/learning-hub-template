import { getCollection, type CollectionEntry } from 'astro:content';

// ─────────────────────────────────────────────────────────────
// 여러 페이지가 공통으로 쓰는 "글 불러오기 + 정렬" 함수 모음.
// 수강생은 여기 손댈 필요 없어.
// ─────────────────────────────────────────────────────────────

export type WikiEntry = CollectionEntry<'wiki'>;
export type Project = CollectionEntry<'projects'>;

// 종류별 정렬 우선순위 (한 주차 안에서: 로드맵 → 개념 → 사례 → 회고)
const 종류순서: Record<string, number> = { 로드맵: 0, 개념: 1, 사례: 2, 회고: 3 };

// 위키 전체를 "책 순서"로 정렬해서 돌려줘.
//   1) 로드맵(주차 없음)이 맨 앞 (전체 지도 = 서문)
//   2) 그다음 주차 오름차순 (1 → 2 → 3 → 4)
//   3) 같은 주차 안에서는 개념 → 사례 → 회고 순, 사례끼리는 날짜순
export async function getWiki(): Promise<WikiEntry[]> {
  const items = await getCollection('wiki', ({ data }) => data.공개 !== false);
  return items.sort((a, b) => {
    const wa = a.data.주차 ?? 0; // 주차 없으면(로드맵) 0 = 맨 앞
    const wb = b.data.주차 ?? 0;
    if (wa !== wb) return wa - wb;
    const ka = 종류순서[a.data.종류] ?? 9;
    const kb = 종류순서[b.data.종류] ?? 9;
    if (ka !== kb) return ka - kb;
    return a.data.date.valueOf() - b.data.date.valueOf(); // 같은 종류면 오래된 순
  });
}

// 위키를 주차별로 묶어서 돌려줘 (좌측 목록·전자책 챕터용).
// 로드맵(주차 없음)은 groups에 안 넣고 따로 roadmap으로 뺌.
export async function getWikiGrouped() {
  const all = await getWiki();
  const roadmap = all.filter((e) => e.data.종류 === '로드맵');
  const rest = all.filter((e) => e.data.종류 !== '로드맵');

  const map = new Map<number, WikiEntry[]>();
  for (const e of rest) {
    const w = e.data.주차 ?? 0; // 주차 안 붙인 글은 0주차(기타)로 모음
    if (!map.has(w)) map.set(w, []);
    map.get(w)!.push(e);
  }
  const weeks = [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([주차, items]) => ({ 주차, items }));

  return { roadmap, weeks };
}

// 홈 랜딩 글 (있으면 첫 번째, 없으면 null). 파일: src/content/landing/landing.md
export async function getLanding() {
  const items = await getCollection('landing');
  return items[0] ?? null;
}

// 공개된 프로젝트 (최신순)
export async function getProjects(): Promise<Project[]> {
  const items = await getCollection('projects', ({ data }) => data.공개 !== false);
  return items.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

// 특정 프로젝트에 엮인 위키 '사례' 글 (오래된 순 = 연재 순서)
export async function getCasesOf(projectSlug: string): Promise<WikiEntry[]> {
  const items = await getCollection(
    'wiki',
    ({ data }) => data.공개 !== false && data.종류 === '사례' && data.프로젝트 === projectSlug,
  );
  return items.sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf());
}

// ─── 세부 목차(우측 TOC)용 — 본문에서 h2/h3 뽑기 ──────────────
export type Heading = { id: string; text: string; level: 2 | 3 };

// 헤딩 텍스트 → 앵커 id. Astro의 기본 heading id 규칙과 최대한 맞춤.
export function headingSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w가-힣\s-]/g, '')
    .replace(/\s+/g, '-');
}

export function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  let inCode = false;
  for (const line of markdown.split('\n')) {
    if (line.trim().startsWith('```')) { inCode = !inCode; continue; }
    if (inCode) continue;
    const m = /^(#{2,3})\s+(.+)$/.exec(line);
    if (m) {
      const text = m[2].trim();
      headings.push({ id: headingSlug(text), text, level: m[1].length as 2 | 3 });
    }
  }
  return headings;
}
