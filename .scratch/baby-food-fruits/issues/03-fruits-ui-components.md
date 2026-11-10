# 03 UI 컴포넌트 및 인터랙션 구현

Type: task
Status: resolved
Blocked by: 01, 02

## 무엇을

`apps/web/features/baby-food/fruits/` 폴더에 탭바, 과일 카드 그리드, 동적 위험 경고 배너, 상세 바텀시트, 주의 식재료 도감 컴포넌트를 구현한다.

## 작업 상세

1. **상단 서브헤더 및 탭바**:
   - `FruitsNav`: `[이유식 궁합표] [월령별 과일 시기]` 상단 링크 탭 구현
   - `StageTabs`: 6단계 월령 칩 탭바 (`[전체 보기]` + `[4~5M]` ~ `[24M+]`)
2. **동적 경고 배너**:
   - `StageWarningBanner`: 선택된 월령에 따라 돌 전 금지(꿀, 우유, 주스, 생식) 또는 두 돌 전 주의(견과류, 설탕)를 경고 카드로 강조.
3. **과일 카드 그리드**:
   - `FruitCard`: 기존 SVG 일러스트(`IngredientArt`) 표시, 3단계 뱃지(`안전 (권장)`, `관행 (참고)`, `주의 (손질필수)`), 이번 달 제철 품종이면 `🌿 이번 달 제철` 뱃지 부착.
4. **상세 바텀시트 (`FruitDetailSheet`)**:
   - 카드 클릭 시 `@workspace/ui/components/bottom-sheet` 기반 시트 열림.
   - 단계별 손질 및 조리법, 핑거푸드 커팅 가이드, 질식 예방 수칙, 알레르기 관찰 요령, 제철 품종(`/seasonal/foods/[id]`), 재료 궁합(`/baby-food/pairings/[id]`), 시세(`/prices/[id]`) 바로가기 제공.
5. **하단 주의 식재료 도감**:
   - `SafetyGuideSection`: 돌 전 절대 금지(꿀, 우유, 주스, 날것), 두 돌 전 주의(통견과류, 첨가당, 나트륨, 젤리) 카드 그리드.
6. **스타일**:
   - `fruits.css`: Oura 토큰 및 Pretendard/Gowun Batang 폰트 체계 준수.

## Answer

- `apps/web/features/baby-food/fruits/` 하위에 8개 핵심 컴포넌트 및 스타일시트 구축 완료.
- 모바일(375px)과 데스크톱(1280px) 반응형 레이아웃 지원.
- `pnpm --filter web typecheck` 및 `pnpm --filter web lint` 0 에러 확인.
