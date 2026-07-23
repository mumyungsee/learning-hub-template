import { defineCollection, z } from 'astro:content';

// ─────────────────────────────────────────────────────────────
// 이 파일은 "내 사이트에 어떤 종류의 글이 들어가는지"를 정하는 설정이야.
// 수강생은 여기 손댈 일 거의 없어. 아래 폴더에 마크다운(.md)을 넣으면 사이트에 자동으로 나타나.
//
//   src/content/wiki/      → 학습위키 (로드맵·개념·사례·회고 다 여기)  ★ 제일 많이 쓰는 곳
//   src/content/projects/  → 내 프로젝트 (카드로 전시)
//   src/content/journal/   → 저널 (개인 학습일지, 사이트엔 안 보임)
// ─────────────────────────────────────────────────────────────

// ★ 파일 이름은 영문·숫자·하이픈(-)으로! (예: w1-case-day1.md)
//   한글 파일 이름은 인터넷 주소로 바뀔 때 문제가 생겨. 제목은 아래 title에 한글로 쓰면 돼.

// 1) 학습위키 — 한 달 동안 배운 게 주차별로 쌓이는 곳.
//    글 하나하나가 위키의 한 페이지이자, 나중에 전자책의 한 꼭지가 돼.
const wiki = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),          // 제목 (필수)
    date: z.coerce.date(),      // 날짜 (필수, 예: 2026-07-23)
    summary: z.string().optional(),   // 한 줄 요약

    // ★ 이 두 개가 위키를 자동으로 정리해줘 ─────────────
    // 종류: 이 글이 뭔지. 좌측 목록에서 순서가 이걸로 정해짐 (로드맵 → 개념 → 사례 → 회고)
    종류: z.enum(['로드맵', '개념', '사례', '회고']).default('사례'),
    // 주차: 몇 주차 글인지 (1~4). 로드맵은 주차가 없어도 돼(맨 위 서문 자리).
    주차: z.number().optional(),
    // ────────────────────────────────────────────────

    tags: z.array(z.string()).optional(),   // 부가 태그 (선택)
    프로젝트: z.string().optional(),          // '사례' 글이면, 어떤 프로젝트 글인지 (그 프로젝트 상세에 연재로 붙음)
    공개: z.boolean().default(true),         // false면 사이트에 안 보임
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
  }),
});

// 3) 저널 — 매일 쓰는 개인 학습일지. 사이트엔 발행 안 됨(나만 봄).
//    여기서 소재를 뽑아 wiki의 '사례' 글로 다듬어 발행해.
const journal = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().optional(),
  }),
});

// 4) 랜딩 — 홈 화면에 들어가는 내 소개 글. (1주차 아이데이션·로드맵 대화로 만들어)
//    src/content/landing/landing.md 하나만 두면 홈 위쪽에 그 내용이 나와.
//    아직 안 만들었으면 홈은 "1주차에 채워요" 안내를 보여줘.
const landing = defineCollection({
  type: 'content',
  schema: z.object({
    헤드라인: z.string().optional(),   // 큰 인사말 (없으면 site.ts 기본값)
    소개: z.string().optional(),        // 한 줄 소개
  }),
});

export const collections = { wiki, projects, journal, landing };
