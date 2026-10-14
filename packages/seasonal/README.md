# @workspace/seasonal

제철달력의 도메인 레이어. 화면(React)을 모르는 순수 TypeScript 데이터와 계산만 둔다.
`apps/web`의 화면과, MVP 이후 달력 인쇄 페이지(`.scratch/calendar-print/spec.md`)가 같은 코드를 쓴다.

| 폴더 | 내용 |
|---|---|
| `src/data/` | 월·계절·명절 같은 고정 데이터 |
| `src/calendar/` | 날짜 계산. "오늘"은 서울 시간 기준 |

앞으로 넣을 것: 월별 제철 품종 목록(`data/`), 달력 칸·공휴일(`calendar/`), 흩어진 이미지 배치(`layout/`, 시드 고정이라 같은 입력이면 같은 결과).

규칙:

- React, Next.js, DOM API를 import하지 않는다.
- 이름은 `grocery-price/GLOSSARY.md`의 용어를 따른다. 굴·사과 같은 항목은 **품종**이다.
- 가져다 쓸 때는 파일 경로로 import한다: `import { SEASONS } from "@workspace/seasonal/data/seasons"`.
