# 이유식 음식 궁합 콘텐츠 일러스트 재사용 조사와 후속 제작

Type: task
Status: needs-info

## 목적과 범위

현재 콘텐츠의 모든 음식 이름에 대해 기존 정적 SVG를 우선 재사용하고, 재사용 범위 판단과 없는 그림의 후속 작업을 남긴다. 이 티켓에서는 그림 제작·동기화·앱 구현을 수행하지 않았다. 범위가 다른 이름의 연결과 비타민의 정체가 미확정이므로 전체 제작 티켓은 `needs-info`다.

## 조사 기준과 출처

- 조사일: 2026-11-08. 현재 작업 디렉터리의 파일을 직접 확인했다.
- 목록 출처: `docs/food-pairing-image-analysis.md` 2절. 기준 음식뿐 아니라 모든 O·X 상대 음식을 포함하며 `브로콜리/콜리플라워`는 두 이름으로 나눴다.
- 이름 대응: `packages/seasonal/src/data/foods.generated.ts`의 `id`, `name`, `aliases`. 음식 궁합의 대표 이름 통일은 원본 분석 문서의 4절을 따른다.
- 실제 배포 에셋 확인: `apps/web/public/foods/<id>/color.svg`의 파일 존재. 디렉터리 이름이나 제철 목록 등록만으로 보유 판정하지 않았다.
- 기존 그림 출처 기록: `apps/web/public/foods/PROVENANCE.md`. 원본 후보는 `prototypes/seasonal-food/foods/<id>/food.mjs`의 존재를 확인했다.
- 용어·작업 절차: `grocery-price/GLOSSARY.md`, `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`, `docs/project-structure.md`.
- 재사용 가능은 이름 대응과 실제 파일 존재 판정이다. 이 티켓에서 모든 그림의 시각적 적합성을 재평가한 것은 아니다. 화면·인쇄 적용 시 작은 크기와 인쇄 크기의 판독성 확인이 남는다.

## 집계

| 구분                                                  | 이름 수 |
| ----------------------------------------------------- | ------: |
| 전체 고유 음식 이름                                   |      90 |
| 이름·별칭 일치 + 실제 color.svg 있어 바로 재사용 가능 |      49 |
| 별칭·범위·부위·형태 또는 정체 검토 필요               |      12 |
| 바로 대응하는 배포 color.svg 없음                     |      29 |
| 위 29개 중 기존 food.mjs 원본을 확인한 이름           |       9 |
| 위 29개 중 새 그림 작업 대상으로 남긴 이름            |      20 |

위 세 분류는 중복 없이 전체 이름을 포함한다. 기준 목록은 브로콜리·콜리플라워를 나누면 32개지만, 이 티켓의 전체 90개에는 상대 음식도 포함된다.

## 1. 기존 SVG 재사용 가능

| 음식 이름  | 등장 위치            | 기존 id             | 확인한 실제 파일                                    |
| ---------- | -------------------- | ------------------- | --------------------------------------------------- |
| 감         | X 상대               | `persimmon`         | `apps/web/public/foods/persimmon/color.svg`         |
| 감자       | O 상대, X 상대, 기준 | `potato`            | `apps/web/public/foods/potato/color.svg`            |
| 고구마     | O 상대, X 상대, 기준 | `sweet-potato`      | `apps/web/public/foods/sweet-potato/color.svg`      |
| 귤         | X 상대               | `mandarin`          | `apps/web/public/foods/mandarin/color.svg`          |
| 근대       | X 상대               | `chard`             | `apps/web/public/foods/chard/color.svg`             |
| 녹두       | O 상대               | `mung-bean`         | `apps/web/public/foods/mung-bean/color.svg`         |
| 단호박     | O 상대, 기준         | `sweet-pumpkin`     | `apps/web/public/foods/sweet-pumpkin/color.svg`     |
| 당근       | O 상대, X 상대, 기준 | `carrot`            | `apps/web/public/foods/carrot/color.svg`            |
| 대추       | O 상대               | `jujube`            | `apps/web/public/foods/jujube/color.svg`            |
| 도라지     | X 상대               | `bellflower-root`   | `apps/web/public/foods/bellflower-root/color.svg`   |
| 딸기       | O 상대, 기준         | `strawberry`        | `apps/web/public/foods/strawberry/color.svg`        |
| 땅콩       | X 상대               | `peanut`            | `apps/web/public/foods/peanut/color.svg`            |
| 마         | O 상대, X 상대       | `chinese-yam`       | `apps/web/public/foods/chinese-yam/color.svg`       |
| 마늘       | O 상대               | `garlic`            | `apps/web/public/foods/garlic/color.svg`            |
| 멜론       | O 상대               | `melon`             | `apps/web/public/foods/melon/color.svg`             |
| 멸치       | X 상대, 기준         | `anchovy`           | `apps/web/public/foods/anchovy/color.svg`           |
| 무         | O 상대, X 상대       | `radish`            | `apps/web/public/foods/radish/color.svg`            |
| 미나리     | X 상대               | `water-dropwort`    | `apps/web/public/foods/water-dropwort/color.svg`    |
| 밤         | O 상대, X 상대       | `chestnut`          | `apps/web/public/foods/chestnut/color.svg`          |
| 배         | O 상대               | `pear`              | `apps/web/public/foods/pear/color.svg`              |
| 배추       | 기준                 | `napa-cabbage`      | `apps/web/public/foods/napa-cabbage/color.svg`      |
| 복숭아     | O 상대               | `peach`             | `apps/web/public/foods/peach/color.svg`             |
| 부추       | O 상대, X 상대       | `garlic-chive`      | `apps/web/public/foods/garlic-chive/color.svg`      |
| 브로콜리   | O 상대, 기준         | `broccoli`          | `apps/web/public/foods/broccoli/color.svg`          |
| 블루베리   | 기준                 | `blueberry`         | `apps/web/public/foods/blueberry/color.svg`         |
| 비트       | O 상대               | `beet`              | `apps/web/public/foods/beet/color.svg`              |
| 사과       | O 상대, X 상대, 기준 | `apple`             | `apps/web/public/foods/apple/color.svg`             |
| 시금치     | O 상대, X 상대, 기준 | `spinach`           | `apps/web/public/foods/spinach/color.svg`           |
| 아욱       | O 상대               | `mallow`            | `apps/web/public/foods/mallow/color.svg`            |
| 애호박     | O 상대, 기준         | `korean-zucchini`   | `apps/web/public/foods/korean-zucchini/color.svg`   |
| 양배추     | O 상대, X 상대, 기준 | `cabbage`           | `apps/web/public/foods/cabbage/color.svg`           |
| 양파       | O 상대, 기준         | `onion`             | `apps/web/public/foods/onion/color.svg`             |
| 오미자     | O 상대               | `omija`             | `apps/web/public/foods/omija/color.svg`             |
| 오이       | O 상대, X 상대, 기준 | `cucumber`          | `apps/web/public/foods/cucumber/color.svg`          |
| 옥수수     | O 상대, X 상대       | `corn`              | `apps/web/public/foods/corn/color.svg`              |
| 완두콩     | O 상대               | `green-pea`         | `apps/web/public/foods/green-pea/color.svg`         |
| 우엉       | 기준                 | `burdock`           | `apps/web/public/foods/burdock/color.svg`           |
| 자두       | X 상대               | `plum`              | `apps/web/public/foods/plum/color.svg`              |
| 전복       | O 상대               | `abalone`           | `apps/web/public/foods/abalone/color.svg`           |
| 참깨       | O 상대               | `sesame-seed`       | `apps/web/public/foods/sesame-seed/color.svg`       |
| 찹쌀       | X 상대               | `glutinous-rice`    | `apps/web/public/foods/glutinous-rice/color.svg`    |
| 콜리플라워 | 기준                 | `cauliflower`       | `apps/web/public/foods/cauliflower/color.svg`       |
| 키위       | O 상대               | `kiwi`              | `apps/web/public/foods/kiwi/color.svg`              |
| 토마토     | O 상대               | `tomato`            | `apps/web/public/foods/tomato/color.svg`            |
| 파프리카   | O 상대               | `paprika`           | `apps/web/public/foods/paprika/color.svg`           |
| 팥         | O 상대, X 상대       | `red-bean`          | `apps/web/public/foods/red-bean/color.svg`          |
| 표고버섯   | O 상대               | `shiitake-mushroom` | `apps/web/public/foods/shiitake-mushroom/color.svg` |
| 피망       | O 상대               | `bell-pepper`       | `apps/web/public/foods/bell-pepper/color.svg`       |
| 호두       | O 상대               | `walnut`            | `apps/web/public/foods/walnut/color.svg`            |

## 2. 별칭·범위 검토 대상

아래 후보는 기존 파일이 실제로 있다는 뜻이며, 해당 음식에 연결하기로 확정한 목록이 아니다. 광범위한 이름을 임의의 품종으로 축소하지 않는다.

| 음식 이름 | 실제 파일 후보                                                                                                                                         | 남은 판단                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| 검은깨    | `apps/web/public/foods/sesame-seed/color.svg`                                                                                                          | 기존 참깨 이미지 후보. 검은깨 색·형태에 맞는지는 별도 확인하고 자동 대체하지 않음                  |
| 게        | `apps/web/public/foods/blue-crab/color.svg`<br>`apps/web/public/foods/snow-crab/color.svg`                                                             | 꽃게·대게는 특정 품종 후보. 넓은 이름인 게에 임의 연결하지 않음                                    |
| 게살      | `apps/web/public/foods/blue-crab/color.svg`<br>`apps/web/public/foods/snow-crab/color.svg`                                                             | 기존 후보는 껍데기 있는 게 전체. 살 부위 이미지와 달라 그대로 연결하지 않음                        |
| 비타민    | 없음                                                                                                                                                   | 음식 정체 미확인. 채소 또는 영양소라고 가정하지 않고 이름 확정 뒤 조사·그리기                      |
| 새우      | `apps/web/public/foods/shrimp/color.svg`                                                                                                               | 기존 이름은 대하. 새우 전체를 대하로 치환하지 말고 그림을 대표 이미지로 쓸지 확인                  |
| 셀러리    | `apps/web/public/foods/celery/color.svg`                                                                                                               | 생성 목록 이름은 샐러리. 문서에서 셀러리로 통일했으므로 표시 이름·별칭 대응만 확인하면 재사용 가능 |
| 조개      | `apps/web/public/foods/manila-clam/color.svg`<br>`apps/web/public/foods/bird-clam/color.svg`<br>`apps/web/public/foods/cockle/color.svg`               | 바지락·새조개·꼬막 후보. 조개라는 범위의 대표 그림 사용 여부 결정 필요                             |
| 콩        | `apps/web/public/foods/soybean/color.svg`<br>`apps/web/public/foods/kidney-bean/color.svg`<br>`apps/web/public/foods/seoritae/color.svg`               | 대두·강낭콩·서리태 후보. 콩의 의미를 특정하지 않은 상태에서 선택 금지                              |
| 파        | `apps/web/public/foods/green-onion/color.svg`<br>`apps/web/public/foods/scallion/color.svg`                                                            | 대파·쪽파 후보. 원본의 파가 어느 범위인지 결정 필요                                                |
| 현미      | `apps/web/public/foods/rice/color.svg`                                                                                                                 | 기존 쌀 후보. 현미의 도정 상태·색 표현이 달라 재사용 확정하지 않음                                 |
| 호박      | `apps/web/public/foods/aged-pumpkin/color.svg`<br>`apps/web/public/foods/sweet-pumpkin/color.svg`<br>`apps/web/public/foods/korean-zucchini/color.svg` | 늙은 호박·단호박·애호박 후보. 호박을 특정 품종으로 치환하지 않음                                   |
| 흰살생선  | `apps/web/public/foods/cod/color.svg`<br>`apps/web/public/foods/pollock/color.svg`<br>`apps/web/public/foods/olive-flounder/color.svg`                 | 대구·명태·광어 후보. 흰살생선 전체를 특정 품종으로 매핑하지 않음                                   |

## 3. 배포 그림이 없는 이름

이 목록은 `apps/web/public/foods/`에 바로 사용할 이름 대응 정적 SVG가 없다는 뜻이다. 원본 코드가 확인된 경우 먼저 원본을 점검하고 동기화 여부를 판단하며, 무조건 다시 그리지 않는다.

| 음식 이름  | 등장 위치            | 확인된 원본 후보 / 후속 작업                                                                                        |
| ---------- | -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 계란       | O 상대, 기준         | 새 그림 작업 대상으로 남김. 제작 전 seasonal-food-illustrator로 기존 원본·체크리스트를 다시 확인                    |
| 김 | O 상대 | `prototypes/seasonal-food/foods/laver/food.mjs` 있음. 기존 원본 검수·재사용 및 배포 동기화 대상 확인 |
| 깻잎       | O 상대               | `prototypes/seasonal-food/foods/perilla-leaf/food.mjs` 있음. 기존 원본 검수·재사용 및 배포 동기화 대상 확인         |
| 다시마     | O 상대               | `prototypes/seasonal-food/foods/kelp/food.mjs` 있음. 기존 원본 검수·재사용 및 배포 동기화 대상 확인                 |
| 달걀노른자 | O 상대               | 새 그림 작업 대상으로 남김. 제작 전 seasonal-food-illustrator로 기존 원본·체크리스트를 다시 확인                    |
| 닭고기     | 기준                 | 새 그림 작업 대상으로 남김. 제작 전 seasonal-food-illustrator로 기존 원본·체크리스트를 다시 확인                    |
| 돼지고기   | 기준                 | 새 그림 작업 대상으로 남김. 제작 전 seasonal-food-illustrator로 기존 원본·체크리스트를 다시 확인                    |
| 두부       | O 상대, X 상대, 기준 | 새 그림 작업 대상으로 남김. 제작 전 seasonal-food-illustrator로 기존 원본·체크리스트를 다시 확인                    |
| 두유       | O 상대, X 상대       | 새 그림 작업 대상으로 남김. 제작 전 seasonal-food-illustrator로 기존 원본·체크리스트를 다시 확인                    |
| 미역       | O 상대, 기준         | `prototypes/seasonal-food/foods/wakame/food.mjs` 있음. 기존 원본 검수·재사용 및 배포 동기화 대상 확인               |
| 바나나     | O 상대, X 상대, 기준 | 새 그림 작업 대상으로 남김. 제작 전 seasonal-food-illustrator로 기존 원본·체크리스트를 다시 확인                    |
| 버터       | X 상대               | 새 그림 작업 대상으로 남김. 제작 전 seasonal-food-illustrator로 기존 원본·체크리스트를 다시 확인                    |
| 새송이버섯 | O 상대               | `prototypes/seasonal-food/foods/king-oyster-mushroom/food.mjs` 있음. 기존 원본 검수·재사용 및 배포 동기화 대상 확인 |
| 새우젓     | O 상대               | 새 그림 작업 대상으로 남김. 제작 전 seasonal-food-illustrator로 기존 원본·체크리스트를 다시 확인                    |
| 설탕       | X 상대               | 새 그림 작업 대상으로 남김. 제작 전 seasonal-food-illustrator로 기존 원본·체크리스트를 다시 확인                    |
| 소고기     | X 상대, 기준         | 새 그림 작업 대상으로 남김. 제작 전 seasonal-food-illustrator로 기존 원본·체크리스트를 다시 확인                    |
| 아몬드     | O 상대               | 새 그림 작업 대상으로 남김. 제작 전 seasonal-food-illustrator로 기존 원본·체크리스트를 다시 확인                    |
| 아보카도   | O 상대               | 새 그림 작업 대상으로 남김. 제작 전 seasonal-food-illustrator로 기존 원본·체크리스트를 다시 확인                    |
| 양송이버섯 | O 상대               | `prototypes/seasonal-food/foods/button-mushroom/food.mjs` 있음. 기존 원본 검수·재사용 및 배포 동기화 대상 확인      |
| 연어       | O 상대, 기준         | 새 그림 작업 대상으로 남김. 제작 전 seasonal-food-illustrator로 기존 원본·체크리스트를 다시 확인                    |
| 올리브유   | O 상대               | 새 그림 작업 대상으로 남김. 제작 전 seasonal-food-illustrator로 기존 원본·체크리스트를 다시 확인                    |
| 우유       | O 상대, X 상대, 기준 | 새 그림 작업 대상으로 남김. 제작 전 seasonal-food-illustrator로 기존 원본·체크리스트를 다시 확인                    |
| 자몽       | O 상대, X 상대       | 새 그림 작업 대상으로 남김. 제작 전 seasonal-food-illustrator로 기존 원본·체크리스트를 다시 확인                    |
| 참기름     | O 상대               | 새 그림 작업 대상으로 남김. 제작 전 seasonal-food-illustrator로 기존 원본·체크리스트를 다시 확인                    |
| 청경채     | O 상대               | `prototypes/seasonal-food/foods/bok-choy/food.mjs` 있음. 기존 원본 검수·재사용 및 배포 동기화 대상 확인             |
| 치즈       | O 상대, X 상대, 기준 | 새 그림 작업 대상으로 남김. 제작 전 seasonal-food-illustrator로 기존 원본·체크리스트를 다시 확인                    |
| 콩나물     | O 상대               | 새 그림 작업 대상으로 남김. 제작 전 seasonal-food-illustrator로 기존 원본·체크리스트를 다시 확인                    |
| 파인애플   | O 상대, X 상대       | `prototypes/seasonal-food/foods/pineapple/food.mjs` 있음. 기존 원본 검수·재사용 및 배포 동기화 대상 확인            |
| 팽이버섯   | O 상대               | `prototypes/seasonal-food/foods/enoki-mushroom/food.mjs` 있음. 기존 원본 검수·재사용 및 배포 동기화 대상 확인       |

## 후속 작업과 완료 조건

[공통 제작 안내와 프롬프트](../../../prototypes/seasonal-food/docs/seasonal-lists/requests/README.md#복사용-제작-프롬프트)와 [신규 21개 작도 요청서](../../../prototypes/seasonal-food/docs/seasonal-lists/requests/baby-food-pairings.md)를 사용한다.

- [ ] 1절의 기존 SVG를 콘텐츠에 재사용한다. 복사본을 새로 그리거나 생성 파일을 직접 수정하지 않는다.
- [ ] 2절의 이름 범위를 확정한다. 셀러리는 기존 샐러리와의 별칭 연결을 확인한다. 비타민은 음식 정체부터 확인한다.
- [ ] 3절 중 기존 원본이 있는 음식은 `/seasonal-food-illustrator`로 원본과 완성 상태를 확인해 재사용한다. 원본이 있다는 이유만으로 현재 배포 에셋이 있다고 표시하지 않는다.
- [ ] 3절의 나머지 이름과, 2절에서 기존 그림 재사용이 불가능하다고 결정한 이름을 별도 제작 단위로 나눈다. 계란과 달걀노른자, 게와 게살 등 부위·형태 차이를 보존한다.
- [ ] 실제 그리기 시작 전에 `seasonal-food-illustrator` 스킬을 읽고 적용한다. 체크리스트 예약과 기존 원본 보호 절차를 따른다. 이 티켓은 그리기 작업 착수·예약을 대신하지 않는다.
- [ ] 완성된 원본은 프로젝트 명령 `pnpm foods:sync`로 동기화하고 출처·생성 목록·bounds를 함께 검증한다. `prototypes/`가 없는 환경에서는 실행하지 않는다.
- [ ] 화면용 작은 크기와 음식별 궁합 인쇄물에서 음식 이름 없이도 구분되는지 확인한다.
- [ ] 이름 목록 변경 시 2절 원문에서 다시 추출해 누락·중복·실제 파일 존재를 재검사한다.

## 검증 기록

- 원문 표의 기준·O 상대·X 상대를 합쳐 고유 이름 90개를 추출했다.
- 재사용 49개 + 검토 12개 + 배포 그림 없음 29개 = 90개로 대조했다.
- 1절과 2절에 적힌 모든 `color.svg` 파일 존재를 확인했다. 3절의 명시된 `food.mjs` 원본도 확인했다.
- SVG·생성 파일·앱 코드·원본 그림은 수정하지 않았다.
