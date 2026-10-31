# @workspace/seasonal

제철달력의 도메인 레이어. 화면(React)을 모르는 순수 TypeScript 데이터와 계산만 둔다.
`apps/web`의 화면과, MVP 이후 달력 인쇄 페이지(`.scratch/calendar-print/spec.md`)가 같은 코드를 쓴다.

| 폴더 | 내용 |
|---|---|
| `src/data/` | 품종(`foods`), 월·계절·명절, 화면 문구(`copy`) |
| `src/calendar/` | 달력 칸·공휴일(`month-calendar`), 서울 기준 오늘(`today`) |
| `src/layout/` | 흩어진 이미지 배치(`scatter`, 시드 고정이라 같은 입력이면 같은 결과), 끌어 옮기기(`gesture`, `arrangement`) |
| `src/geometry/` | 배치가 쓰는 기하 계산(Lloyd 이완 `lloyd`, 겹침 풀기 `relax-shapes`) |
| `src/search/` | 초성 검색(`match-foods`) |
| `src/print/` | 인쇄 에디션: 스펙 · 구성(`layouts`) · 기간 차트 · 원형 달력 |
| `scripts/` | 생성 스크립트 |
| `docs/` | 조사 기록: 흩어진 배치 알고리즘 비교(`scatter-layout-algorithms.md`, `layout/`과 `geometry/`의 근거), 명절 전통 음식(`traditional-foods.md`) |

품종 목록 `src/data/foods.generated.ts`는 생성 파일이다. 직접 고치지 않고 `pnpm --filter @workspace/seasonal build:foods`로 다시 만든다. 원천이 `prototypes/`(Git 밖)에 있어 그 폴더가 있는 기기에서만 돌릴 수 있다. 일러스트가 없는 품종의 id는 스크립트의 `NEW_IDS`에서 정한다.

화면 문구는 `src/data/copy.ts` 한 곳에 둔다. 화면 코드에 문구를 직접 쓰지 않는다.

테스트: `pnpm --filter @workspace/seasonal test`(vitest). 순수 함수는 테스트를 먼저 쓴다.

규칙:

- React, Next.js, DOM API를 import하지 않는다.
- 이름은 `grocery-price/GLOSSARY.md`의 용어를 따른다. 굴·사과 같은 항목은 **품종**이다.
- 가져다 쓸 때는 파일 경로로 import한다: `import { SEASONS } from "@workspace/seasonal/data/seasons"`.
