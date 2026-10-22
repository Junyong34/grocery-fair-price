# 16. 달력 글자 크기 3단계

Status: ready-for-agent
Blocked by: 01

## 목적

달력 글자(날짜 숫자, 요일, 공휴일 이름)만 따로 키우고 줄인다. 지금은 `type.scale`(작게 0.9 / 보통 1 / 크게 1.1)이 시트의 모든 글자에 함께 적용돼서, 그림 이름은 그대로 두고 달력만 키울 수 없다(`features/print/parts/units.ts`의 `t()`가 `--t`를 곱함).

## 결정(2026-10-22)

- `calendar.size: "small" | "medium" | "large"`. 배율은 0.85 / 1 / 1.2를 초안으로 하고, A4로 직접 보고 정한다.
- 전체 글자 크기와 곱한다(전체 "크게" + 달력 "크게" = 1.1 × 1.2).
- 달력이 있는 **월간**과 **연간 한 장**만. 포스터에는 없다.
- 값이 없는 예전 에디션은 `"medium"`(`.default()`)으로 읽어 지금과 같게 나온다.

## 할 일

- [ ] `spec.ts`: 월간·연간 한 장의 `calendar`에 `size`. `spec.test.ts`에 예전 사양(값 없음)이 `"medium"`으로 읽히는 테스트를 더한다.
- [ ] `option-fields.ts`: "달력" 탭에 "달력 글자 크기" 선택(작게 / 보통 / 크게). 01의 `when`은 필요 없다(달력이 있는 종류에만 넣는다).
- [ ] `parts/print-calendar.tsx`: `dayFont`에 배율을 곱한다. 요일·공휴일 이름은 `dayFont`를 따라가므로 함께 바뀐다. `monthly.tsx`·`year-sheet.tsx`가 넘기는 값을 고친다.
- [ ] 넘침 확인: 연간 한 장은 칸이 작다(`year-sheet.tsx`가 칸 크기에서 `dayFont`를 계산함). `"large"`와 전체 "크게"를 함께 골랐을 때 날짜·공휴일 이름이 칸을 넘치는지 A4로 본다. 넘치면 칸 크기로 정한 상한을 두거나, 파서가 그 조합을 거른다. 어느 쪽을 골랐는지 Answer에 적는다.
- [ ] 월간도 `"large"`에서 6주짜리 달(예: 2027년 10월, 주 시작 일요일)이 칸을 넘치지 않는지 본다.

## 완료 조건

- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test` 통과.
- `/print?spec=…&paper=A4`에서 월간·연간 한 장을 small·large로 한 쪽씩 스크린샷 확인.
- `/admin` 편집기에서 바꾸면 미리보기가 바뀌고 콘솔 오류가 없다.
