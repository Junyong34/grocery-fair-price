# 03. 그림 메타와 이유식 그림 목록

Status: ready-for-agent
Type: task (prototypes/가 있는 기기에서)
Blocked by: 01

## 목적

그림 검수 상태를 기계가 읽게 하고, 화면이 쓰는 그림 목록을 계층 규칙에 맞는 곳에 둔다 (명세 결정 6~8).

## 할 일

- [ ] `prototypes/seasonal-food/foods/<id>/art.json` 형식을 정한다: 그림 ID, 표시명, 검수 상태, 검수일, 참고 출처. 표시명은 `build/catalog.json`에서 가져온다.
- [ ] 그림 폴더 321개에 `art.json`을 한 번에 만든다. 01에서 웹에 나가 있던 그림은 검수 완료, 나머지는 미검수. 검수일은 모르면 비운다.
- [ ] `dishes/`에도 같은 파일이 필요한지 판단한다. 전통 음식 그림은 범위 밖이라 지금 동작(화면에 나오는 것만 복사)을 유지하면 된다.
- [ ] `apps/web/features/baby-food/data.ts`의 `FRUIT_GUIDE_ART`·`PAIRING_ART`를 `packages/seasonal`의 JSON으로 내리고, 앱은 패키지 경로로 import한다. 어드민(06)이 이 파일을 쓴다.
- [ ] 스킬의 `references/provenance.md`가 설명하는 기록 위치와 어긋나면 08에서 고치도록 메모한다.

## 완료 기준

- 모든 그림 폴더에 `art.json`이 있고 스키마 검사를 통과한다.
- 이유식 화면이 바뀌지 않았다(375 · 1280 폭 확인).
- 루트 스크립트가 `apps/web/features/`를 import하지 않는다.
