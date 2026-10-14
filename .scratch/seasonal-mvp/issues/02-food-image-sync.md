# 02. 일러스트 동기화 `pnpm foods:sync`

Status: ready-for-agent
Blocked by: 01

## 목적

`prototypes/seasonal-food`의 일러스트를 앱에서 쓰도록 복사한다. 일러스트는 계속 늘어나므로 손 복사가 아니라 스크립트로 한다.

## 할 일

- [ ] `scripts/sync-food-images.mjs`와 루트 `package.json`의 `foods:sync` 스크립트를 만든다.
- [ ] `prototypes/seasonal-food/kit`의 `renderSvg`를 직접 불러 `watercolor` 갈래, `color`와 `motion` 변형을 **`shadow: false`**로 렌더한다. 대시보드가 쓰는 `build/out/`은 건드리지 않는다.
- [ ] 출력: `apps/web/public/foods/<id>/{color,motion}.svg`. `foods.ts`에 있는 id만 복사하고, 그 밖의 id는 건너뛴 목록으로 출력한다.
- [ ] `apps/web/public/foods/PROVENANCE.md`를 덮어쓴다: 갈래 id·버전·sha, 생성일, 복사한 품종 목록.
- [ ] `packages/seasonal/src/data/drawn-foods.ts`(생성 파일, 머리에 "직접 고치지 않는다")에 그림이 있는 id 목록을 쓴다.
- [ ] `prototypes/`가 없는 환경(새 클론)에서는 오류 메시지를 내고 끝난다. 이미 커밋된 복사본은 그대로 둔다.
- [ ] `AGENTS.md`의 "Where things are"에 한 줄을 더한다: 일러스트를 새로 그리면 `pnpm foods:sync`.

## 완료 조건

- 스크립트를 두 번 돌려도 diff가 없다(결정적 출력).
- 복사한 SVG에 `data-part="shadow"`가 없다.
