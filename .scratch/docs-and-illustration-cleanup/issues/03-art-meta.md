# 03. 그림 메타와 이유식 그림 목록

Status: resolved
Type: task (prototypes/가 있는 기기에서)
Blocked by: 01 (resolved)

## 목적

그림 검수 상태를 기계가 읽게 하고, 화면이 쓰는 그림 목록을 계층 규칙에 맞는 곳에 둔다 (명세 결정 6~8).

## 할 일

- [x] `prototypes/seasonal-food/foods/<id>/art.json` 형식을 정한다: 그림 ID, 표시명, 검수 상태, 검수일, 참고 출처. 표시명은 `build/catalog.json`에서 가져온다.
- [x] 그림 폴더 321개에 `art.json`을 한 번에 만든다. 01에서 웹에 나가 있던 그림은 검수 완료, 나머지는 미검수. 검수일은 모르면 비운다.
- [x] `dishes/`에도 같은 파일이 필요한지 판단한다. 전통 음식 그림은 범위 밖이라 지금 동작(화면에 나오는 것만 복사)을 유지하면 된다.
- [x] `apps/web/features/baby-food/data.ts`의 `FRUIT_GUIDE_ART`·`PAIRING_ART`를 `packages/seasonal`의 JSON으로 내리고, 앱은 패키지 경로로 import한다. 어드민(06)이 이 파일을 쓴다.
- [x] 스킬의 `references/provenance.md`가 설명하는 기록 위치와 어긋나면 08에서 고치도록 메모한다.

## 완료 기준

- 모든 그림 폴더에 `art.json`이 있고 스키마 검사를 통과한다.
- 이유식 화면이 바뀌지 않았다(375 · 1280 폭 확인).
- 루트 스크립트가 `apps/web/features/`를 import하지 않는다.

## Comments

2026-11-12: 마쳤다.

- 그림 메타 형식은 `packages/seasonal/src/data/art-meta.ts`(그림 ID, 이름, `review`, `reviewedAt`, `references`). 그림 폴더 321개에 `art.json`을 만들었다: 웹에 나가 있던 296개는 `reviewed`, 나머지 25개는 `unreviewed`. 검수일은 몰라서 비웠고 참고 자료도 비어 있다(기록이 `NOTES.md` 자유 서술에만 있어 옮기지 않았다).
- 이유식 그림 목록은 `packages/seasonal/src/data/infant-art.json`(과일 12, 궁합 재료 97, 그림 102개)이고 값이 그림 ID다. `infant-art.ts`가 `FRUIT_ART_IDS`·`PAIRING_ART_IDS`·`infantArtIds()`를 낸다. 앱의 `FRUIT_GUIDE_ART`·`PAIRING_ART`는 이 ID를 경로로 바꾼 값이라 화면 코드는 그대로다.
- `scripts/sync-food-images.mjs`가 앱 계층 대신 `infant-art.json`을 읽는다. `pnpm foods:sync`를 다시 돌려 산출물이 01의 해시와 같은 것을 확인했다(`git status`에 산출물 변경 없음).
- 이유식 화면 `/baby-food/fruits`, `/baby-food/pairings`를 375 · 1280 폭에서 확인했다. 깨진 그림 0, 가로 넘침 없음, 콘솔 오류 없음.
- 전통 음식(`dishes/`)에는 `art.json`을 두지 않았다. 범위 밖이고 지금 동작을 유지한다.

**05·08이 알아야 할 것**: `build/catalog.json`(그림 원본 `food.mjs`에서 나온다)에 그림마다 `season`(달, status, sources)이 따로 있다. 전복은 카탈로그가 7~10월, 품종 원본이 5~8월이다. 제철의 원본은 품종 원본이므로 어드민은 카탈로그의 `season`을 보여 주지 않거나 "그릴 때의 메모"로만 보여 준다. 08에서 스킬이 새 그림의 `food.mjs`에 제철을 적지 않게 할지 정한다.

`infant-art.json`의 궁합 재료 키에 `참개`가 있다(`참깨`와 같은 그림). 이유식 데이터의 재료 이름을 그대로 옮긴 것이라 고치지 않았다.
