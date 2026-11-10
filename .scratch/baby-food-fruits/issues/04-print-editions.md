# 04 A4 인쇄용 출력물(세로형/가로형) 및 어드민 연동

Type: task
Status: resolved
Blocked by: 01, 03

## 무엇을

냉장고 부착용 A4 1장 출력물을 세로형(Portrait)과 가로형(Landscape) 2가지 포맷으로 구현하고, 로컬 어드민에서 PDF 생성 및 미리보기를 지원한다.

## 작업 상세

1. **A4 인쇄 템플릿**:
   - `apps/web/features/baby-food/fruits/fruits-print.tsx` 및 `fruits-print.css`:
     - 세로형(Portrait): 2열 그리드 + 6단계 과일 팁 + 하단 빨간색 금기 경고 박스 (돌 전 꿀/우유/주스 및 만 5세 미만 통견과류/질식)
     - 가로형(Landscape): 3열 그리드 + 하단 경고 박스
2. **어드민 연동**:
   - `apps/web/app/admin/baby-food/fruits-print/page.tsx`: 미리보기 및 세로/가로 탭 전환 지원
   - `apps/web/app/admin/baby-food/fruits-pdf/route.ts`: Playwright Chrome headless 기반 A4 1장 PDF 생성 및 attachment 다운로드 지원
   - `apps/web/features/admin-print/server/generate.ts`: `generateA4CustomPdf` 신설
3. **사용자 다운로드**:
   - `/baby-food/fruits` 화면 상단에 "냉장고 부착용 A4 요약표 인쇄 (PDF)" CTA 버튼 연결

## Answer

- `fruits-print.tsx`, `fruits-print.css` 구축 완료 (A4 정밀 mm 규격, portrait / landscape 둘 다 지원).
- 어드민 미리보기(`/admin/baby-food/fruits-print`) 및 PDF 생성기(`/admin/baby-food/fruits-pdf`) 연동 완료.
- `shared/routes.ts`에 `babyFoodFruitsPrint`, `babyFoodFruitsPdf` 등록 완료.
- `pnpm --filter web typecheck` 및 `pnpm --filter web lint` 0 에러 통과.
