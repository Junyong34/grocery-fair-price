---
version: alpha
name: Oura Analysis
description: An analysis of Oura's design language — a warm-paper wellness system that pairs a high-contrast Editorial serif with a quiet grotesque sans, wraps every surface in a cream-and-earth palette drawn from mustard, clay and olive, and drives conversion with a single decisive action blue against otherwise calm, photography-led layouts.

colors:
  primary: "#2a72de"
  on-primary: "#ffffff"
  stone: "#4a4741"
  on-stone: "#ffffff"
  clay: "#6b443d"
  espresso: "#39221e"
  gold: "#af751b"
  ochre: "#bc924c"
  gold-soft: "#ddaa61"
  gold-pale: "#ddbe78"
  gold-deep: "#684d07"
  forest: "#224228"
  olive: "#5c6f5d"
  sage: "#849671"
  sage-mute: "#7b886d"
  sage-pale: "#ced4b8"
  canvas: "#f7f1e8"
  surface: "#ffffff"
  surface-grey: "#ececec"
  silver: "#cccac7"
  ink-band: "#000000"
  ink-band-soft: "#19191c"
  ink: "#1c1b1a"
  ash: "#838280"
  mute: "#a8a5a0"
  on-dark: "#ffffff"
  hairline: "#e1dcd3"
  error: "#e33a22"

typography:
  display:
    fontFamily: Editorial New
    fontSize: 110px
    fontWeight: 300
    lineHeight: 1.05
    letterSpacing: 0
  display-2:
    fontFamily: Editorial New
    fontSize: 80px
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: 0
  heading-1:
    fontFamily: Editorial New
    fontSize: 68px
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: 0
  heading-2:
    fontFamily: Editorial New
    fontSize: 40px
    fontWeight: 300
    lineHeight: 1.15
    letterSpacing: 0
  heading-3:
    fontFamily: AkkuratLL
    fontSize: 40px
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: 0
  title:
    fontFamily: AkkuratLL
    fontSize: 32px
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: 0
  lead:
    fontFamily: Editorial New
    fontSize: 24px
    fontWeight: 100
    lineHeight: 1.25
    letterSpacing: 0
  body-lg:
    fontFamily: AkkuratLL
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body:
    fontFamily: AkkuratLL
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: AkkuratLL
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  button:
    fontFamily: AkkuratLL
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0
  ui:
    fontFamily: AkkuratLL
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  caption:
    fontFamily: AkkuratLL
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  eyebrow:
    fontFamily: AkkuratLL
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 1px

rounded:
  none: 0px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 24px
  xl: 40px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px

components:
  # ─── Brand-native components (extracted) ───
  nav-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.stone}"
    typography: "{typography.ui}"
    rounded: "{rounded.none}"

  announcement-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.none}"

  hero:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.display}"
    rounded: "{rounded.none}"

  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"

  button-secondary:
    backgroundColor: "{colors.stone}"
    textColor: "{colors.on-stone}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"

  button-on-dark:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.stone}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"

  button-outline:
    backgroundColor: "{colors.ink-band}"
    textColor: "{colors.on-dark}"
    borderColor: "{colors.on-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"

  button-outline-stone:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.stone}"
    borderColor: "{colors.stone}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"

  button-icon-circular:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.stone}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.full}"

  text-input:
    backgroundColor: "{colors.stone}"
    textColor: "{colors.on-stone}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"

  text-input-focused:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.error}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"

  feature-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"

  feature-card-elevated:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"

  product-card:
    backgroundColor: "{colors.surface-grey}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"

  person-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"

  stat-badge:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.stone}"
    typography: "{typography.title}"
    rounded: "{rounded.full}"

  pill-tab:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.stone}"
    borderColor: "{colors.silver}"
    typography: "{typography.ui}"
    rounded: "{rounded.full}"

  eyebrow-label:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.none}"

  news-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"

  footer:
    backgroundColor: "{colors.ink-band-soft}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"

  # ─── Examples (illustrative, kit-mirror) ───
  # (derived in Step 7.5 by scripts/derive-examples-block.mjs)

  ex-pricing-tier:
    description: "Default Pricing tier card. Re-uses feature-card chrome with brand canvas-soft surface."
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  ex-pricing-tier-featured:
    description: "Featured/highlighted tier — polarity-flipped surface (dark fill + light text in light mode, light fill + dark text in dark mode)."
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  ex-product-selector:
    description: "Color/size picker chrome — fashion / DTC variant selector."
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  ex-cart-drawer:
    description: "Shopping cart drawer — DTC / fashion brand actual cart chrome."
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    item-divider: "{colors.hairline}"
  ex-app-shell-row:
    description: "Sidebar nav row inside the App Shell example. Active state uses brand primary as the indicator."
    backgroundColor: "{colors.canvas}"
    activeIndicator: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm} {spacing.md}"
  ex-data-table-cell:
    description: "Default data-table th + td chrome. Header uses mono-caps eyebrow typography; body uses body-sm."
    headerBackground: "{colors.surface}"
    headerTypography: "{typography.eyebrow}"
    bodyTypography: "{typography.body-sm}"
    cellPadding: "{spacing.sm} {spacing.md}"
    rowBorder: "{colors.hairline}"
  ex-auth-form-card:
    description: "Sign-in / sign-up card. Re-uses feature-card chrome with text-input primitives inside."
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  ex-modal-card:
    description: "Modal dialog surface — same chrome as feature-card with elevated shadow."
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  ex-empty-state-card:
    description: "Empty-state illustration frame."
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
    captionTypography: "{typography.body}"
  ex-toast:
    description: "Toast notification surface — feature-card shape + medium shadow."
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.sm} {spacing.md}"
    typography: "{typography.body-sm}"

---


## Overview

Oura's web presence reads like a printed field journal that learned to breathe. The default surface is a warm paper cream (`{colors.canvas}` — #f7f1e8) rather than white, and everything sits on it with generous air: a light, high-contrast serif for the big statements, a calm grotesque sans for everything you actually read, and full-bleed lifestyle photography that carries most of the emotional weight. Where a typical wellness-tech site would reach for gradients and glassmorphism, Oura reaches for restraint — flat fills, hairline rules, and long vertical silences between sections.

The system runs three surface "worlds." The **cream world** (`{colors.canvas}`) is home base for marketing and editorial content. The **ink world** (`{colors.ink-band}` / `{colors.ink-band-soft}`) is a near-black stage reserved for the footer and the "In the News" band, where cream cards float like clippings on a dark table. The **silver world** (`{colors.surface-grey}` → `{colors.silver}`) is a cool, machined grey gradient used only on the product-showcase pages, where the ring is photographed like jewellery.

Color discipline is the signature move. The whole palette is earth-toned — mustard and gold (`{colors.gold}`, `{colors.ochre}`), clay and espresso (`{colors.clay}`, `{colors.espresso}`), olive and sage (`{colors.forest}`, `{colors.sage}`) — and these appear as accent bands, illustration, and score/data-visualisation, never as buttons. Buttons carry a single, deliberate exception: **action blue** (`{colors.primary}` — #2a72de), used only for the decisive conversion moments ("Explore", "Shop All Products"). The warm brand neutral `{colors.stone}` (#4a4741) does the quieter work — the wordmark, editorial pills, form fields, outlines, and links — so the blue never has to compete.

**Key Characteristics:**
- Warm-paper canvas (`{colors.canvas}`) as the default surface, not white — cream is the brand's resting state.
- A two-typeface voice: `{typography.display}` (Editorial New, a light high-contrast serif) for headlines, `{typography.body}` (AkkuratLL, a neutral grotesque) for reading.
- One decisive **action blue** (`{colors.primary}`) reserved strictly for primary CTAs; every other button is warm-neutral `{colors.stone}` or cream.
- An earth-tone accent family — mustard, clay, olive — used for bands, illustration and data-viz, deliberately kept off buttons.
- Fully-rounded pill buttons (`{rounded.full}`) against softly-rounded cards (`{rounded.lg}`) and large-radius product images (`{rounded.xl}`).
- Three surface worlds cycling in a predictable rhythm: cream editorial → black news/footer band → silver product stage.
- Photography-first hierarchy: full-bleed imagery leads, UI recedes to hairlines and quiet labels.

## 장볼날 공통 색상 조합

2026-11-04에 확인한 크림 배경 기준의 색상군이다. **크림·매트를 기본 표면으로, 포레스트·딥 골드를 강조색으로 쓴다.** 공통 색상 조합은 이 절을 따르고, 아래 Oura 분석은 원형 참고로 읽는다. 계절·명절·가격 판정처럼 의미가 정해진 색상은 해당 도메인의 토큰을 우선한다.

### 색의 원천과 이름

- 실제 값의 원천은 `packages/ui/src/styles/globals.css`다. 문서의 색상값을 화면에 직접 복사하지 않는다.
- 원색 토큰(`canvas`, `mat`, `forest`, `gold-deep` 등) 위에 조합 토큰 `--color-pair-<이름>`과 `--color-pair-<이름>-foreground`를 둔다. 앞 토큰은 배경, `foreground`는 그 배경 위의 글자·아이콘이다.
- Tailwind에서는 `bg-pair-<이름> text-pair-<이름>-foreground`를 함께 쓴다. 한 쌍의 배경만 바꾸고 이전 글자색을 남기지 않는다.
- 연한 세이지 `sage-wash`는 `sage` 22%와 `canvas`의 Oklab 혼합색이다. `gold-wash`는 `gold-pale` 30%와 `canvas`, `mat`는 `ochre` 12%와 `canvas`를 섞는다(따뜻한 모래색). 새 원색이나 고정된 혼합색 hex를 추가하지 않는다.
- 밝은 크림 `pair-light`는 `surface` 70%와 `canvas` 30%를 Oklab으로 혼합한 불투명 색이다. `transparent`와 섞은 흰색이나 `bg-surface/70`으로 대체하지 않는다. 부모가 매트·세이지여도 같은 색을 유지한다.

### 조합 토큰과 용도

아래 이름마다 배경 토큰과 `-foreground` 토큰이 실제 CSS에 정의되어 있다.

| 조합 이름 | 배경 | 글자·아이콘 | 사용 기준 |
|---|---|---|---|
| `pair-base` | `canvas` · 크림 | `ink` | 페이지와 기본 내용 면처럼 가장 넓게 쓰는 바탕 |
| `pair-light` | `surface` 70% + `canvas` 30% · 밝은 크림 | `ink` | 메인 검색창, 검색 입력창, 최근 본 품종·검색의 자주 사는 품종 알약, 달력·포스터 다운로드 진입 카드. 크림보다 살짝 밝은 탐색 표면 |
| `pair-muted` | `mat` · 모래 베이지 | `ink` | 담기 전 버튼, 보조 컨트롤, 받침, 읽기만 하는 정보 카드처럼 기본 배경에서 한 단계 구분할 표면 |
| `pair-forest` | `sage-wash` · 연한 세이지 | `forest` | 브랜드 안내나 강조 구역. 연한 바탕과 진한 초록을 함께 사용 |
| `pair-forest-strong` | `forest` | `canvas` | 포레스트 강조가 필요한 작은 버튼·표식. 한 구역의 주된 행동 하나에 한정 |
| `pair-gold` | `gold-wash` · 연한 골드 | `gold-deep` | 따뜻한 강조, 현재 위치, 주목할 안내. 보통 글씨에도 연한 골드 원색 대신 딥 골드를 사용 |
| `pair-gold-strong` | `gold-deep` | `canvas` | 짧은 강조 표식. 넓은 배경이나 여러 행동 버튼에 반복하지 않음 |
| `pair-ink` | `ink` | `canvas` | 담음·켜짐 같은 확정된 선택 상태, 또렷한 중립 강조 |
| `pair-clay` | `clay` | `canvas` | 제한적인 보조 강조. 포레스트·골드와 같은 화면에서 동등하게 경쟁시키지 않음 |

크림과 매트를 화면의 대부분에 사용하고, 연한 포레스트·골드는 필요한 구역에만 넣는다. 진한 채움은 작은 영역에 집중한다. 클레이는 기본 강조색으로 올리지 않는다.

2026-11-04 브라우저의 불투명 단색 조합을 sRGB로 환산해 확인한 글자 대비는 약 6.17:1~16.65:1이다. 가장 낮은 조합은 `pair-gold`, 가장 높은 조합은 `pair-light`이며, 9쌍 모두 일반 글씨 기준 4.5:1 이상이다. 각 조합의 불투명도나 글자색을 바꾸면 다시 확인한다.

`pair-light`는 기본 바탕에서 탐색 대상을 구분하는 밝기 차이다. 별도의 깊이 단계나 선택 상태를 뜻하지 않는다. 입력창은 기본·hover·focus에서 같은 밝은 크림을 유지하고, focus 테두리·링은 기존 UI 컴포넌트의 표현을 사용한다. 입력한 글자는 `pair-light-foreground`, 메인의 검색 예시·placeholder는 기존 보조 글자색을 유지한다.

### 깊이와 중첩 표면의 기준

**기본 구조는 크림·매트로 만들고, 한 묶음 안의 브랜드 강조는 포레스트나 골드 중 한 계열로 이어 간다.** 깊이가 늘어났다는 이유로 크림 → 베이지 → 세이지 → 골드처럼 색 계열을 순서대로 바꾸지 않는다. 서로 다른 색은 깊이보다 서로 다른 구역·상태로 읽히기 쉽다.

아래 L0~L3는 내용 구조를 설명하는 단계이며 CSS `z-index`가 아니다. 모든 단계를 별도 카드로 감싸지 않고, 실제 구분이 필요한 면에만 배경색을 준다. 넓은 면은 보통 2~3단계 안에서 정리하고, 가장 진한 색은 작은 행동·표식에 집중한다.

| 단계·역할 | 중립 구조 | 포레스트 강조 | 골드 강조 |
|---|---|---|---|
| L0 페이지 바탕 | `pair-base` | `pair-base` | `pair-base` |
| L1 내용 묶음·보조 표면 | `pair-muted` | `pair-muted` | `pair-muted` |
| L2 묶음 안의 내용·강조 면 | `pair-base` | `pair-forest` | `pair-gold` |
| L3 작은 확정 상태·강조 행동·표식 | `pair-ink` | `pair-forest-strong` | `pair-gold-strong` |

각 칸은 `bg-<토큰> text-<토큰>-foreground`를 함께 적용한다. 이 표는 단계마다 고정 색을 강제하는 규칙이 아니다. 예를 들어 담기 전 보조 버튼은 L3 위치에 있더라도 `pair-muted`, 담은 후는 `pair-ink`를 유지한다. `pair-forest-strong`은 브랜드 행동, `pair-gold-strong`은 짧은 강조 표식에 쓰며 기존 상태 의미를 덮어쓰지 않는다.

중첩할 때는 다음 기준을 지킨다.

- **혼합의 기준색은 항상 `canvas`다.** `pair-light`, `mat`, `sage-wash`, `gold-wash`는 크림을 기준으로 이미 혼합된 불투명 토큰이다. 부모가 매트나 세이지여도 색을 다시 섞지 않는다. `bg-pair-forest/50` 같은 반투명 배경이나 부모의 `opacity`로 깊이를 표현하면 아래 색에 따라 실제 조합이 달라지므로 기본 중첩 방식으로 쓰지 않는다.
- **안쪽으로 갈 때는 같은 계열의 진한 색 또는 중립 내용 면을 고른다.** 연한 세이지 안의 행동은 포레스트, 연한 골드 안의 표식은 딥 골드가 기본이다. 추가 내용 구분이 필요하면 크림 내용 면으로 돌아갈 수 있다.
- **글자색은 바로 아래 표면의 `foreground`를 따른다.** 세이지 묶음 안에 크림 내용 면을 넣었다면 그 면에서는 `pair-base-foreground`로 재설정한다. 바깥의 포레스트 글자색을 모든 자식에게 그대로 상속하지 않는다.
- **다른 강조 계열을 섞는 예외에는 별도 의미가 있어야 한다.** 세이지 안의 골드가 '현재 선택'처럼 분명한 상태를 나타낼 때는 가능하다. 상태 이름·아이콘 등을 함께 제공한다. 단순히 더 안쪽이라는 이유만으로 골드를 넣지 않는다. 판정·계절·공휴일의 의미색은 각 도메인 기준을 유지한다.
- **면의 경계는 색만으로 구분하지 않는다.** 여백·배치로 먼저 묶고 필요하면 `hairline` 구분선이나 `silver` 컨트롤 테두리를 더한다. 특히 현재 매트와 연한 골드의 면끼리 대비는 약 1.03:1(2026-11-04 확인)이라 안팎의 차이가 작다. 이 값은 면 사이의 구분 정도이며, 앞 절의 글자 대비와 별개다. 샌드 베이지 `hairline`도 깊이 단계의 필수 채움색으로 올리지 않는다.
- **떠 있는 면은 별도로 다룬다.** Popover·메뉴는 중첩 표면의 다음 색이 아니라 앞 내용을 덮는 별도 레이어다. 기존 UI 라이브러리의 portal·쌓임 순서를 사용하고, `surface` 배경·`ink` 글자와 부드러운 그림자로 떠오름을 표현한다. 부모의 강조색을 계속 누적하지 않는다.

단계별 토큰 흐름은 다음과 같다.

```text
중립:       pair-base → pair-muted → pair-base   → pair-ink
포레스트:   pair-base → pair-muted → pair-forest → pair-forest-strong
골드:       pair-base → pair-muted → pair-gold   → pair-gold-strong
```

예를 들어 포레스트 계열의 색상 클래스는 다음처럼 적용한다. 아래 구조는 색상 관계를 설명하는 예시이며, 각 요소의 여백·크기·접근성 상태는 기존 컴포넌트 기준을 따른다.

```tsx
<main className="bg-pair-base text-pair-base-foreground">{/* L0 페이지 */}
  <section className="bg-pair-muted text-pair-muted-foreground">{/* L1 묶음 */}
    <aside className="bg-pair-forest text-pair-forest-foreground">{/* L2 강조 면 */}
      <p>브랜드 안내</p>
      <button className="bg-pair-forest-strong text-pair-forest-strong-foreground">
        자세히 보기 {/* L3 주된 행동 하나 */}
      </button>
    </aside>
  </section>
</main>
```

중립 구조는 위 예시의 L2를 `bg-pair-base text-pair-base-foreground`, L3를 `bg-pair-ink text-pair-ink-foreground`로 바꾼다. 골드 구조는 L2에 `bg-pair-gold text-pair-gold-foreground`, L3의 짧은 표식에 `bg-pair-gold-strong text-pair-gold-strong-foreground`를 쓴다.

### 현재 화면에 적용하는 기준

- 시세 메인 검색창·검색 입력창·최근 본 품종·검색의 자주 사는 품종 알약은 `pair-light`, 담기 전 버튼은 `pair-muted`, 담은 후 버튼은 `pair-ink` 조합이다. 메인·검색·품종 상세에서 같은 의미를 유지한다. 이 표는 기존 색상과 대응하는 기준이며, 모든 화면의 클래스 이름을 한 번에 바꿀 필요는 없다.
- 제철달력 월별 목록의 월 카드는 본문과 스크롤 고정 제목 모두 `pair-light`를 사용한다. 같은 카드 안에서 바탕이 달라 보이지 않도록 불투명 조합을 함께 적용한다.
- 담기 전후는 색상과 함께 `+`·체크 표시 및 `aria-pressed`로 구분한다. 일반 담기 버튼을 포레스트로 칠해 이미 담은 상태처럼 보이게 하지 않는다.
- `hairline`은 연한 구분선, `silver`는 컨트롤 테두리에 사용한다. 경계·focus는 기존 컴포넌트 규칙을 유지하며 배경색의 미세한 차이만으로 조작 가능 여부를 전달하지 않는다.
- 보조 글씨는 크림 위에서 `caption`, 매트 위에서는 `stone`을 우선한다. 연한 세이지·골드 위의 글씨는 각 조합의 `foreground`를 쓴다. `ash`, `mute`, `sage`, `gold-pale`을 작은 본문 글자색으로 쓰지 않는다.
- `verdict-*`는 싸요·보통·비싸요·판정 전, `season-*`는 계절, `holiday`는 공휴일의 의미색이다. 일반 브랜드 강조에는 `pair-*`를 쓰고, 가격 판정이나 오류를 브랜드 색으로 대신 표시하지 않는다. 연한 세이지가 같더라도 일반 안내는 `pair-forest`, 가격 판정은 `verdict-cheap-wash`처럼 의미에 맞는 이름을 선택한다.
- 흰색 `surface`는 정보 popover처럼 떠 있는 면에 남긴다. 기본 검색창·알약·담기 버튼을 구분하기 위한 기본값으로 흰색을 반복하지 않는다.
- 아래 Oura 원형의 파란 CTA와 머스터드 버튼 관련 설명은 원형 분석이다. 장볼날의 공통 조합은 이 절을 우선하며, 연한 골드를 진한 글씨 없이 행동 배경으로 쓰지 않는다. 기존 하단 내비·계절 화면의 선택 표현은 각 화면 기준을 유지한다.
- 라이트 모드 기준이다. 배경 불투명도, 이미지, 겹침을 바꾸면 실제 결과의 대비를 다시 확인한다. 기본 조합의 일반 글씨 대비는 4.5:1 이상을 유지한다.

### 사용 예시

아래 예시는 색상 클래스만 보여 준다. 크기·테두리·focus·접근성 상태는 기존 컴포넌트의 규칙을 함께 적용한다.

```tsx
<main className="bg-pair-base text-pair-base-foreground">…</main>

<button
  aria-pressed={added}
  className={
    added
      ? "bg-pair-ink text-pair-ink-foreground"
      : "bg-pair-muted text-pair-muted-foreground"
  }
>
  {added ? "✓ 담음" : "+ 담기"}
</button>

<aside className="bg-pair-forest text-pair-forest-foreground">브랜드 안내</aside>
<span className="bg-pair-gold text-pair-gold-foreground">현재 위치</span>
```

일반 CSS에서도 같은 쌍을 사용한다.

```css
.brand-note {
  background: var(--color-pair-forest);
  color: var(--color-pair-forest-foreground);
}
```

## 제철달력 화면의 적용 기준

아래는 계절 상세·월별 도감·나의 식탁에 적용한 기준이다. 뒤의 Oura 분석은 원형 참고이며, 실제 앱의 서체·선택 색상·화면별 수치는 이 절을 따른다. 기존의 크림색 바탕, 얇은 경계선, 터치 영역 원칙은 반복하지 않는다.

### 색조와 선택 상태

- 계절 상세의 품종 그림 바탕, 나의 식탁 요약 카드와 검색창은 `bg-surface/40`으로 밝기만 살짝 높인다. 품종 그림은 hover·키보드 focus에서 `bg-surface/70`으로 구분한다.
- 계절 이동 카드는 `bg-canvas`를 사용한다. 계절색을 섞은 회색 그라데이션이나 요약 카드의 색 번짐을 추가하지 않는다. 계절색은 아이콘·진행률 등 의미가 있는 표시에 남긴다.
- 계절 상세의 월 칩은 기본 `border-hairline`·`bg-canvas`·`text-stone`, 현재 월은 `border-gold-soft`·`bg-gold-soft/30`·`text-gold-deep`·semibold다. 스크롤에 따라 현재 월 하나만 강조한다.
- 나의 식탁 필터는 선택 시 `border-gold`·`bg-gold-wash`·`text-gold-deep`, 계절 요약 칸은 `border-gold-soft`·`bg-gold-wash`로 맞춘다. 선택하지 않은 계절 칸도 글자 전체를 흐리게 하지 않는다.
- 나의 식탁의 제철 달·미기록 상태·검색 placeholder는 `text-stone`이다. 미기록 그림은 불투명도 70%·채도 75%로 알아볼 수 있게 남기고, 기록한 그림은 원래 색을 쓴다.

### 글자 크기와 정보 위계

앱의 실제 서체는 본문 Pretendard, 제목 Gowun Batang(`font-heading`), 큰 숫자 cojeev display 서체 Bricolage Grotesque(`font-number`, `shared/fonts/display-font.ts`)다.

| 요소 | 적용값 |
|---|---|
| 계절 상세 품종명 | 모바일 13px, 640px 이상 14px, medium, 줄 높이 20px, 중앙 정렬. 말줄임 없이 단어를 보존한다. |
| 계절 상세 월 제목 | 28px, 1024px 이상 36px. 설명은 14px / 16px, 품종 수는 13px·고정폭 숫자다. |
| 계절 상세 월 칩 | 13px. 현재 월만 semibold다. |
| 하단 계절 이동 | 계절명 24px·제목 서체·bold, 방향 안내와 월 범위 12px다. |
| 나의 식탁 목록 | 품종명 16px·제목 서체·bold, 제철 달과 기록 상태 12px. 이름은 왼쪽, 상태는 오른쪽 정렬이다. |
| 나의 식탁 필터·검색 | 필터 13px, 검색 입력 16px다. |

### 배치와 여백

- 계절 상세·나의 식탁 본문 최대 폭은 1080px, 좌우 여백은 모바일 18px / 1024px 이상 24px다. 나의 식탁은 넓은 화면에서 요약 280px + 간격 32px + 목록으로 나눈다.
- 계절 상세 품종 목록은 모바일 4열, 640px 이상 6열이다. 월 제목과 목록 사이는 20px, 카드 사이 가로 간격은 10px / 12px, 행 간격은 20px / 24px다.
- 품종 그림은 정사각형·모서리 8px·안쪽 여백 8px를 쓰고, 그림과 이름 사이는 8px다. 월 제목·설명은 기준선을 맞추되 좁으면 설명이 다음 줄로 흐르게 한다.
- 계절 상세 월 칩은 보이는 높이 32px, 칩 사이 4px다. 실제 터치 영역은 기존 Touch Targets 기준을 유지한다.
- 하단 계절 이동은 두 개의 낮은 가로 카드다. 안쪽 여백 12px, 작은 식재료 그림 하나 40px, 계절명과 월 범위 간격 4px를 쓴다. 현재 구성의 높이는 약 104px이며 고정 높이를 강제하지 않는다. 이전 화살표는 왼쪽, 다음 화살표는 오른쪽에 둔다.
- 나의 식탁 목록은 `체크 44px | 그림 40px | 유동 폭 이름·제철 달 | 상태`의 네 열로 정렬한다. 열 간격 8px, 행 위아래 여백 12px, 이름과 제철 달 사이 4px다.
- 나의 식탁 요약 카드는 안쪽 여백 20px / 넓은 화면 24px, 그림자 대신 얇은 테두리를 사용한다. 검색·필터 줄 간격은 12px, 필터와 목록 사이는 12px다.
- 월별 도감의 월 제목은 각 카드 안에서 탭 바로 아래에 고정한다. 제목 바탕은 불투명한 `bg-surface`로 그림과 겹치지 않게 하고, 한쪽만 펼쳐도 각 제목은 자기 카드 끝에서 사라진다.

## Colors

> Source pages analysed: the homepage, the Oura Ring 5 store page, the Activity & Movement page, and the Clinical & Science Experts page. The palette below reconciles all four into one system.

### Brand & Accent
- **Action Blue** (`{colors.primary}` — #2a72de): the single conversion color. Fills the primary CTA pill ("Explore", "Shop All Products") with `{colors.on-primary}` text. Used nowhere else — not for links, not for accents.
- **Stone** (`{colors.stone}` — #4a4741): the warm taupe-brown brand neutral. Carries the wordmark, secondary/editorial pill buttons, form-field fills, circular-icon outlines, and default link color. This is the color that makes Oura feel "Oura."
- **Clay** (`{colors.clay}` — #6b443d): a warm reddish-brown used for accent bands and content cards (e.g., the Activity page's "Your Oura Activity Score" band).
- **Espresso** (`{colors.espresso}` — #39221e): the darkest brown, for deep accent fills and rich text on gold surfaces.
- **Gold** (`{colors.gold}` — #af751b) / **Ochre** (`{colors.ochre}` — #bc924c) / **Gold Soft** (`{colors.gold-soft}` — #ddaa61) / **Gold Pale** (`{colors.gold-pale}` — #ddbe78) / **Gold Deep** (`{colors.gold-deep}` — #684d07): the mustard ramp. Powers warm illustration, the activity-ring dashboard card, and score data-visualisation.
- **Forest** (`{colors.forest}` — #224228) / **Olive** (`{colors.olive}` — #5c6f5d) / **Sage** (`{colors.sage}` — #849671) / **Sage Mute** (`{colors.sage-mute}` — #7b886d) / **Sage Pale** (`{colors.sage-pale}` — #ced4b8): the olive ramp, used for calm accent bands, illustration, and secondary data-visualisation.

### Surface
- **Canvas** (`{colors.canvas}` — #f7f1e8): the signature warm-paper background for all editorial and marketing surfaces.
- **Surface** (`{colors.surface}` — #ffffff): pure white, for elevated cards, inputs-on-cream, and the circular "+" overlay buttons on person cards.
- **Surface Grey** (`{colors.surface-grey}` — #ececec): the light end of the product-page gradient and light utility fills.
- **Silver** (`{colors.silver}` — #cccac7): the cool grey used on product-showcase pages and as the selected-tab border.
- **Ink Band** (`{colors.ink-band}` — #000000): the true-black stage for the footer / news band.
- **Ink Band Soft** (`{colors.ink-band-soft}` — #19191c): the near-black used for the footer surface, a hair warmer than pure black.
- **Hairline** (`{colors.hairline}` — #e1dcd3): the warm 1px divider on cream (a low-opacity ink wash blended onto canvas).

### Text
- **Ink** (`{colors.ink}` — #1c1b1a): primary heading and body text on cream.
- **Stone** (`{colors.stone}` — #4a4741): secondary text and editorial emphasis on cream.
- **Ash** (`{colors.ash}` — #838280): muted grey for meta text, titles-under-names, and utility captions.
- **Caption** (this app only, `--color-caption` — #6c6a65): Ash is 3.4:1 on canvas, short of AA for 12px text. Small captions and placeholders use this one step darker value (4.8:1) instead. Ash stays for borders and non-text marks.
- **Mute** (`{colors.mute}` — #a8a5a0): warm grey for the quietest captions and for secondary text on dark bands.
- **On Dark** (`{colors.on-dark}` — #ffffff): text and icons on the ink and silver worlds.

### Semantic
- **Error** (`{colors.error}` — #e33a22): validation and focus-error state on form fields (the focused email field border).

### Print month colors (this app only)
- **Month tone** (`--color-month-tone-1` … `-12`): twelve quiet month colors for the print month label. Seven reuse Oura colors (stone, clay, sage, olive, forest, gold); five sit between them.
- **Month vivid** (`--color-month-vivid-1` … `-12`): twelve saturated month colors, the one deliberate break from the Oura palette. Print only (the "쨍한 열두 달" option on PDFs); screens never use them.

## Typography

### Font Family
Two families carry the entire system, and the tension between them is the point.

- **Editorial New** (`{typography.display}`, `{typography.heading-1}`, `{typography.heading-2}`, `{typography.lead}`): a light, high-contrast transitional serif used for display headlines, section titles, and the occasional light-serif lead paragraph. Weights run thin — 100 and 300 — so the large sizes read as elegant, not heavy. The Activity page shows it in italic ("move *count*") for a hand-set editorial flourish.
- **AkkuratLL** (`{typography.heading-3}` through `{typography.caption}`): a neutral Swiss grotesque that does all the real reading work — subheads, body, UI labels, buttons, captions. Weights 300 / 400 / 600 / 700.

### Hierarchy

| Token | Family | Size | Weight | Line Height | Use |
|---|---|---|---|---|---|
| `{typography.display}` | Editorial New | 110px | 300 | 1.05 | Homepage hero headline ("Subtle. Power.") |
| `{typography.display-2}` | Editorial New | 80px | 300 | 1.1 | Secondary-page display headlines |
| `{typography.heading-1}` | Editorial New | 68px | 300 | 1.1 | Large page titles |
| `{typography.heading-2}` | Editorial New | 40px | 300 | 1.15 | Section headlines |
| `{typography.heading-3}` | AkkuratLL | 40px | 400 | 1.25 | Sans section headings / large stats |
| `{typography.title}` | AkkuratLL | 32px | 400 | 1.25 | Card titles, sub-section titles |
| `{typography.lead}` | Editorial New | 24px | 100 | 1.25 | Light-serif intro / lead paragraphs |
| `{typography.body-lg}` | AkkuratLL | 20px | 400 | 1.5 | Emphasised body copy |
| `{typography.body}` | AkkuratLL | 18px | 400 | 1.5 | Default body text |
| `{typography.body-sm}` | AkkuratLL | 16px | 400 | 1.5 | Dense body, links, form text |
| `{typography.button}` | AkkuratLL | 16px | 600 | 1 | Button labels |
| `{typography.ui}` | AkkuratLL | 14px | 400 | 1.4 | Nav links, tabs, utility UI |
| `{typography.caption}` | AkkuratLL | 13px | 400 | 1.4 | Captions, footnotes |
| `{typography.eyebrow}` | AkkuratLL | 12px | 700 | 1.2 | Small-caps overlines ("IN THE NEWS", "FEATURED ARTICLE") |

### Principles
- Serif for feeling, sans for facts. `{typography.display}` and its siblings appear only at large sizes where the high stroke contrast is legible and expressive; everything at reading scale is `{typography.body}`.
- Thin display weights. Big serif headlines lean on weight 100–300, so scale — not boldness — creates hierarchy.
- Quiet overlines. Section context is set with `{typography.eyebrow}` (uppercase, lightly tracked) rather than heavy kickers.

### Note on Font Substitutes
Both faces are proprietary. For open-source builds, substitute **Editorial New** with **Fraunces** or **Newsreader** (both high-contrast serifs — set optical size high and weight low to match the thin display feel), and **AkkuratLL** with **Inter** or **Hanken Grotesk** (neutral grotesques with similar x-height). When substituting, nudge display line-height up slightly (Fraunces runs a touch taller than Editorial New) and keep body tracking at 0.

## Layout

### Spacing System
- **Base unit**: 8px.
- **Tokens**: `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px.
- Card interiors sit at `{spacing.lg}`; tight utility groupings (form padding, chip padding) at `{spacing.sm}`–`{spacing.md}`. Section-to-section rhythm is deliberately large — long vertical gaps of blank cream separate content blocks, letting photography and headlines breathe.

### Grid & Container
- Content is center-constrained within a wide max-width, with full-bleed photography breaking out to the viewport edges.
- Card grids run 3-up (person cards, benefit trios) and 4-up (news / expert carousels), collapsing toward 1-up on narrow screens.
- The product page alternates centered single-column showcases with edge-to-edge media.

### Whitespace Philosophy
Empty cream is a design element, not leftover space. Large silences between sections group related content and pace the scroll like chapters. UI chrome stays minimal so the eye rests on imagery and headlines.

### Responsive Strategy

#### Breakpoints
| Name | Width | Key Changes |
|---|---|---|
| Desktop | ≥ 1280px | Full multi-column grids, horizontal nav, large display type |
| Laptop | 1024–1279px | Slightly tightened gutters, same structure |
| Tablet | 768–1023px | 4-up grids → 2-up, nav begins to condense |
| Mobile | ≤ 767px | Single-column stacks, hamburger nav, display type scales down (110px → ~48px), pill CTAs go full-width-ish |

(Breakpoint ladder observed in the extracted media-query data spans 1280 → 1024 → 896 → 768 → 600 → 480 → 320px.)

#### Touch Targets
Pill buttons (`button-primary`, `button-secondary`) and circular icon buttons (`button-icon-circular`) are sized for comfortable tapping; keep interactive controls at a minimum 44×44px on touch. Carousel arrows and the "+" person-card buttons are circular and finger-sized.

#### Collapsing Strategy
- Horizontal nav collapses to a hamburger below the tablet breakpoint; the cart and wordmark persist.
- Multi-column card grids collapse 4-up → 2-up → 1-up.
- The silver product showcase keeps its centered single-column media on all sizes and simply scales the imagery.
- Footer link columns reflow from a 4-column row into stacked groups.

#### Image Behavior
Photography is full-bleed and art-directed, often edge-to-edge on mobile. Product imagery uses large-radius rounded frames (`{rounded.xl}`); editorial imagery is frequently un-rounded full-bleed. Images lazy-load as sections enter the viewport.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 — Flat | No shadow; separation by color-world shift or `{colors.hairline}` rule | Default on cream; most sections |
| 1 — Resting card | Very soft, low-opacity drop shadow | News cards on the black band, the Technical Specifications card |
| 2 — Floating | Slightly deeper, more diffuse soft shadow | Product-showcase media cards, elevated content cards |
| 3 — Overlay | Strong diffuse shadow + scrim | Modals / dialogs (rare) |

Depth is understated. On cream, sections separate through the surface-world shift (cream → black → silver) and hairline dividers rather than heavy elevation. Where shadows appear, they are soft, warm, and low-opacity — never hard or high-contrast.

### Decorative Depth
Depth mostly comes from **photography** (full-bleed lifestyle imagery, machined product renders on the silver stage) and from **warm accent bands** (`{colors.clay}`, `{colors.gold}` families) that recede or advance a section. Subtle radial glows appear behind product imagery on the store page to lift the ring off its grey backdrop.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Full-bleed imagery, bands, nav |
| `{rounded.xs}` | 4px | Small utility chips, tight controls |
| `{rounded.sm}` | 8px | Small cards, badges, list items |
| `{rounded.md}` | 12px | Form fields (email input) |
| `{rounded.lg}` | 24px | Content cards, person cards, news cards |
| `{rounded.xl}` | 40px | Large product-image cards on the store page |
| `{rounded.full}` | 9999px | Pill buttons, tabs, circular icon buttons, stat badges |

### Photography Geometry
Product and lifestyle imagery is generous and soft-cornered: product cards use `{rounded.xl}`, editorial and person imagery uses `{rounded.lg}` or runs full-bleed with no radius. Person cards are near-portrait rectangles with a small circular "+" affordance in the corner. Stat readouts ("99%", "95%", "90%") sit in perfect circles (`{rounded.full}`).

## Components

> Only Default and (where genuinely extracted) Active/Pressed states are documented. Variants live as separate `components:` entries in the front matter.

### Navigation

**`nav-bar`** — Top navigation on cream
- Background `{colors.canvas}`, links in `{colors.stone}` at `{typography.ui}`, no radius. Slots: OURA wordmark (left, `{colors.stone}`), center dropdown links (Shop, Your Health, Why Oura, For Organizations), cart icon (right). Sits flush on the cream canvas with no divider until scrolled.

**`announcement-bar`** — Top promo strip
- Full-width cream strip above the nav, centered `{typography.eyebrow}` text in `{colors.ink}` (e.g. free-trial offer copy). No radius, no background shift — it reads as the top edge of the paper.

### Hero

**`hero`** — Page-opening statement
- Cream background, `{typography.display}` serif headline in `{colors.ink}` (homepage: "Subtle. Power."), a small serif eyebrow label above, and a single `button-primary` blue pill CTA. Often paired with full-bleed product/lifestyle photography directly beneath the headline.

### Buttons

**`button-primary`** — Primary conversion CTA
- Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button}`, fully rounded (`{rounded.full}`). The only blue in the interface. Used for "Explore" and "Shop All Products".

**`button-secondary`** — Editorial / secondary action
- Background `{colors.stone}`, text `{colors.on-stone}`, `{typography.button}`, `{rounded.full}`. The warm-neutral pill for content actions ("Why Oura", "How It Works").

**`button-on-dark`** — Cream pill on dark surfaces
- Background `{colors.canvas}`, text `{colors.stone}`, `{typography.button}`, `{rounded.full}`. Used for "Read More" and card actions floating on the black news band. (Extracted button variant: cream fill, stone text, full radius.)

**`button-outline`** — Outline pill on dark/photo
- Transparent over `{colors.ink-band}`, 1px `{colors.on-dark}` border, white text, `{rounded.full}`. For low-emphasis actions over dark imagery.

**`button-outline-stone`** — Outline pill on cream
- Cream background, 1px `{colors.stone}` border, `{colors.stone}` text, `{rounded.full}`. Low-emphasis action on the paper canvas.

**`button-icon-circular`** — Circular icon control
- Circular (`{rounded.full}`) control for carousel arrows and the person-card "+" affordance. Two flavours: a white surface circle (`{colors.surface}`) with a hairline edge for the "+" overlays, and a stone-outlined circle for the carousel arrows.

### Inputs & Forms

**`text-input`** — Newsletter / email field
- Background `{colors.stone}`, text `{colors.on-stone}`, `{typography.body-sm}`, radius `{rounded.md}` (12px), padding roughly 8px vertical / 20px left with a trailing submit affordance on the right. The dark taupe fill makes the field feel like part of the footer rather than a bright form box.

**`text-input-focused`** — Focused / error field
- On focus the field lifts to a light surface (`{colors.surface}`) with `{colors.ink}` text and a `{colors.error}` border for the validation-error state. Radius stays `{rounded.md}`.

### Cards & Containers

**`feature-card`** — Content / benefit card
- White surface (`{colors.surface}`), `{colors.hairline}` border, `{colors.ink}` text, `{typography.body}`, radius `{rounded.lg}`, padding `{spacing.lg}`. The default soft-cornered content container on cream.

**`feature-card-elevated`** — Floating content card
- Cream surface (`{colors.canvas}`) with a soft Level-1/2 shadow, `{rounded.lg}`, padding `{spacing.lg}`. Used where a card floats over imagery or the black band (news clippings, spec card).

**`product-card`** — Product-showcase media card
- Cool grey surface (`{colors.surface-grey}`), large radius `{rounded.xl}` (40px), holds a machined product render on the silver stage, often with a subtle radial glow behind the ring.

**`person-card`** — Expert / leadership card
- Cream background, portrait photo with radius `{rounded.lg}`, a white circular `button-icon-circular` "+" in the corner, name in `{typography.body}`/`{typography.title}` and role in `{colors.ash}` `{typography.caption}`. Appears in horizontal carousels.

**`news-card`** — News clipping on the dark band
- Cream card (`{colors.canvas}`) floating on `{colors.ink-band}`, `{colors.ink}` text, `{typography.body}`, `{rounded.lg}`, padding `{spacing.lg}`. Carries a publication quote plus a circular arrow link.

### Signature Components

**`stat-badge`** — Circular stat readout
- Perfect circle (`{rounded.full}`) on cream with a large `{typography.title}`/`{typography.heading-3}` number in `{colors.stone}` and a small caption beneath (e.g. "99% / 95% / 90%" accuracy figures on the product page).

**`pill-tab`** — Product selector tab
- Fully-rounded (`{rounded.full}`) tab in a horizontal selector row; selected state gets a `{colors.silver}` (2px) border, label in `{typography.ui}`, `{colors.stone}` text on cream. Used for the "Everyday health sensing" category switcher.

**`eyebrow-label`** — Section overline
- Uppercase `{typography.eyebrow}` label in `{colors.ink}` on cream, no background, marking section context ("ACTIVITY & MOVEMENT", "FROM THE PULSE BLOG", "FEATURED ARTICLE" as a small pill on imagery).

**`footer`** — Site footer
- Near-black surface (`{colors.ink-band-soft}`), `{colors.on-dark}` text and `{colors.mute}` secondary text, `{typography.body-sm}`. Contains the OURA wordmark, a newsletter `text-input`, payment-method icons, a 4-column link grid, and a language pill.

### Examples (illustrative)

> Auto-derived kit-mirror demonstration surfaces (`scripts/derive-examples-block.mjs`). Each `ex-*` entry references brand-native primitives so downstream consumers (`/preview-design`, `/generate-kit`) re-skin the same 10 surfaces consistently.

**`ex-pricing-tier`** — Default Pricing tier card. Re-uses feature-card chrome with brand canvas-soft surface.
- Properties: `backgroundColor`, `textColor`, `borderColor`, `rounded`, `padding`

**`ex-pricing-tier-featured`** — Featured/highlighted tier — polarity-flipped surface (dark fill + light text in light mode, light fill + dark text in dark mode).
- Properties: `backgroundColor`, `textColor`, `rounded`, `padding`

**`ex-product-selector`** — Color/size picker chrome — fashion / DTC variant selector.
- Properties: `backgroundColor`, `rounded`, `padding`

**`ex-cart-drawer`** — Shopping cart drawer — DTC / fashion brand actual cart chrome.
- Properties: `backgroundColor`, `rounded`, `padding`, `item-divider`

**`ex-app-shell-row`** — Sidebar nav row inside the App Shell example. Active state uses brand primary as the indicator.
- Properties: `backgroundColor`, `activeIndicator`, `rounded`, `padding`

**`ex-data-table-cell`** — Default data-table th + td chrome. Header uses mono-caps eyebrow typography; body uses body-sm.
- Properties: `headerBackground`, `headerTypography`, `bodyTypography`, `cellPadding`, `rowBorder`

**`ex-auth-form-card`** — Sign-in / sign-up card. Re-uses feature-card chrome with text-input primitives inside.
- Properties: `backgroundColor`, `rounded`, `padding`

**`ex-modal-card`** — Modal dialog surface — same chrome as feature-card with elevated shadow.
- Properties: `backgroundColor`, `rounded`, `padding`

**`ex-empty-state-card`** — Empty-state illustration frame.
- Properties: `backgroundColor`, `rounded`, `padding`, `captionTypography`

**`ex-toast`** — Toast notification surface — feature-card shape + medium shadow.
- Properties: `backgroundColor`, `rounded`, `padding`, `typography`


## Do's and Don'ts

### Do
- Reserve `{colors.primary}` strictly for the primary conversion CTA — one blue moment per view, maximum.
- Default every surface to `{colors.canvas}` (warm paper), not white. White (`{colors.surface}`) is for elevated cards and inputs, not backgrounds.
- Use `{colors.stone}` for the wordmark, secondary pills, outlines, form fills, and links — it is the workhorse neutral.
- Pair `{typography.display}` (thin serif) at large sizes with `{typography.body}` (grotesque) for reading; let scale create hierarchy.
- Keep pills fully rounded (`{rounded.full}`) and cards softly rounded (`{rounded.lg}`); use `{rounded.xl}` only for large product imagery.
- Let the earth-tone ramps (gold, clay, olive) live in bands, illustration, and data-viz — as color-blocked sections that pace the scroll.
- Give sections large vertical breathing room; treat empty cream as structure.

### Don't
- Don't use `{colors.primary}` for links, accents, icons, or decorative fills — it must stay unique to the primary CTA.
- Don't put the mustard/olive accent colors on buttons — they are surfaces and illustration, never actions.
- Don't set body copy in `{typography.display}`; the thin serif is display-only and gets illegible at small sizes.
- Don't default backgrounds to white — it breaks the warm-paper identity.
- Don't add heavy or hard-edged shadows; elevation here is soft, warm, and low-opacity.
- Don't crowd sections — compressing the vertical rhythm collapses the calm, editorial pacing that defines the brand.
