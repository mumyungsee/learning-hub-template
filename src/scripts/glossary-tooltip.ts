/**
 * 용어 툴팁 시스템 (공용)
 *
 * 학습자료·사례글 본문에서 어려운 용어에 밑줄이 생기고, 마우스를 올리면
 * 쉬운 설명 풍선이 떠. 내가 새로 배운 용어를 추가하고 싶으면
 * 아래 glossaryTerms 배열에 한 줄 추가하면 돼. (클로드한테 부탁해도 됨)
 *   { regex: /내가만든용어/g, tip: '쉬운 설명' },
 *
 * 사용(이미 상세 페이지에 걸려 있음):
 *   import { applyGlossaryTo } from '../scripts/glossary-tooltip';
 *   applyGlossaryTo('.prose');
 *
 * 같은 위치에 여러 매칭이면 긴 매칭 우선 (예: "Claude Code" > "Claude").
 */

type GlossaryTerm = { regex: RegExp; tip: string };

export const glossaryTerms: GlossaryTerm[] = [
  // === Git/GitHub 기본 ===
  { regex: /커밋/g, tip: '파일 변경 사항을 기록하는 것. 게임의 세이브포인트 같은 개념' },
  { regex: /푸시/g, tip: '내 컴퓨터의 커밋을 GitHub에 올리는 것' },
  { regex: /포크/g, tip: '남의 저장소를 내 계정으로 복사해 오는 것' },
  { regex: /클론/g, tip: '저장소를 내 컴퓨터에 내려받는 것' },
  { regex: /저장소/g, tip: '코드와 파일을 담아두는 공간. GitHub의 프로젝트 폴더' },
  { regex: /배포/g, tip: '만든 사이트를 인터넷에 올려 누구나 볼 수 있게 하는 것' },
  { regex: /빌드/g, tip: '소스 코드를 실제 사이트 파일로 변환하는 과정' },
  { regex: /오픈소스/g, tip: '코드를 누구나 볼 수 있게 공개한 프로젝트. 가져다 쓰거나 수정할 수 있음' },
  { regex: /레포(?!\s*지)/g, tip: '저장소의 줄임말 (repository → repo). GitHub의 프로젝트 공간' },
  { regex: /마크다운/g, tip: '#으로 제목, **로 굵게 등 기호로 서식을 표현하는 텍스트 형식' },
  { regex: /README\.md/g, tip: '레포의 첫 페이지 설명서. 마크다운으로 작성되고, GitHub에서 자동으로 예쁘게 보여줌' },
  { regex: /스크린샷/g, tip: '화면을 이미지로 캡처한 것. Claude 채팅창에 붙여넣으면 AI가 화면을 보고 분석할 수 있음' },
  { regex: /로컬 서버/g, tip: '내 컴퓨터 안에서만 돌아가는 미리보기 서버. 인터넷엔 공개 안 된 상태' },
  { regex: /dev log/g, tip: '작업 중 결정사항·막혔던 것·해결법을 기록해두는 개발 일지' },
  { regex: /회의록/g, tip: '대화에서 나온 주요 내용과 결정사항을 정리한 문서. 다음 작업 때 맥락을 빠르게 복원할 수 있음' },
  { regex: /롤백/g, tip: '이전 상태로 되돌리는 것. Git에서는 원하는 커밋 시점으로 되돌릴 수 있음' },
  { regex: /git log/g, tip: '지금까지 찍은 커밋 목록을 보여주는 Git 명령어. 어느 시점으로 돌아갈지 고를 때 씀' },
  { regex: /브랜치/g, tip: '코드의 독립적인 작업 흐름. main이 기본 브랜치' },
  { regex: /라이선스/g, tip: '오픈소스를 가져다 쓸 때 지켜야 하는 조건과 규칙' },
  { regex: /라이센스/g, tip: '오픈소스를 가져다 쓸 때 지켜야 하는 조건과 규칙' },
  { regex: /로컬/g, tip: '내 컴퓨터 안에서만 동작. 인터넷에는 아직 공개 안 된 상태' },
  { regex: /자연어/g, tip: '코드나 명령어가 아닌, 평소 쓰는 일상 언어' },
  { regex: /\bFork\b/g, tip: '남의 저장소를 내 계정으로 복사해 오는 것' },
  { regex: /\bClone\b/g, tip: '저장소를 내 컴퓨터에 내려받는 것' },
  { regex: /\bPush\b/g, tip: '내 컴퓨터의 커밋을 GitHub에 올리는 것' },
  { regex: /\bpush\b/g, tip: '내 컴퓨터의 커밋을 GitHub에 올리는 것' },
  { regex: /\bcommit\b/g, tip: '파일 변경 사항을 기록하는 것. 게임의 세이브포인트 같은 개념' },
  { regex: /\bMarkdown\b/g, tip: '#으로 제목, **로 굵게 등 기호로 서식을 표현하는 텍스트 형식' },
  { regex: /\bMIT\b/g, tip: '가장 자유로운 오픈소스 라이선스. 수정·재배포·상업 이용 모두 허용' },
  { regex: /\bPrivate\b/g, tip: '나만 볼 수 있는 저장소 설정' },
  { regex: /\bPublic\b/g, tip: '누구나 볼 수 있는 저장소 설정' },

  // === 도구 (긴 이름부터) ===
  { regex: /\bClaude Code\b/g, tip: 'VS Code 안에서 파일 작업을 도와주는 AI 어시스턴트 (확장 또는 터미널 CLI)' },
  { regex: /\bVS Code\b/g, tip: 'Microsoft가 만든 무료 코드 에디터. 이 스터디에서 메인 작업 환경' },
  { regex: /\bNode\.js\b/g, tip: 'JavaScript를 내 컴퓨터에서 실행하게 해주는 도구. bkit의 자동 동작(hook)도 이걸로 동작' },
  { regex: /\bAntigravity\b/g, tip: '(이전 사용) Google이 만든 AI 작업 환경. 현재 스터디는 VS Code로 진행' },
  { regex: /\bAstro\b/g, tip: '마크다운 파일을 자동으로 웹페이지로 변환해주는 도구. 글 파일 하나 = 페이지 하나' },
  { regex: /\bGit\b/g, tip: '파일 변경 이력을 기록하고 관리하는 도구. 커밋·푸시·브랜치가 모두 Git 기능' },
  { regex: /깃/g, tip: '파일 변경 이력을 기록하고 관리하는 도구. 커밋·푸시·브랜치가 모두 Git 기능' },
  { regex: /\bGitHub CLI\b/g, tip: 'GitHub를 터미널에서 다룰 수 있게 해주는 도구. 명령어 이름은 gh' },
  { regex: /\bGitHub\b/g, tip: '코드를 저장하고 공유하는 온라인 서비스. 오픈소스 저장소를 가져올 수도 있음' },
  { regex: /\bVercel\b/g, tip: '코드를 자동으로 웹사이트로 만들어 올려주는 서비스. 무료로 사용 가능' },
  { regex: /\bChrome\b/g, tip: 'Google이 만든 웹 브라우저. 가장 많이 쓰는 브라우저 중 하나' },
  { regex: /\bClaude\b/g, tip: 'Anthropic이 만든 AI. 자연어로 대화하면서 작업을 함께 진행' },
  { regex: /\bbkit\b/g, tip: 'Claude Code에 끼우는 플러그인. 새 스킬을 잔뜩 추가해서 작업을 체계적으로 잡아줌' },

  // === AI 개념 (긴 이름부터) ===
  { regex: /컨텍스트 윈도우/g, tip: 'AI가 한 대화에서 기억할 수 있는 최대 양. 이 한계를 넘으면 오래된 내용부터 잊어버림' },
  { regex: /컨텍스트 엔지니어링/g, tip: 'AI가 일하는 환경 자체를 설계하는 것. 매번 설명하는 대신 CLAUDE.md 같은 파일로 환경이 대신 설명해주게 만드는 것' },
  { regex: /인터뷰 방식/g, tip: 'AI한테 바로 만들지 말고 먼저 질문해달라고 요청하는 프롬프트 방법. 빠진 정보를 AI가 직접 물어봐서 채워줌' },
  { regex: /하네스 엔지니어링/g, tip: 'AI 에이전트가 일하는 환경 전체를 설계하는 것. 여러 AI가 협업하는 멀티 에이전트 시스템을 만들 때 필요' },
  { regex: /리버스 엔지니어링/g, tip: '결과물을 보고 거꾸로 "어떻게 만들었지?"를 뽑아내는 것. AI로 만든 결과물에서 프롬프트를 역으로 추출할 때 씀' },
  { regex: /멀티 에이전트/g, tip: '여러 AI가 각자 역할을 나눠서 팀처럼 협업하는 구조' },
  { regex: /\bCLAUDE\.md\b/g, tip: 'Claude가 대화 시작 전에 먼저 읽는 지침 파일. 글로벌(모든 프로젝트)과 로컬(이 프로젝트만) 두 종류' },
  { regex: /\bFew-shot\b/g, tip: '말로 설명하는 대신 예시를 직접 보여주며 AI에게 시키는 방법. "이런 형식으로 해줘 (예시)"' },
  { regex: /\bPlan mode\b/g, tip: 'Claude Code의 모드. 실행하기 전에 계획만 먼저 보여주고 승인을 받는 방식' },
  { regex: /\bMVP\b/g, tip: '핵심 기능만 담은 첫 번째 버전. "일단 가장 중요한 것만 만들자"는 개념' },
  { regex: /\bPRD\b/g, tip: '제품 기획서. MVP를 구체화해서 "무엇을, 왜, 어떻게 만들 건지" 정리한 문서' },
  { regex: /\bLLM\b/g, tip: '대형 언어 모델. 엄청난 양의 텍스트를 학습해서 다음에 올 말을 예측하는 방식으로 동작하는 AI' },
  { regex: /환각/g, tip: 'AI가 없는 사실을 자신 있게 말하는 현상. LLM은 정답을 찾는 게 아니라 그럴듯한 말을 생성하기 때문에 생김' },
  { regex: /커맨드/g, tip: '스킬을 /daily처럼 짧게 호출하는 단축키. .claude/commands/ 폴더에 파일 하나 = 커맨드 하나' },

  // === AI 관련 ===
  { regex: /\bAI\b/g, tip: '사람처럼 대화하고 일도 해주는 똑똑한 컴퓨터 프로그램. ChatGPT·Claude·Gemini 같은 게 모두 AI' },
  { regex: /\bAnthropic\b/g, tip: 'Claude를 만든 회사. ChatGPT를 만든 OpenAI랑 같은 위치의 AI 회사' },
  { regex: /\bOpus\b/g, tip: 'Claude의 최상위 모델. 가장 똑똑하지만 가장 비쌈' },
  { regex: /\bSonnet\b/g, tip: 'Claude의 중간 모델. 속도·가격·성능 균형' },
  { regex: /\bHaiku\b/g, tip: 'Claude의 경량 모델. 빠르고 저렴' },
  { regex: /에이전트/g, tip: '스스로 판단해서 여러 단계 일을 진행하는 AI. 챗봇은 한 번 답하고 끝, 에이전트는 계속 일함' },
  { regex: /\bAgent\b/g, tip: '스스로 판단해서 여러 단계 일을 진행하는 AI. 챗봇은 한 번 답하고 끝, 에이전트는 계속 일함' },
  { regex: /스킬/g, tip: 'Claude Code의 명령어 묶음. /로 시작하는 게 다 스킬. bkit 같은 플러그인이 새 스킬을 추가함' },
  { regex: /\bSkill\b/g, tip: 'Claude Code의 명령어 묶음. /로 시작하는 게 다 스킬. bkit 같은 플러그인이 새 스킬을 추가함' },
  { regex: /\bPDCA\b/g, tip: '계획(Plan)→실행(Do)→점검(Check)→개선(Act) 한 바퀴. bkit이 이 순서로 작업을 잡아줌' },
  { regex: /프롬프트/g, tip: 'AI에게 시키는 말. "이거 해줘"라고 입력하는 그 문장 자체' },
  { regex: /\bPrompt\b/g, tip: 'AI에게 시키는 말. "이거 해줘"라고 입력하는 그 문장 자체' },
  { regex: /컨텍스트/g, tip: 'AI가 한 대화 동안 기억하는 내용. 너무 길어지면 잊어버려서 새로 시작해야 함' },
  { regex: /\bContext\b/g, tip: 'AI가 한 대화 동안 기억하는 내용. 너무 길어지면 잊어버려서 새로 시작해야 함' },
  { regex: /챗봇/g, tip: '대화형으로 답해주는 AI 서비스. ChatGPT, Claude.ai 같은 웹 채팅 형태' },

  // === IT 일반 ===
  { regex: /\bCLI\b/g, tip: '마우스 클릭 대신 글자(명령어)로 도구를 쓰는 방식. 터미널 안에서 동작' },
  { regex: /\bUI\b/g, tip: '사용자가 보는 화면·버튼. "UI가 바뀌었다" = "보이는 화면이 통째로 바뀌었다"' },
  { regex: /터미널/g, tip: '컴퓨터에 글자로 명령 내리는 검은 창. 해커 영화에서 보던 그거. VS Code 안에서 Ctrl+백틱으로 열림' },
  { regex: /확장/g, tip: 'VS Code 같은 도구에 끼우는 추가 부품. 한글팩, AI 확장 같은 게 다 확장' },
  { regex: /\bExtension\b/g, tip: 'VS Code 같은 도구에 끼우는 추가 부품. 한글팩, AI 확장 같은 게 다 확장' },
  { regex: /플러그인/g, tip: '확장이랑 같은 뜻. 도구에 끼우는 추가 기능. bkit이 Claude Code의 플러그인' },
  { regex: /\bPlugin\b/g, tip: '확장이랑 같은 뜻. 도구에 끼우는 추가 기능. bkit이 Claude Code의 플러그인' },
  { regex: /마켓플레이스/g, tip: '확장·플러그인이 모여있는 가게. 거기서 골라서 설치' },
  { regex: /\bMarketplace\b/g, tip: '확장·플러그인이 모여있는 가게. 거기서 골라서 설치' },
  { regex: /\bPowerShell\b/g, tip: 'Windows의 터미널 종류. 검은 창에 PS C:\\로 시작하면 PowerShell' },
  { regex: /\bGit Bash\b/g, tip: 'Windows에서 Mac·Linux식 명령어를 쓸 수 있게 해주는 터미널 종류' },
  { regex: /\bPATH\b/g, tip: '컴퓨터가 명령어를 찾는 길 목록. 새 도구 깔면 이 목록에 추가됨. "PATH 갱신" = "새 도구 찾을 수 있게 길 업데이트"' },
  { regex: /환경변수/g, tip: '컴퓨터 전체가 공유하는 설정값. PATH가 대표적인 환경변수' },
  { regex: /\bShell\b/gi, tip: '터미널에서 명령어를 해석해서 실행해주는 프로그램. PowerShell·Bash 같은 게 다 셸의 한 종류' },
  { regex: /셸/g, tip: '터미널에서 명령어를 해석해서 실행해주는 프로그램. PowerShell·Bash 같은 게 다 셸의 한 종류' },
  { regex: /\bCMD\b/g, tip: 'Windows의 옛날 터미널. 검은 창에 C:\\>로 시작하면 CMD. 요즘은 PowerShell이 더 많이 쓰임' },

  // === 웹/개발 ===
  { regex: /\bJavaScript\b/g, tip: '웹페이지를 움직이게 하는 프로그래밍 언어. 버튼 누르면 뭐가 뜨는 거, 다 JavaScript' },
  { regex: /\bJS\b/g, tip: 'JavaScript의 줄임말. 웹페이지를 움직이게 하는 프로그래밍 언어' },
  { regex: /\bnpm\b/g, tip: 'Node.js의 부품 가게. 필요한 코드 묶음을 받아서 깔 때 씀' },
  { regex: /\bHTML\b/g, tip: '웹페이지의 뼈대. "여기에 제목, 여기에 글" 같은 구조를 짜는 언어' },
  { regex: /\bCSS\b/g, tip: '웹페이지의 옷. 색깔·크기·위치 같은 디자인을 입히는 언어' },
  { regex: /\bAPI\b/g, tip: '외부 서비스랑 대화하는 약속. 날씨 API에 물어보면 날씨 알려주는 식' },
  { regex: /\bfrontmatter\b/g, tip: '마크다운 파일 맨 위 ---로 감싼 정보. 제목·날짜·공개 여부 같은 "이 글에 대한 정보"' },
  { regex: /\bhook\b/gi, tip: '"이런 일이 일어나면 자동으로 이걸 실행해" 같은 자동 동작 연결. 예: 파일 저장하면 자동으로 검사. bkit의 자동화가 이걸로 돌아감' },
  { regex: /훅/g, tip: '"이런 일이 일어나면 자동으로 이걸 실행해" 같은 자동 동작 연결. 예: 파일 저장하면 자동으로 검사. bkit의 자동화가 이걸로 돌아감' },
  { regex: /\bIDE\b/g, tip: '코드 작업 전용 프로그램. VS Code가 IDE의 한 종류. 메모장 대신 쓰는 전용 작업실' },

  // === 하드웨어 / 칩 ===
  { regex: /\bApple Silicon\b/g, tip: 'Mac의 M1·M2·M3·M4 칩 통칭. 2020년 이후 Mac이 쓰는 새 칩 (옛날 Intel Mac이랑 구분)' },
  { regex: /\bARM64\b/g, tip: 'Surface Pro X·Galaxy Book·일부 노트북이 쓰는 칩 종류. 일반 PC면 보통 x64라 무시해도 됨' },
  { regex: /\bARM\b/g, tip: '저전력 칩 계열 (스마트폰·일부 노트북이 이걸 씀). x64랑은 다른 종류라 설치 파일이 따로 있음' },
  { regex: /\bx64\b/g, tip: '일반 노트북·데스크탑 대부분이 쓰는 칩 종류. 99% 여기에 해당' },
  { regex: /\bIntel\b/g, tip: '대표적인 PC 칩 제조사. 옛날 Mac도 Intel 칩을 썼는데, 2020년 이후 Mac은 보통 Apple Silicon' },

  // === Claude 계정 / CLI ===
  { regex: /\bClaude Pro\b/g, tip: 'Claude의 유료 구독 등급. 일반 사용자가 쓰는 게 이거' },
  { regex: /\bPro\b/g, tip: 'Claude의 유료 구독 등급. 무료 등급과 구분되는 정식 사용 등급' },
  { regex: /\bAnthropic Console\b/g, tip: 'Claude API를 쓰는 개발자용 계정. 일반 사용자는 보통 Pro 구독으로 충분' },
  { regex: /\bgh\b/g, tip: 'GitHub CLI의 명령어 이름. 터미널에서 gh 치면 GitHub 작업 가능' },

  // === 도구 첫 실행 화면 ===
  { regex: /Welcome to Claude Code/g, tip: 'Claude Code를 처음 실행하면 뜨는 환영 화면. 이게 보이면 설치·로그인 성공' },
];

/**
 * 컨테이너 안 텍스트 노드에 용어 툴팁 적용
 *
 * @param selector - 적용할 컨테이너 셀렉터 (예: '.tutorial-body', '.page-body')
 */
export function applyGlossaryTo(selector: string): void {
  const container = document.querySelector(selector);
  if (!container) return;

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const skip = (node.parentElement as Element | null)?.closest(
          'pre, code, a, .glossary-term, h1, h2, h3'
        );
        return skip ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const textNodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) textNodes.push(n as Text);

  for (const textNode of textNodes) {
    const text = textNode.textContent ?? '';

    // 모든 용어의 매칭 위치 수집
    const matches: { start: number; end: number; term: string; tip: string }[] = [];
    for (const { regex, tip } of glossaryTerms) {
      regex.lastIndex = 0;
      let m;
      while ((m = regex.exec(text)) !== null) {
        matches.push({ start: m.index, end: m.index + m[0].length, term: m[0], tip });
      }
    }
    if (matches.length === 0) continue;

    // 위치순 정렬 (같은 위치면 긴 매칭 우선 — 예: "Claude Code" > "Claude")
    matches.sort((a, b) =>
      a.start !== b.start ? a.start - b.start : b.end - b.start - (a.end - a.start)
    );
    const kept: typeof matches = [];
    let cursor = 0;
    for (const m of matches) {
      if (m.start >= cursor) {
        kept.push(m);
        cursor = m.end;
      }
    }

    // 텍스트 노드를 분해해서 span으로 교체
    const frag = document.createDocumentFragment();
    let pos = 0;
    for (const m of kept) {
      if (m.start > pos) frag.appendChild(document.createTextNode(text.slice(pos, m.start)));
      const span = document.createElement('span');
      span.className = 'glossary-term';
      span.dataset.tooltip = m.tip;
      span.textContent = m.term;
      frag.appendChild(span);
      pos = m.end;
    }
    if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
    textNode.replaceWith(frag);
  }
}
