import { getCollection, type CollectionEntry } from 'astro:content';

// ─────────────────────────────────────────────────────────────
// 여러 페이지가 공통으로 쓰는 "글 불러오기 + 정렬" 함수 모음.
// 수강생은 여기 손댈 필요 없어.
// ─────────────────────────────────────────────────────────────

export type WikiEntry = CollectionEntry<'wiki'>;
export type Project = CollectionEntry<'projects'>;

// 종류별 정렬 우선순위 (한 주차 안에서: 계획 → 개념 → 사례 → 회고)
// 계획이 맨 앞인 이유 — 그 주에 뭘 만들려 했는지를 먼저 읽어야 나머지가 읽힌다.
// (로드맵은 아래 getWikiGroups에서 따로 빠지므로 이 표에서는 순서를 다투지 않는다)
const 종류순서: Record<string, number> = { 로드맵: 0, 계획: 1, 개념: 2, 사례: 3, 회고: 4 };

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

// ─── 서재 — 프로젝트 하나가 책 한 권 ────────────────────────────────
// 글은 여전히 `/wiki/{slug}` 한 곳에만 산다. 책은 그 글들을 다른 순서로 꿴 것뿐이다.
// ★ 최소 개수 조건을 두지 않는다 — "몇 편 넘어야 책이 된다"는 규칙은 주인을 헷갈리게 한다.
//   대신 **주인이 켠다**: 프로젝트 카드의 `책: true`. 글 한두 개로 책을 내는 게 민망할 수 있어서,
//   언제 낼지는 기계가 아니라 주인이 정한다. 껐다 켰다 자유롭고, 꺼도 사례글은 그대로 남는다.
export type Book = {
  slug: string;
  title: string;
  summary?: string;
  status: string;
  책: boolean;
  started: Date;
  cases: WikiEntry[];
  주차별: { 주차: number; items: WikiEntry[] }[];
};

// 책장에 꽂힌 책 (`책: true`인 것만)
export async function getBooks(): Promise<Book[]> {
  return (await getAllBooks()).filter((b) => b.책);
}

// 모든 프로젝트의 책 데이터 (토글과 무관 — 개별 책 페이지는 꺼져 있어도 열린다.
// 주인이 미리 보고 낼지 정할 수 있어야 하므로 주소는 항상 살아 있다)
export async function getAllBooks(): Promise<Book[]> {
  const projects = await getProjects();
  return Promise.all(
    projects.map(async (p) => {
      const cases = await getCasesOf(p.slug);
      // 책 안에서도 주차가 챕터가 된다 (챌린지 리듬 유지)
      const map = new Map<number, WikiEntry[]>();
      for (const c of cases) {
        const w = c.data.주차 ?? 0;
        if (!map.has(w)) map.set(w, []);
        map.get(w)!.push(c);
      }
      return {
        slug: p.slug,
        title: p.data.title,
        summary: p.data.summary,
        status: p.data.status,
        책: p.data.책 ?? false,
        started: p.data.date,
        cases,
        주차별: [...map.entries()]
          .map(([주차, items]) => ({ 주차, items }))
          .sort((a, b) => a.주차 - b.주차),
      };
    }),
  );
}

// 프로젝트 카드 하나 (책의 서문으로 쓴다).
// ★ 페이지에서 getCollection을 직접 부르지 않는다 — 데이터 읽기는 이 파일 한 곳에 모은다.
//   그래야 스키마가 바뀌어도 고칠 자리가 하나다.
export async function getProjectCard(slug: string): Promise<Project | null> {
  const items = await getCollection('projects', ({ id }) => id.replace(/\.md$/, '') === slug);
  return items[0] ?? null;
}

export async function getBook(slug: string): Promise<Book | null> {
  return (await getAllBooks()).find((b) => b.slug === slug) ?? null;
}

// 어느 프로젝트에도 안 묶인 글 (로드맵·계획·개념·회고). 서재에서 "그 밖의 기록"으로 묶인다.
// 사례글인데 `프로젝트:`를 안 붙인 것도 여기로 떨어진다 — 그게 눈에 보여야 연결을 챙긴다.
export async function getStrayEntries(): Promise<WikiEntry[]> {
  const all = await getWiki();
  const projects = await getProjects();
  const ids = new Set(projects.map((p) => p.slug));
  return all.filter((e) => !(e.data.종류 === '사례' && e.data.프로젝트 && ids.has(e.data.프로젝트)));
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
