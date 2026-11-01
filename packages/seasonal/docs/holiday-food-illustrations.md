# 명절 전통 음식 그림 작업 기록

작업일: 2026-11-01. 기록일: 2026-11-02.

명절 가족 상차림 조사에 따라 전통 음식 5개와 그림을 추가하고, 닭찜 그림을 다시 그렸다. 잡채·소갈비찜·LA갈비구이는 실물 사진을 직접 보고 색감과 재질을 보강했다. 선정 근거는 [추가 후보 조사](holiday-food-expansion-research-2026-11-01.md)에 있다.

## 반영한 그림과 명절

| 음식 | 앱 SVG | 명절 | 작업 내용 |
|---|---|---|---|
| 잡채 | [japchae](../../../apps/web/public/dishes/japchae/color.svg) | 설날·추석 | 갈색 통바탕을 없애 면 사이 틈을 만들고, 호박색 당면·채소채·짧은 윤기를 보강했다. |
| 소갈비찜 | [sogalbijjim](../../../apps/web/public/dishes/sogalbijjim/color.svg) | 설날·추석 | 반복된 원형 뼈 고리를 없애고 살점 한쪽에 짧은 뼈 끝을 드러냈다. 고기 결·짙은 양념·양념이 밴 무를 보강했다. |
| LA갈비구이 | [la-galbi-gui](../../../apps/web/public/dishes/la-galbi-gui/color.svg) | 추석 | 얇은 갈빗살과 나란한 뼈 단면을 그렸다. 빈 구멍처럼 보이던 뼈를 밝게 채우고 구움색·지방층·불규칙한 탄 자국을 보강했다. |
| 동그랑땡 | [donggeurangttaeng](../../../apps/web/public/dishes/donggeurangttaeng/color.svg) | 설날·추석 | 쿠키처럼 보이던 볼록한 원반을 얇게 하고, 갈색 부침면과 회갈색 다진 속·두부·채소를 구분했다. |
| 동태전 | [dongtae-jeon](../../../apps/web/public/dishes/dongtae-jeon/color.svg) | 추석 | 폭과 끝이 다른 생선 포를 그렸다. 큰 흰 띠와 계단형 단면을 작은 흰 면·서로 다른 곡률의 살결로 바꿨다. |
| 닭찜 | [dakjjim](../../../apps/web/public/dishes/dakjjim/color.svg) | 추석 | 기존 그림을 닭다리·접힌 날개·토막살로 다시 구성했다. 고기를 겹쳐 담고 밤·은행의 크기와 채도를 낮췄다. |

`dish-rows.ts`에 새 음식의 id와 이름을 등록하고 `festivals.ts`에 명절을 연결했다. 앱 전통 음식은 14개에서 19개가 됐다. 프로토타입 체크리스트는 확장 명절 음식 2개를 포함해 21개이며, 작업 후 모두 완료 상태다.

## 사진 관찰과 수정 근거

사진은 음식의 색·부피·재질을 관찰하는 데 사용했다. 사진의 배치·추가 고명·워터마크를 결과 SVG에 옮기지 않았다.

- [잡채, Sarah Ahn](https://ahnestkitchen.com/food/the-best-japchae): 간장빛 당면의 투명감, 짧게 끊기는 반사광과 익힌 채소의 색 대비를 관찰했다.
- [소갈비찜, 시크제이맘](https://www.10000recipe.com/recipe/6909518): 짙은 양념색, 살점 윗면의 윤기와 황갈색으로 익은 무를 관찰했다.
- [LA갈비구이, 하반반찬전문점](https://www.10000recipe.com/recipe/7042963): 살점과 진한 가장자리, 밝은 지방·뼈 단면의 대비를 관찰했다.
- [궁중닭찜, Friandise](https://www.10000recipe.com/recipe/6958634)과 [마늘간장닭다리](https://www.10000recipe.com/recipe/6868248): 닭다리의 굵은 살에서 가늘어지는 목, 껍질의 접힘과 부분적인 양념 윤기를 관찰했다. 입력에 없는 감자·당근·파는 새 그림에 추가하지 않았다.

## 생성물과 검수

그림은 `seasonal-food-illustrator` 스킬의 관찰·작도·정지 시트 검수 절차로 제작했다. 전통 음식 원본은 `features` 3개, `materials` 3~6개와 바닥 그림자를 갖추고 `season`, `motion`, `parts` 필드를 쓰지 않는다.

- 전체 5스타일의 정지 4변형과 수채 스타일의 64·128·256·512px를 밝고 어두운 배경에서 직접 확인했다.
- 신규 5개 제작 시 SVG·대시보드 검사 155개를 통과했다. 3개 색감 보강에서는 95개, 닭찜 재제작에서는 35개를 통과했다.
- 실제 브라우저 너비 375px·1280px에서 음식 이름·SVG 로드·가로 넘침을 확인했다. 앱 콘솔 오류와 hydration 경고, Next.js dev MCP의 컴파일·실행 오류가 없었다.
- `pnpm foods:sync`로 앱 SVG와 출처 문서, 그림 목록을 생성했다. 원본 SHA는 [PROVENANCE.md](../../../apps/web/public/dishes/PROVENANCE.md)에 기록된다.
- 루트 `pnpm typecheck`, `pnpm lint`(오류 0), `pnpm test`를 통과했다.

64px에서는 소갈비찜과 다른 갈색 고기찜의 엄밀한 구분, 동태전의 생선 종 식별, 개별 고명의 세부 식별이 제한된다. 시각 검수는 에이전트의 판단이며 독립 사용자 인식 시험은 아니다.

원본 코드·관찰 메모·전후 PNG·정지 시트는 Git에서 제외된 `prototypes/seasonal-food/`에 보관한다. 저장소에는 배포용 SVG와 출처·작업 기록을 남긴다. 이번 작업의 선점 파일만 정리했고, 다른 음식과 기존 선점 기록은 보존했다.
