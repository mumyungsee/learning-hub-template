import { defineCollection, z } from 'astro:content';

// ─────────────────────────────────────────────────────────────
// 이 파일은 "내 사이트에 어떤 종류의 글이 들어가는지"를 정하는 설정이야.
// 수강생은 여기 손댈 일 거의 없어. 아래 폴더에 마크다운(.md)을 넣으면 사이트에 자동으로 나타나.
//
//   src/content/wiki/      → 위키 글 (로드맵·계획·개념·사례·회고)  ★ 제일 많이 쓰는 곳
//   src/content/projects/  → 내 프로젝트 (카드로 전시). 카드를 만들면 위키와 전자책이 같이 생겨요.
//   src/content/wikis/     → 위키 카드 (제목을 바꾸거나, 프로젝트와 상관없는 위키를 더 만들 때만)
//   src/content/journal/   → 저널 (개인 학습일지, 사이트엔 안 보임)
// ─────────────────────────────────────────────────────────────

// ★ 파일 이름은 영문·숫자·하이픈(-)으로! (예: w1-case-day1.md)
//   한글 파일 이름은 인터넷 주소로 바뀔 때 문제가 생겨. 제목은 아래 title에 한글로 쓰면 돼.

// 1) 위키 글 — 한 페이지. 나중에 그 위키의 전자책 한 꼭지가 돼.
const wiki = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),          // 제목 (필수)
    date: z.coerce.date(),      // 날짜 (필수, 예: 2026-07-23)
    summary: z.string().optional(),   // 한 줄 요약

    // ★ 이 두 개가 위키를 자동으로 정리해줘 ─────────────
    // 종류: 이 글이 뭔지. 좌측 목록에서 순서가 이걸로 정해짐 (로드맵 → 계획 → 개념 → 사례 → 회고)
    //   로드맵 = (선택) 4주 전체 지도. 쓰고 싶은 사람만(맨 앞 서문 자리, 한 번만)
    //   계획   = 그 주에 뭘 어디까지 만들지 정한 문서. 짧은 계획·실행 순서·완성 기준·다음 30일이 여기.
    //            새 대화로 자주 시작하니 이런 건 대화에 두면 사라진다 → 반드시 파일로 남긴다.
    종류: z.enum(['로드맵', '계획', '개념', '사례', '회고']).default('사례'),
    // 주차: 몇 주차 글인지 (1~4). 로드맵은 주차가 없어도 돼(맨 위 서문 자리).
    주차: z.number().optional(),
    // ────────────────────────────────────────────────

    tags: z.array(z.string()).optional(),   // 부가 태그 (선택)
    프로젝트: z.string().optional(),          // 어느 프로젝트 위키에 넣을지 (프로젝트 파일 이름). 이 칸만 있어도 그 위키·작업 기록으로 모여요.
    // 프로젝트와 상관없는 위키, 또는 위키 카드 이름으로 직접 넣고 싶을 때만 이 칸을 써요.
    // `위키:`도 `프로젝트:`도 없으면 '기본 위키'(default)에 들어가요.
    위키: z.string().optional(),
    공개: z.boolean().default(true),         // false면 사이트에 안 보임
  }),
});

// 1-2) 위키 카드 — 보통은 필요 없어요. 프로젝트 카드를 만들면 위키와 전자책이 같이 생겨요.
//     이 폴더는 (1) 위키 제목·소개를 내가 정하고 싶거나
//     (2) 프로젝트와 상관없는 위키를 하나 더 만들 때만 쓰면 돼.
//     이미 `프로젝트: 이름`을 적은 카드가 있으면, 그 프로젝트 위키를 하나 더 자동으로 만들지 않아요.
const wikis = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().optional(),
    프로젝트: z.string().optional(),  // 어느 프로젝트의 위키인지 (이 카드가 그 프로젝트 위키를 대신할 때)
    // 책장에 꽂을지. 이 칸을 비우면:
    //   - 프로젝트 위키는 글이 하나라도 있을 때 서재에 책이 나와요.
    //   - 프로젝트와 상관없는 위키는 true를 넣어야 책장에 꽂혀요.
    // 직접 true나 false를 쓰면 그 값을 따릅니다.
    책: z.boolean().optional(),
    공개: z.boolean().default(true),
  }),
});

// 2) 프로젝트 — 내가 만드는 것. 완성되면 배지가 자동으로 [완성]으로 바뀜
const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().optional(),
    status: z.enum(['진행중', '완성']).default('진행중'),
    tags: z.array(z.string()).optional(),
    링크: z.string().optional(),   // 배포한 앱·결과물 주소 (있으면 "체험하기" 버튼)
    공개: z.boolean().default(true),
    // 예전 방식(하위 호환). 지금은 프로젝트 카드만 만들어도 위키가 생기고,
    // 글이 하나라도 있으면 서재에 책이 나와요. 새 글에서는 이 칸을 안 써도 돼요.
    책: z.boolean().default(false),
  }),
});

// 3) 저널 — 작업한 날 쓰는 개인 학습일지. 사이트엔 발행 안 됨(나만 봄).
//    여기서 소재를 뽑아 wiki의 '사례' 글로 다듬어 발행해.
const journal = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().optional(),
  }),
});

// 4) 랜딩 — 홈 화면에 들어가는 내 소개 글. (1회차에 만들 것을 고른 대화로 만들어)
//    src/content/landing/landing.md 하나만 두면 홈 위쪽에 그 내용이 나와.
//    아직 안 만들었으면 홈은 "1주차에 채워요" 안내를 보여줘.
const landing = defineCollection({
  type: 'content',
  schema: z.object({
    헤드라인: z.string().optional(),   // 큰 인사말 (없으면 site.ts 기본값)
    소개: z.string().optional(),        // 한 줄 소개
  }),
});

export const collections = { wiki, wikis, projects, journal, landing };
