# 07. P3 "내가 본 가격 적기"를 본문 섹션으로

Status: ready-for-agent
Type: task (AFK)
Blocked by: 06

## 목적

하단 내비 위에 겹쳐 떠 있는 "내가 본 가격 적기" 바(`features/price/variety-detail/my-price.tsx`의 `MyPriceBar`)를 본문 "내 가격" 섹션 안의 입력으로 옮긴다. 하단 내비는 그대로 둔다(spec 6장).

## 할 일

- [ ] `MyPriceBar`의 떠 있는 위치를 없애고, 본문 섹션(`id="my-price"`) 안에 입력과 결과(판정 칩)를 둔다. 입력 시트가 있으면 그대로 쓴다.
- [ ] 06의 섹션 칩 "내 가격"이 이 섹션으로 데려간다.
- [ ] 화면 키보드가 열렸을 때 입력이 가려지지 않는지 본다(모바일 375).

## 완료 기준

- 루트 `pnpm typecheck` · `pnpm lint` · `pnpm test` 통과
- 375에서 하단 내비와 겹치는 떠 있는 바가 없다.
- 내 가격을 넣으면 판정이 나온다.
- 콘솔 오류가 없다.
