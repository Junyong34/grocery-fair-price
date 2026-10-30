# 달력 PDF 어드민 · 다운로드 스펙

Status: ready-for-agent (1차 구현 2026-10-16, 남은 일은 아래 "1차 구현에서 달라진 점과 남은 일", 구성 늘리기는 "구성(layout) 늘리기")
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
    max: number                           // 칸 하나(달·계절)에 넣을 품종 수 상한(1~40). 폼 상한: 월간 40(흩뿌림·줄 맞춤·M-E 모두 그림끼리 겹치지 않음, 2026-10-23 측정), 계절 30, 월별 12, 연간 8
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
  monthLabel: PrintMonthLabel             // 아래 "달 표기"
  monthStyle: MonthStyle
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
  monthLabel: PrintMonthLabel | "big-number"   // big-number: 시안 5처럼 그림 위에 크게 쓴 숫자(monthStyle은 색만 따른다)
  monthStyle: MonthStyle
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
  monthLabel: PrintMonthLabel
  monthStyle: MonthStyle
  grid: "4x3" | "3x4" | "2x6"
  categories: readonly FoodCategory[]
}

// ── 달 표기(packages/seasonal/src/print/month-label.ts, 2026-10-23) ──
// 표기(글자) × 색 × 크기 × 장식. 화면(2a)은 data/months.ts의 세 가지(number·korean·english)만 쓴다.
type PrintMonthLabel =
  | "number" | "two-digit"                          // 1 / 01
  | "korean"                                        // 1월
  | "english-short" | "english-short-caps"          // Jan / JAN
  | "english-full" | "english-full-caps"            // January / JANUARY. 좁은 자리(막대표 머리·원형 판)는 세 글자
  | "number-english" | "korean-english"            // 1 + JANUARY / 1월 + JAN. 좁은 자리는 큰 글자만
  // 예전 값 english는 english-full로 읽는다
type MonthStyle = {
  palette: "season" | "flow" | "twelve" | "vivid"   // 계절색 / 계절색 사이를 섞은 열두 달 흐름 / 차분한 열두 색 / 채도 높은 열두 색. 바탕까지 칠하는 건 surface: "season"
  size: "small" | "medium" | "large"                // 0.7·1·1.4배. 월간 머리 높이가 20·26·34mm로 따라 바뀐다
  frame: "none" | "rule" | "pill" | "ribbon" | "outline"   // 글자만 / 밑줄 / 알약 태그 / 책갈피 리본 / 외곽선 숫자 + 아래 영문
  font: "auto" | "gowun-batang" | "pretendard"      // auto: type의 서체를 따름(숫자는 type.number, 1월·January는 type.heading, 대문자는 프리텐다드). 고르면 큰 글자·곁들이는 영문 모두 그 서체
}   // 없던 예전 사양은 season·medium·none·auto(지금까지의 모양). font만 없으면 auto
// 표기는 놓일 자리 높이·폭을 넘지 않게 줄어든다. 곁들이는 영문이 A4 약 5pt보다 작아지는 자리(포스터 칸·연간 달력 머리)에서는 아래 줄 대신 옆에 붙인다.
// ribbon은 네 글자 넘는 이름을 숫자로 바꾸고 이름을 아래로, outline은 숫자만 크게 쓰고("11월"의 "월"을 뗀다) 이름을 아래로 내린다.
// 막대표 머리·원형 판 표기는 글자(표기)만 따르고, 원형 판은 색도 따른다. 장식·크기는 쓰지 않는다.

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
- 그림이 아직 없는 품종(`isDrawn`이 거짓)은 인쇄물에 넣지 않는다. 예외는 이름만 적는 체크 목록이다(월별 포스터 P-D, 월간 `memo: "eaten-check"`). 글자라 빈 원이 생기지 않는다.
- **계절 포스터 사분면(S-B, `quarters`)**: 세로 용지는 2×2, 가로 용지는 네 열. 칸마다 테를 두르고, 그림 있는 품종만 넣는다(와이어프레임 초안의 "그림 없는 품종 이름 목록"은 넣지 않음).
- **월별 포스터 한 줄에 한 달(P-D, `rows-check`)**: 세로 용지만(가로는 줄이 약 14mm라 파서가 거른다). 줄마다 달 표기, 그림 최대 6개(`foods.max`와 6 중 작은 값. 더 많으면 두 줄로 접혀 작아진다), 그 달 품종 전체의 체크 목록 4열. 목록 글자는 가장 많은 달(11월 20개)에 맞춰 열두 줄이 같은 크기다(A4 약 7pt).
- **월간 달력 옆 체크 목록(M-B, `side-check`)**: 세로 용지만. 위 그림은 M-A 흩뿌림과 같고, 달력 오른쪽 52mm에 "이달의 제철" 체크 목록(그 달 품종 전체, 한 줄에 하나). 글자는 달 높이에 맞춰 최대 3.2mm(A4 약 9pt). `memo`는 쓰지 않는다.
- **연간 큰 그림 위(Y-B, `hero-top`)**: 세로 용지만. 위 84mm에 1년치 품종을 달마다 하나(`yearFoods`, 열둘) 흩뿌리고, 아래 달력은 3×4 고정(`grid`·`foods.max`는 쓰지 않는다). `monthLabel: "big-number"`는 달력 위 숫자로 쓴다. A4 날짜 약 8.4pt.
- **월간 쓰는 달력(M-D, `strip`)**: 두 방향 모두. 그림 띠 14개(세로는 위 44mm 두 줄, 가로는 왼쪽 48mm 두 열)에 그 달 그림 있는 품종을 먼저 채우고, 남은 것을 1일 앞·말일 뒤 빈 날짜 칸에 하나씩 넣는다(`stripFoods`). 2027년 모든 달·주 시작에서 다 들어간다(테스트). 달력은 격자 고정, 날짜는 칸 왼쪽 위. `calendar.variant`·`memo`·`foods.max`는 쓰지 않는다. 가로 띠를 12개로 하면 11월(19개)이 넘쳐 14개로 했다.
- **월간 그림 판 전체(M-E, `allover`)**: 두 방향 모두. 세로는 머리 아래 판 전체에 흩뿌리고 오른쪽 아래 100×88mm 블록에 한 달 달력을 얹는다(흩뿌림의 `avoid` 사각형으로 블록과 그 둘레 6mm를 비운다). 블록 날짜는 4.6mm(A4 약 13pt) × 달력 글자 배율이되, 6주짜리 달의 공휴일 이름 줄이 칸을 넘지 않게 상한을 둔다. 가로는 왼쪽에 그림, 오른쪽 34mm에 날짜 한 열(1일~말일 한 줄씩, 줄 높이 31일 기준 6mm, 날짜 A4 약 10.8pt·요일 7.5pt·공휴일 이름 6.5pt, 일요일 위 굵은 선). `memo`는 쓰지 않고, 가로는 `calendar.variant`·`calendar.weekStart`도 쓰지 않는다.
- **계절마다 한 장(S-D, `per-season`)**: 두 방향 모두. 계절 하나에 한 쪽, PDF 4쪽(`pageCount` 4, 생성기가 쪽 수를 검사한다). 머리에 큰 계절 이름(영문 표기를 켜면 위에 작게)과 오른쪽에 그 계절 달, 계절색 줄, 판 전체에 그 계절 품종(줄 맞춤), 발에 제목과 쪽 번호. 그림 있는 품종이 겨울 10 ~ 가을 26개로 차이가 커서 그림 크기는 장마다 판에 맞추고, 품종이 적은 계절은 줄 사이를 넓혀 판 높이를 채운다. 바탕 `season`은 장마다 그 계절색. 숨는 옵션은 없다(`foods.max`는 한 장마다, 최대 30).
- **월간 표지 열두 달 미리보기(C-2, `cover: "months"`)**: 두 방향 모두(세로 3×4, 가로 4×3). 위에 "제철 달력"과 연도, 아래 달 칸마다 그 달 대표 품종 둘과 달 표기(`monthLabel`). 대표 품종은 C-1과 같은 규칙(`yearFoods`: 앞 달에 나오지 않은 품종을 그 달 특별한 것부터)을 달마다 묶은 `yearFoodsByMonth`로 고른다. 달마다 둘이면 빈 달이 없다(테스트). 칸 바탕은 달의 계절색, 이름은 넣지 않는다. 표지 한 쪽이라 `pageCount`는 그대로다.
- **제철 막대표 부품**: 줄 배치는 `@workspace/seasonal/print/period-chart`(`chartFoods`·`chartLines`·`chartColumns`·`seasonRuns`), 그리기는 `features/print/parts/period-chart.tsx`(한 단). 줄 = 카테고리 머리 줄(채소·과일·수산·곡물·견과) + 품종 줄(제철 시작 달 순, 같으면 이름순), 품종 줄 앞에 작은 그림, 막대 색은 제철이 시작하는 계절색. 12월→1월로 넘는 제철은 막대 둘. 여러 단이면 묶음 중간에서 시작하는 단에 머리 줄을 다시 둔다. 이름 글자는 줄 높이 × 0.55, 상한 3.2(A4 약 9pt). 와이어프레임 `periodChart`는 가짜 막대를 그리는 도형이라 계산을 나눠 쓰지 않는다.
- **월별 포스터 막대표(P-B, `chart`)**: 두 방향 모두. 그림 있는 품종(카테고리로 줄일 수 있다) 전부, 세로 2단·가로 3단(줄이 24개 이하면 한 단, 줄 높이 상한 9mm). A4 이름 약 9pt, 달 머리 한글 약 6pt·영문 약 5.5pt(달 열 폭 약 5mm). `grid`·`foods.names`(늘 적음)·`foods.max`(전부 싣는다)는 쓰지 않는다.
- **제철 막대표 여러 단**: `PeriodChartColumns`(`features/print/parts/period-chart.tsx`)가 줄을 단으로 나누고(`chartColumns`), 가장 긴 단과 달 머리 줄이 높이에 들도록 줄 높이를 정한다(상한 9mm). 단마다 이름 칸 폭이 같다. P-B·Y-C·C-3이 같이 쓴다.
- **연간 열두 달 달력 + 막대표(Y-C, `chart`)**: 두 방향 모두. 위에 작은 달력 열둘(세로 4×3, 가로 6×2, 칸 높이 36·35mm, 칸 폭 약 44mm), 아래에 막대표(세로 2단, 가로 3단). 막대표 품종은 달마다 대표 넷(`yearFoods`, 48개). 67개를 다 넣으면 세로 줄이 약 3.7mm(이름 약 6pt)라 줄였다. A4 날짜 세로 약 7.5pt·가로 약 7.2pt, 이름 약 7.6·7.4pt, 달 머리 약 6.3pt. 그림 칸이 없어 `monthLabel: "big-number"`는 숫자로 그리고 선택지에서 뺀다(짝 체크무늬에서만 보인다). `grid`·`foods.max`·`foods.names`(늘 적음)는 쓰지 않는다.
- **월간 표지 1년 제철 표(C-3, `cover: "chart"`)**: 두 방향 모두. C-2와 같은 머리(왼쪽 "제철 달력", 오른쪽 큰 연도, 40mm) 아래 달마다 대표 여섯(`chartFoods`, 많아야 72개)의 막대표, 세로 2단·가로 3단. 월간에는 카테고리 옵션이 없고 표지는 1년 전체를 보여 주는 쪽이라 줄이지 않는다. A4 이름 약 9pt(상한), 달 머리 약 7.7pt(영문 약 5.6pt). 표지 한 쪽이라 `pageCount`는 그대로다.
- **원형 판 부품**: 자리 계산은 `@workspace/seasonal/print/wheel`의 `wheelLayout({ diameter, sectors, counts })`, 그리기는 `features/print/parts/wheel.tsx`(SVG 부채꼴 + 그림·표기). 12시 방향부터 시계 방향, 가운데 빈 원(반지름 0.3)과 바깥 표기 띠(0.11) 사이 고리에 그림을 놓는다. 부채꼴마다 고리 줄 수·줄마다 개수를 그림이 가장 커지게 고르고, 모든 그림 크기는 가장 빽빽한 부채꼴에 맞춘다. 그림이 부채꼴 밖으로 나가지 않고 서로 겹치지 않음을 테스트한다.
- **월별 포스터 원형 판(P-C, `wheel`)**: 두 방향 모두(세로는 판 폭, 가로는 판 높이가 지름, 가운데 정렬). 조각마다 그 달 품종 최대 넷(`foods.max`와 4 중 작은 값), 이름은 넣지 않는다. 달 표기는 바깥 띠에 A4 약 12pt, 가운데에 "열두 달 / 제철 음식". 바탕 `season`이면 조각마다 계절색. `grid`·`foods.names`는 쓰지 않는다.
- **계절 포스터 사계절 원형 판(S-C, `wheel`)**: 두 방향 모두(지름은 P-C와 같다). 부채꼴 넷에 그 계절 품종(`foods.max`), 이름은 넣지 않는다(`foods.names` 숨김). 계절 이름은 바깥 띠 대신 원을 감싼 정사각형 모서리에 A4 약 23pt(봄 오른쪽 위부터 시계 방향). 90° 부채꼴의 띠에 가로 글자를 쓰면 원 밖으로 삐져나오기 때문이고, 그래서 띠는 0.02로 줄였다. 가운데에 "사계절 / 제철 음식". 바탕 `season`이면 부채꼴마다 계절색.
- **세로 전용 구성**은 `spec.ts`의 `PORTRAIT_ONLY` 표 하나에 모은다(M-B, Y-B, P-D).
- **달력 글자 크기(`calendar.size`)**: small 0.85 / medium 1 / large 1.2배, `type.scale`과 곱한다. 연간 한 장은 키워도 날짜 인쇄 크기가 칸 폭의 절반을 넘지 않는다(두 자리 날짜가 붙지 않게).

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

구성(`layout`)과 월간 표지(`cover`) 선택은 이름 목록이 아니라 와이어프레임 썸네일 칸이다(`editor/wireframe-choice.tsx`, 2026-10-23). 선택지마다 와이어프레임 안 코드를 두고(`option-fields.ts`), 썸네일은 지금 용지 방향으로 그린다. 아직 안 되는 안은 "준비 중"으로 보이고 고를 수 없다. 선택지가 사양의 구성 값(`LAYOUTS`·`MONTHLY_COVERS`)과 `available` 안을 모두 덮는지 테스트한다.

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
5. 생성이 끝나면 편집기에 파일 링크가 뜬다. 관리자가 PDF를 열어 보고, 괜찮으면 상태를 `published`로 바꿔 저장한다. 저장이 공개 용지(A4) PDF를 비공개 R2(`downloads/<id>/a4.pdf`, ADR 0003)에 올린 뒤 매니페스트에 넣는다. 지금 옵션으로 만든 PDF가 없거나 R2 쓰기 키가 없으면 저장이 막히고 이유가 뜬다. 사양 · 매니페스트 · 썸네일을 커밋해 배포하면 목록에 보인다(PDF는 git에 넣지 않는다).
6. 공개 중에 옵션을 바꾸면 저장만 하고, PDF를 다시 만들 때 같은 키에 덮어쓴다.
7. 내리기: 상태를 `withdrawn`(또는 `draft`)으로 저장하면 매니페스트에서 뺀 뒤 R2 객체를 지운다. 옛 링크는 에디션 상세로 302해 새 에디션을 안내한다. 공개 중인 에디션을 삭제해도 R2 객체를 지운다. 2026-10-30 calendar-download 03에서 바꿨다.

AGENTS.md "Generated files" 표에 `public/downloads/**`와 명령 `pnpm prints:build`를 더한다.

### 사용자 다운로드 (`/seasonal/downloads`)

매니페스트에 있는(공개된) 에디션을 종류별로 묶어 카드로 보여 준다(달력 / 포스터). 카드를 누르면 용지 선택(A4 기본 / A3, 세그먼트 컨트롤)이 나온다. 버튼은 하나다. 월간 달력은 "12개월 전체", 나머지는 "내려받기"다. 용지 옆에 "A4 · 가정용 프린터", "A3 · 벽걸이용"처럼 쓰임을 한 줄로 적는다. 고른 용지는 `seasonal:settings`에 저장해 다음 방문에도 유지한다. 목록과 링크는 `manifest.json`을 빌드 때 읽어 정적으로 그린다. 링크에는 `download` 속성과 파일 크기를 붙인다. 2a ⚙ 설정 시트에는 이 화면으로 가는 링크 한 줄만 둔다. 이 페이지는 색인 대상이다(`shared/seo/pages.ts`).

## 기술 결정

| 항목 | 결정 | 이유 |
|---|---|---|
| 렌더링 | HTML 인쇄 페이지 → 헤드리스 Chrome `page.pdf()` | 앱 컴포넌트·Oura 토큰·SVG 일러스트를 그대로 쓴다. 글자와 그림이 벡터라 A3에서도 선명하다. (이전 판 결정 유지) |
| 생성 위치 | 관리자의 컴퓨터. 개발 서버 + Playwright(`apps/web` devDependency) | 운영에 PDF 엔진이 필요 없다. Vercel 함수 크기·시간 제한, `@sparticuz/chromium` 호환 문제가 사라진다. |
| 다운로드 폴더 | `apps/web/public/downloads/`(git에 커밋, Vercel CDN이 내려준다). 링크의 앞부분은 `DOWNLOADS_BASE` 상수 하나 | 에디션 몇 개 규모면 저장소가 견딘다. PDF 한 개 크기는 아직 모른다(SVG 벡터라 작을 것으로 추측). 합계가 100MB를 넘으면 R2·Blob으로 옮기고 `DOWNLOADS_BASE`만 바꾼다. (2026-10-23: PDF는 커밋하지 않기로 했다. 2026-10-29: 저장소는 Supabase가 아니라 비공개 Cloudflare R2, 사용자 쪽은 `.scratch/calendar-download/spec.md`와 ADR 0003이 기준이다) |
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

`--u`(용지 단위)는 A4에서 1mm, A3에서 √2mm다. `Sheet`가 `PAPERS`의 `scale`로 인라인 스타일에 넣는다(CSS에 배율을 따로 적지 않는다).

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
- 월간 달력의 `foodLayout`은 `scatter | grid | none`이다(`hero`, `strip` 없음). 2026-10-22부터 이름이 `layout`이고, `cover`는 `"none" | "year"` 값 목록이다("구성(layout) 늘리기").
- 연간 한 장은 달력 모양(`variant`)을 고르지 않는다. 칸이 작아 plain만 쓴다.
- 숫자 display 서체는 라이선스 확인 전이라 고를 수 없다.
- 그림이 없는 품종은 인쇄물에 넣지 않는다.
- 에디션 id는 관리자가 적지 않는다. `nextEditionId`가 "종류-번호"(`monthly-3`)로 붙이고, 관리자는 종류와 이름만 고른다.
- 모든 종류에 `margin: "safe" | "none"`이 있다. none은 여백 없이 용지 끝까지 채운다(집 프린터는 가장자리가 잘릴 수 있다). 이 값이 없는 예전 에디션은 safe로 읽는다.
- 어드민 화면은 cojeev 컴포넌트(article-headings 목록, card, field, input, native-select, number-input, toggle-group, tabs, switch, badge, kbd, empty, skeleton)로 짰다.

남은 일:

1. **용량.** (2026-10-16 결정: PDF는 커밋하지 않는다. `apps/web/public/downloads/**/*.pdf`를 `.gitignore`에 넣었다. 저장 위치를 정할 때까지 에디션을 공개하지 않는다.) 처음 잰 값: 월간 에디션 하나(PDF 26개)가 34MB, A4 12개월 묶음 6.6MB, A3 묶음 11.8MB. A3가 A4보다 큰 것은 일러스트 SVG의 필터 효과가 래스터로 들어가기 때문으로 추정한다(확인 전). 포스터·연간 한 장은 한 파일 0.6~2.2MB. 월간 에디션 서너 개면 "100MB 넘으면 스토리지로" 기준에 닿는다. 2026-10-23 결정: PDF는 Supabase Storage에 올리고 사용자는 거기서 내려받는다(가격 DB와 같은 Supabase 프로젝트). 올리는 방법과 버킷·경로, `DOWNLOADS_BASE`를 바꾸는 일은 아직 하지 않았다. 그때까지 에디션을 공개하지 않는다.
2. 배치 끌어 옮기기(`placements`, 월간 달력).
3. 월간 달력의 명절(공휴일이 아닌 것)·음력 표시.
4. 실제 프린터로 A4·A3 한 장씩 뽑아 안전 여백과 연간 한 장의 작은 글자 확인.

## 구성(layout) 늘리기 (2026-10-22 결정)

와이어프레임 안(`/admin/wireframes`, 근거는 `research/market.md`)을 실제 인쇄물로 만든다. 안 목록 원본은 `apps/web/features/admin-print/lib/wireframe-catalog.ts`다. M-C(이달의 대표 품종)와 Y-D(달마다 이름 목록)는 폐기했다.

### 결정

- **종류마다 `layout` 하나.** 값 하나가 와이어프레임 안 하나다. 안 안에서 용지 방향에 따라 갈리는 모양(M-E 모서리 블록/가장자리 열, S-B 사분면/네 열)은 하위 옵션을 두지 않고 `orientation`으로 정한다. 그래서 말이 안 되는 조합이 생기지 않고, 옵션 패널 썸네일이 값과 1:1로 맞는다.
- 어느 안에서나 조합되는 값(서체, 배경, 여백, 품종 이름·개수, 공휴일, 요일 표기)은 지금처럼 따로 둔다.
- **일부 안에서만 뜻이 있는 옵션**(`grid`, `memo`, `monthLabel: "big-number"` 등)은 사양에 그대로 둔다. 해당하지 않는 안을 고르면 옵션 패널에서 숨기고 인쇄할 때 무시한다. 파서는 거부하지 않는다(안을 바꿔 봐도 값이 지워지지 않는다).
- 고르는 순서: 종류 → 구성(썸네일) → 세부 조정. 사용자 다운로드 화면은 바뀌지 않는다.

### 값

| 종류 | 필드 | 값 → 안 | 지금 있는 값 |
|---|---|---|---|
| 월간 | `layout` | `scatter`·`grid`·`none` → M-A, `side-check` → M-B, `strip` → M-D, `allover` → M-E | `scatter`·`grid`·`none`(`foodLayout`) |
| 월간 표지 | `cover` | `none`, `year` → C-1, `months` → C-2, `chart` → C-3 | `true`·`false` |
| 연간 한 장 | `layout` | `pairs` → Y-A, `hero-top` → Y-B, `chart` → Y-C | `pairs`(필드 없음) |
| 계절 포스터 | `layout` | `bands` → S-A, `quarters` → S-B, `wheel` → S-C, `per-season` → S-D | `bands`(필드 없음) |
| 월별 포스터 | `layout` | `cells` → P-A, `chart` → P-B, `wheel` → P-C, `rows-check` → P-D | `cells`(필드 없음) |

값은 티켓마다 하나씩 사양에 더한다. 사양에 없는 값을 미리 넣지 않는다.

### 예전 에디션 호환

`version`은 1 그대로 두고, 파서가 읽을 때 옮긴다. 저장된 JSON은 고치지 않는다. 다음 저장 때 새 모양으로 써진다.

- 월간: `foodLayout`이 있고 `layout`이 없으면 `layout`으로 옮긴다. `cover: true`는 `"year"`, `false`는 `"none"`으로 읽는다.
- 연간 한 장·계절 포스터·월별 포스터: `layout`이 없으면 `pairs`·`bands`·`cells`(`margin`과 같은 `.default()`).
- 필드 이름이 바뀌어 예전 에디션의 `specHash`가 달라지므로, `edition.ts`의 생성 기록 대조(`build.specHash === specHash(spec)`)가 "다시 생성 필요"로 본다. PDF를 아직 공개하지 않았으니 다시 생성하면 된다. 해시를 예전 값에 맞추는 코드는 두지 않는다.

### 티켓 흐름

티켓 하나가 세션 하나다. 순서: `spec.ts`·`spec.test.ts` → `option-fields.ts`·`option-fields.test.ts`(선택지가 스키마와 맞는지) → `features/print/<kind>.tsx` → `wireframe-catalog.ts`에서 그 안을 `available`로. 새 부품은 A4 한 장을 실제로 인쇄해 글자 크기를 본 뒤 다음으로 간다. 티켓: `issues/01`~`16`(16은 구성과 상관없는 달력 글자 크기).

## 정해야 할 것

1. **PNG**를 계속 낼지. 지금 안은 PDF만이다.
2. 연도가 바뀔 때: 에디션을 복제해 `year`만 바꾸는 방식으로 충분한지.
3. 숫자 display 서체의 PDF 포함 라이선스.
4. 계절 포스터에서 여러 계절에 걸친 품종을 시작 계절 하나에만 둘지, 걸친 계절마다 둘지. 지금 안은 시작 계절 하나다.
5. MVP 이후 종류 후보: 명절 포스터(1g 데이터), 24절기. 지금은 넣지 않는다.

### 품종 207개로 늘린 뒤(2026-10-23)

제철 범위를 "시장에 많이 나오는 때"로 넓히고 정보누리 후보 113개·해수부 후보 15개를 올려 품종이 79 → 207개, 한 달 제철이 31~86개가 됐다(`.scratch/food-months/`). 품종마다 `peak`(넓히기 전 대표 달)와 `core`(처음부터 검증한 품종)를 두고, 인쇄물은 칸에 다 못 넣으면 대표부터 넣는다.

- 그 달 품종 차례(`monthFoods`): 그 달이 대표 달인 품종 → `core` → 제철이 짧은 품종 → 이름순. `foods.max`로 자른다.
- 계절 포스터(`seasonFoods`): 대표 달이 시작하는 계절에 놓는다(배는 시장 범위 8~10월이지만 대표 9·10월이라 가을). 많으면 그 계절 대표 달이 많은 품종부터 `foods.max`개.
- 막대표(P-B, Y-C 제외 C-3): 달마다 대표 여섯(`chartFoods`, `CHART_PER_MONTH`), 많아야 72줄. 버섯 묶음이 생겼다.
- 체크 목록(M-B, 메모 eaten-check, P-D): 그 달 대표 20개(`CHECKLIST_MAX`).
- M-D 쓰는 달력: 띠 14개는 늘 차고, 빈 칸 뒤로 넘치는 품종은 뺀다.
- 확인: P-B·P-D·C-3·M-D·M-B·S-C·Y-C A4 세로에서 용지 밖 0. M-B의 잘린 글자는 대체공휴일 이름(전부터 있던 말줄임)이다.

### 친숙도와 칸 함수(2026-10-26)

위 함수 이름(`monthFoods`·`seasonFoods`·`yearFoods`·`CHECKLIST_MAX`·`CHART_PER_MONTH`)은 이제 없다. 지금 규칙:

- 품종 친숙도 1·2·3등급(`packages/seasonal/src/data/food-familiarity.ts`). 1등급 48개는 최적 달도 적는다(대표 달 안, 1등급이 한 달에 몰리지 않게). 나머지의 최적 달은 계절 순서로 첫 대표 달.
- 차례: 대표 달 → 친숙도 → `core` → 제철이 짧은 품종 → 이름순. 계절 포스터는 그 계절 대표 달 수 → 친숙도 → ….
- 연간 한 장(Y-A·Y-B·Y-C)과 월간 표지(C-1~3)는 한 품종을 최적 달에만 놓고, 넘치면 싣지 않는다.
- 화면은 `print/foods.ts`의 칸 함수 여섯(`monthPictures`·`monthChecklist`·`stripFoods`·`yearPictures`·`chartFoods`·`seasonPictures`)에 사양만 넘긴다. 칸당 상한(체크 20, 원판 조각 4, P-D 줄 6, 띠 14, Y-B·C-1 1, C-2 2, 막대표 6, Y-C 4)은 그 파일의 `PER_CELL`에 근거와 함께 있다.

