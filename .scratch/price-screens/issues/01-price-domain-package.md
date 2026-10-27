# 01. `@workspace/price` 도메인 패키지

Status: resolved
Type: task (AFK)
Blocked by: 없음

## 목적

가격 화면이 쓰는 모양과 순수 계산을 React · Next · DOM 없이 한 패키지에 둔다 (spec 3-1). `packages/seasonal`과 같은 모양: `exports: "./*": "./src/*.ts"`, 배럴 없음.

## 할 일

- [x] `packages/price` 패키지 뼈대: `package.json`(`@workspace/price`), `tsconfig.json`, `eslint.config.js`, vitest. `apps/web`의 의존성과 `transpilePackages`에 더한다
- [x] `src/types.ts`: `VarietySummary`, `VarietyDetail`, `Verdict`, `SearchIndex` 등 화면이 쓰는 모양. pipeline.md 4-1 payload와 `current_judgment` 목록 열에 맞춘다
- [x] `src/verdict.ts`: `verdictOf(price, usual, band)`. 평소가 null이면 `none`. 입력 가격 판정(P3 "내가 본 가격")도 이 함수. 테스트 먼저
- [x] `src/search.ts`: 초성 · 품목 · 별칭 · 한 글자 오타. `es-hangul`, `match-foods.ts` 방식 참고. 테스트 먼저
- [x] `src/format.ts`(원 · 날짜 표시), `src/copy.ts`(화면 문구: 설명 한 줄, 빈 상태, 토스트, 판정 전 문구)
- [x] `docs/project-structure.md`에 패키지 등록

## 완료 기준

- 루트 `pnpm typecheck`, `pnpm lint`, `pnpm test` 통과. `verdict.test.ts`, `search.test.ts`가 와이어프레임의 검색 예("ㅂㅊ", "호박", "대패삼겹", "배츄", "트러플")를 덮는다.

## Answer

2026-10-27. `packages/price/src/`: `types.ts`, `verdict.ts`, `search.ts`, `format.ts`, `copy.ts`와 테스트 4개(29건).

- 판정 %는 반올림한 정수이고, 구간 비교도 그 정수로 한다. 화면의 "+10%"와 판정(보통)이 어긋나지 않는다. 구간 경계(±10%)는 보통.
- 판정 구간은 `VerdictBand { lower, upper }`(%)로 품종마다 받는다 (judgment.md 2장의 품종별 백분위). 정해지기 전에는 `DEFAULT_BAND` ±10%.
- 검색: 품목 이름과 같은 이름의 품종이 있으면(예: "배추") 품목 고르기 대신 이름 검색으로 본다. 와이어프레임은 "배추"를 품목 고르기로 보내 배추 자신이 빠졌다.
- 문구의 조사는 `es-hangul`의 `josa`로 받침에 맞춘다. 스펙의 "트러플는"은 "트러플은"이 맞다(플에 받침 ㄹ). "삼겹살(국산)"처럼 괄호가 붙으면 괄호 앞 글자로 고른다.
