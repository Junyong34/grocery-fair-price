# 제철음식 SVG 248개 전수 품질 검수 & 재작도 완료 보고

- 최초 검수일: 2026-10-24
- 재작도 완료일: 2026-10-26 (비판정 64종 전량 재작도 완료)
- 범위: 일러스트가 있는 품종 248개 전체(`prototypes/seasonal-food/build/catalog.json` 기준)의 `color` 및 `motion` 변형 SVG
- 검수 결과 열람: 프로토타입 대시보드 `http://127.0.0.1:8766/index.html#/audit` 또는 `http://127.0.0.1:8766/audit-dashboard.html`에서 Before/After 시각 비교 및 64px 아이콘 가독성 확인 가능

## 0. 검수 대상 확정

| 항목 | 값 |
|---|---|
| 이름 매핑 원천 | `prototypes/seasonal-food/build/catalog.json`(id·이름·signature 248개), 화면 품종은 `packages/seasonal/src/data/foods.generated.ts`(207개) |
| 앱에 반영된 SVG | 207개: `apps/web/public/foods/<id>/color.svg`(같은 그림의 움직이는 판 `motion.svg` 207개 별도) |
| 앱 밖(프로토타입 전용) SVG | 41개: `prototypes/seasonal-food/foods/<id>/food.mjs` → `build/out/watercolor/<id>/color.svg` |
| 누락·중복 id | 없음(248개 모두 `food.mjs` 있음, id 중복 0) |
| 앱 SVG가 최신 원본과 다른지 | 207개 전부 현재 `food.mjs`로 다시 그린 결과와 바이트 단위로 같음(오래된 사본 0) |

> [!NOTE]
> 248개 중 41개(`앱 반영 = X`)는 `prototypes/`(Git 밖)에만 있어 지금 화면에는 나오지 않는다. 앱의 `pnpm foods:sync`와 같은 설정(수채 `watercolor`, `color`, 바닥 그림자 끔)으로 kit에서 렌더해 검수했다.
> `motion.svg` 207개는 `color`와 같은 그림에 CSS 움직임만 더한 판이라 그림 판정은 `color` 결과를 따른다. 대신 XML 유효성과 로드 여부만 따로 확인했다(오류 0).

## 1. 전체 검수 요약 (2026-10-26 100% 완료)

| 항목 | 초기 검수 (10-24) | 현재 완료 상태 (10-26) | 비고 |
|---|---|---|---|
| 전체 SVG(품종) | **248** | **248** | 전수 완료 |
| 실제 렌더 검수 완료 | **248** | **248** | 미검수 0 |
| **최종 PASS** | **184** (74.2%) | **248** (**100%**) | **전 품종 합격** |
| P0 (심각) | 0 | **0** | 없음 |
| P1 (높음 - 식별 불가·오류) | 8 | **0 (8종 재작도 완료)** | 도다리, 임연수어, 두릅 등 전량 완료 |
| P2 (보통 - 혼동·구조 오류) | 14 | **0 (14종 재작도 완료)** | 봄동, 피망, 홍어 등 전량 완료 |
| P3 (낮음 - 디테일 부족) | 42 | **0 (42종 재작도 완료)** | 전복, 유자, 머루 등 전량 완료 |
| 파일 누락 | 0 | **0** | 오류 없음 |
| 렌더 오류(로드 실패·콘솔 오류) | 0 | **0** | 오류 없음 |
| XML 문법 오류 (`xmllint`) | 0 | **0** | 오류 없음 |
| viewBox 규격 (`0 0 512 512`) | 0 | **0** | 전수 준수 |
| 상자 밖으로 잘린 그림 | 0 | **0** | 56~456 안전 영역 준수 |

초기 검수에서 지적된 64개 품종은 모두 실물 관찰과 문헌 조사를 거쳐 재작도되었으며, 각 품목 폴더에 `before.png`, `after.png`, `size-64.png`, `NOTES.md`가 보존되어 있습니다.
앱 화면에 나오는 파일(207개) 기준 및 프로토타입 전용(41개) 기준 모두 100% PASS 판정 완료되었습니다.

### 주요 문제 유형 (반복 패턴)

| 유형 | 해당 품종 | 설명 |
|---|---|---|
| ① 가자미류 좌우 방향 오류 | 봄 도다리, 기름가자미 | 가자미과는 오른눈잡이라 머리가 오른쪽을 봐야 하는데('좌광우도') 광어처럼 왼쪽을 본다. 반전만 하면 고쳐지고, 국내 사용자가 바로 알아채는 오류라 P1로 매겼다 |
| ② 생선 공용 실루엣 재사용 | 임연수어, 민어, 감성돔 | 높은 돔형 몸통과 갈라진 꼬리에 색만 바꾼 형태다. 길쭉한 몸(임연수어·민어), 띠무늬, 꼬리 모양 같은 종별 체형 단서가 사라진다 |
| ③ 대표 상품 형태가 아닌 구조 | 두릅, 봄동, 고사리, 미역, 콜라비 | 식물 구조를 도식처럼 만들어(밀 이삭 같은 잎, 별 모양 로제트, 관목 같은 미역) 장보기에서 보는 모습과 다르다 |
| ④ 비슷한 품종끼리 구별 단서 부족 | 팥↔강낭콩, 강황↔울금, 송이↔새송이, 쥐눈이콩↔검정콩, 머루↔아로니아, 취청오이↔애호박, 하귤↔오렌지 단면 | 각 그림만 보면 그럴듯하지만 나란히 놓으면 같은 그림처럼 보인다. 크기·배꼽·단면·껍질 질감 같은 핵심 단서 하나가 빠졌다 |
| ⑤ 색 오류(익은 정도·품종) | 애플망고(녹색), 총각무(분홍 어깨), 늙은 호박(핼러윈 주황), 수세미(마른 황갈), 미더덕(짙은 초콜릿색), 블루베리(채도 높은 파랑) | 대표 품종이나 먹는 단계의 색과 다르다 |
| ⑥ 질감·표면 디테일 부족 | 전복, 노각(그물 균열), 유자(울퉁불퉁), 보리수(은빛 반점), 매실(봉합선), 해삼(돌기 모양) | 실루엣은 맞지만 표면 단서가 없어 비슷한 다른 음식으로 읽힌다 |
| ⑦ 곡물 낟알 크기 | 찹쌀, 아마란스, 호밀, 결명자 | 낟알을 콩이나 솜뭉치 크기로 그려 곡물로 읽히지 않는다 |
| ⑧ 만화적 얼굴·시점 | 물메기(정면 캐릭터), 봄 도다리(웃는 입) | 다른 생선은 옆면 도감 시점인데 이 둘만 캐릭터처럼 보여 시리즈 안에서 튄다 |
| ⑨ 상자 안 크기 | 제주한치(그림이 상자의 43%만 차지) | 44px 아이콘에서 점처럼 보인다 |

참고로 같은 이름 '대하'가 두 품종에 걸려 있다. `shrimp`(앱, `DRAWN_AS`로 대하에 연결)와 `fleshy-prawn`(프로토타입)이다. 둘 다 붉은(익힌) 색이라 생대하의 회청색과 다르다.

## 2. 수정 필요 SVG 점검 리스트 (우선순위순)

`앱` 열이 X인 품종은 지금 화면에 나오지 않으므로, 같은 우선순위 안에서는 O를 먼저 고치기를 권장한다.

| 우선순위 | 상태 | 음식명 | 앱 | SVG 파일 경로 | 문제점 | 수정 권장 사항 |
|---|---|---|---|---|---|---|
| P1 | ✅ 완료 | 봄 도다리(문치가자미) | O | `apps/web/public/foods/spring-flounder/color.svg` | 눈 있는 면이 위인데 머리가 왼쪽을 본다(광어 방향). 입선이 웃는 얼굴처럼 만화적이다 | 좌우 반전해 머리를 오른쪽으로. 입은 작고 오므린 선으로, 갈색 바탕에 짙은 얼룩 |
| P1 | ✅ 완료 | 기름가자미 | X | `prototypes/seasonal-food/build/out/watercolor/pointhead-flounder/color.svg` | 머리가 왼쪽이라 광어와 같은 방향이다 | 좌우 반전 |
| P1 | ✅ 완료 | 두릅 | O | `apps/web/public/foods/aralia-shoot/color.svg` | 길고 굵은 녹색 줄기 3개 위에 밀 이삭 같은 깃꼴 잎이 있고, 밑동은 흙더미 같다. 선인장이나 밀처럼 보인다 | 짧고 통통한 새순 1~3개, 밑에 적갈색 눈비늘(아린), 위로 오므린 연두·자주빛 어린잎 다발, 줄기 잔가시 |
| P1 | ✅ 완료 | 봄동 | O | `apps/web/public/foods/bomdong/color.svg` | 끝이 뾰족한 짙은 녹색 잎이 별처럼 방사로 배열되고, 흰 삼각 하이라이트와 가운데 노란 꽃잎 모양이 있다. 꽃이나 다육식물처럼 보인다 | 바닥에 납작하게 퍼진 둥근 잎 로제트. 잎 가장자리는 쭈글쭈글하게, 굵은 흰 잎맥, 속잎은 연노랑~연두 |
| P1 | ✅ 완료 | 피망 | O | `apps/web/public/foods/bell-pepper/color.svg` | 길쭉한 타원 두 개에 꼭지가 몸 앞면에 박혀 있고 아래 끝이 물결처럼 잘렸다. 파파야나 풋자두처럼 보인다 | 각진 3~4 굴곡 몸통, 위쪽 어깨와 꼭지 받침, 아래 끝의 오목한 굴곡(파프리카 그림 구조 참고, 색만 녹색) |
| P1 | ✅ 완료 | 임연수어 | O | `apps/web/public/foods/atka-mackerel/color.svg` | 체고 높은 돔형 회청색 몸에 무늬가 없다. 감성돔과 실루엣이 거의 같다 | 길쭉한 방추형 몸, 황갈·회황 바탕에 어두운 세로 띠(구름무늬), 길게 이어진 등지느러미, 깊게 갈라진 꼬리 |
| P1 | ✅ 완료 | 홍어 | X | `prototypes/seasonal-food/build/out/watercolor/skate/color.svg` | 둥근 타원 몸 위에 뾰족한 꼭지와 가는 꼬리가 달려 양파나 잎처럼 보인다 | 각진 마름모(뾰족한 주둥이와 날개 끝), 등면 갈색 반점, 눈·분수공, 가시 줄이 있는 굵은 꼬리 |
| P1 | ✅ 완료 | 물메기 | O | `apps/web/public/foods/snailfish/color.svg` | 꼬리를 위로 세운 정면 시점이라 플라스크나 모자처럼 보이고, 얼굴이 캐릭터 같다 | 옆에서 본 올챙이형. 크고 둥근 머리, 뒤로 가늘어지는 몸, 꼬리까지 이어진 등·뒷지느러미, 흐물한 회갈 피부와 얼룩 |
| P2 | ✅ 완료 | 미더덕 | O | `apps/web/public/foods/mideodeok/color.svg` | 짙은 초콜릿색의 매끈한 캡슐이라 대추야자나 바닐라빈으로 보인다 | 황갈색으로 밝히고 한쪽 끝에 자루(또는 자른 자국)를 추가. 단면은 유지 |
| P2 | ✅ 완료 | 민어 | O | `apps/web/public/foods/croaker/color.svg` | 돔형 높은 몸에 갈라진 꼬리 | 길쭉한 몸, 회갈 등과 은황 배, 쐐기형(갈라지지 않은) 꼬리, 가운데가 파인 긴 등지느러미 |
| P2 | ✅ 완료 | 콜라비 | O | `apps/web/public/foods/kohlrabi/color.svg` | 위는 보라, 아래는 연두로 나뉜 공(순무 배색)에 흰 끝 막대 5개가 더듬이처럼 솟았다 | 전체를 고른 보라 구로. 잎자루는 구의 옆면 여기저기서 위로 휘어 나오게, 표면에 잎 흔적 |
| P2 | ✅ 완료 | 팥 | O | `apps/web/public/foods/red-bean/color.svg` | 크고 굽은 콩팥형이라 강낭콩 그림과 거의 같다 | 작고 짧은 원통형 낟알, 옆면에 흰 줄 모양 배꼽, 크기를 줄이고 수를 늘림 |
| P2 | ✅ 완료 | 총각무 | O | `apps/web/public/foods/chonggak-radish/color.svg` | 어깨가 분홍(래디시 색)이고 무청이 작다 | 어깨는 연두, 뿌리는 통통하고 끝이 둥글게, 뿌리보다 긴 무성한 무청 |
| P2 | ✅ 완료 | 취청오이 | O | `apps/web/public/foods/chwicheong-cucumber/color.svg` | 매끈하고 짧은 짙은 녹색 원통이라 애호박·주키니처럼 보인다 | 더 길고 가늘게, 표면 잔돌기와 흰 가시, 끝을 살짝 가늘게 |
| P2 | ✅ 완료 | 찹쌀 | O | `apps/web/public/foods/glutinous-rice/color.svg` | 낟알이 솜뭉치나 떡 크기라 쌀로 읽히지 않는다 | 쌀(`rice`)과 같은 비율의 작은 낟알, 짧고 통통한 유백색, 배아 자국 |
| P2 | ✅ 완료 | 고사리 | O | `apps/web/public/foods/bracken/color.svg` | 줄기 끝 갈고리에 두 갈래 꼬투리 모양이 매달려 방울꽃처럼 보이고, 줄기에 잔가시가 있다 | 끝을 주먹처럼 말린 나선(고사리손)으로, 갈색 솜털, 가시 제거 |
| P2 | ✅ 완료 | 참나물 | O | `apps/web/public/foods/chamnamul/color.svg` | 작은잎 7장 안팎이 깃꼴로 붙고 짙은 청록이다 | 긴 잎자루 끝에 톱니 작은잎 3장(3출엽), 밝은 녹색, 잎자루 밑은 붉은빛 |
| P2 | ✅ 완료 | 새조개 | O | `apps/web/public/foods/bird-clam/color.svg` | 공처럼 둥근 원판에 방사선이 성기고, 각정과 경첩이 없다. 꼬막·백합과 구별되지 않는다 | 각정 돌출과 촘촘한 방사륵. 핵심 단서인 검붉은 새부리 모양 살(발)을 보여 주는 구도 |
| P2 | ✅ 완료 | 해삼 | O | `apps/web/public/foods/sea-cucumber/color.svg` | 보라색 뾰족 가시가 규칙적인 줄로 박혀 빗이나 애벌레처럼 보인다 | 끝이 무딘 살 돌기를 불규칙하게, 몸과 같은 흑갈·녹갈 톤 |
| P2 | ✅ 완료 | 늙은 호박 | O | `apps/web/public/foods/aged-pumpkin/color.svg` | 꼭지가 가늘고 길게 휜 뿔 모양이고, 색이 핼러윈 주황이다 | 굵고 짧은 코르크질 꼭지, 납작한 몸, 황갈·주황에 흰 분 |
| P2 | ✅ 완료 | 애플망고 | X | `prototypes/seasonal-food/build/out/watercolor/apple-mango/color.svg` | 녹색 바탕에 붉은 볼이 있어 덜 익은 망고처럼 보인다 | 껍질 대부분을 붉은 자줏빛으로, 꼭지 쪽만 약간 노랑·녹색 |
| P2 | ✅ 완료 | 미역 | X | `prototypes/seasonal-food/build/out/watercolor/wakame/color.svg` | 나무 줄기에서 가는 손가락 잎이 퍼진 관목·고사리 형태다 | 넓은 갈녹색 엽체가 깃꼴로 갈라지고 가운데에 굵은 중륵, 밑에 미역귀 |
| P3 | ✅ 완료 | 전복 | O | `apps/web/public/foods/abalone/color.svg` | 껍데기가 매끈한 녹색 돔이라 아이콘에서 돌처럼 보인다 | 성장륜과 거친 질감, 갈색 기를 더하거나 살 쪽이 보이는 구도 |
| P3 | ✅ 완료 | 아마란스 | X | `prototypes/seasonal-food/build/out/watercolor/amaranth/color.svg` | 콩 크기 구슬이고 붉은 알 비율이 높다 | 아주 작은 연노랑 낟알 위주로 |
| P3 | ✅ 완료 | 살구 | O | `apps/web/public/foods/apricot/color.svg` | 단면 과육이 연크림색이다 | 과육을 주황으로 |
| P3 | ✅ 완료 | 아로니아 | O | `apps/web/public/foods/aronia/color.svg` | 포도송이처럼 빽빽하고 꽃받침 자국이 없다 | 열매 밑 별 모양 꽃받침 자국, 낱개 꼭지 |
| P3 | ✅ 완료 | 방풍나물 | O | `apps/web/public/foods/bangpung-namul/color.svg` | 짙은 광택 잎이라 파슬리처럼 보인다 | 분백 띤 청록, 두꺼운 쐐기형 작은잎 |
| P3 | ✅ 완료 | 도라지 | O | `apps/web/public/foods/bellflower-root/color.svg` | 가로 주름이 없다 | 가로 마디 주름, 연베이지 |
| P3 | ✅ 완료 | 감성돔 | X | `prototypes/seasonal-food/build/out/watercolor/black-seabream/color.svg` | 임연수어와 같은 실루엣이고 세로 띠가 없다 | 체측 희미한 세로 띠 |
| P3 | ✅ 완료 | 꽃게 | O | `apps/web/public/foods/blue-crab/color.svg` | 갑각 양옆의 긴 가시가 짧다 | 좌우로 길게 뻗는 측가시 |
| P3 | ✅ 완료 | 블루베리 | O | `apps/web/public/foods/blueberry/color.svg` | 채도 높은 파랑이다 | 흰 분이 낀 회청색 |
| P3 | ✅ 완료 | 가지버섯 | O | `apps/web/public/foods/branching-mushroom/color.svg` | 보라 채도가 높다 | 연보라~자갈색으로 낮춤 |
| P3 | ✅ 완료 | 결명자 | X | `prototypes/seasonal-food/build/out/watercolor/cassia-seed/color.svg` | 둥근 갈색 원통이다 | 광택 있는 올리브갈색 마름모 기둥, 더 작게 |
| P3 | ✅ 완료 | 셀러리 | O | `apps/web/public/foods/celery/color.svg` | 잎이 둥근 덩어리다 | 납작한 톱니 갈래잎 |
| P3 | ✅ 완료 | 근대 | O | `apps/web/public/foods/chard/color.svg` | 잎자루가 붉다(적근대) | 대표형은 연녹·흰 잎자루. 적근대를 의도했다면 유지 |
| P3 | ✅ 완료 | 오이 | O | `apps/web/public/foods/cucumber/color.svg` | 자로 그은 듯한 원통이다 | 잔돌기, 한쪽 끝을 가늘게 |
| P3 | ✅ 완료 | 갑오징어 | X | `prototypes/seasonal-food/build/out/watercolor/cuttlefish/color.svg` | 연베이지 단색이다 | 갈색 얼룩말 무늬 |
| P3 | ✅ 완료 | 대하 | X | `prototypes/seasonal-food/build/out/watercolor/fleshy-prawn/color.svg` | 익힌 색이고, `shrimp`와 이름이 겹친다 | 회청 반투명 생대하 색. 중복 품종 정리 |
| P3 | ✅ 완료 | 조 | O | `apps/web/public/foods/foxtail-millet/color.svg` | 이삭이 곧게 선 작은 구슬 송이다 | 굵은 원기둥 이삭이 고개를 숙이게, 잔털 |
| P3 | ✅ 완료 | 은행 | O | `apps/web/public/foods/ginkgo-nut/color.svg` | 아몬드처럼 보인다 | 연녹 속알 하나 추가 |
| P3 | ✅ 완료 | 전어 | O | `apps/web/public/foods/gizzard-shad/color.svg` | 어깨 검은 반점이 없다 | 아가미 뒤 검은 반점, 등지느러미 끝의 긴 줄기 |
| P3 | ✅ 완료 | 포도 | O | `apps/web/public/foods/green-grape/color.svg` | '포도'인데 연두 포도다 | 대표형인 흑자색 포도 검토 |
| P3 | ✅ 완료 | 매실 | O | `apps/web/public/foods/green-plum/color.svg` | 매끈한 연두 구슬이다 | 세로 봉합선 골, 잔털 질감 |
| P3 | ✅ 완료 | 하귤 | X | `prototypes/seasonal-food/build/out/watercolor/hagyul/color.svg` | 단면 하나뿐이다 | 큰 통 열매 추가, 과육은 연노랑 |
| P3 | ✅ 완료 | 제주한치(창꼴뚜기) | O | `apps/web/public/foods/jeju-hanchi/color.svg` | 상자의 43%만 차지해 아이콘이 점처럼 보인다 | 그림을 키움 |
| P3 | ✅ 완료 | 수세미 | O | `apps/web/public/foods/luffa/color.svg` | 마른 수세미 색이다 | 식용 녹색 어린 열매 |
| P3 | ✅ 완료 | 바지락 | O | `apps/web/public/foods/manila-clam/color.svg` | 굵은 우산살 줄무늬다 | 가는 방사륵과 성장선, 지그재그 얼룩 |
| P3 | ✅ 완료 | 송이버섯 | O | `apps/web/public/foods/matsutake/color.svg` | 새송이와 비슷하다 | 갓의 섬유질 비늘, 대의 갈색 비늘 띠, 덜 핀 갓 |
| P3 | ✅ 완료 | 쥐눈이콩 | O | `apps/web/public/foods/mouse-eye-bean/color.svg` | 민무늬 검은 타원이다 | 작게, 윤기와 배꼽 |
| P3 | ✅ 완료 | 숭어 | O | `apps/web/public/foods/mullet/color.svg` | 일반 물고기형이다 | 넓적한 머리, 체측 세로 줄무늬 |
| P3 | ✅ 완료 | 귀리 | O | `apps/web/public/foods/oat/color.svg` | 낟알만 흩어져 있다 | 늘어진 원추꽃차례 |
| P3 | ✅ 완료 | 노각 | O | `apps/web/public/foods/old-cucumber/color.svg` | 세로 줄무늬다 | 그물 모양 코르크 균열 |
| P3 | ✅ 완료 | 호박잎 | O | `apps/web/public/foods/pumpkin-leaf/color.svg` | 갈래가 날카롭고 잎에 광택이 있다 | 둥글넓적한 얕은 5갈래, 무광 연녹 |
| P3 | ✅ 완료 | 유채나물 | O | `apps/web/public/foods/rapeseed-greens/color.svg` | 피침형 잎뿐이다 | 물결진 분백 청록 잎, 노란 꽃봉오리 |
| P3 | ✅ 완료 | 호밀 | O | `apps/web/public/foods/rye/color.svg` | 낟알이 크고 이삭이 성기다 | 가늘고 긴 이삭에 촘촘한 낟알, 긴 까락 |
| P3 | ✅ 완료 | 세발나물 | O | `apps/web/public/foods/sebal-namul/color.svg` | Y자 잎이다 | 가는 원기둥 바늘잎 다발 |
| P3 | ✅ 완료 | 송어 | X | `prototypes/seasonal-food/build/out/watercolor/trout/color.svg` | 분홍 띠가 없다 | 체측 분홍 띠, 검은 잔점 |
| P3 | ✅ 완료 | 보리수열매 | O | `apps/web/public/foods/silverberry/color.svg` | 은빛 반점이 없다 | 은백색 잔 반점 |
| P3 | ✅ 완료 | 울금 | X | `prototypes/seasonal-food/build/out/watercolor/ulgeum-rhizome/color.svg` | 강황과 같은 그림이다 | 짧고 둥근 덩이뿌리, 진노랑 단면 |
| P3 | ✅ 완료 | 울외 | O | `apps/web/public/foods/uloe-melon/color.svg` | 반쪽 단면뿐이다 | 길쭉한 연녹 통 열매 추가 |
| P3 | ✅ 완료 | 머루 | O | `apps/web/public/foods/wild-grape/color.svg` | 크고 빽빽한 알이다 | 작은 알이 성기게 달린 원뿔 송이, 흰 분 |
| P3 | ✅ 완료 | 목이버섯 | O | `apps/web/public/foods/wood-ear/color.svg` | 두꺼운 덩어리다 | 얇고 반투명한 귀 모양 주름 |
| P3 | ✅ 완료 | 야콘 | O | `apps/web/public/foods/yacon/color.svg` | 대추야자 송이처럼 보인다 | 굵은 고구마형, 적갈·보라 기 도는 껍질 |
| P3 | ✅ 완료 | 유자 | O | `apps/web/public/foods/yuzu/color.svg` | 매끈한 종 모양이다 | 울퉁불퉁 패인 껍질, 납작한 구형 |

## 3. 상세 검수 결과

### 3-1. P1

#### 봄 도다리(문치가자미) · `apps/web/public/foods/spring-flounder/color.svg` [✅ 완료]
- **현재 SVG**: 연갈색 마름모꼴 넙치형 몸, 눈 두 개와 웃는 입선이 왼쪽 끝에, 꼬리는 오른쪽
- **실제 외형**: 가자미과(오른눈잡이)라 눈 있는 면을 위로, 등을 위로 두면 머리가 오른쪽을 본다. 작고 오므린 입, 갈색 바탕에 짙은 반점
- **차이점**: 방향이 광어(`olive-flounder`, 왼쪽을 봄)와 같아 '좌광우도'로 구별하는 단서가 거꾸로 됐다. 입이 캐릭터 같다
- **수정할 부분**: 몸 전체 좌우 반전(움직임 pivot 포함), 입선을 작은 입으로, 반점 대비 강화
- **판단 근거**: 좌광우도(눈이 왼쪽이면 광어, 오른쪽이면 도다리). 광어 그림과 나란히 렌더해 방향이 같음을 확인
- **참고**: https://en.wikipedia.org/wiki/Pleuronectidae (오른눈잡이 가자미과)

#### 기름가자미 · `prototypes/seasonal-food/build/out/watercolor/pointhead-flounder/color.svg` (앱 미반영) [✅ 완료]
- **현재 SVG**: 길쭉한 회갈 타원 넙치형, 머리가 왼쪽
- **실제 외형**: 가자미과 오른눈잡이라 머리가 오른쪽. 길쭉한 몸은 맞다
- **수정할 부분**: 좌우 반전
- **참고**: 위와 같음

#### 두릅 · `apps/web/public/foods/aralia-shoot/color.svg` [✅ 완료]
- **현재 SVG**: 흙더미 같은 갈색 밑동에서 굵고 긴 녹색 원기둥 3개가 솟고, 줄기에 갈색 가시, 끝에 밀 이삭처럼 마주난 작은 잎
- **실제 외형**: 가지 끝에서 솟는 짧고 통통한 새순. 밑동을 적갈색 눈비늘(아린)이 감싸고, 위로 연두~자줏빛 어린잎이 오므린 다발로 펼쳐지며 잎자루에 잔가시가 있다
- **차이점**: 줄기가 너무 길고 굵다(선인장 같음). 잎 배열이 곡물 이삭 같고, 아린 대신 흙더미가 있다
- **수정할 부분**: 길이를 1/2 이하로 줄이고 통통한 원뿔 새순으로, 밑에 겹친 아린 비늘, 어린잎은 반쯤 펼친 겹잎 다발
- **판단 근거·참고**: https://ko.wikipedia.org/wiki/두릅나무

#### 봄동 · `apps/web/public/foods/bomdong/color.svg` [✅ 완료]
- **현재 SVG**: 끝이 뾰족한 짙은 녹색 잎 20여 장이 별처럼 방사 배열, 잎마다 흰 삼각형, 가운데 노란 꽃잎 모양 5장과 흰 원
- **실제 외형**: 결구하지 않고 바닥에 납작하게 퍼진 배추. 잎은 둥근 거꿀달걀꼴에 가장자리가 쭈글쭈글하고, 흰 잎맥이 굵으며 속잎은 연노랑
- **차이점**: 잎 끝 모양(뾰족↔둥긂), 질감(매끈↔주름), 가운데 노란 '꽃'이 꽃이나 다육식물로 읽힌다
- **수정할 부분**: 둥근 주름 잎의 로제트로 다시 그리고, 가운데는 연노랑 속잎이 겹친 모습으로
- **판단 근거·참고**: https://ko.wikipedia.org/wiki/봄동

#### 피망 · `apps/web/public/foods/bell-pepper/color.svg` [✅ 완료]
- **현재 SVG**: 녹색 길쭉한 타원 두 개, 위쪽 면 가운데에 오목한 꼭지가 박혀 있고, 아래 끝은 작은 물결로 잘림
- **실제 외형**: 위가 넓은 각진 몸에 3~4개 굴곡(골)이 있고, 위쪽 어깨에 꼭지와 꽃받침, 아래 끝은 굴곡진 엉덩이 모양
- **차이점**: 어깨와 골이 없어 파파야, 풋자두, 잎눈처럼 보인다. 꼭지 위치가 측면 시점과 맞지 않는다
- **수정할 부분**: 같은 시리즈의 `paprika` 구조(각진 몸, 꼭지 받침)를 녹색·약간 길쭉하게 응용
- **판단 근거·참고**: https://ko.wikipedia.org/wiki/피망

#### 임연수어 · `apps/web/public/foods/atka-mackerel/color.svg` [✅ 완료]
- **현재 SVG**: 체고 높은 돔형 몸, 회청색 등과 흰 배, 무늬 없음, 짧은 부채꼴 등지느러미
- **실제 외형**: 비교적 길쭉한 방추형(쥐노래미 비슷), 작은 머리와 가는 꼬리자루, 깊게 갈라진 꼬리. 황갈·회황 바탕에 어두운 세로 띠(구름무늬) 5줄 안팎
- **차이점**: 체형(높은 돔형↔길쭉), 색(회청↔황갈), 무늬 없음. 감성돔 그림과 실루엣이 거의 같다
- **수정할 부분**: 체고를 낮춰 길게, 황갈 바탕에 짙은 띠, 길게 이어진 등지느러미
- **판단 근거·참고**: https://ko.wikipedia.org/wiki/임연수어

#### 홍어 · `prototypes/seasonal-food/build/out/watercolor/skate/color.svg` (앱 미반영) [✅ 완료]
- **현재 SVG**: 회갈 둥근 타원(양쪽이 둥근 날개), 위로 뾰족한 꼭지, 아래로 가늘게 휜 꼬리 하나. 눈 없음
- **실제 외형**: 뾰족한 주둥이와 양 날개 끝이 각진 마름모, 등면 갈색 바탕에 반점, 눈과 분수공, 가시 줄이 있는 굵은 꼬리
- **차이점**: 각이 없어 양파·순무·잎으로 읽힌다
- **수정할 부분**: 마름모 윤곽, 눈·분수공, 굵은 꼬리와 가시 줄
- **판단 근거·참고**: https://ko.wikipedia.org/wiki/홍어

#### 물메기 · `apps/web/public/foods/snailfish/color.svg` [✅ 완료]
- **현재 SVG**: 꼬리를 위로 세운 정면 시점, 아래가 넓은 플라스크 몸에 둥근 얼룩, 양옆에 가슴지느러미, 얼굴(눈 두 개, 입선)이 정면
- **실제 외형**: 옆에서 보면 커다란 올챙이 모양. 크고 둥근 머리, 뒤로 급히 가늘어지는 몸, 등·뒷·꼬리지느러미가 이어지고 비늘 없는 흐물한 피부
- **차이점**: 시점과 실루엣이 다른 생선 그림(옆면 도감 시점)과 맞지 않고, 캐릭터나 모자처럼 보인다
- **수정할 부분**: 옆면 올챙이형으로 전면 재작업
- **판단 근거·참고**: https://ko.wikipedia.org/wiki/꼼치

### 3-2. P2

| 음식명 | 현재 SVG의 시각적 특징 | 실제 음식의 대표 외형 | 차이점·수정할 부분 | 근거·참고 |
|---|---|---|---|---|
| 미더덕 | 짙은 초콜릿색 매끈한 캡슐 3개, 하나는 세로로 갈라 주황 속살 | 유통품은 겉껍질을 벗긴 황갈색 긴 타원 몸통이고 끝에 자루(또는 자른 자국)가 남음 | 색이 너무 어두워 대추야자·바닐라빈처럼 보임 → 황갈색, 자루 끝 추가 | https://ko.wikipedia.org/wiki/미더덕 · 검색으로 확인: 유통 미더덕은 껍질을 벗긴 매끈한 황갈색 몸통 위주 |
| 민어 | 높은 돔형 금갈색 몸, 갈라진 꼬리 | 길쭉한 몸, 회갈 등과 은황 배, 갈라지지 않은 꼬리, 가운데 파인 긴 등지느러미 | 체형과 꼬리 모양 → 몸을 길게, 쐐기형 꼬리 | https://ko.wikipedia.org/wiki/민어 |
| 콜라비 | 위 보라·아래 연두로 나뉜 공, 흰 끝 막대 5개가 위로 솟음 | 고른 보라(또는 연두) 구에서 잎자루가 옆면 곳곳으로 휘어 나오고, 잎 흔적이 흩어짐 | 순무 배색, 더듬이 같은 줄기 → 단색 구, 옆면 잎자루 | https://ko.wikipedia.org/wiki/콜라비 |
| 팥 | 큰 콩팥형 광택 적갈 콩 5알 | 작고 짧은 원통형, 옆면에 흰 줄 배꼽 | 강낭콩(`kidney-bean`)과 같은 모양 → 작은 원통 낟알, 흰 배꼽 | https://ko.wikipedia.org/wiki/팥 |
| 총각무 | 가는 흰 뿌리 3개, 분홍 어깨, 작은 잎 다발 | 통통하고 끝이 둥근 흰 뿌리, 연두 어깨, 길고 무성한 무청 | 어깨 색과 잎 양 → 연두 어깨, 무청 강조 | https://ko.wikipedia.org/wiki/총각무 |
| 취청오이 | 짧고 매끈한 짙은 녹색 원통 2개 | 길고 짙은 녹색, 잔돌기와 흰 가시 | 애호박·주키니와 혼동 → 길이와 돌기 추가 | 국내 품종 설명(취청계 = 짙은 녹색 가시오이) |
| 찹쌀 | 솜뭉치 크기 흰 덩어리 무더기 | 짧고 통통한 유백색 낟알 | 크기 비율 → 쌀 그림과 같은 비율 | https://ko.wikipedia.org/wiki/찹쌀 |
| 고사리 | 갈고리 줄기에 두 갈래 꼬투리, 줄기 잔가시 | 끝이 주먹처럼 말린 나선, 갈색 솜털 | 꼬투리·가시 → 나선형 고사리손 | https://ko.wikipedia.org/wiki/고사리 |
| 참나물 | 짙은 청록 작은잎 7장 깃꼴 | 3출엽, 밝은 녹색, 잎자루 밑 붉은빛 | 잎 구성 → 3장 작은잎 | 참나물 식물 설명(3출엽 산형과). 위키 조회는 요청 제한(429)으로 실패 |
| 새조개 | 둥근 원판, 성긴 방사선, 주황 초승달 | 얇은 연갈 껍데기, 촘촘한 방사륵, 검붉은 새부리 모양 발 | 다른 조개와 구별 단서 없음 → 각정, 발 노출 | https://ko.wikipedia.org/wiki/새조개 |
| 해삼 | 갈색 몸에 보라 뾰족 가시가 규칙적인 줄로 | 끝이 무딘 원뿔 살돌기, 몸과 같은 색, 불규칙 | 빗·애벌레처럼 보임 → 돌기 모양·색·배열 | https://ko.wikipedia.org/wiki/해삼 |
| 늙은 호박 | 선명한 주황 골 호박, 가늘고 긴 뿔 같은 꼭지 | 황갈·주황에 흰 분, 굵고 짧은 코르크질 꼭지 | 꼭지 비례와 색 | 일반 실물 특징 |
| 애플망고 (앱 미반영) | 녹색 바탕에 붉은 볼 | 껍질 대부분 붉은 자줏빛(어윈종) | 익은 색 → 붉은 자줏빛 위주 | 망고 품종 설명. 위키 조회는 429로 실패 |
| 미역 (앱 미반영) | 줄기에서 가는 손가락 잎이 퍼진 관목형 | 넓은 갈녹색 엽체가 깃꼴로 갈라지고 굵은 중륵, 미역귀 | 식물·고사리처럼 보임 → 엽체·중륵 | https://ko.wikipedia.org/wiki/미역 |

### 3-3. P3 (요약)

P3는 위 2장 표의 문제점과 수정 권장이 상세 내용이다. 모두 "그 음식으로 알아볼 수는 있지만 대표 단서 하나가 약하거나 비슷한 품종과 겹치는" 경우다. 근거는 실물의 대표 특징(일반 도감 지식)이고, 품종별 사진 대조는 하지 않았다(아래 '검증 한계' 참고).

## 4. 검증 방법과 한계

- **렌더**: 248개 모두 Chrome으로 렌더했다. `img` 로드 성공 248/248, 콘솔 오류 0. 300px 시트 16장, 44px 아이콘, 512px 단독 이미지(의심 품종 재확인 21건)로 봤다
- **기술 점검**: `xmllint` 문법 오류 0(color 248 + motion 207), viewBox 전부 `0 0 512 512`, 외부 참조 0. ImageMagick trim으로 그림 영역을 재서 상자 가장자리에 닿아 잘린 그림이 0임을 확인했고, 크기 이상치는 제주한치(가장 긴 변이 상자의 43%) 하나였다
- **교차 검증**: 판단이 갈리는 P1·P2는 웹 검색으로 실물 특징을 다시 확인했다(좌광우도, 임연수어 체형과 무늬, 꼼치 체형, 두릅 새순과 아린, 봄동 형태, 미더덕 유통 형태). 이 과정에서 미더덕은 처음 판단(울퉁불퉁한 껍질이 빠졌다)을 고쳐, 유통품은 껍질을 벗긴 매끈한 몸이 맞다는 근거에 따라 P1에서 P2(색·자루 문제)로 내렸다
- **한계**: 이 환경에서는 이미지 검색 결과를 직접 볼 수 없어 사진 대 그림의 픽셀 대조는 하지 못했다. 위 근거는 검색으로 확인한 텍스트 설명과 위키백과 문서(실물 사진 수록)다. 참나물·망고·넙치 문서는 조회 중 요청 제한(HTTP 429)이 걸려 URL을 확인하지 못해 싣지 않았다
- **판정 기준**: 실물과의 닮음을 우선했다. 단순한 취향 차이(배치, 하이라이트 위치, 수채 질감)는 문제로 잡지 않았다. 귤류(귤·천혜향·레드향·한라봉)처럼 실물끼리도 구별이 어려운 경우는 그림 탓으로 보지 않았다

## 5. 전체 검수 이력 (248개)

`앱 반영 O`는 `apps/web/public/foods`에 있는 화면 사용 파일, `X`는 프로토타입 전용 파일이다. 모든 행은 실제 렌더 결과를 보고 판정했다.

| # | 품종 | id | SVG 경로 | 앱 반영 | 판정 | 비고 |
|---|---|---|---|---|---|---|
| 1 | 전복 | `abalone` | `apps/web/public/foods/abalone/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 거친 성장륜과 화산형 호흡공 줄이 선명한 녹갈·적갈색 바깥 패각+진주층 테두리·검은 주름 상족·크림색 족부가 드러난 활전복 2개체 구도 |
| 2 | 율무 | `adlay` | `apps/web/public/foods/adlay/color.svg` | O | PASS | 렌더 확인. 흰 알곡+갈색 홈 |
| 3 | 앵두 | `aengdu` | `apps/web/public/foods/aengdu/color.svg` | O | PASS | 렌더 확인. 작은 선홍 구슬, 짧은 꼭지 |
| 4 | 늙은 호박 | `aged-pumpkin` | `apps/web/public/foods/aged-pumpkin/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 납작하고 넓게 퍼진 7엽 맷돌호박 몸통+움푹한 상단 홈의 굵고 짧은 오각형 코르크질 꼭지+황갈·주황 껍질 위 하얀 분가루(백분) 질감 |
| 5 | 알로에 | `aloe` | `prototypes/seasonal-food/build/out/watercolor/aloe/color.svg` | X | PASS | 렌더 확인. 회녹색 다육 로제트, 가장자리 가시·흰 반점 |
| 6 | 산마늘 | `alpine-leek` | `apps/web/public/foods/alpine-leek/color.svg` | O | PASS | 렌더 확인. 넓은 타원 잎+자주색 밑동 |
| 7 | 아마란스 | `amaranth` | `prototypes/seasonal-food/build/out/watercolor/amaranth/color.svg` | X | PASS (✅ 재작업 완료) | 재작업 확인. 지름 6~7.5px의 미세하고 납작한 연노랑·상아빛 렌즈형 낟알 더미(92% 이상)+배경의 자홍색 원추화서 이삭과 잎 |
| 8 | 멸치 | `anchovy` | `prototypes/seasonal-food/build/out/watercolor/anchovy/color.svg` | X | PASS | 렌더 확인. 은빛 측선, 작은 몸 |
| 9 | 사과 | `apple` | `apps/web/public/foods/apple/color.svg` | O | PASS | 렌더 확인. - |
| 10 | 애플망고 | `apple-mango` | `prototypes/seasonal-food/build/out/watercolor/apple-mango/color.svg` | X | PASS (✅ 재작업 완료) | 재작업 확인. 껍질 대부분(80% 이상)을 덮는 화사한 다홍·붉은 자줏빛 숙성 색감+아래 끝 쪽의 황금 주황·노란빛 그라데이션+미세한 황백색 숨구멍 점 |
| 11 | 살구 | `apricot` | `apps/web/public/foods/apricot/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 뚜렷한 봉합선과 다홍 볼 터치의 주황 통 살구+껍질과 어우러지는 진하고 따뜻한 살구빛 주황 단면 과육과 갈색 씨 |
| 12 | 두릅 | `aralia-shoot` | `apps/web/public/foods/aralia-shoot/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 적갈색 아린 받침+가시 돋은 통통한 새순 줄기+위로 오므린 연두·적자색 어린 겹잎 다발 |
| 13 | 아로니아 | `aronia` | `apps/web/public/foods/aronia/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 성글게 갈라진 붉은 자줏빛 낱개 열매자루(산방꽃차례)+흑자색 열매 6알 아랫면마다 선명하게 박힌 오각 별 모양 꽃받침 자국 |
| 14 | 신선초(명일엽) | `ashitaba` | `apps/web/public/foods/ashitaba/color.svg` | O | PASS | 렌더 확인. 톱니 깊은 3출 잎, 긴 연녹 잎자루 |
| 15 | 아스파라거스 | `asparagus` | `apps/web/public/foods/asparagus/color.svg` | O | PASS | 렌더 확인. - |
| 16 | 취나물(참취) | `aster-scaber` | `apps/web/public/foods/aster-scaber/color.svg` | O | PASS | 렌더 확인. 하트형 톱니 잎 |
| 17 | 임연수어 | `atka-mackerel` | `apps/web/public/foods/atka-mackerel/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 작은 머리와 길쭉한 방추형 황갈색 몸+암갈색 세로 구름무늬 띠 6줄+긴 등지느러미 |
| 18 | 죽순 | `bamboo-shoot` | `apps/web/public/foods/bamboo-shoot/color.svg` | O | PASS | 렌더 확인. 겹친 갈색 껍질 원뿔, 녹색 끝 |
| 19 | 방아잎 | `bangah-leaf` | `apps/web/public/foods/bangah-leaf/color.svg` | O | PASS | 렌더 확인. 마주난 톱니 하트잎, 자줏빛 줄기 |
| 20 | 방풍나물 | `bangpung-namul` | `apps/web/public/foods/bangpung-namul/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 분백 띤 회청록색의 두꺼운 쐐기형 3갈래 작은잎과 둔한 톱니+연녹백색 굵은 잎자루와 자줏빛 밑동 엽초 |
| 21 | 보리 | `barley` | `apps/web/public/foods/barley/color.svg` | O | PASS | 렌더 확인. 긴 까락 이삭+낟알 |
| 22 | 비트 | `beet` | `apps/web/public/foods/beet/color.svg` | O | PASS | 렌더 확인. 적자색 뿌리+붉은 잎맥+동심원 단면 |
| 23 | 피망 | `bell-pepper` | `apps/web/public/foods/bell-pepper/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 각진 어깨 둔덕+3~4굴곡 세로 골+하단 3갈래 엉덩이 발+각진 꼭지 받침과 위로 솟은 꼭지 |
| 24 | 도라지 | `bellflower-root` | `apps/web/public/foods/bellflower-root/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 따뜻한 황백·연베이지색 껍질+상단 마디진 뇌두와 촘촘한 가로 고리 주름(환문)+2~3갈래 잔뿌리 |
| 25 | 새조개 | `bird-clam` | `apps/web/public/foods/bird-clam/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 위로 볼록 돌출된 각정과 19줄의 촘촘한 방사륵 패각+조개 밖으로 날렵하게 굽어 나온 검붉은(자갈색) 새부리 모양 발(살) |
| 26 | 비름나물 | `bireum-namul` | `apps/web/public/foods/bireum-namul/color.svg` | O | PASS | 렌더 확인. 둥근 마름모 잎+붉은 줄기 (잎 끝 노란 점은 경미) |
| 27 | 여주(고야) | `bitter-melon` | `apps/web/public/foods/bitter-melon/color.svg` | O | PASS | 렌더 확인. 혹 돌기 긴 박과, 덩굴손 |
| 28 | 복분자 | `black-raspberry` | `apps/web/public/foods/black-raspberry/color.svg` | O | PASS | 렌더 확인. 검붉은 작은 알 집합 열매 |
| 29 | 흑미 | `black-rice` | `apps/web/public/foods/black-rice/color.svg` | O | PASS | 렌더 확인. 검보라 길쭉한 낟알 |
| 30 | 감성돔 | `black-seabream` | `prototypes/seasonal-food/build/out/watercolor/black-seabream/color.svg` | X | PASS (✅ 재작업 완료) | 재작업 확인. 목덜미가 가파르게 솟은 높은 체고의 돔 체형+은회색 체측 위 7줄의 희미한 암회색 세로 줄무늬 띠+뾰족한 가시 등지느러미와 금빛 홍채 눈 |
| 31 | 꽃게 | `blue-crab` | `apps/web/public/foods/blue-crab/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 좌우 양끝으로 길고 예리하게 뻗은 등딱지 측가시+앞옆 가장자리 톱니 가시+등딱지 흰 반점과 헤엄다리 |
| 32 | 블루베리 | `blueberry` | `apps/web/public/foods/blueberry/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 회색 접시 제거+흰 분(과분)이 낀 차분한 회청·남보라색 알갱이 5알+별 모양 꽃받침 왕관과 초록 잎 2장 |
| 33 | 청경채 | `bok-choy` | `prototypes/seasonal-food/build/out/watercolor/bok-choy/color.svg` | X | PASS | 렌더 확인. 숟가락 잎+연녹 잎자루 |
| 34 | 봄동 | `bomdong` | `apps/web/public/foods/bomdong/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 바닥에 납작하게 퍼진 둥근 거꿀달걀꼴 주름 배춧잎 로제트+두툼한 흰 중륵과 잎맥+연노랑 속잎 겹침 |
| 35 | 고사리 | `bracken` | `apps/web/public/foods/bracken/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 태엽처럼 안으로 둥글게 말린 주먹 모양 나선형 고사리손(권상엽) 5가닥 다발+보송보송한 황갈색 솜털 코어+자갈색~녹갈색 매끈한 줄기(가시 제거) |
| 36 | 가지버섯 | `branching-mushroom` | `apps/web/public/foods/branching-mushroom/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 과한 보라 채도를 낮춘 자연스러운 연보라~자갈색(회갈색 감도는 퍼플브라운) 깔때기형 갓과 주름살 |
| 37 | 브로콜리 | `broccoli` | `apps/web/public/foods/broccoli/color.svg` | O | PASS | 렌더 확인. - |
| 38 | 방울양배추 | `brussels-sprout` | `apps/web/public/foods/brussels-sprout/color.svg` | O | PASS | 렌더 확인. - |
| 39 | 메밀 | `buckwheat` | `apps/web/public/foods/buckwheat/color.svg` | O | PASS | 렌더 확인. 짙은 갈색 세모 낟알 |
| 40 | 우엉 | `burdock` | `apps/web/public/foods/burdock/color.svg` | O | PASS | 렌더 확인. - |
| 41 | 머위 | `butterbur` | `apps/web/public/foods/butterbur/color.svg` | O | PASS | 렌더 확인. 신장형 톱니 잎, 밑 결각에 잎자루 |
| 42 | 머위대 | `butterbur-stalk` | `apps/web/public/foods/butterbur-stalk/color.svg` | O | PASS | 렌더 확인. - |
| 43 | 양송이버섯 | `button-mushroom` | `prototypes/seasonal-food/build/out/watercolor/button-mushroom/color.svg` | X | PASS | 렌더 확인. - |
| 44 | 양배추 | `cabbage` | `apps/web/public/foods/cabbage/color.svg` | O | PASS | 렌더 확인. - |
| 45 | 당근 | `carrot` | `apps/web/public/foods/carrot/color.svg` | O | PASS | 렌더 확인. - |
| 46 | 결명자 | `cassia-seed` | `prototypes/seasonal-food/build/out/watercolor/cassia-seed/color.svg` | X | PASS (✅ 재작업 완료) | 재작업 확인. 양 끝이 비스듬히 잘린 작고 각진 올리브갈색 마름모 기둥꼴(능주형) 씨앗 28알+옆면 연황갈색 사선 무늬와 표면 광택 |
| 47 | 메기 | `catfish` | `apps/web/public/foods/catfish/color.svg` | O | PASS | 렌더 확인. 수염 4쌍 느낌, 납작한 머리 |
| 48 | 콜리플라워 | `cauliflower` | `apps/web/public/foods/cauliflower/color.svg` | O | PASS | 렌더 확인. - |
| 49 | 샐러리 | `celery` | `apps/web/public/foods/celery/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 세로 섬유질 능선이 뚜렷한 연녹색 줄기 다발+3갈래로 갈라진 납작하고 뾰족한 톱니 가장자리 샐러리 잎 |
| 50 | 참나물 | `chamnamul` | `apps/web/public/foods/chamnamul/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 긴 연두색 잎자루 끝에 끝이 뾰족한 달걀형 톱니 작은잎 3장이 세 갈래로 펼쳐진 3출엽 구조+산뜻한 밝은 녹색 잎+붉은 자줏빛 줄기 밑동 |
| 51 | 근대 | `chard` | `apps/web/public/foods/chard/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 짙은 녹색 주름 잎몸+한국 대표형 청근대의 넓적하고 밝은 백록색(연녹·흰색) 잎자루와 주맥 |
| 52 | 천혜향 | `cheonhyehyang` | `apps/web/public/foods/cheonhyehyang/color.svg` | O | PASS | 렌더 확인. 매끈한 주황 만감+속 쪽 단면 (귤류 간 구별은 본질적 한계) |
| 53 | 체리 | `cherry` | `apps/web/public/foods/cherry/color.svg` | O | PASS | 렌더 확인. - |
| 54 | 방울토마토 | `cherry-tomato` | `apps/web/public/foods/cherry-tomato/color.svg` | O | PASS | 렌더 확인. - |
| 55 | 밤 | `chestnut` | `apps/web/public/foods/chestnut/color.svg` | O | PASS | 렌더 확인. 밤송이+밤 3톨 |
| 56 | 밤콩 | `chestnut-bean` | `apps/web/public/foods/chestnut-bean/color.svg` | O | PASS | 렌더 확인. 연갈색 바탕 적갈 얼룩 굵은 콩 |
| 57 | 치커리 | `chicory` | `apps/web/public/foods/chicory/color.svg` | O | PASS | 렌더 확인. 갈래 많은 잎+노란 속 |
| 58 | 마 | `chinese-yam` | `apps/web/public/foods/chinese-yam/color.svg` | O | PASS | 렌더 확인. 갈색 원통 덩이+흰 단면 |
| 59 | 총각무 | `chonggak-radish` | `apps/web/public/foods/chonggak-radish/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 연두빛 어깨+아랫배가 통통하고 끝이 둥글뭉툭한 작은 흰 무 3개+길고 풍성한 깃꼴 푸른 무청 묶음 |
| 60 | 취청오이 | `chwicheong-cucumber` | `apps/web/public/foods/chwicheong-cucumber/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 가늘고 긴 원통형 비례+짙은 청록에서 꽃자리 쪽 연두빛 그라데이션+잔돌기와 흰 가시+구부러진 초록 줄기 꼭지 |
| 61 | 꼬막 | `cockle` | `apps/web/public/foods/cockle/color.svg` | O | PASS | 렌더 확인. 굵은 방사륵 껍데기+살 |
| 62 | 대구 | `cod` | `apps/web/public/foods/cod/color.svg` | O | PASS | 렌더 확인. 큰 머리, 턱수염, 얼룩무늬 |
| 63 | 바다장어 | `conger-eel` | `apps/web/public/foods/conger-eel/color.svg` | O | PASS | 렌더 확인. 흰 점 측선 |
| 64 | 옥수수 | `corn` | `apps/web/public/foods/corn/color.svg` | O | PASS | 렌더 확인. - |
| 65 | 민어 | `croaker` | `apps/web/public/foods/croaker/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 길쭉하고 미끈한 방추형 몸+회갈색 등과 황금빛 은백색 옆구리+결각 있는 긴 등지느러미+갈라지지 않은 쐐기형 꼬리지느러미 |
| 66 | 쑥갓 | `crown-daisy` | `apps/web/public/foods/crown-daisy/color.svg` | O | PASS | 렌더 확인. 깊게 갈라진 잎+노란 꽃봉오리 |
| 67 | 오이 | `cucumber` | `apps/web/public/foods/cucumber/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 살짝 휘어지며 한쪽 끝이 완만하게 가늘어지는 원통형 비례+상단 짙은 녹색에서 하단 연두·백록색 그라데이션+오돌토돌한 표면 잔돌기와 가시 점 |
| 68 | 갑오징어 | `cuttlefish` | `prototypes/seasonal-food/build/out/watercolor/cuttlefish/color.svg` | X | PASS (✅ 재작업 완료) | 재작업 확인. 두툼한 타원 외투막 위 암갈색·크림황갈색이 교차하는 선명한 갈색 얼룩말 물결 무늬+외투막 가장자리 백색 테두리선과 전장 물결 지느러미 |
| 69 | 더덕 | `deodeok` | `apps/web/public/foods/deodeok/color.svg` | O | PASS | 렌더 확인. 가로 주름 갈색 방추형 뿌리 |
| 70 | 용과 | `dragon-fruit` | `prototypes/seasonal-food/build/out/watercolor/dragon-fruit/color.svg` | X | PASS | 렌더 확인. - |
| 71 | 동해한치(화살꼴뚜기) | `east-sea-hanchi` | `apps/web/public/foods/east-sea-hanchi/color.svg` | O | PASS | 렌더 확인. 화살촉 지느러미 긴 외투막, 반투명 분홍 |
| 72 | 가지 | `eggplant` | `apps/web/public/foods/eggplant/color.svg` | O | PASS | 렌더 확인. - |
| 73 | 팽이버섯 | `enoki-mushroom` | `prototypes/seasonal-food/build/out/watercolor/enoki-mushroom/color.svg` | X | PASS | 렌더 확인. - |
| 74 | 얼갈이배추 | `eolgari-cabbage` | `apps/web/public/foods/eolgari-cabbage/color.svg` | O | PASS | 렌더 확인. - |
| 75 | 무화과 | `fig` | `apps/web/public/foods/fig/color.svg` | O | PASS | 렌더 확인. - |
| 76 | 대하 | `fleshy-prawn` | `prototypes/seasonal-food/build/out/watercolor/fleshy-prawn/color.svg` | X | PASS (✅ 재작업 완료) | 재작업 확인. 진주빛 속살이 비치는 회청·은회색 반투명 생대하 갑각+등면의 미세한 암회색 색소포 잔점+끝이 검푸른 남회색 꼬리 부채와 긴 톱니 이마뿔·수염 |
| 77 | 조 | `foxtail-millet` | `apps/web/public/foods/foxtail-millet/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 무게로 활처럼 휘어 고개를 숙인 굵고 복스러운 원기둥 마디형 이삭+이삭 둘레 금빛 잔털(강모)+아래쪽 동그란 노란 좁쌀 더미 |
| 78 | 다슬기 | `freshwater-snail` | `prototypes/seasonal-food/build/out/watercolor/freshwater-snail/color.svg` | X | PASS | 렌더 확인. 짙은 원뿔 나선 껍데기 |
| 79 | 마늘 | `garlic` | `apps/web/public/foods/garlic/color.svg` | O | PASS | 렌더 확인. - |
| 80 | 부추 | `garlic-chive` | `apps/web/public/foods/garlic-chive/color.svg` | O | PASS | 렌더 확인. - |
| 81 | 마늘종 | `garlic-scape` | `apps/web/public/foods/garlic-scape/color.svg` | O | PASS | 렌더 확인. - |
| 82 | 생강 | `ginger` | `apps/web/public/foods/ginger/color.svg` | O | PASS | 렌더 확인. 마디진 덩이+분홍 눈 |
| 83 | 은행 | `ginkgo-nut` | `apps/web/public/foods/ginkgo-nut/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 양옆 모난 능선과 부리가 있는 살구빛 베이지 씨껍질 3알+반쯤 깨진 껍질 속 연녹색 속알 1알+완전히 깐 비취빛 연녹색 탱글한 속알 2알 |
| 84 | 인삼 | `ginseng-root` | `apps/web/public/foods/ginseng-root/color.svg` | O | PASS | 렌더 확인. - |
| 85 | 전어 | `gizzard-shad` | `apps/web/public/foods/gizzard-shad/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 아가미 뒤 뚜렷한 검은 어깨 반점과 체측 상단 점열+등지느러미 뒤끝의 실처럼 긴 연조+체고 있는 은백색 몸통과 배 아래 날카로운 모비늘·황색 꼬리지느러미 |
| 86 | 찹쌀 | `glutinous-rice` | `apps/web/public/foods/glutinous-rice/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 쌀(rice)과 동일한 낱알 스케일의 짧고 통통한 단립종 비율(25알 무더기+앞바닥 대표 낱알)+불투명한 유백색 배유+오목한 배아 자국 |
| 87 | 구기자 | `goji-berry` | `prototypes/seasonal-food/build/out/watercolor/goji-berry/color.svg` | X | PASS | 렌더 확인. - |
| 88 | 곰취 | `gomchwi` | `apps/web/public/foods/gomchwi/color.svg` | O | PASS | 렌더 확인. 큰 원심형 톱니 잎 |
| 89 | 곤드레 | `gondeure` | `apps/web/public/foods/gondeure/color.svg` | O | PASS | 렌더 확인. 회녹색 달걀꼴 잎 |
| 90 | 껍질콩(그린빈) | `green-bean` | `apps/web/public/foods/green-bean/color.svg` | O | PASS | 렌더 확인. - |
| 91 | 포도 | `green-grape` | `apps/web/public/foods/green-grape/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 한국 대표형인 짙은 흑자색·보라색 포도 알갱이와 뽀얀 하얀 과분(블룸)+상단 갈라진 초록 가지와 작은 포도 잎사귀 |
| 92 | 청귤 | `green-mandarin` | `apps/web/public/foods/green-mandarin/color.svg` | O | PASS | 렌더 확인. - |
| 93 | 대파 | `green-onion` | `apps/web/public/foods/green-onion/color.svg` | O | PASS | 렌더 확인. - |
| 94 | 완두콩 | `green-pea` | `apps/web/public/foods/green-pea/color.svg` | O | PASS | 렌더 확인. - |
| 95 | 매실 | `green-plum` | `apps/web/public/foods/green-plum/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 오목한 꼭지 홈에서 아래까지 파인 뚜렷한 세로 봉합선 골+보송한 잔털 질감과 살구빛 홍조+작은 초록 잎사귀 |
| 96 | 과메기 | `gwamegi` | `apps/web/public/foods/gwamegi/color.svg` | O | PASS | 렌더 확인. 묶어 말린 통과메기 두 마리 |
| 97 | 하귤 | `hagyul` | `prototypes/seasonal-food/build/out/watercolor/hagyul/color.svg` | X | PASS (✅ 재작업 완료) | 재작업 확인. 초록 잎이 달린 크고 두꺼운 황등색 통 하귤+두툼한 흰 속껍질(알베도)과 상큼한 연노랑 과육 주머니·씨앗이 드러난 반쪽 단면 |
| 98 | 갈치 | `hairtail` | `apps/web/public/foods/hairtail/color.svg` | O | PASS | 렌더 확인. 띠 모양 은빛 몸, 뾰족한 꼬리 |
| 99 | 한라봉 | `hallabong` | `apps/web/public/foods/hallabong/color.svg` | O | PASS | 렌더 확인. 꼭지 혹 |
| 100 | 전갱이 | `horse-mackerel` | `apps/web/public/foods/horse-mackerel/color.svg` | O | PASS | 렌더 확인. 꼬리 쪽 모비늘(방패비늘) 열 |
| 101 | 향어 | `hyang-carp` | `prototypes/seasonal-food/build/out/watercolor/hyang-carp/color.svg` | X | PASS | 렌더 확인. 큰 비늘 잉어형 |
| 102 | 씀바귀 | `ixeris` | `apps/web/public/foods/ixeris/color.svg` | O | PASS | 렌더 확인. 피침형 잎+흰 뿌리 |
| 103 | 고들빼기 | `ixeris-root-greens` | `apps/web/public/foods/ixeris-root-greens/color.svg` | O | PASS | 렌더 확인. 깃꼴 갈래 잎+가는 뿌리 |
| 104 | 재첩 | `jaecheop-clam` | `apps/web/public/foods/jaecheop-clam/color.svg` | O | PASS | 렌더 확인. 흑갈 작은 껍데기+보라 안쪽 |
| 105 | 제주한치(창꼴뚜기) | `jeju-hanchi` | `apps/web/public/foods/jeju-hanchi/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 캔버스 약 78%를 채우도록 1.52배 확대한 반투명 유백·연분홍 외투막+넓은 마름모꼴 창 모양 지느러미+짧은 다리 다발과 양쪽 눈 |
| 106 | 돼지감자 | `jerusalem-artichoke` | `apps/web/public/foods/jerusalem-artichoke/color.svg` | O | PASS | 렌더 확인. - |
| 107 | 히카마 | `jicama` | `prototypes/seasonal-food/build/out/watercolor/jicama/color.svg` | X | PASS | 렌더 확인. 납작 둥근 갈색 덩이+흰 단면+뿌리꼬리 |
| 108 | 대추 | `jujube` | `apps/web/public/foods/jujube/color.svg` | O | PASS | 렌더 확인. - |
| 109 | 다시마 | `kelp` | `prototypes/seasonal-food/build/out/watercolor/kelp/color.svg` | X | PASS | 렌더 확인. - |
| 110 | 강낭콩 | `kidney-bean` | `apps/web/public/foods/kidney-bean/color.svg` | O | PASS | 렌더 확인. - |
| 111 | 새송이버섯 | `king-oyster-mushroom` | `prototypes/seasonal-food/build/out/watercolor/king-oyster-mushroom/color.svg` | X | PASS | 렌더 확인. - |
| 112 | 키위 | `kiwi` | `apps/web/public/foods/kiwi/color.svg` | O | PASS | 렌더 확인. - |
| 113 | 콜라비 | `kohlrabi` | `apps/web/public/foods/kohlrabi/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 전체 자주색 둥글납작한 줄기 구경+층층이 가로로 패인 크림색 눈썹 모양 엽흔+옆면 비대칭 잎자루와 상단 초록 어린 속잎 |
| 114 | 우럭(조피볼락) | `korean-rockfish` | `apps/web/public/foods/korean-rockfish/color.svg` | O | PASS | 렌더 확인. 회흑 얼룩, 가시 등지느러미 |
| 115 | 애호박 | `korean-zucchini` | `apps/web/public/foods/korean-zucchini/color.svg` | O | PASS | 렌더 확인. - |
| 116 | 칡 | `kudzu-root` | `apps/web/public/foods/kudzu-root/color.svg` | O | PASS | 렌더 확인. - |
| 117 | 김 | `laver` | `prototypes/seasonal-food/build/out/watercolor/laver/color.svg` | X | PASS | 렌더 확인. - |
| 118 | 레몬 | `lemon` | `prototypes/seasonal-food/build/out/watercolor/lemon/color.svg` | X | PASS | 렌더 확인. - |
| 119 | 상추 | `lettuce` | `apps/web/public/foods/lettuce/color.svg` | O | PASS | 렌더 확인. 적상추 (하트 배치는 연출) |
| 120 | 노루궁뎅이버섯 | `lions-mane` | `apps/web/public/foods/lions-mane/color.svg` | O | PASS | 렌더 확인. - |
| 121 | 미꾸라지 | `loach` | `apps/web/public/foods/loach/color.svg` | O | PASS | 렌더 확인. - |
| 122 | 낙지 | `long-arm-octopus` | `apps/web/public/foods/long-arm-octopus/color.svg` | O | PASS | 렌더 확인. 작은 머리, 긴 다리 |
| 123 | 연근 | `lotus-root` | `apps/web/public/foods/lotus-root/color.svg` | O | PASS | 렌더 확인. - |
| 124 | 수세미 | `luffa` | `apps/web/public/foods/luffa/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 싱그러운 녹색 원통형 식용 어린 수세미+짙은 녹색 세로 능선 골과 잔돌기+덩굴손과 아래 끝 노란 수세미꽃 흔적 |
| 125 | 고등어 | `mackerel` | `apps/web/public/foods/mackerel/color.svg` | O | PASS | 렌더 확인. - |
| 126 | 매생이 | `maesaengi` | `apps/web/public/foods/maesaengi/color.svg` | O | PASS | 렌더 확인. - |
| 127 | 아욱 | `mallow` | `apps/web/public/foods/mallow/color.svg` | O | PASS | 렌더 확인. - |
| 128 | 귤 | `mandarin` | `apps/web/public/foods/mandarin/color.svg` | O | PASS | 렌더 확인. - |
| 129 | 바지락 | `manila-clam` | `apps/web/public/foods/manila-clam/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 촘촘한 가는 방사륵과 동심원 성장선 격자 결+바지락 특유의 갈색 지그재그(물결·갈매기) 얼룩 무늬 2개체 구도 |
| 130 | 송이버섯 | `matsutake` | `apps/web/public/foods/matsutake/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 거친 적갈색 섬유질 비늘이 갈라진 안으로 말린 갓+흰 솜 같은 턱받이(베일)와 대 하단 갈색 비늘 띠+옆에 붙은 덜 핀 봉오리 어린 송이 |
| 131 | 멜론 | `melon` | `apps/web/public/foods/melon/color.svg` | O | PASS | 렌더 확인. - |
| 132 | 미더덕 | `mideodeok` | `apps/web/public/foods/mideodeok/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 오돌토돌한 가로 주름 결의 황갈색·황토색 피낭+위쪽 두 입·출수공 돌기+아래쪽 주름진 자루+주황·노란빛 속살 단면 |
| 133 | 아귀 | `monkfish` | `apps/web/public/foods/monkfish/color.svg` | O | PASS | 렌더 확인. 넓적한 몸+큰 입 이빨+유인돌기 |
| 134 | 쥐눈이콩 | `mouse-eye-bean` | `apps/web/public/foods/mouse-eye-bean/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 작고 동글동글하며 반질반질한 윤기가 도는 칠흑색 통콩 8알과 흰 테두리 배꼽(제점)+푸른빛(연녹색) 속살 단면을 드러낸 반쪽 콩 2알 |
| 135 | 쑥 | `mugwort` | `apps/web/public/foods/mugwort/color.svg` | O | PASS | 렌더 확인. 깊게 갈라진 잎+은백 뒷면 |
| 136 | 오디 | `mulberry` | `apps/web/public/foods/mulberry/color.svg` | O | PASS | 렌더 확인. - |
| 137 | 숭어 | `mullet` | `apps/web/public/foods/mullet/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 납작하고 넓적한 머리와 황금빛 홍채+서로 멀찍이 떨어진 2개의 등지느러미+은회색 체측 비늘줄을 따라 달리는 6줄의 뚜렷한 수평 줄무늬 |
| 138 | 녹두 | `mung-bean` | `apps/web/public/foods/mung-bean/color.svg` | O | PASS | 렌더 확인. - |
| 139 | 숙주나물 | `mung-bean-sprout` | `prototypes/seasonal-food/build/out/watercolor/mung-bean-sprout/color.svg` | X | PASS | 렌더 확인. - |
| 140 | 홍합 | `mussel` | `apps/web/public/foods/mussel/color.svg` | O | PASS | 렌더 확인. - |
| 141 | 갓 | `mustard-greens` | `apps/web/public/foods/mustard-greens/color.svg` | O | PASS | 렌더 확인. - |
| 142 | 배추 | `napa-cabbage` | `apps/web/public/foods/napa-cabbage/color.svg` | O | PASS | 렌더 확인. - |
| 143 | 능이버섯 | `neungi-mushroom` | `prototypes/seasonal-food/build/out/watercolor/neungi-mushroom/color.svg` | X | PASS | 렌더 확인. 깔때기꼴 갈색 갓+거친 비늘 |
| 144 | 귀리 | `oat` | `apps/web/public/foods/oat/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 사방으로 갈라진 가는 가지 끝에 작은이삭들이 방울처럼 늘어져 매달린 원추꽃차례 이삭+깊은 세로 골이 파인 황갈색 귀리 알곡 6알 |
| 145 | 문어 | `octopus` | `prototypes/seasonal-food/build/out/watercolor/octopus/color.svg` | X | PASS | 렌더 확인. - |
| 146 | 노각 | `old-cucumber` | `apps/web/public/foods/old-cucumber/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 굵고 통통한 황갈색 몸통 전체에 자잘한 그물 모양 코르크 균열(망상 무늬)+마른 꼭지+한쪽 끝 백색 과육과 3심실 씨방 단면 |
| 147 | 광어(넙치) | `olive-flounder` | `apps/web/public/foods/olive-flounder/color.svg` | O | PASS | 렌더 확인. 왼쪽 눈, 갈색 반점 넙적한 몸 |
| 148 | 오미자 | `omija` | `apps/web/public/foods/omija/color.svg` | O | PASS | 렌더 확인. - |
| 149 | 양파 | `onion` | `apps/web/public/foods/onion/color.svg` | O | PASS | 렌더 확인. - |
| 150 | 참외 | `oriental-melon` | `apps/web/public/foods/oriental-melon/color.svg` | O | PASS | 렌더 확인. - |
| 151 | 굴 | `oyster` | `apps/web/public/foods/oyster/color.svg` | O | PASS | 렌더 확인. - |
| 152 | 느타리버섯 | `oyster-mushroom` | `prototypes/seasonal-food/build/out/watercolor/oyster-mushroom/color.svg` | X | PASS | 렌더 확인. - |
| 153 | 파프리카 | `paprika` | `apps/web/public/foods/paprika/color.svg` | O | PASS | 렌더 확인. - |
| 154 | 복숭아 | `peach` | `apps/web/public/foods/peach/color.svg` | O | PASS | 렌더 확인. - |
| 155 | 땅콩 | `peanut` | `apps/web/public/foods/peanut/color.svg` | O | PASS | 렌더 확인. - |
| 156 | 배 | `pear` | `apps/web/public/foods/pear/color.svg` | O | PASS | 렌더 확인. - |
| 157 | 키조개 | `pen-shell` | `apps/web/public/foods/pen-shell/color.svg` | O | PASS | 렌더 확인. 부채꼴 삼각 껍데기 |
| 158 | 깻잎 | `perilla-leaf` | `prototypes/seasonal-food/build/out/watercolor/perilla-leaf/color.svg` | X | PASS | 렌더 확인. - |
| 159 | 들깨 | `perilla-seed` | `apps/web/public/foods/perilla-seed/color.svg` | O | PASS | 렌더 확인. - |
| 160 | 감 | `persimmon` | `apps/web/public/foods/persimmon/color.svg` | O | PASS | 렌더 확인. - |
| 161 | 솔부추 | `pine-chive` | `apps/web/public/foods/pine-chive/color.svg` | O | PASS | 렌더 확인. - |
| 162 | 잣 | `pine-nut` | `apps/web/public/foods/pine-nut/color.svg` | O | PASS | 렌더 확인. - |
| 163 | 파인애플 | `pineapple` | `prototypes/seasonal-food/build/out/watercolor/pineapple/color.svg` | X | PASS | 렌더 확인. - |
| 164 | 자두 | `plum` | `apps/web/public/foods/plum/color.svg` | O | PASS | 렌더 확인. - |
| 165 | 기름가자미 | `pointhead-flounder` | `prototypes/seasonal-food/build/out/watercolor/pointhead-flounder/color.svg` | X | PASS (✅ 재작업 완료) | 재작업 확인. 머리가 오른쪽을 향하는 우도(오른눈잡이) 방향 교정+나란히 모인 두 눈과 작은 입+검은 기조 줄무늬 지느러미 |
| 166 | 명태 | `pollock` | `apps/web/public/foods/pollock/color.svg` | O | PASS | 렌더 확인. 등지느러미 3개, 턱수염 |
| 167 | 석류 | `pomegranate` | `apps/web/public/foods/pomegranate/color.svg` | O | PASS | 렌더 확인. - |
| 168 | 병어 | `pomfret` | `apps/web/public/foods/pomfret/color.svg` | O | PASS | 렌더 확인. 마름모 은빛 몸 |
| 169 | 감자 | `potato` | `apps/web/public/foods/potato/color.svg` | O | PASS | 렌더 확인. - |
| 170 | 기장 | `proso-millet` | `apps/web/public/foods/proso-millet/color.svg` | O | PASS | 렌더 확인. 늘어진 원추 이삭 |
| 171 | 복어 | `pufferfish` | `prototypes/seasonal-food/build/out/watercolor/pufferfish/color.svg` | X | PASS | 렌더 확인. - |
| 172 | 호박잎 | `pumpkin-leaf` | `apps/web/public/foods/pumpkin-leaf/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 둥글넓적하고 얕게 갈라진 오각형·심장형 5갈래 잎몸+잔털로 인해 번들거림 없는 무광 연녹~중간 녹색 엽면+솜털 돋은 연초록 잎자루 |
| 173 | 호박씨 | `pumpkin-seed` | `apps/web/public/foods/pumpkin-seed/color.svg` | O | PASS | 렌더 확인. - |
| 174 | 모과 | `quince` | `apps/web/public/foods/quince/color.svg` | O | PASS | 렌더 확인. - |
| 175 | 무 | `radish` | `apps/web/public/foods/radish/color.svg` | O | PASS | 렌더 확인. - |
| 176 | 유채나물 | `rapeseed-greens` | `apps/web/public/foods/rapeseed-greens/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 끝이 둥글넓적하고 가장자리가 물결치는 분백 청록빛 유채 잎 다발+가운데 꽃대 끝에 송이져 맺힌 노란 유채 꽃봉오리 단서 |
| 177 | 산딸기 | `raspberry` | `apps/web/public/foods/raspberry/color.svg` | O | PASS | 렌더 확인. - |
| 178 | 팥 | `red-bean` | `apps/web/public/foods/red-bean/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 양 끝이 사각지게 뭉툭한 작고 짧은 원통형(장타원형) 적갈색 팥알 9개+한쪽 옆모서리의 길고 선명한 흰 줄 모양 배꼽(제점) |
| 179 | 적채 | `red-cabbage` | `apps/web/public/foods/red-cabbage/color.svg` | O | PASS | 렌더 확인. - |
| 180 | 홍고추 | `red-chili` | `apps/web/public/foods/red-chili/color.svg` | O | PASS | 렌더 확인. - |
| 181 | 홍게 | `red-crab` | `prototypes/seasonal-food/build/out/watercolor/red-crab/color.svg` | X | PASS | 렌더 확인. 붉은 둥근 갑각, 긴 다리 |
| 182 | 레드향 | `red-hyang` | `apps/web/public/foods/red-hyang/color.svg` | O | PASS | 렌더 확인. - |
| 183 | 홍가리비 | `red-scallop` | `prototypes/seasonal-food/build/out/watercolor/red-scallop/color.svg` | X | PASS | 렌더 확인. - |
| 184 | 도미(참돔) | `red-seabream` | `apps/web/public/foods/red-seabream/color.svg` | O | PASS | 렌더 확인. 분홍 몸+청색 점 |
| 185 | 영지버섯 | `reishi-mushroom` | `prototypes/seasonal-food/build/out/watercolor/reishi-mushroom/color.svg` | X | PASS | 렌더 확인. - |
| 186 | 쌀 | `rice` | `apps/web/public/foods/rice/color.svg` | O | PASS | 렌더 확인. 고개 숙인 벼 이삭+백미 |
| 187 | 호밀 | `rye` | `apps/web/public/foods/rye/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 길고 가늘게 휘는 이삭에 좁고 긴 회녹~갈색 소수 15개가 촘촘히 2열로 배열되고 긴 까락이 뻗은 호밀 이삭+바닥의 가늘고 긴 탈곡 낱알 5개 |
| 188 | 삼채 | `samchae` | `apps/web/public/foods/samchae/color.svg` | O | PASS | 렌더 확인. 굵은 흰 뿌리 다발 |
| 189 | 도루묵 | `sandfish` | `prototypes/seasonal-food/build/out/watercolor/sandfish/color.svg` | X | PASS | 렌더 확인. - |
| 190 | 상황버섯 | `sanghwang-mushroom` | `prototypes/seasonal-food/build/out/watercolor/sanghwang-mushroom/color.svg` | X | PASS | 렌더 확인. - |
| 191 | 꽁치 | `saury` | `apps/web/public/foods/saury/color.svg` | O | PASS | 렌더 확인. - |
| 192 | 쪽파 | `scallion` | `apps/web/public/foods/scallion/color.svg` | O | PASS | 렌더 확인. - |
| 193 | 가리비 | `scallop` | `apps/web/public/foods/scallop/color.svg` | O | PASS | 렌더 확인. - |
| 194 | 농어 | `sea-bass` | `apps/web/public/foods/sea-bass/color.svg` | O | PASS | 렌더 확인. - |
| 195 | 해삼 | `sea-cucumber` | `apps/web/public/foods/sea-cucumber/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 몸통과 같은 흑갈·녹갈색 얼룩 톤으로 밑동이 넓고 끝이 무딘 원뿔형 살 돌기(불규칙 배열)+앞쪽 구촉수 입 주름과 황갈색 배발 |
| 196 | 멍게 | `sea-squirt` | `apps/web/public/foods/sea-squirt/color.svg` | O | PASS | 렌더 확인. 혹 돌기 주황 몸+입·출수공+노란 살 |
| 197 | 성게 | `sea-urchin` | `apps/web/public/foods/sea-urchin/color.svg` | O | PASS | 렌더 확인. - |
| 198 | 세발나물 | `sebal-namul` | `apps/web/public/foods/sebal-namul/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 솔잎·가는 실부추처럼 가늘고 통통한 원기둥형 다육질 바늘잎들이 마디에서 촘촘히 갈라져 올라온 다발+연붉은 기가 도는 유백색 짧은 밑동 |
| 199 | 섬초 | `seomcho` | `apps/web/public/foods/seomcho/color.svg` | O | PASS | 렌더 확인. 둥근 짙은 녹색 시금치 잎 (뿌리 쪽 붉은빛 추가 시 더 정확) |
| 200 | 서리태 | `seoritae` | `apps/web/public/foods/seoritae/color.svg` | O | PASS | 렌더 확인. 굵은 검은 콩+흰 배꼽 |
| 201 | 참깨 | `sesame-seed` | `apps/web/public/foods/sesame-seed/color.svg` | O | PASS | 렌더 확인. - |
| 202 | 냉이 | `shepherds-purse` | `apps/web/public/foods/shepherds-purse/color.svg` | O | PASS | 렌더 확인. 깃꼴 로제트+흰 곧은뿌리 |
| 203 | 표고버섯 | `shiitake-mushroom` | `apps/web/public/foods/shiitake-mushroom/color.svg` | O | PASS | 렌더 확인. 갈라진 화고 갓 |
| 204 | 꽈리고추 | `shishito-pepper` | `apps/web/public/foods/shishito-pepper/color.svg` | O | PASS | 렌더 확인. - |
| 205 | 새우 | `shrimp` | `apps/web/public/foods/shrimp/color.svg` | O | PASS | 렌더 확인. 붉은 새우(삶은 색). 앱에서 '대하'로 표시됨, 생대하는 회청색이라는 점은 참고 |
| 206 | 보리수열매 | `silverberry` | `apps/web/public/foods/silverberry/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 깊이 익은 다홍~진홍빛 타원 열매 전체에 촘촘히 박힌 은백색 잔 반점(비늘털)+열매 끝 꽃받침 흔적 돌기와 은백록색 뒷면 잎 |
| 207 | 홍어 | `skate` | `prototypes/seasonal-food/build/out/watercolor/skate/color.svg` | X | PASS (✅ 재작업 완료) | 재작업 확인. 양옆 날개 끝이 각진 마름모꼴 체반과 뾰족한 주둥이+등면 눈·분수공과 눈무늬 반점+두 갈래 배지느러미와 가시 줄 돋은 굵은 꼬리 |
| 208 | 물메기 | `snailfish` | `apps/web/public/foods/snailfish/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 크고 둥근 올챙이형 머리와 뒤로 좁아지는 측면 체형+구름 모양 암갈색 얼룩 피부+꼬리와 하나로 이어진 등·뒷지느러미와 큰 부채꼴 가슴지느러미 |
| 209 | 대게 | `snow-crab` | `apps/web/public/foods/snow-crab/color.svg` | O | PASS | 렌더 확인. - |
| 210 | 수수 | `sorghum` | `apps/web/public/foods/sorghum/color.svg` | O | PASS | 렌더 확인. - |
| 211 | 대두 | `soybean` | `apps/web/public/foods/soybean/color.svg` | O | PASS | 렌더 확인. - |
| 212 | 콩잎 | `soybean-leaf` | `apps/web/public/foods/soybean-leaf/color.svg` | O | PASS | 렌더 확인. 3출 달걀꼴 잎 |
| 213 | 삼치 | `spanish-mackerel` | `apps/web/public/foods/spanish-mackerel/color.svg` | O | PASS | 렌더 확인. - |
| 214 | 시금치 | `spinach` | `apps/web/public/foods/spinach/color.svg` | O | PASS | 렌더 확인. 붉은 뿌리목 |
| 215 | 봄 도다리(문치가자미) | `spring-flounder` | `apps/web/public/foods/spring-flounder/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 오른쪽을 향한 마름모꼴 유안측(우도)+나란히 모인 두 눈과 작은 입+짙은 얼룩 반점과 활 모양 측선 |
| 216 | 오징어 | `squid` | `apps/web/public/foods/squid/color.svg` | O | PASS | 렌더 확인. - |
| 217 | 딸기(시설) | `strawberry` | `apps/web/public/foods/strawberry/color.svg` | O | PASS | 렌더 확인. - |
| 218 | 돌나물 | `stringy-stonecrop` | `apps/web/public/foods/stringy-stonecrop/color.svg` | O | PASS | 렌더 확인. 3장 돌려난 다육 잎 |
| 219 | 동죽 | `surf-clam` | `prototypes/seasonal-food/build/out/watercolor/surf-clam/color.svg` | X | PASS | 렌더 확인. - |
| 220 | 고구마 | `sweet-potato` | `apps/web/public/foods/sweet-potato/color.svg` | O | PASS | 렌더 확인. - |
| 221 | 고구마순 | `sweet-potato-stem` | `apps/web/public/foods/sweet-potato-stem/color.svg` | O | PASS | 렌더 확인. - |
| 222 | 단호박 | `sweet-pumpkin` | `apps/web/public/foods/sweet-pumpkin/color.svg` | O | PASS | 렌더 확인. - |
| 223 | 토란 | `taro` | `apps/web/public/foods/taro/color.svg` | O | PASS | 렌더 확인. - |
| 224 | 토란대 | `taro-stem` | `apps/web/public/foods/taro-stem/color.svg` | O | PASS | 렌더 확인. - |
| 225 | 엉겅퀴 | `thistle-greens` | `apps/web/public/foods/thistle-greens/color.svg` | O | PASS | 렌더 확인. 가시 갈래 회녹 잎+자주 밑동 |
| 226 | 토마토 | `tomato` | `apps/web/public/foods/tomato/color.svg` | O | PASS | 렌더 확인. - |
| 227 | 서대 | `tongue-sole` | `apps/web/public/foods/tongue-sole/color.svg` | O | PASS | 렌더 확인. 혀 모양 몸, 왼눈잡이(머리 왼쪽) 맞음 |
| 228 | 송어 | `trout` | `prototypes/seasonal-food/build/out/watercolor/trout/color.svg` | X | PASS (✅ 재작업 완료) | 재작업 확인. 아가미에서 꼬리까지 체측을 가로지르는 선명한 분홍~자홍색 무지개 띠+올리브 회록색 등면·등지느러미·기름지느러미·꼬리지느러미에 촘촘히 박힌 검은 잔점 |
| 229 | 강황 | `turmeric` | `prototypes/seasonal-food/build/out/watercolor/turmeric/color.svg` | X | PASS | 렌더 확인. - |
| 230 | 순무 | `turnip` | `apps/web/public/foods/turnip/color.svg` | O | PASS | 렌더 확인. 보라 어깨 흰 순무 |
| 231 | 울금 | `ulgeum-rhizome` | `prototypes/seasonal-food/build/out/watercolor/ulgeum-rhizome/color.svg` | X | PASS (✅ 재작업 완료) | 재작업 확인. 가로 고리 마디와 짧은 곁눈 혹이 있는 통통한 달걀·방추형 울금 덩이뿌리+동심원 내피 고리가 선명한 진노랑(레몬황색) 반쪽 단면과 슬라이스 |
| 232 | 울외 | `uloe-melon` | `apps/web/public/foods/uloe-melon/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 옅은 세로 줄이 흐르는 길쭉한 연녹·백록색 통 울외+두꺼운 백록 과육과 크림색 씨방 단면이 드러난 반쪽 울외 2개체 구도 |
| 233 | 미역 | `wakame` | `prototypes/seasonal-food/build/out/watercolor/wakame/color.svg` | X | PASS (✅ 재작업 완료) | 재작업 확인. 도톰한 황녹갈색 가운데 중륵(줄기)+양옆으로 넓고 유려하게 물결치며 드리우는 갈녹색 엽체 날개+줄기 아랫부분의 주름진 미역귀(포자엽) |
| 234 | 호두 | `walnut` | `apps/web/public/foods/walnut/color.svg` | O | PASS | 렌더 확인. - |
| 235 | 고추냉이 | `wasabi` | `prototypes/seasonal-food/build/out/watercolor/wasabi/color.svg` | X | PASS | 렌더 확인. 혹 마디 녹색 뿌리줄기 (작게 그려짐) |
| 236 | 미나리 | `water-dropwort` | `apps/web/public/foods/water-dropwort/color.svg` | O | PASS | 렌더 확인. - |
| 237 | 수박 | `watermelon` | `apps/web/public/foods/watermelon/color.svg` | O | PASS | 렌더 확인. - |
| 238 | 주꾸미 | `webfoot-octopus` | `apps/web/public/foods/webfoot-octopus/color.svg` | O | PASS | 렌더 확인. - |
| 239 | 밀 | `wheat` | `apps/web/public/foods/wheat/color.svg` | O | PASS | 렌더 확인. - |
| 240 | 달래 | `wild-chive` | `apps/web/public/foods/wild-chive/color.svg` | O | PASS | 렌더 확인. - |
| 241 | 머루 | `wild-grape` | `apps/web/public/foods/wild-grape/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 붉은빛 감도는 가지에 작고 불규칙한 검보라·자홍빛 알이 성기게 달린 원뿔형 산머루 송이+뽀얀 흰 분막과 상단 머루 잎·덩굴손 |
| 242 | 동아 | `winter-melon` | `apps/web/public/foods/winter-melon/color.svg` | O | PASS | 렌더 확인. - |
| 243 | 목이버섯 | `wood-ear` | `apps/web/public/foods/wood-ear/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 얇고 반투명한 귀·조개 모양 주름 갓 여러 겹이 겹쳐진 자실체+안쪽 촉촉한 적갈색 오목면과 젤라틴 주름 맥+반투명 호박빛 가장자리와 회갈색 뒷면 |
| 244 | 야콘 | `yacon` | `apps/web/public/foods/yacon/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 적갈·자갈색 껍질의 굵고 묵직한 고구마형 덩이뿌리 2개+아삭하고 수분감 있는 반투명 유백색·아이보리 속살이 드러난 반쪽 단면과 둥근 슬라이스 조각 |
| 245 | 조기 | `yellow-croaker` | `apps/web/public/foods/yellow-croaker/color.svg` | O | PASS | 렌더 확인. - |
| 246 | 방어 | `yellowtail` | `apps/web/public/foods/yellowtail/color.svg` | O | PASS | 렌더 확인. 청색 등+노란 세로띠+노란 꼬리 (유일하게 오른쪽을 향함, 스타일 차이) |
| 247 | 열무 | `young-radish` | `apps/web/public/foods/young-radish/color.svg` | O | PASS | 렌더 확인. - |
| 248 | 유자 | `yuzu` | `apps/web/public/foods/yuzu/color.svg` | O | PASS (✅ 재작업 완료) | 재작업 확인. 위아래로 납작한 편구형 몸통 전체에 울퉁불퉁 패인 두꺼운 곰보 껍질과 기름샘 구멍+날개 달린 유자 잎(익엽)+두꺼운 흰 속껍질과 큼직한 씨앗이 박힌 반쪽 단면 |
