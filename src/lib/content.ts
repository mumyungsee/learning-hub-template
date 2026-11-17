import { getCollection, type CollectionEntry } from 'astro:content';

// ─────────────────────────────────────────────────────────────
// 여러 페이지가 공통으로 쓰는 "글 불러오기 + 정렬" 함수 모음.
// 수강생은 여기 손댈 필요 없어.
// ─────────────────────────────────────────────────────────────

export type WikiEntry = CollectionEntry<'wiki'>;
export type WikiCard = CollectionEntry<'wikis'>;
export type Project = CollectionEntry<'projects'>;

/** 글에 `위키:` 칸이 없을 때 들어가는 기본 위키 이름 */
export const DEFAULT_WIKI_SLUG = 'default';

// 종류별 정렬 우선순위 (한 주차 안에서: 계획 → 개념 → 사례 → 회고)
// 계획이 맨 앞인 이유 — 그 주에 뭘 만들려 했는지를 먼저 읽어야 나머지가 읽힌다.
// (로드맵은 아래 getWikiGrouped에서 따로 빠지므로 이 표에서는 순서를 다투지 않는다)
const 종류순서: Record<string, number> = { 로드맵: 0, 계획: 1, 개념: 2, 사례: 3, 회고: 4 };

function sortEntries(items: WikiEntry[]): WikiEntry[] {
  return items.slice().sort((a, b) => {
    const wa = a.data.주차 ?? 0;
    const wb = b.data.주차 ?? 0;
    if (wa !== wb) return wa - wb;
    const ka = 종류순서[a.data.종류] ?? 9;
    const kb = 종류순서[b.data.종류] ?? 9;
    if (ka !== kb) return ka - kb;
    return a.data.date.valueOf() - b.data.date.valueOf();
  });
}

function groupByWeek(items: WikiEntry[]) {
  const roadmap = items.filter((e) => e.data.종류 === '로드맵');
  const rest = items.filter((e) => e.data.종류 !== '로드맵');
  const map = new Map<number, WikiEntry[]>();
  for (const e of rest) {
    const w = e.data.주차 ?? 0;
    if (!map.has(w)) map.set(w, []);
    map.get(w)!.push(e);
  }
  const weeks = [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([주차, weekItems]) => ({ 주차, items: weekItems }));
  return { roadmap, weeks };
}

/** 이 글이 어느 위키에 속하는지. `위키:` 칸이 없으면 기본 위키. */
export function entryWikiSlug(e: WikiEntry): string {
  const raw = e.data.위키?.trim();
  return raw ? raw : DEFAULT_WIKI_SLUG;
}

// 공개된 위키 글 전체 (최신 홈 목록 등). 주차·종류 순.
export async function getWiki(): Promise<WikiEntry[]> {
  const items = await getCollection('wiki', ({ data }) => data.공개 !== false);
  return sortEntries(items);
}

export type WikiSet = {
  slug: string;
  title: string;
  summary?: string;
  프로젝트?: string;
  책: boolean;
  started: Date;
  implicit: boolean;
  card: WikiCard | null;
};

async function getWikiCards(): Promise<WikiCard[]> {
  return getCollection('wikis', ({ data }) => data.공개 !== false);
}

/** 위키 카드 목록. 파일이 없어도 기본 위키는 항상 하나 있다(하위 호환). */
export async function getWikiSets(): Promise<WikiSet[]> {
  const cards = await getWikiCards();
  const sets: WikiSet[] = cards.map((c) => ({
    slug: c.slug,
    title: c.data.title,
    summary: c.data.summary,
    프로젝트: c.data.프로젝트,
    책: c.data.책 ?? false,
    started: c.data.date,
    implicit: false,
    card: c,
  }));
  if (!sets.some((s) => s.slug === DEFAULT_WIKI_SLUG)) {
    sets.unshift({
      slug: DEFAULT_WIKI_SLUG,
      title: '기본 위키',
      summary: '위키 칸을 아직 안 단 글이 여기 모여요.',
      책: false,
      started: new Date('2026-01-01'),
      implicit: true,
      card: null,
    });
  }
  return sets;
}

export async function getWikiSet(slug: string): Promise<WikiSet | null> {
  return (await getWikiSets()).find((s) => s.slug === slug) ?? null;
}

/** 한 위키에 속한 공개 글 (모든 종류). */
export async function getEntriesOfWiki(wikiSlug: string): Promise<WikiEntry[]> {
  const all = await getWiki();
  return sortEntries(all.filter((e) => entryWikiSlug(e) === wikiSlug));
}

export async function getWikiSetsOfProject(projectSlug: string): Promise<WikiSet[]> {
  return (await getWikiSets()).filter((s) => s.프로젝트 === projectSlug);
}

// 위키를 주차별로 묶어서 돌려줘 (좌측 목록·전자책 챕터용).
// wikiSlug를 주면 그 위키만, 안 주면 공개 글 전체(옛 동작).
export async function getWikiGrouped(wikiSlug?: string) {
  const all = wikiSlug ? await getEntriesOfWiki(wikiSlug) : await getWiki();
  return groupByWeek(all);
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

// ─── 서재 — 위키마다 책 한 권 ────────────────────────────────
// 글은 여전히 `/wiki/{slug}` 한 곳에만 산다. 책은 그 위키의 글을 다른 순서로 꿴 것뿐이다.
// ★ 최소 개수 조건을 두지 않는다. 책장에 꽂을지는 위키 카드의 `책: true`.
export type Book = {
  slug: string;
  title: string;
  summary?: string;
  status: string;
  책: boolean;
  started: Date;
  cases: WikiEntry[];
  주차별: { 주차: number; items: WikiEntry[] }[];
  프로젝트?: string;
  legacy?: boolean;
};

function toBook(opts: {
  slug: string;
  title: string;
  summary?: string;
  status: string;
  책: boolean;
  started: Date;
  items: WikiEntry[];
  프로젝트?: string;
  legacy?: boolean;
}): Book {
  const { roadmap, weeks } = groupByWeek(opts.items);
  const 주차별 = [
    ...(roadmap.length ? [{ 주차: 0, items: roadmap }] : []),
    ...weeks,
  ];
  return {
    slug: opts.slug,
    title: opts.title,
    summary: opts.summary,
    status: opts.status,
    책: opts.책,
    started: opts.started,
    cases: opts.items,
    주차별,
    프로젝트: opts.프로젝트,
    legacy: opts.legacy,
  };
}

// 책장에 꽂힌 책 (`책: true`인 것만)
export async function getBooks(): Promise<Book[]> {
  return (await getAllBooks()).filter((b) => b.책);
}

// 모든 위키의 책 데이터 (토글과 무관 — 꺼져 있어도 주소는 살아 있다)
export async function getAllBooks(): Promise<Book[]> {
  const sets = await getWikiSets();
  const projects = await getProjects();
  const statusOf = (projectSlug?: string) =>
    projects.find((p) => p.slug === projectSlug)?.data.status ?? '진행중';

  const books: Book[] = [];
  for (const s of sets) {
    const items = await getEntriesOfWiki(s.slug);
    books.push(
      toBook({
        slug: s.slug,
        title: s.title,
        summary: s.summary,
        status: statusOf(s.프로젝트),
        책: s.책,
        started: s.started,
        items,
        프로젝트: s.프로젝트,
      }),
    );
  }

  // 하위 호환: 위키 카드가 없는데 프로젝트 카드에만 `책: true`가 있는 예전 사이트
  const taken = new Set(books.map((b) => b.slug));
  const claimed = new Set(sets.map((s) => s.프로젝트).filter(Boolean) as string[]);
  for (const p of projects) {
    if (!p.data.책) continue;
    if (taken.has(p.slug) || claimed.has(p.slug)) continue;
    const items = await getCasesOf(p.slug);
    books.push(
      toBook({
        slug: p.slug,
        title: p.data.title,
        summary: p.data.summary,
        status: p.data.status,
        책: true,
        started: p.data.date,
        items,
        프로젝트: p.slug,
        legacy: true,
      }),
    );
  }
  return books;
}

// 프로젝트 카드 하나 (책의 서문으로 쓸 수도 있음).
export async function getProjectCard(slug: string): Promise<Project | null> {
  const items = await getCollection('projects', ({ id }) => id.replace(/\.md$/, '') === slug);
  return items[0] ?? null;
}

export async function getWikiCard(slug: string): Promise<WikiCard | null> {
  const items = await getCollection('wikis', ({ id }) => id.replace(/\.md$/, '') === slug);
  return items[0] ?? null;
}

export async function getBook(slug: string): Promise<Book | null> {
  return (await getAllBooks()).find((b) => b.slug === slug) ?? null;
}

// 서재에 꽂힌 책에 안 들어간 글. 기본 위키(책이 꺼진) 글이 여기 모여요.
export async function getStrayEntries(): Promise<WikiEntry[]> {
  const all = await getWiki();
  const shelved = new Set(
    (await getAllBooks())
      .filter((b) => b.책)
      .flatMap((b) => b.cases.map((e) => e.slug)),
  );
  return all.filter((e) => !shelved.has(e.slug));
}

// ─── 세부 목차(우측 TOC)용 — 본문에서 h2/h3 뽑기 ──────────────
export type Heading = { id: string; text: string; level: 2 | 3 };

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
