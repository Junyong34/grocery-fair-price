# 달력 PDF 어드민 · 다운로드 스펙

Status: ready-for-agent (1차 구현 2026-10-16, 남은 일은 아래 "1차 구현에서 달라진 점과 남은 일")
Phase: MVP 이후.
작성일: 2026-10-14, 어드민 기준으로 다시 씀: 2026-10-16

## 목표

관리자가 인쇄물 종류(월간 달력, 연간 달력 한 장, 계절 포스터, 월별 포스터)를 고르고 스타일과 타이포를 맞춰 **에디션**(PDF 묶음)을 만들고, 미리 보고, PDF로 뽑는다. 뽑은 PDF는 **다운로드 폴더**(`apps/web/public/downloads/`)에 올리고, 사용자는 다운로드 화면의 링크로 내려받는다. 서버는 PDF를 만들지 않는다.

이전 판(2026-10-14)과 달라진 점:

| 이전 | 지금 | 이유 |
|---|---|---|
| 어드민 없음, CI 스크립트가 옵션 조합 312개를 모두 만든다 | 관리자가 고른 에디션만 만든다 | 옵션이 배치·달력 모양·표기·공휴일·서체로 늘어 조합을 곱하면 수만 개다. 모두 만들 수 없고, 만들어도 사용자가 고르기 어렵다. |
| 사용자가 설정 시트에서 범위·디자인·용지·방향·형식을 고른다 | 사용자는 에디션·용지·달만 고른다 | 디자인 판단은 관리자가 끝낸다. 사용자 화면이 단순해진다(메모리: 제철 화면은 단순하게). |
| GitHub Actions에서 생성, 오브젝트 스토리지에 저장 | 관리자가 자기 컴퓨터에서 어드민으로 만들고 다운로드 폴더에 올린다 | 만드는 사람이 관리자 한 명이고, 결과물을 눈으로 보고 올린다. 운영 서버에 헤드리스 Chrome·스토리지·로그인이 필요 없다. |

WIREFRAME-SPEC 4절 "달력 다운로드"의 옵션 표는 이 스펙으로 대체한다.

## 용어

- **인쇄 사양(PrintSpec)**: PDF 한 묶음의 모양을 정하는 값 전체. 같은 사양이면 언제나 같은 PDF가 나온다.
- **인쇄물 종류(kind)**: 사양의 첫 갈래. MVP는 아래 네 가지다.
- **에디션(Edition)**: 이름·설명·상태가 붙은 인쇄 사양 하나와 그 결과 파일들. 사용자에게 보이는 단위다.
- **용지(Paper)**: `A4`(210×297mm) 또는 `A3`(297×420mm). 에디션의 속성이 아니라 결과 파일을 만들 때 고르는 값이다.
- **결과 파일**: 종류마다 다르다(아래 표). 용지마다 한 벌씩 만든다.

## 인쇄물 종류 (MVP)

| kind | 이름 | 모양 | 결과 파일(용지마다) | 참고 시안 |
|---|---|---|---|---|
| `monthly` | 월간 달력 | 한 장에 한 달. 위는 그 달 제철 그림, 아래는 달력. 표지 한 장을 앞에 붙일 수 있다. | 달별 12개 + 12개월 묶음 1개 = 13 | 사용자 첨부 6(표지 + 12장), 7(그림 위·달력 아래) |
| `year-sheet` | 연간 달력 한 장 | 한 장에 12달. 달마다 그림 칸과 작은 달력 칸이 짝을 이룬다. | 1 | 사용자 첨부 5 |
| `season-poster` | 계절 제철 포스터 | 달력 없음. 봄·여름·가을·겨울 네 띠에 그 계절 품종 그림과 이름. | 1 | 사용자 첨부 8 |
| `month-poster` | 월별 제철 포스터 | 달력 없음. 1~12월 열두 칸에 그 달 품종 그림과 이름. 날짜가 없어 해가 바뀌어도 그대로 쓴다. | 1 | `season-poster`의 달 버전 |

`month-poster`는 "한 장에 12달"로 정했다. "달마다 한 장씩 그림만"은 `monthly`에서 달력을 끈 것과 같아 종류를 따로 두지 않는다. 필요하면 `monthly`에 `calendar: false`를 더한다.

`season-poster`와 `month-poster`는 날짜가 없으므로 `year`가 없다. 연도가 바뀌어도 다시 만들지 않는다.

## 데이터 모양

인쇄 사양은 `packages/seasonal/src/print/spec.ts`에 둔다(React·DOM을 모르는 순수 타입과 파서). **종류마다 쓰는 옵션이 다르므로 `kind`로 갈리는 유니언**이다. 공통 블록은 한 번만 정의해 조합한다.

```ts
type PrintSpec = MonthlySpec | YearSheetSpec | SeasonPosterSpec | MonthPosterSpec

// ── 공통 블록 ──
type Base = {
  version: 1
  orientation: "portrait" | "landscape"
  type: {
    heading: "gowun-batang" | "pretendard"
    number: "display" | "pretendard" | "gowun-batang"
    scale: 0.9 | 1 | 1.1
  }
  surface: "cream" | "white" | "season"   // 배경: 크림 / 흰색(잉크 절약) / 계절색
  foods: {
    names: "hidden" | "korean" | "korean-english"
    max: number                           // 칸 하나(달·계절)에 넣을 품종 수 상한
    seed: number
    /** 관리자가 미리보기에서 끌어 옮긴 자리. 키는 칸(달 "1".."12" 또는 계절). 없으면 시드 배치. */
    placements: Partial<Record<Month | Season, readonly SavedSpot[]>>
  }
}

type CalendarBlock<H> = {
  variant: CalendarVariant                // 화면의 plain·grid·editorial·tiles를 그대로 쓴다
  weekStart: "sun" | "mon"
  holidays: H
  weekday: "korean" | "english-short" | "english-initial"   // 일 / Sun / S
}

// ── 종류 ──
type MonthlySpec = Base & {
  kind: "monthly"
  year: number
  cover: boolean                          // 첫 장에 연도 표지
  monthLabel: MonthLabelStyle             // number("10") · korean("10월") · english("October")
  calendar: CalendarBlock<"hidden" | "mark" | "mark-and-name"> & {
    festivals: boolean                    // 공휴일이 아닌 명절(정월대보름·단오·삼복·동지)
    lunar: boolean
  }
  foodLayout: "scatter" | "hero" | "strip" | "none"   // 흩뿌림 / 큰 그림 한 칸 / 띠 / 없음
  memo: "none" | "lines" | "eaten-check"
}

type YearSheetSpec = Base & {
  kind: "year-sheet"
  year: number
  monthLabel: MonthLabelStyle | "big-number"   // big-number: 시안 5처럼 그림 위에 크게 쓴 숫자
  // 칸이 작아 공휴일 이름·음력·명절은 들어가지 않는다. 타입에서 아예 고를 수 없다.
  calendar: CalendarBlock<"hidden" | "mark">
  grid: "4x3" | "3x4" | "2x6"             // 열×행. 방향과 맞지 않는 값은 파서가 거른다
}

type SeasonPosterSpec = Base & {
  kind: "season-poster"
  title: string                           // 예: "제철 과일과 채소"
  seasonLabel: "korean" | "english-korean"   // 봄 / Spring · 봄
  categories: readonly FoodCategory[]     // 넣을 카테고리(과일·채소·수산물 …). 비우면 전부
}

type MonthPosterSpec = Base & {
  kind: "month-poster"
  title: string
  monthLabel: MonthLabelStyle
  grid: "4x3" | "3x4" | "2x6"
  categories: readonly FoodCategory[]
}

type Paper = "A4" | "A3"

/** 용지 치수(mm). 인쇄 CSS와 생성기가 모두 이 표를 읽는다. */
const PAPERS = {
  A4: { width: 210, height: 297, scale: 1 },
  A3: { width: 297, height: 420, scale: Math.SQRT2 },
} as const satisfies Record<Paper, { width: number; height: number; scale: number }>

/** 결과 PDF는 사양·용지마다 하나다(2026-10-22, 달별 파일과 PageKey·KIND_PAGES를 지웠다).
 *  월간 달력은 표지(선택) + 12장을 한 파일에 담는다. 쪽 수는 pageCount(spec)가 계산한다. */
function pageCount(spec: PrintSpec): number

type Edition = {
  id: string                      // slug, 다운로드 경로에 쓴다
  title: string
  description: string
  spec: PrintSpec
  /** published만 매니페스트에 들어가 사용자에게 보인다. */
  status: "draft" | "published"
}

/** public/downloads/manifest.json. 생성기가 쓰고 다운로드 화면이 읽는다. 손으로 고치지 않는다. */
type DownloadManifest = {
  editions: {
    id: string
    kind: PrintSpec["kind"]
    title: string
    description: string
    /** 이 파일을 만든 사양의 해시. 어드민이 "다시 생성 필요"를 판단한다. */
    specHash: string
    generatedAt: string
    /** 경로는 public 기준. 예: /downloads/monthly-cream/a4.pdf */
    files: Record<Paper, { path: string; bytes: number }>
  }[]
}
```

용지를 사양 밖에 둔 이유: A4와 A3는 가로세로 비가 같은(1:√2) ISO 216 용지라 A3는 A4를 √2배 키운 것이다. 배치(`placements`)는 판 대비 비율로 저장되므로 두 용지에서 같은 그림이 나온다. 그래서 에디션 하나가 두 용지를 모두 내고, 관리자는 배치를 한 번만 잡는다. 방향(세로·가로)은 비율이 바뀌어 배치가 달라지므로 사양에 남긴다.

설계 규칙:

- **종류가 옵션을 정한다.** 연간 한 장에서 공휴일 이름을, 포스터에서 달력 모양을 고를 수 없다. 타입이 막고, 편집기는 `kind`에 따라 옵션 패널을 바꾼다. 쓰지 않는 옵션을 들고 다니는 평평한 객체(`calendar?`, `if (kind === …)` 흩어짐)를 만들지 않는다.
- **인쇄 컴포넌트는 종류마다 하나**(`features/print/{monthly,year-sheet,season-poster,month-poster}.tsx`)이고 `Record<kind, Component>` 표로 고른다. 공통 조각(달력 격자, 품종 그림+이름, 시트)은 `features/print/parts/`에 둔다.
- **선택지는 모두 유한한 유니언이다.** 색·크기 자유 입력은 받지 않는다(포스터 `title`만 예외). 색은 Oura 토큰, 서체는 앱이 이미 싣는 세 가지 안에서만 고른다.
- **종류마다 기본값이 있다**(`DEFAULT_SPECS: Record<kind, PrintSpec>`). 새 에디션은 종류를 고르면 그 기본값을 복사해 시작한다. 만든 뒤에는 종류를 바꾸지 않는다(바꾸려면 새 에디션).
- **`parsePrintSpec(unknown): PrintSpec | Error`가 경계다.** URL·저장소에서 읽은 값은 모두 여기를 지난다. 안쪽 코드는 검증하지 않는다.
- **`version` 필드**로 사양이 바뀔 때 옛 에디션을 옮긴다.
- 기록형의 "먹은 음식 체크"는 **빈 칸을 인쇄**하는 것으로 정한다(`memo: "eaten-check"`, 월간 달력만). 기기에 저장된 사용자 기록을 찍어 내는 PDF는 사람마다 달라 미리 만들 수 없으므로 이 스펙에서 뺀다.

### 종류별 레이아웃 메모

- **월간 달력**: 시트를 위(그림)·아래(달력)로 나눈다. 비율은 세로 55:45, 가로는 좌우 50:50. 표지는 연도를 크게(`font-number`) 쓰고 그 해 대표 품종 몇 개를 얹는다.
- **연간 한 장**: 달 하나 = 그림 칸 + 달력 칸 한 쌍. `4x3`(A4 세로 기본)이면 짝을 지그재그로 놓아 시안 5처럼 그림과 달력이 체크무늬가 된다. A4에서 날짜 숫자는 약 7pt로, 이보다 작아지는 조합(`2x6` 가로 등)은 파서가 거른다.
- **계절 포스터**: 네 띠를 같은 높이로 나누고, 띠마다 그 계절 품종을 두 줄로 흐르게 놓는다(`foodsInSeason`). 겨울이 12·1·2월인 규칙은 `SEASON_MONTHS`를 그대로 쓴다. 한 품종이 여러 계절에 걸치면 제철이 시작하는 계절 하나에만 놓는다.
- **월별 포스터**: 열두 칸에 `foodsInMonth`를 놓는다. 한 품종이 여러 달에 나오면 달마다 반복된다. 이것이 의도다(그 달에 무엇이 나는지 보는 표).
- 그림이 아직 없는 품종(`isDrawn`이 거짓)은 인쇄물에 넣지 않는다.

## 화면과 라우트

```
apps/web/app/
  admin/                         어드민. 개발 서버에서만 열린다(운영 빌드에서 notFound)
    layout.tsx                   noindex, 제철 셸 없음, NODE_ENV 검사
    page.tsx                     에디션 목록
    editions/[id]/page.tsx       에디션 편집기 (왼쪽 옵션, 오른쪽 미리보기)
    editions/[id]/actions.ts     저장·생성 Server Action (로컬 파일에 쓴다)
  print/page.tsx                 인쇄 전용 페이지. 어드민과 같이 개발 서버에서만. ?spec=<base64url>&paper=<A4|A3>&page=<1..12|all>
  seasonal/downloads/page.tsx    사용자 다운로드 화면. 매니페스트를 읽어 정적으로 그린다
  (public/downloads/)            다운로드 폴더. PDF와 manifest.json
apps/web/print-editions/<id>.json 에디션 사양 원본(git에 커밋)
apps/web/scripts/build-prints.mjs  에디션 → PDF·매니페스트 생성기 (어드민 버튼도 이것을 부른다)
apps/web/features/
  admin-print/                   편집기 컴포넌트, 옵션 폼
  print/                         인쇄물 종류별 컴포넌트 4개 + parts/(시트, 달력 격자, 품종 그림)
packages/seasonal/src/print/
  spec.ts, spec.test.ts          PrintSpec 유니언, PAPERS, pageCount, 종류별 기본값, 파서, 해시
```

`print`가 어드민 아래가 아니라 따로 있는 이유: 미리보기 iframe, PDF 생성기, 개발자의 브라우저가 모두 같은 주소를 연다. 사양을 URL에 담으므로 인쇄 페이지는 저장소를 읽지 않고, 같은 URL은 언제나 같은 화면이다.

### 에디션 목록 (`/admin`)

카드 한 장 = 에디션 하나. 종류 배지(월간·연간 한 장·계절 포스터·월별 포스터), 썸네일(첫 쪽 미리보기), 제목, 상태(초안·공개), "다시 생성 필요" 표시, 마지막 생성 시각. 종류로 거른다. 버튼: 새 에디션(먼저 종류를 고른다), 복제.

### 에디션 편집기 (`/admin/editions/[id]`)

```
┌ 옵션 패널 (380px) ─────────┐┌ 미리보기 ──────────────────────────────┐
│ 이름 · 설명                 ││ [1]…[12][전체]     [A4|A3] 세로 · 100%  │
│ ▸ 방향     세로/가로         ││ ┌───────────────┐                       │
│ ▸ 달력     모양 썸네일 4개   ││ │ <iframe       │  실제 용지 비율로      │
│            주 시작 · 공휴일  ││ │  /print?spec= │  축소해 보여 준다      │
│            명절 · 음력       ││ │  &page=10>    │                       │
│ ▸ 표기     달 1/1월/January  ││ └───────────────┘                       │
│            요일 · 연도       ││ [배치 편집] 그림을 끌어 옮긴다          │
│ ▸ 제철 이미지 배치·이름·개수 ││                                         │
│ ▸ 서체     제목·숫자·크기    ││                                         │
│ ▸ 배경 · 여백               ││                                         │
├────────────────────────────┤└─────────────────────────────────────────┘
│ [저장] [PDF 생성] [공개]     │  생성 상태: 26개 중 9개 완료
└────────────────────────────┘
```

위 그림은 월간 달력의 패널이다. 패널은 `kind`마다 다르고 표 하나(`KIND_SECTIONS: Record<kind, Section[]>`)가 정한다.

| 패널 칸 | 월간 | 연간 한 장 | 계절 포스터 | 월별 포스터 |
|---|---|---|---|---|
| 방향 | O | O | O | O |
| 연도·표지 | 연도, 표지 | 연도 | - | - |
| 달력(모양·주 시작·요일·공휴일) | O, 공휴일 이름·명절·음력까지 | O, 공휴일은 미노출/표시만 | - | - |
| 표기 | 달 표기 | 달 표기 + 큰 숫자 | 계절 표기, 제목 | 달 표기, 제목 |
| 칸 배열 | - | 4×3 / 3×4 / 2×6 | 네 띠 고정 | 4×3 / 3×4 / 2×6 |
| 품종 | 배치·이름·개수 | 이름·개수 | 이름·개수·카테고리 | 이름·개수·카테고리 |
| 서체·배경 | O | O | O | O |
| 여백(메모·체크 칸) | O | - | - | - |

미리보기는 결과 PDF와 같은 한 파일을 보여 준다(쪽 탭 없음). 월간 달력은 표지와 열두 달이 이어진다.

- 옵션을 바꾸면 iframe의 `spec` 쿼리만 바뀐다. 미리보기는 실제 PDF와 같은 페이지이므로 따로 맞출 일이 없다.
- 미리보기 위의 A4·A3 토글은 iframe의 `paper`만 바꾼다. A3에서 글자·선 굵기가 벽에 걸었을 때 괜찮은지 확인하는 용도다. 사양에는 저장하지 않는다.
- 달력 모양 고르기는 2a의 `CalendarStylePicker`를 그대로 쓴다.
- **배치 편집**: 미리보기에서 `DraggableScatter`를 켜고, 끌어 놓은 자리를 `spec.foods.placements[칸]`에 저장한다(칸은 달 또는 계절). MVP는 월간 달력의 `scatter` 배치에서만 켠다. 연간 한 장과 포스터는 칸이 작고 정렬된 배치라 시드 배치만 쓴다. 2a 사용자 배치(`scatter-store`, `merge-saved`)와 같은 `SavedSpot` 모양이다. "시드로 되돌리기"는 그 달 항목을 지운다.
- 저장하지 않은 변경이 있으면 생성 버튼을 막는다.

### 생성과 올리기

관리자의 컴퓨터에서 개발 서버(`pnpm dev`)를 띄우고 진행한다. 운영 사이트에는 어드민이 없다.

1. **저장**: 편집기의 저장 버튼이 `apps/web/print-editions/<id>.json`에 사양을 쓴다. 사양은 git에 남으므로 언제든 같은 PDF를 다시 뽑을 수 있다.
2. **PDF 생성**: 생성 버튼(또는 같은 일을 하는 `pnpm prints:build [id]`)이 Playwright Chromium으로 `/print?spec=…&paper=…`를 열고 `page.pdf({ preferCSSPageSize: true, printBackground: true })`로 저장한다. 용지마다 하나씩, 에디션마다 2개를 만든다.
3. 파일은 `apps/web/public/downloads/{editionId}/{a4|a3}.pdf`에 쓴다. 경로에 해시가 없어 다시 생성해도 사용자 링크가 그대로다. 이전 파일은 git 기록에 남는다.
4. 생성기는 끝에 `public/downloads/manifest.json`을 `status: "published"`인 에디션으로 다시 쓴다. 같은 사양이면 같은 파일과 같은 매니페스트가 나온다(멱등). `generatedAt`은 사양 해시가 바뀐 에디션만 갱신한다.
5. 생성이 끝나면 편집기에 파일 링크가 뜬다. 관리자가 PDF를 열어 보고, 괜찮으면 상태를 `published`로 바꾼 뒤 사양·PDF·매니페스트를 한 커밋으로 올린다. 배포되면 사용자 링크가 살아난다.
6. 내리기: 상태를 `draft`로 돌리고 생성기를 다시 돌리면 매니페스트에서 빠진다. PDF 파일은 남겨 둔다(이미 공유된 링크가 깨지지 않게). 지울 때는 손으로 지운다.

AGENTS.md "Generated files" 표에 `public/downloads/**`와 명령 `pnpm prints:build`를 더한다.

### 사용자 다운로드 (`/seasonal/downloads`)

매니페스트에 있는(공개된) 에디션을 종류별로 묶어 카드로 보여 준다(달력 / 포스터). 카드를 누르면 용지 선택(A4 기본 / A3, 세그먼트 컨트롤)이 나온다. 버튼은 하나다. 월간 달력은 "12개월 전체", 나머지는 "내려받기"다. 용지 옆에 "A4 · 가정용 프린터", "A3 · 벽걸이용"처럼 쓰임을 한 줄로 적는다. 고른 용지는 `seasonal:settings`에 저장해 다음 방문에도 유지한다. 목록과 링크는 `manifest.json`을 빌드 때 읽어 정적으로 그린다. 링크에는 `download` 속성과 파일 크기를 붙인다. 2a ⚙ 설정 시트에는 이 화면으로 가는 링크 한 줄만 둔다. 이 페이지는 색인 대상이다(`shared/seo/pages.ts`).

## 기술 결정

| 항목 | 결정 | 이유 |
|---|---|---|
| 렌더링 | HTML 인쇄 페이지 → 헤드리스 Chrome `page.pdf()` | 앱 컴포넌트·Oura 토큰·SVG 일러스트를 그대로 쓴다. 글자와 그림이 벡터라 A3에서도 선명하다. (이전 판 결정 유지) |
| 생성 위치 | 관리자의 컴퓨터. 개발 서버 + Playwright(`apps/web` devDependency) | 운영에 PDF 엔진이 필요 없다. Vercel 함수 크기·시간 제한, `@sparticuz/chromium` 호환 문제가 사라진다. |
| 다운로드 폴더 | `apps/web/public/downloads/`(git에 커밋, Vercel CDN이 내려준다). 링크의 앞부분은 `DOWNLOADS_BASE` 상수 하나 | 에디션 몇 개 규모면 저장소가 견딘다. PDF 한 개 크기는 아직 모른다(SVG 벡터라 작을 것으로 추측). 합계가 100MB를 넘으면 R2·Blob으로 옮기고 `DOWNLOADS_BASE`만 바꾼다. |
| 접근 제한 | `/admin`, `/print`의 layout이 `process.env.NODE_ENV === "production"`이면 `notFound()` | 어드민이 운영에 없으므로 로그인·Basic Auth·비밀번호 관리가 없다. 저장 Server Action도 같은 검사를 한다(파일을 쓰므로). |
| 색인 | `/admin`, `/print`는 `shared/seo/pages.ts`에 noindex로 등록. `/seasonal/downloads`는 색인 대상. PDF는 `robots.ts`에서 막지 않는다 | 가드 테스트가 등록을 강제한다. 운영에서 404인 경로라 sitemap에 넣지 않는다. |
| 사양 전달 | `?spec=`에 JSON을 base64url로. 인쇄 페이지는 `<Suspense>` 안에서 `searchParams`를 읽고 `parsePrintSpec` 실패 시 `notFound()` | 저장 전 상태도 미리 볼 수 있다. 정적 프리렌더 대상이 아니다. |
| 서체 | Pretendard, Gowun Batang(둘 다 OFL, PDF 포함 허용) | 숫자용 display 서체는 PDF 포함 라이선스를 확인하기 전까지 `type.number`의 선택지에서 뺀다. |

## 인쇄 CSS

인쇄 페이지는 화면 CSS를 줄여 쓰는 것이 아니라 **용지가 기준인 페이지**다. 크기는 모두 mm 기반 단위로 정하고, px·vw·화면 브레이크포인트는 쓰지 않는다.

### 용지와 페이지 박스

`@page`는 용지마다 달라야 하는데 CSS 변수로 바꿀 수 없다. 그래서 용지×방향마다 이름 붙은 페이지(named page) 네 개를 두고, 시트의 `data-paper`·`data-orientation`으로 고른다.

```css
@page a4-portrait  { size: A4 portrait;  margin: 0; }
@page a4-landscape { size: A4 landscape; margin: 0; }
@page a3-portrait  { size: A3 portrait;  margin: 0; }
@page a3-landscape { size: A3 landscape; margin: 0; }

.print-sheet[data-paper="A4"][data-orientation="portrait"] { page: a4-portrait; }
/* 나머지 세 조합도 같은 모양 */

.print-sheet {
  width: var(--sheet-w);            /* 210mm 또는 297mm, 방향에 따라 맞바꿈 */
  height: var(--sheet-h);
  overflow: hidden;                 /* 한 달이 두 장으로 넘치지 않게 */
  break-after: page;
  print-color-adjust: exact;        /* 크림 배경·계절색·공휴일 빨강 유지 */
  -webkit-print-color-adjust: exact;
}
.print-sheet:last-child { break-after: auto; }   /* 끝에 빈 장이 붙지 않게 */
```

- `margin: 0`으로 두고 여백은 페이지 박스 안의 패딩으로 그린다. 배경색이 용지 끝까지 깔리고, 브라우저가 머리글·바닥글(날짜, URL)을 넣을 자리가 없어진다.
- `--sheet-w`, `--sheet-h`는 `PAPERS` 표에서 서버가 인라인 스타일로 넣는다. 치수의 출처는 그 표 하나다.

### 크기 단위

```css
.print-sheet[data-paper="A4"] { --u: 1mm; }
.print-sheet[data-paper="A3"] { --u: calc(1mm * 1.41421); }
```

글자, 선 굵기, 칸 높이, 그림 크기, 패딩은 모두 `calc(var(--u) * n)`으로 쓴다. A4에서 맞춘 디자인이 A3에서 그대로 √2배 커지므로 용지별 CSS 분기가 생기지 않는다. 기준 크기 예: 달 제목 `calc(var(--u) * 14)`(A4 약 40pt), 날짜 숫자 `calc(var(--u) * 4.2)`(약 12pt), 공휴일 이름 `calc(var(--u) * 2.3)`(약 6.5pt, 최소 가독 크기).

예외 둘. 둘 다 용지와 상관없이 고정 mm다.

- **안전 여백**: 가정용 프린터는 가장자리 3~5mm를 못 찍는다. 글자와 달력 선은 바깥 여백 `max(8mm, calc(var(--u) * 10))` 안에만 둔다. 배경색만 끝까지 간다.
- **머리카락 선**: 0.25mm 아래 선은 인쇄에서 사라진다. 달력 선은 `max(0.25mm, calc(var(--u) * 0.2))`.

### 화면에서 볼 때(미리보기)

인쇄 페이지는 브라우저 화면에서도 같은 크기의 용지 박스를 그린다. `@media screen`에서만 회색 배경 위에 용지를 띄우고 그림자를 준다. 편집기 iframe은 `transform: scale()`로 용지 박스를 칸 폭에 맞춰 줄인다. 페이지 안의 레이아웃은 화면 폭에 반응하지 않는다.

```css
@media screen {
  body { background: var(--color-stone); }
  .print-sheet { margin: 24px auto; box-shadow: 0 1px 8px rgb(0 0 0 / .15); }
}
@media print {
  body { background: none; }
  .print-sheet { margin: 0; box-shadow: none; }
}
```

이렇게 해 두면 관리자나 개발자가 브라우저에서 `/print`를 열고 Ctrl+P를 눌러도 인쇄 대화상자의 용지와 방향이 사양대로 잡힌다.

### 그 밖의 인쇄 규칙

1. 생성기는 `page.pdf({ preferCSSPageSize: true, printBackground: true })`. 용지 크기를 옵션으로 넘기지 않는다(넘기면 `@page`와 두 군데서 정하게 된다).
2. `document.fonts.ready`와 모든 그림(`img.decode()`)을 기다린 뒤 저장한다. 서체는 PDF에 포함된다.
3. 애니메이션과 전환을 모두 끈다(`*, *::before, *::after { animation: none !important; transition: none !important; }`). 배치는 시드 고정 또는 저장된 자리라 매번 같다.
4. 오늘 표시(`isToday`), 공유·설정 버튼, 내비게이션 같은 화면 전용 요소는 인쇄 페이지에 그리지 않는다. 인쇄 컴포넌트는 `features/print/`에 따로 두고, 2a 화면 컴포넌트를 `@media print`로 숨겨 재활용하지 않는다.
5. 월간 달력의 `all`은 표지(켰을 때)와 `.print-sheet` 12장이 이어진 한 문서다. 나머지 종류는 시트 한 장이다.
6. 그림은 SVG 그대로 넣어 A3에서도 벡터로 남게 한다. 래스터로 바꾸지 않는다.

### 확인 방법

- `spec.test.ts`에서 `PAPERS`의 A3 치수가 A4 × √2와 1mm 안으로 맞는지 확인한다.
- 생성된 PDF를 `pdfinfo`로 열어 쪽 크기(A4 595×842pt, A3 842×1191pt)와 쪽 수(`pageCount`, 월간 달력은 표지 여부 포함)를 확인하는 스크립트를 생성 단계 끝에 둔다. 다르면 생성기가 실패하고 매니페스트를 쓰지 않는다.
- A4·A3 PDF를 각각 실제 프린터로 한 장씩 뽑아 안전 여백 안에서 글자가 잘리지 않는지 본다(착수 순서 3에서 한 번).

## 먼저 할 일 (착수 순서)

1. `print/spec.ts`: 타입, 기본값, 파서, 해시. 테스트 먼저.
2. `/print` 인쇄 페이지와 인쇄 CSS: 월간 달력 기본 사양으로 A4 세로 한 달을 만들고, `paper=A3`에서 √2배로 나오는지 확인한다.
3. `scripts/build-prints.mjs`: 에디션 JSON 하나 → PDF·매니페스트. 여기서 PDF 한 개 크기를 처음 재고, 다운로드 폴더를 git에 둘지 다시 판단한다.
4. 나머지 세 종류 인쇄 컴포넌트: 연간 한 장 → 계절 포스터 → 월별 포스터 순서. 연간 한 장은 A4에서 날짜 7pt가 읽히는지 실제 인쇄로 먼저 본다. 종류마다 기본 사양으로만 만들고, 옵션은 그다음에 붙인다.
5. 개발 전용 막기(`notFound`), SEO 등록.
6. `/admin` 목록과 편집기(옵션 폼 + iframe 미리보기), 저장·생성 버튼.
7. 배치 편집(월간 달력).
8. `/seasonal/downloads`와 설정 시트 링크.

## 1차 구현에서 달라진 점과 남은 일 (2026-10-16)

구현: `packages/seasonal/src/print/`(spec·edition·foods), `apps/web/features/print/`, `apps/web/features/admin-print/`, `/print`, `/admin`, `/seasonal/downloads`. 실제 사양 타입은 `print/spec.ts`가 기준이다. 위 "데이터 모양"은 설계 당시의 안이다.

달라진 점:

- `pnpm prints:build` 명령은 만들지 않았다. 생성기(`features/admin-print/generate.ts`)는 Next 안의 TypeScript라 어드민 "PDF 생성" 버튼(Server Action)으로만 돈다. 저장소에 TS를 바로 돌릴 도구(tsx)가 없다.
- 품종 이름의 `korean-english`는 뺐다. 품종 데이터에 영어 이름이 없다.
- `foods.seed`는 뺐다. 흩뿌림 배치는 달·품종·판 크기로 정해진다(화면 2a와 같다).
- 월간 달력의 `foodLayout`은 `scatter | grid | none`이다(`hero`, `strip` 없음).
- 연간 한 장은 달력 모양(`variant`)을 고르지 않는다. 칸이 작아 plain만 쓴다.
- 숫자 display 서체는 라이선스 확인 전이라 고를 수 없다.
- 그림이 없는 품종은 인쇄물에 넣지 않는다.
- 에디션 id는 관리자가 적지 않는다. `nextEditionId`가 "종류-번호"(`monthly-3`)로 붙이고, 관리자는 종류와 이름만 고른다.
- 모든 종류에 `margin: "safe" | "none"`이 있다. none은 여백 없이 용지 끝까지 채운다(집 프린터는 가장자리가 잘릴 수 있다). 이 값이 없는 예전 에디션은 safe로 읽는다.
- 어드민 화면은 cojeev 컴포넌트(article-headings 목록, card, field, input, native-select, number-input, toggle-group, tabs, switch, badge, kbd, empty, skeleton)로 짰다.

남은 일:

1. **용량.** (2026-10-16 결정: PDF는 커밋하지 않는다. `apps/web/public/downloads/**/*.pdf`를 `.gitignore`에 넣었다. 저장 위치를 정할 때까지 에디션을 공개하지 않는다.) 처음 잰 값: 월간 에디션 하나(PDF 26개)가 34MB, A4 12개월 묶음 6.6MB, A3 묶음 11.8MB. A3가 A4보다 큰 것은 일러스트 SVG의 필터 효과가 래스터로 들어가기 때문으로 추정한다(확인 전). 포스터·연간 한 장은 한 파일 0.6~2.2MB. 월간 에디션 서너 개면 "100MB 넘으면 스토리지로" 기준에 닿는다. 다운로드 폴더를 git에 둘지 R2·Blob으로 옮길지 정해야 한다.
2. 배치 끌어 옮기기(`placements`, 월간 달력).
3. 월간 달력의 명절(공휴일이 아닌 것)·음력 표시.
4. 실제 프린터로 A4·A3 한 장씩 뽑아 안전 여백과 연간 한 장의 작은 글자 확인.

## 정해야 할 것

1. **PNG**를 계속 낼지. 지금 안은 PDF만이다.
2. 연도가 바뀔 때: 에디션을 복제해 `year`만 바꾸는 방식으로 충분한지.
3. 숫자 display 서체의 PDF 포함 라이선스.
4. 계절 포스터에서 여러 계절에 걸친 품종을 시작 계절 하나에만 둘지, 걸친 계절마다 둘지. 지금 안은 시작 계절 하나다.
5. MVP 이후 종류 후보: 명절 포스터(1g 데이터), 24절기. 지금은 넣지 않는다.
