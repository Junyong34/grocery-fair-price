# 분석(GA4) 운영 · 유지보수

`apps/web`의 이용 통계는 Google Analytics 4로 모은다. 왜 GA4인지, 어떤 이벤트를 왜 보내는지는 `.scratch/calendar-download/issues/08-ga4.md`에 있다. 이 문서는 코드를 고치거나 GA 관리 화면을 만질 때 보는 절차다.

## 한눈에

- 코드는 `apps/web/shared/analytics/` 한 폴더에 있다. 화면 코드는 `track(이름, 매개변수)`만 부른다. `sendGAEvent` · `gtag` · `window.dataLayer`를 직접 쓰지 않는다.
- 이벤트를 더하고 고치고 지우는 곳은 `events.ts` 하나다.
- 운영 빌드이고 `GA_MEASUREMENT_ID`가 있을 때만 GA 스크립트가 붙는다. 개발 서버에서는 기본으로 꺼져 있다.
- 이용 기록을 모으는 방식이 바뀌면 개인정보 처리방침(`/privacy`)도 같이 고친다.

## 파일

| 파일 | 하는 일 | 고칠 때 |
|---|---|---|
| `events.ts` | 이벤트 카탈로그: 이름 → 매개변수 타입(주석은 언제 보내는지), GA에 등록한 매개변수 `REGISTERED_PARAMS`, 이벤트마다 표본 `EVENT_SAMPLES` | 이벤트를 더하거나 바꾸거나 지울 때 |
| `events.test.ts` | GA4 이름 규칙(영문 소문자 · 숫자 · 밑줄, 40자, `google_` · `ga_` · `firebase_` 금지), 이벤트당 매개변수 25개 · 문자열 값 100자, **쓰는 매개변수 = `REGISTERED_PARAMS`** | 거의 없다 |
| `config.ts` (+ `config.test.ts`) | 환경 변수를 읽어 켤지 정한다(서버 전용) | 켜는 조건을 바꿀 때 |
| `analytics-tag.tsx` | `<GoogleAnalytics>`(`@next/third-parties`). `app/layout.tsx`가 `</body>` 뒤에 그린다 | 다른 도구로 바꿀 때 |
| `track.ts` | `track(name, params)`. GA가 붙지 않은 화면(개발, ID 없음, 차단기)에서는 아무것도 하지 않는다 | 다른 도구로 바꿀 때 |
| `tracked-link.tsx` | 서버 컴포넌트의 `<Link>`에 클릭 이벤트를 붙이는 래퍼(`eventName`, `eventParams`) | 거의 없다 |

## 환경 변수

빌드와 실행 환경에 같은 값을 넣는다(정적 페이지가 빌드 때 굳힌다). `turbo.json` `build.env`에 선언되어 있다.

| 변수 | 넣는 곳 | 내용 |
|---|---|---|
| `GA_MEASUREMENT_ID` | 운영 | GA4 측정 ID(`G-…`). 페이지 HTML에 그대로 나가는 공개 값이다. 없으면 GA를 붙이지 않는다 |
| `GA_DEBUG` | 로컬만 | `true`면 개발 서버에서도 붙이고 `debug_mode`로 보낸다(DebugView). 운영에는 넣지 않는다 |

## 이벤트 목록 (2026-10-30)

| 이벤트 | 언제 | 매개변수 | 부르는 곳 |
|---|---|---|---|
| `print_download` | 인쇄물 상세의 "PDF 내려받기" · "다시 내려받기" | `edition_id`, `edition_kind`, `paper`, `placement`(sheet · page) | `features/seasonal/downloads/edition-actions.tsx` |
| `print_a3_request` | "A3도 원해요"를 이 기기에서 처음 누를 때 | `edition_id`, `edition_kind` | 같은 파일 `A3Request` |
| `print_share` | 상세의 "공유", 받은 뒤 "링크 복사" · "공유하기". 공유 창을 닫기만 하면 세지 않는다 | `edition_id`, `method`(copy · share) | 같은 파일, `ShareButton`의 `onShared` |
| `print_entry_click` | 2a · 2b의 "제철 달력 · 포스터 PDF 받기" 카드 | `placement`(this-month · month-timeline) | `features/seasonal/components/downloads-card.tsx` |

페이지뷰는 보내지 않는다. GA 향상된 측정의 "브라우저 기록 이벤트 기반 페이지 변경"이 클라이언트 이동까지 센다. 직접 보내면 두 번 센다.

숫자는 클릭 기준이다. 링크를 복사해 붙여 받거나 차단기를 쓰는 이용자는 빠진다. 에디션끼리 비교하고 수요를 어림하는 용도다.

## 절차

### 이벤트 더하기

1. `events.ts`의 `AnalyticsEvents`에 한 줄 더한다. 위 주석에 언제 보내는지 적는다.
2. `EVENT_SAMPLES`에 표본을 더한다(빠뜨리면 타입 오류).
3. 부르는 곳에서 `track("이름", { … })`. 서버 컴포넌트의 링크면 `<TrackedLink eventName eventParams>`.
4. **새 매개변수를 썼다면** GA 관리 → 맞춤 정의 → 맞춤 측정기준 만들기(범위: 이벤트, 매개변수 이름 그대로)를 하고 `REGISTERED_PARAMS`에 더한다. 안 하면 `events.test.ts`가 실패한다. 등록 전에 쌓인 값은 보고서에 소급되지 않으니 배포 전에 등록한다.
5. 위 "이벤트 목록" 표에 한 줄 더한다. 새 종류의 정보를 모으게 되면 `/privacy` 1항도 고친다(아래).

### 이벤트 고치기

- 매개변수 타입을 바꾸면 부르는 곳이 타입 오류로 드러난다. 그대로 따라 고친다.
- 이벤트 이름을 바꾸면 GA 보고서에서는 다른 이벤트가 된다. 비교가 끊기므로 꼭 필요할 때만 바꾸고, 바꾼 날을 이 문서 표 아래에 적는다.

### 이벤트 지우기

1. `AnalyticsEvents`와 `EVENT_SAMPLES`에서 지운다. 부르는 곳이 타입 오류로 드러나니 지운다.
2. 그 이벤트만 쓰던 매개변수가 있으면 `REGISTERED_PARAMS`에서 빼고, GA 맞춤 측정기준은 보관처리한다(맞춤 측정기준 수에 한도가 있다).
3. 이 문서 표에서 지운다.

### 분석 도구를 바꿀 때

`analytics-tag.tsx`와 `track.ts`만 바꾼다. 카탈로그와 화면 코드는 그대로다. `/privacy`의 위탁 · 국외 이전 절을 새 도구로 고친다.

## GA 관리 화면 설정 (한 번)

1. 속성 만들기: 시간대 대한민국, 통화 KRW.
2. 데이터 스트림 → 웹. 주소는 운영 도메인. **향상된 측정**을 켜고 "브라우저 기록 이벤트 기반 페이지 변경"이 체크되어 있는지 본다.
3. 측정 ID를 운영 환경 변수 `GA_MEASUREMENT_ID`에 넣는다(로컬 확인은 루트 `.env`).
4. 관리 → 데이터 설정 → 데이터 수집: Google 신호 데이터 **끔**.
5. 관리 → 데이터 설정 → 데이터 보존: **14개월**(`/privacy`와 같은 값. 바꾸면 `privacy-content.ts`의 `ANALYTICS_RETENTION`도).
6. 관리 → 맞춤 정의 → 맞춤 측정기준(범위: 이벤트): `REGISTERED_PARAMS`의 다섯 개(`edition_id`, `edition_kind`, `paper`, `placement`, `method`).

## 확인

- 측정 ID 없이 `pnpm dev`: 페이지 HTML에 `googletagmanager.com`이 없고, 버튼을 눌러도 콘솔 경고가 없다.
- `GA_DEBUG=true pnpm dev`(루트 `.env`에 측정 ID): GA 관리 → DebugView에서 이벤트와 매개변수가 보인다. A3 요청은 두 번 눌러도 한 번, 시트 ↔ 페이지 이동에서 `page_view`가 한 번씩.
- 운영 빌드 흉내: `GA_MEASUREMENT_ID=G-… pnpm --filter web exec next build && pnpm --filter web exec next start`. 브라우저 콘솔에서 `dataLayer`에 이벤트가 쌓인다.
- `pnpm test`가 카탈로그 규칙을 검사한다.

## 개인정보 처리방침과의 관계

`/privacy`(`apps/web/features/legal/privacy/privacy-content.ts`)는 GA가 모으는 것을 이용자에게 알린다. 아래가 바뀌면 같이 고치고 `PRIVACY_CHANGES` 맨 앞에 날짜와 한 줄을 더한다.

- 모으는 정보의 종류(새 이벤트가 새 종류의 정보를 모을 때. 같은 종류의 버튼 클릭이 늘어나는 것은 해당 없음)
- 보존 기간, Google 신호 데이터 설정
- 분석 도구 자체
- 연락 이메일

처리방침은 법률 자문을 거친 문서가 아니다. 크게 바꿀 때는 개인정보보호위원회 "개인정보 처리방침 작성지침"을 함께 본다. 쿠키 동의 배너는 넣지 않았다(국내 이용자 대상). 해외 이용자를 받게 되면 다시 정한다.

## 남은 일 (2026-10-30)

- [ ] GA 속성을 만들고 위 "GA 관리 화면 설정"을 한다(운영자).
- [ ] `GA_DEBUG=true`로 DebugView 확인.
- [ ] 처리방침 문구를 운영자가 읽고 승인. 배포일이 2026-10-30과 다르면 `PRIVACY_CHANGES` 첫 줄을 고친다.
- [ ] 가격 화면에서 `/privacy`로 가는 길(바닥글). `shared/shell/site-shell.tsx`의 다른 작업이 커밋된 뒤.
