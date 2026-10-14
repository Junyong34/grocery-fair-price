# 달력 인쇄 · 다운로드 (PDF/PNG) — 스펙

Status: needs-triage
Phase: **MVP 이후**. MVP(제철달력 화면) 개발이 끝난 뒤에 착수한다. 그전까지는 구현하지 않는다.
작성일: 2026-10-14

## 목표

사용자가 2a 이달 화면의 ⚙ 설정 시트에서 고른 조건에 맞는 달력 파일(PDF/PNG)을 내려받게 한다. 화면 구성은 `prototypes/seasonal-food/wireframes/WIREFRAME-SPEC.md` 4절 "달력 다운로드"에 있다.

## MVP 범위와의 관계

- MVP의 설정 시트에는 다운로드 영역을 두지 않는다. 자리만 남기거나 "준비 중"으로 표시할지는 MVP 화면 작업 때 정한다.
- MVP 동안 지킬 것: 달력 칸 계산, 공휴일, 제철 데이터, 흩어진 이미지 배치를 **화면 컴포넌트와 분리된 순수 함수·데이터 모듈**로 만든다. 그래야 인쇄 페이지가 같은 코드를 그대로 쓸 수 있다. 와이어프레임 결정 기록의 "달력 디자인 슬롯" 원칙(슬롯이 받는 데이터는 고정하고 디자인만 바꾼다)과 같다.

## 정한 것

| 항목 | 결정 | 이유 |
|---|---|---|
| 생성 방식 | 파일을 **미리 만들어 두고** 다운로드 링크만 준다. 요청이 올 때 만들지 않는다. | 사용자마다 내용이 같다. 서버에 PDF 엔진이 필요 없고 CDN으로 내려준다. 출시 전에 결과물을 눈으로 확인할 수 있다. |
| 렌더링 | **HTML 인쇄 페이지 → 헤드리스 Chrome**(Playwright `page.pdf()`)으로 PDF를 만든다. PNG는 같은 페이지의 스크린샷으로 만든다. | 앱의 React 컴포넌트·Oura 토큰·SVG 일러스트를 그대로 쓴다. 글자와 SVG가 벡터로 들어가 A3에서도 선명하다. |
| 쓰지 않는 방식 | html2canvas + jsPDF(브라우저 캡처), `@react-pdf/renderer`, 디자인 툴 수작업 | 캡처는 글자가 흐리고 파일이 크다. react-pdf는 컴포넌트를 다시 만들어야 한다. 수작업은 조합 수를 감당하지 못한다. |
| 인쇄 페이지 위치 | 별도 앱이 아니라 `apps/web` 안의 라우트 | cojeev 컴포넌트가 `apps/web` 경로(`@/lib/cojeev-motion/...`)에 묶여 있다. |
| 어드민 | 만들지 않는다 | 생성은 스크립트와 CI로 충분하다. 비개발자가 직접 생성·미리보기를 해야 할 때만 `apps/web`에 `/admin/print`를 추가한다. |
| 실행 | GitHub Actions: 연말 `schedule` + 수동 `workflow_dispatch` | 날짜 데이터(공휴일·명절)나 제철 목록·디자인이 바뀔 때 다시 만든다. `@hyunbinseo/holidays-kr` 5.2027.x에는 2027년까지 들어 있다. |
| 저장 | 오브젝트 스토리지(Vercel Blob, S3, R2 중 택1), 경로에 연도 포함 | 조합이 연 300개 안팎이라 git(`public/`)에 넣으면 저장소가 계속 커진다. |

## 구성

```
apps/web/app/print/[range]/[design]/page.tsx   인쇄 전용 페이지 (화면 컴포넌트 재사용, 메뉴 연결 없음, noindex)
apps/web/scripts/build-calendars.mjs           앱을 띄우고 Playwright로 조합마다 PDF·PNG 저장
.github/workflows/calendars.yml                생성 → 스토리지 업로드
```

파일 경로 규칙(안):

```
/downloads/{year}/{range}-{design}-{paper}-{orient}.{pdf|png}
예) /downloads/2026/10-minimal-a4-portrait.pdf
    /downloads/2026/year-seasonal-a3-landscape.pdf
```

설정 시트는 고른 옵션을 이 경로로 바꿔 링크만 연다.

## 옵션과 조합 수

와이어프레임 옵션을 모두 곱하면 연 **312개**다.

| 옵션 | 값 | 수 |
|---|---|---|
| 범위 | 1~12월 각각, 12개월 전체 | 13 |
| 디자인 | 미니멀(날짜·공휴일만), 제철 이미지, 기록형(먹은 음식 체크 칸) | 3 |
| 용지 | A4(210×297mm), A3(297×420mm) | 2 |
| 방향 | 세로, 가로 | 2 |
| 형식 | PDF, 이미지(PNG) | 2 |

## 인쇄 페이지 구현 메모

1. 용지와 방향은 CSS로 정한다: `@page { size: A4 portrait; margin: 0; }`. Playwright에서 `preferCSSPageSize: true`.
2. 배경을 인쇄한다: `printBackground: true`와 `print-color-adjust: exact`. 없으면 크림 배경과 계절색이 빠진다.
3. `document.fonts.ready`를 기다린 뒤 저장한다. 한글 서체는 PDF에 포함되므로 라이선스가 PDF 포함을 허용하는지 확인한다.
4. 인쇄 페이지에서는 cojeev·motion 애니메이션을 끈다. 흩어진 이미지 배치는 시드가 고정된 계산이라 매번 같은 결과가 나온다.
5. 12개월 전체는 한 장에 한 달씩, `break-after: page`로 나눈다.
6. PNG는 `deviceScaleFactor` 2~3으로 고해상도를 만든다.

## 착수 전에 정할 것

1. **기록형의 의미**
   - 빈 체크 칸을 인쇄해 손으로 체크하는 것이라면 다른 디자인처럼 미리 만든다.
   - 앱의 "먹었어요" 기록이 찍혀 나오는 것이라면 사람마다 다르므로 미리 만들 수 없다. 이 경우만 같은 인쇄 페이지를 브라우저에서 열어 `window.print()`로 저장하게 한다.
2. **조합 줄이기**: 예를 들어 PNG는 A4 세로만, 가로는 12개월 전체만 둔다.
3. **스토리지 선택**과 배포 환경(Vercel 여부).
4. **한글 서체**(MVP에서 정하는 서체를 그대로 쓴다).
5. 인쇄 페이지를 운영에서 막는 방법: `noindex`만 둘지, 환경 변수로 404를 낼지.

## Comments
