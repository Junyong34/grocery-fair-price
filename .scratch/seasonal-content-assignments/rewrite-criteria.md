# 제철 상세 콘텐츠 재작성 기준

2026-11-12 `.scratch/chunks/` 검토 결과를 바탕으로 정리했습니다. 이 문서를 작성 프롬프트에 그대로 붙이고, 청크 파일과 부록 목록을 함께 넘기세요.

## 왜 다시 쓰나

28개 청크가 두 형식으로 나뉘었습니다.

| | A 형식 (기준으로 삼음) | B 형식 (다시 씀) |
| --- | --- | --- |
| 파일 | fruit-01·04, grain-01, mixed-01, sea-01·04·07, veg-02·05·08 | 나머지 18개 |
| 항목 수 | 88 | 165 |
| 섹션 | 1~6, 8 | 1~8, 제목에 영어 병기 |
| 한 줄 소개 | 95자 안팎, 장보기 행동 중심 | "SEO Snippet", 110~120자, 홍보 문구 |
| 출처 | 링크와 확인일이 있음 | 330줄 중 198줄에 링크가 없고, 35개 항목은 링크가 하나도 없음 |
| 7번 섹션 | 없음 | 효능 주장 다수 (피로 회복 35, 면역 29, 해독 14, 혈압 12, 항암 7, 당뇨 7 등) |

B 형식은 A 형식으로 새로 씁니다. 기존 B 본문은 사실을 찾는 단서로만 쓰고, 문장은 옮기지 않습니다. 출처 링크가 달린 사실만 남깁니다.

배정 범위 밖 미검증 품목 30개(`.scratch/chunks/unverified-season-drafts.md`)도 같은 기준을 따릅니다. 작성된 25개가 B 형식이라 함께 다시 씁니다. 보류 5개(알로에, 숙주나물, 고추냉이, 새우류, 동죽)는 보류로 둡니다.

| 대상 | 작업 |
| --- | --- |
| B 형식 165개 + 미검증 25개 | 전부 다시 씀 |
| A 형식 88개 | 한 줄 소개만 3절 SEO 규칙으로 다시 쓰고, 부록 B·C 해당분을 보완 |

## 1. 파일 머리

```markdown
# <청크ID> · <카테고리>

작성 완료 · 배정 N / 작성 N / 보류 0

## 목차 및 검수 현황
- [x] [감 (`persimmon`)](#persimmon--감)
- [ ] 괴도라치 (`goedorachi`) — 보류 이유 한 문장. [기관 · 자료명](URL)
```

- 상태 줄은 `작성 완료` 또는 `부분 완료`입니다. 숫자는 목차의 체크 개수와 맞춥니다.
- 보류 항목에는 본문을 쓰지 않습니다. 목차 줄에 보류 이유와 확인한 자료 링크를 적습니다.

## 2. 항목 구조

제목과 순서를 바꾸지 않습니다. 영어 병기 `(Description)` 같은 표기는 쓰지 않습니다.

```markdown
## <id> | <화면 표시명>

| 항목 | 내용 |
|---|---|
| **ID** | `<id>` |
| **카테고리** | <레지스트리 카테고리> |
| **제철 / 절정** | <제철> / <절정 또는 —> |
| **대표 산지** | <산지 또는 —> |
| **검증일** | YYYY-MM-DD |

> **한 줄 소개 (summary, NN자)**
> <한 줄 소개>

### 1. 개요 및 특징
### 2. 맛과 식감
### 3. 고르는 방법
### 4. 보관 및 손질법
### 5. 추천 요리
### 6. 품종과 유통 특성 | 어종과 유통 특성 | 재배와 활용 특성
### 8. 출처 및 근거

**검수 메모** (선택) <달력과 다르게 쓴 이유, 남은 의문>

---
```

- 7번 섹션(영양 성분 및 섭취 주의사항)은 없습니다. 번호는 A 형식과 맞추려고 8번으로 둡니다.
- 6번 제목은 셋 중 하나를 고릅니다. 과일·곡물은 `품종과 유통 특성`, 수산은 `어종과 유통 특성`, 채소·버섯은 `재배와 활용 특성`을 씁니다.
- `별칭` 행은 쓰지 않습니다. 별칭은 레지스트리 `aliases`가 맡습니다.

## 3. 섹션별 기준

| 섹션 | 기준 |
| --- | --- |
| 한 줄 소개 | 아래 「한 줄 소개 = 검색 결과 설명문」 규칙을 따릅니다. |
| 1. 개요 및 특징 | 3~4문장. 무엇인지, 시장에서 어떤 형태로 만나는지, 장볼 때 무엇을 구분해야 하는지 씁니다. |
| 2. 맛과 식감 | 1~2문장. 날것과 익힌 것이 다르면 둘 다 씁니다. 당도 수치(브릭스)는 출처가 있을 때만 씁니다. |
| 3. 고르는 방법 | 불릿 2~3개. 매장에서 눈과 손으로 확인할 수 있는 기준만 씁니다. |
| 4. 보관 및 손질법 | `- **보관법** …`, `- **손질법** …` 두 줄. 콜론은 쓰지 않습니다. |
| 5. 추천 요리 | 불릿 2개. `요리명. 한 문장 설명.` 형식입니다. |
| 6. 유통 특성 | 1~3문장. 출하 시기 차이, 품종·가공 상태 이름, 원산지 표시처럼 장볼 때 헷갈리는 점을 씁니다. |
| 8. 출처 및 근거 | 아래 4절을 따릅니다. |

### 한 줄 소개 = 검색 결과 설명문

한 줄 소개는 상세 화면 첫 문단이면서, 검색 결과에서 제목 아래에 보이는 설명문(meta description)으로 씁니다. 페이지 제목은 이미 `감 제철 시기 · 9~11월` 형식으로 자동 생성되므로, 설명문은 **제목이 말하지 않은 것**을 보여 주고 페이지를 열어 볼 이유를 줘야 합니다.

| 규칙 | 내용 |
| --- | --- |
| 길이 | 공백 포함 70~90자. 모바일 검색 결과에서 잘리지 않게 핵심은 앞 45자 안에 둡니다. `NN자`에는 실제 글자 수를 적습니다. |
| 첫 문장 | 품목명과 제철 달을 넣습니다. 검색어와 겹치는 말이 굵게 표시되기 때문입니다. 예: `감은 9~11월이 제철이에요.` |
| 둘째 문장 | 바로 써먹을 수 있는 구체적인 팁 하나를 줍니다. 고르는 기준이나 보관 요령처럼 이 품목에만 해당하는 것을 고릅니다. |
| 마지막 | 페이지에 있는 내용을 짧게 예고해 클릭할 이유를 줍니다. 예: `단감·홍시 고르는 법과 보관법을 정리했어요.` 실제로 본문에 있는 내용만 예고합니다. |
| 말투 | 해요체. 사이트 문구와 지금 자동 생성되는 설명문이 해요체입니다. |
| 금지 | 낚시성 표현(`이것만 알면`, `꼭 확인하세요!`, `모르면 손해`), 물음표·느낌표, 효능 문구, `최고`·`일품` 같은 과장, 다른 품목과 똑같은 틀을 이름만 바꿔 쓰는 것 |

좋은 예 (82자):

> 감은 9~11월이 제철이에요. 단감은 꼭지가 붙어 있고 눌린 자국이 없는 것을 고르세요. 단감·홍시 고르는 법과 보관법, 추천 요리를 정리했어요.

나쁜 예와 이유:

- `감은 9~11월에 제철입니다. …` 제목과 같은 말만 하고, 합니다체입니다.
- `달콤한 가을의 맛, 감! 영양 가득한 감 고르는 비법을 확인하세요.` 효능 암시, 느낌표, 구체적인 정보가 없습니다.

참고: 구글은 검색어에 따라 설명문을 본문 문장으로 바꿔 보여 주기도 합니다. 그래서 본문 1번 첫 문장도 설명문만큼 정보가 담기게 씁니다.

## 4. 문체와 금지 내용

- 본문은 `합니다`체를 기본으로 하고(한 줄 소개만 해요체), 권유는 `~하세요`로 씁니다. 감탄, 과장(`일품`, `제격`, `최고조`, `탁월`)은 쓰지 않습니다.
- **건강·효능 문구를 쓰지 않습니다.** 질병 예방, 치료, 개선을 말하거나 암시하는 말(면역, 항산화, 해독, 혈압, 혈당, 당뇨, 항암, 노화, 다이어트, 숙취, 피로 회복, 부종)과 한방 성질(`찬 성질`, `따뜻한 성질`)이 모두 해당합니다.
- 안전 정보는 예외입니다. 출처가 있으면 4번 손질법에 씁니다. 예: 복어 독, 가시, 충분히 익히기, 알레르기 표시.
- 용어는 `grocery-price/GLOSSARY.md`를 따릅니다(카테고리, 품목, 품종, 규격).
- 영어는 품종명을 표기할 때만 괄호로 씁니다.

## 5. 출처

```markdown
- [기관명 · 자료 제목](URL) · YYYY-MM-DD 확인
```

- 본문의 사실(제철 달, 산지, 품종, 고르는 법, 보관법)은 모두 출처 안에 있어야 합니다. 출처 하나가 다 덮으면 1개도 되지만, 이때는 검수 메모에 그렇다고 적습니다. 출처에 없는 문장은 쓰지 않습니다.
- 농식품정보누리 제철농식품 원문에도 효능 설명(효능, 항암, 면역 등)이 많습니다. 제철·산지·품종·구입요령·손질과 보관법만 가져오고, 효능 단락은 옮기지 않습니다. 원문의 궁합("같이 먹으면 설사")이나 한방 성질 설명도 옮기지 않습니다.
- 정보누리 품목 링크는 목록 `https://www.foodnuri.go.kr/portal/bbs/B0000283/list.do?menuNo=300063&selectMonth=99&pageIndex=N`에서 찾습니다.
- 모든 줄에 링크가 있어야 합니다. 링크 없는 자료명은 출처로 치지 않습니다.
- 링크는 직접 열어 그 품목에 대한 내용인지 확인한 뒤 답니다.
- 우선순위는 다음과 같습니다.
  1. 정부·공공기관: 농식품정보누리 제철농식품, 농촌진흥청 농사로, 국립수산물품질관리원 수산물안전정보, 해양수산부 이달의 수산물, 국립수산과학원, 지자체
  2. 공공기관이 운영하는 관광·유통 사이트(근거가 부족할 때만, 검수 메모에 표시)
- 블로그, 쇼핑몰, 위키, 언론 기사를 단독 근거로 쓰지 않습니다.

## 6. 제철·절정 달

화면은 `packages/seasonal/src/data/food-registry.json`의 `months`와 `peak`를 보여 줍니다. 본문의 달은 이 값과 맞아야 합니다.

1. 기본은 레지스트리 값을 그대로 쓰고 `(달력)`을 붙입니다. 예: `12월~이듬해 2월(달력) / —`
2. 출처가 다른 달을 말하면 표에는 레지스트리 값을 두고, 출처의 달은 6번 섹션이나 검수 메모에 씁니다.
3. 레지스트리 값이 틀렸다고 판단되면 검수 메모 첫 줄을 `달력 수정 제안: 제철 X~Y월 / 절정 Z월`로 쓰고 출처를 답니다. 레지스트리는 따로 고칩니다.
4. 해를 넘기는 기간은 `11월~이듬해 2월`로 씁니다. `여름`, `봄`처럼 달이 없는 표기는 쓰지 않습니다.
5. 레지스트리에 `peak`가 없으면 절정은 `—`입니다.

## 7. 끝내기 전 확인

- [ ] 2절의 제목 8개가 순서대로 있고, 7번과 영어 병기가 없다
- [ ] 한 줄 소개가 70~90자, 해요체이고, 품목명·제철 달·구체적 팁·본문 예고가 있으며, 적은 글자 수가 실제와 같다
- [ ] 효능 금지어가 하나도 없다
- [ ] 출처 줄마다 링크와 확인일이 있다
- [ ] 제철·절정 표가 레지스트리와 같거나, 다른 이유가 검수 메모에 있다
- [ ] 상태 줄 숫자와 목차 체크 수가 같다

형식 검사는 스크립트로 합니다. 모든 항목이 `OK`가 나와야 끝입니다.

```bash
python3 -I .scratch/seasonal-content-assignments/check-chunk.py .scratch/chunks/<청크ID>.md
```

스크립트가 보지 못하는 것: 문장이 출처에 실제로 있는지, 다른 품목과 같은 틀을 반복하는지. 이 두 가지는 직접 확인합니다. 기준 예시는 시범으로 다시 쓴 `.scratch/chunks/fruit-02.md`입니다.

## 유지할 항목(A 형식)의 보완

A 형식 88개는 본문을 다시 쓰지 않습니다. 한 줄 소개는 모두 SEO 규칙에 맞춰 새로 쓰고, 부록 B와 C에 해당하는 것만 고칩니다.

## 부록 A. 다시 쓸 항목 (B 형식 165개 + 미검증 25개)

| 청크 | 건수 | 항목 |
| --- | ---: | --- |
| fruit-02 | 9 | 멜론 (`melon`), 모과 (`quince`), 무화과 (`fig`), 배 (`pear`), 보리수열매 (`silverberry`), 복분자 (`black-raspberry`), 복숭아 (`peach`), 블루베리 (`blueberry`), 사과 (`apple`) |
| fruit-03 | 8 | 산딸기 (`raspberry`), 살구 (`apricot`), 샤인머스캣 (`shine-muscat`), 석류 (`pomegranate`), 수박 (`watermelon`), 신비복숭아 (`shinbi-peach`), 아로니아 (`aronia`), 애플망고 (`apple-mango`) |
| fruit-05 | 8 | 체리 (`cherry`), 카라향 (`kara-mandarin`), 키위 (`kiwi`), 포도 (`green-grape`), 플럼코트 (`plumcot`), 하귤 (`summer-orange`), 한라봉 (`hallabong`), 황금향 (`benimadonna`) |
| grain-02 | 9 | 밤 (`chestnut`), 밤콩 (`chestnut-bean`), 보리 (`barley`), 서리태 (`seoritae`), 수수 (`sorghum`), 쌀 (`rice`), 옥수수 (`corn`), 완두콩 (`green-pea`), 율무 (`adlay`) |
| grain-03 | 8 | 은행 (`ginkgo-nut`), 잣 (`pine-nut`), 조 (`foxtail-millet`), 쥐눈이콩 (`mouse-eye-bean`), 참깨 (`sesame-seed`), 찹쌀 (`glutinous-rice`), 팥 (`red-bean`), 호두 (`walnut`) |
| sea-02 | 10 | 굴 (`oyster`), 기름가자미 (`pointhead-flounder`), 긴꼬리벵에돔 (`longtail-blackfish`), 꼬막 (`cockle`), 꽁치 (`saury`), 꽃게 (`blue-crab`), 낙지 (`long-arm-octopus`), 농어 (`sea-bass`), 능성어 (`banded-grouper`), 대게 (`snow-crab`) |
| sea-03 | 10 | 대구 (`cod`), 대하 (`shrimp`), 도치 (`lumpfish`), 독가시치 (`rabbitfish`), 돌가자미 (`stone-flounder`), 돌돔 (`rock-bream`), 동해한치 (`east-sea-hanchi`), 말쥐치 (`black-scraper`), 망둥어 (`goby`), 매생이 (`maesaengi`) |
| sea-05 | 10 | 바지락 (`manila-clam`), 방어 (`yellowtail`), 밴댕이 (`sardinella`), 벤자리 (`chicken-grunt`), 벵에돔 (`blackfish`), 병어 (`pomfret`), 보리멸 (`borimyeol`), 복어 (`pufferfish`), 볼락 (`gray-rockfish`), 봄 도다리 (`spring-flounder`) |
| sea-06 | 10 | 부시리 (`yellowstripe-jack`), 불볼락 (`red-rockfish`), 붉바리 (`red-spotted-grouper`), 삼치 (`spanish-mackerel`), 새조개 (`bird-clam`), 서대 (`tongue-sole`), 성게 (`sea-urchin`), 성대 (`searobin`), 송어 (`trout`), 숭어 (`mullet`) |
| sea-08 | 9 | 전갱이 (`horse-mackerel`), 전복 (`abalone`), 전어 (`gizzard-shad`), 제주한치 (`jeju-hanchi`), 조기 (`yellow-croaker`), 주꾸미 (`webfoot-octopus`), 줄가자미 (`roughscale-flounder`), 쥐노래미 (`fat-greenling`), 참가자미 (`yellowfin-flounder`) |
| sea-09 | 9 | 참다랑어 (`bluefin-tuna`), 참돔 (`red-seabream`), 청어 (`herring`), 키조개 (`pen-shell`), 학꽁치 (`halfbeak`), 해만가리비 (`scallop`), 해삼 (`sea-cucumber`), 홍어 (`skate`), 홍합 (`mussel`) |
| veg-01 | 10 | 가지 (`eggplant`), 감자 (`potato`), 갓 (`mustard-greens`), 강황 (`turmeric`), 고구마 (`sweet-potato`), 고구마순 (`sweet-potato-stem`), 고들빼기 (`ixeris-root-greens`), 고사리 (`bracken`), 곤드레 (`gondeure`), 곰취 (`gomchwi`) |
| veg-03 | 10 | 더덕 (`deodeok`), 도라지 (`bellflower-root`), 돌나물 (`stringy-stonecrop`), 동아 (`winter-melon`), 돼지감자 (`jerusalem-artichoke`), 두릅 (`aralia-shoot`), 마 (`chinese-yam`), 마늘 (`garlic`), 마늘종 (`garlic-scape`), 머위 (`butterbur`) |
| veg-04 | 9 | 머위대 (`butterbur-stalk`), 무 (`radish`), 미나리 (`water-dropwort`), 방아잎 (`bangah-leaf`), 방울양배추 (`brussels-sprout`), 방울토마토 (`cherry-tomato`), 방풍나물 (`bangpung-namul`), 배추 (`napa-cabbage`), 봄동 (`bomdong`) |
| veg-06 | 9 | 섬초 (`seomcho`), 세발나물 (`sebal-namul`), 솔부추 (`pine-chive`), 수세미 (`luffa`), 순무 (`turnip`), 시금치 (`spinach`), 신선초 (`ashitaba`), 쑥 (`mugwort`), 쑥갓 (`crown-daisy`) |
| veg-07 | 9 | 씀바귀 (`ixeris`), 아스파라거스 (`asparagus`), 아욱 (`mallow`), 애호박 (`korean-zucchini`), 야콘 (`yacon`), 양배추 (`cabbage`), 양파 (`onion`), 얼갈이배추 (`eolgari-cabbage`), 엉겅퀴 (`thistle-greens`) |
| veg-09 | 9 | 죽순 (`bamboo-shoot`), 쪽파 (`scallion`), 참나물 (`chamnamul`), 총각무 (`chonggak-radish`), 취나물 (`aster-scaber`), 취청오이 (`chwicheong-cucumber`), 치커리 (`chicory`), 칡 (`kudzu-root`), 콜라비 (`kohlrabi`) |
| veg-10 | 9 | 콜리플라워 (`cauliflower`), 콩잎 (`soybean-leaf`), 토란 (`taro`), 토란대 (`taro-stem`), 토마토 (`tomato`), 파프리카 (`paprika`), 피망 (`bell-pepper`), 호박잎 (`pumpkin-leaf`), 홍고추 (`red-chili`) |
| unverified-season-drafts | 25 | 청경채 (`bok-choy`), 히카마 (`jicama`), 깻잎 (`perilla-leaf`), 울금 (`ulgeum-rhizome`), 용과 (`dragon-fruit`), 구기자 (`goji-berry`), 레몬 (`lemon`), 파인애플 (`pineapple`), 아마란스 (`amaranth`), 결명자 (`cassia-seed`), 양송이버섯 (`button-mushroom`), 팽이버섯 (`enoki-mushroom`), 새송이버섯 (`king-oyster-mushroom`), 능이버섯 (`neungi-mushroom`), 느타리버섯 (`oyster-mushroom`), 영지버섯 (`reishi-mushroom`), 상황버섯 (`sanghwang-mushroom`), 다슬기 (`freshwater-snail`), 향어 (`hyang-carp`), 다시마 (`kelp`), 김 (`laver`), 홍게 (`red-crab`), 홍가리비 (`red-scallop`), 도루묵 (`sandfish`), 미역 (`wakame`) |

## 부록 B. 달력과 달이 다른 항목 (72개)

| 항목 | 청크 | 다른 값 | 콘텐츠 | 레지스트리 (제철 / 절정) |
| --- | --- | --- | --- | --- |
| 금귤 (`kumquat`) | fruit-01 | 제철 | 3~4월(제주 기준) / — | 3·4·5월 / 3·4월 |
| 석류 (`pomegranate`) | fruit-03 | 절정 | 9~12월 / 10~11월 | 9·10·11·12월 / 11월 |
| 아로니아 (`aronia`) | fruit-03 | 절정 | 7~9월 / 8~9월 | 7·8·9월 / 7월 |
| 애플망고 (`apple-mango`) | fruit-03 | 절정 | 5~10월 / 6~8월 | 5·6·7·8·9·10월 / 6·7월 |
| 밀 (`wheat`) | grain-01 | 제철 | 5월(정보누리), 6월 수확 사례 / — | 5월 / 5월 |
| 은행 (`ginkgo-nut`) | grain-03 | 절정 | 9~11월 / 10월 | 9·10·11월 / 10·11월 |
| 잣 (`pine-nut`) | grain-03 | 절정 | 8~12월 / 9~10월 | 8·9·10·11·12월 / 11월 |
| 조 (`foxtail-millet`) | grain-03 | 절정 | 9~10월 / 10월 | 9·10월 / 9월 |
| 찹쌀 (`glutinous-rice`) | grain-03 | 절정 | 9~10월 / 10월 | 9·10월 / 9월 |
| 팥 (`red-bean`) | grain-03 | 절정 | 9~10월 / 10월 | 9·10월 / 9월 |
| 가숭어 (`redlip-mullet`) | sea-01 | 제철 | 11월~이듬해 2월 / — | 2월 / 2월 |
| 간재미 (`ganjaemi`) | sea-01 | 제철 | 서해 4~6월, 진도 12월~이듬해 3월 / — | 4월 / 4월 |
| 감성돔 (`black-seabream`) | sea-01 | 제철 | 10월(해양수산부 선정) / — | 10·12월 / 10·12월 |
| 갯장어 (`pike-conger`) | sea-01 | 제철 | 여름 / — | 8월 / 8월 |
| 괴도라치 (`goedorachi`) | sea-01 | 제철 | 9월~10월 / 9월 | 9월 / 9월 |
| 대구 (`cod`) | sea-03 | 절정 | 12~2월 / 1월 | 1·2·12월 / 12월 |
| 도치 (`lumpfish`) | sea-03 | 제철 | 12~2월 / 1월 | 1월 / 1월 |
| 독가시치 (`rabbitfish`) | sea-03 | 제철 | 9~11월 / 10월 | 10월 / 10월 |
| 돌가자미 (`stone-flounder`) | sea-03 | 제철·절정 | 10~1월 / 11~12월 | 10월 / 10월 |
| 돌돔 (`rock-bream`) | sea-03 | 제철 | 8~10월 / 9월 | 9월 / 9월 |
| 동해한치 (`east-sea-hanchi`) | sea-03 | 절정 | 12~5월 / 1~3월 | 1·2·3·4·5·12월 / 2월 |
| 망둥어 (`goby`) | sea-03 | 절정 | 9~10월 / 10월 | 9·10월 / 9·10월 |
| 매생이 (`maesaengi`) | sea-03 | 제철 | 12~2월 / 1월 | 1·12월 / 1월 |
| 미더덕 (`mideodeok`) | sea-04 | 제철 | 봄(4월 공식 소개) / — | 3·4·5월 / 3월 |
| 부시리 (`yellowstripe-jack`) | sea-06 | 절정 | 8월 / 7~9월 | 8월 / 8월 |
| 붉바리 (`red-spotted-grouper`) | sea-06 | 절정 | 11월 / 10~12월 | 11월 / 11월 |
| 삼치 (`spanish-mackerel`) | sea-06 | 절정 | 10~3월 / 12~2월 | 1·2·3·10·11·12월 / 2·11월 |
| 새조개 (`bird-clam`) | sea-06 | 절정 | 11~2월 / 1~2월 | 1·2·11·12월 / 2월 |
| 서대 (`tongue-sole`) | sea-06 | 절정 | 6~10월 / 7~8월 | 6·7·8·9·10월 / 6월 |
| 성게 (`sea-urchin`) | sea-06 | 절정 | 3~8월 / 5~7월 | 3·4·5·6·7·8월 / 6월 |
| 성대 (`searobin`) | sea-06 | 절정 | 1월 / 12~2월 | 1월 / 1월 |
| 숭어 (`mullet`) | sea-06 | 절정 | 3~5월 / 4월 | 3·4·5월 / 3·4월 |
| 쌍동가리 (`sixbar-sandperch`) | sea-07 | 제철 | 5월~6월 / 5월 | 5월 / 5월 |
| 쏨뱅이 (`marbled-rockfish`) | sea-07 | 제철 | 12월~이듬해 2월 / 1월 | 1월 / 1월 |
| 아귀 (`monkfish`) | sea-07 | 제철 | 12월~이듬해 2월 / — | 1·2월 / 1월 |
| 참돔 (`red-seabream`) | sea-09 | 절정 | 11~3월 / 1~2월 | 1·2·3·11·12월 / 1·2·3·11·12월 |
| 청어 (`herring`) | sea-09 | 제철·절정 | 12~2월 / 1월 | 1·12월 / 1·12월 |
| 키조개 (`pen-shell`) | sea-09 | 절정 | 3~5월 / 4월 | 3·4·5월 / 4·5월 |
| 학꽁치 (`halfbeak`) | sea-09 | 제철 | 1~3월 / 2월 | 2월 / 2월 |
| 해만가리비 (`scallop`) | sea-09 | 제철 | 10~12월 / 11월 | 11월 / 11월 |
| 해삼 (`sea-cucumber`) | sea-09 | 절정 | 10~2월 / 12~1월 | 1·2·10·11·12월 / 11월 |
| 홍어 (`skate`) | sea-09 | 제철·절정 | 12~4월 / 1~3월 | 1·4월 / 1·4월 |
| 홍합 (`mussel`) | sea-09 | 제철 | 1~3월 / 2월 | 2·3월 / 2월 |
| 감자 (`potato`) | veg-01 | 절정 | 6~10월 / 6~7월 | 6·7·8·9·10월 / 6월 |
| 갓 (`mustard-greens`) | veg-01 | 절정 | 9~12월 / 10~11월 | 9·10·11·12월 / 10월 |
| 고구마 (`sweet-potato`) | veg-01 | 절정 | 9~10월 / 10~11월 | 9·10월 / 9·10월 |
| 고구마순 (`sweet-potato-stem`) | veg-01 | 절정 | 5~6월 / 6~8월 | 5·6월 / 5월 |
| 고들빼기 (`ixeris-root-greens`) | veg-01 | 절정 | 10~12월 / 10~11월 | 10·11·12월 / 10월 |
| 고사리 (`bracken`) | veg-01 | 절정 | 4~6월 / 4~5월 | 4·5·6월 / 4월 |
| 곤드레 (`gondeure`) | veg-01 | 절정 | 5~6월 / 5월 | 5·6월 / 6월 |
| 머위대 (`butterbur-stalk`) | veg-04 | 절정 | 3~4월 / 4~5월 | 3·4월 / 3월 |
| 무 (`radish`) | veg-04 | 절정 | 10~3월 / 11~12월 | 1·2·3·10·11·12월 / 10·11월 |
| 미나리 (`water-dropwort`) | veg-04 | 절정 | 3~4월 / 3월 | 3·4월 / 3·4월 |
| 방아잎 (`bangah-leaf`) | veg-04 | 절정 | 8~11월 / 8~9월 | 8·9·10·11월 / 8월 |
| 방울토마토 (`cherry-tomato`) | veg-04 | 절정 | 6~9월 / 7~8월 | 6·7·8·9월 / 6월 |
| 방풍나물 (`bangpung-namul`) | veg-04 | 절정 | 5월 / 4~5월 | 5월 / 5월 |
| 배추 (`napa-cabbage`) | veg-04 | 절정 | 11~12월 / 11월 | 11·12월 / 11·12월 |
| 씀바귀 (`ixeris`) | veg-07 | 절정 | 3~4월 / 3~4월 | 3·4월 / 4월 |
| 아욱 (`mallow`) | veg-07 | 절정 | 7~8월 / 7~8월 | 7·8월 / 7월 |
| 애호박 (`korean-zucchini`) | veg-07 | 절정 | 6~10월 / 7~8월 | 6·7·8·9·10월 / 6·7월 |
| 야콘 (`yacon`) | veg-07 | 절정 | 9~10월 / 10~11월 | 9·10월 / 9월 |
| 양배추 (`cabbage`) | veg-07 | 절정 | 5~7월 / 5~6월 | 5·6·7월 / 5월 |
| 양파 (`onion`) | veg-07 | 절정 | 4~7월 / 5~6월 | 4·5·6·7월 / 7월 |
| 엉겅퀴 (`thistle-greens`) | veg-07 | 절정 | 5~7월 / 5~6월 | 5·6·7월 / 6월 |
| 콜리플라워 (`cauliflower`) | veg-10 | 절정 | 9~12월 / 10~11월 | 9·10·11·12월 / 12월 |
| 토란 (`taro`) | veg-10 | 절정 | 10월 / 9~10월 | 10월 / 10월 |
| 토란대 (`taro-stem`) | veg-10 | 절정 | 9~10월 / 9~10월 | 9·10월 / 9월 |
| 토마토 (`tomato`) | veg-10 | 절정 | 7~9월 / 7~8월 | 7·8·9월 / 7월 |
| 파프리카 (`paprika`) | veg-10 | 절정 | 5~11월 / 6~9월 | 5·6·7·8·9·10·11월 / 11월 |
| 피망 (`bell-pepper`) | veg-10 | 절정 | 4~12월 / 6~9월 | 4·5·6·7·8·9·10·11·12월 / 5월 |
| 호박잎 (`pumpkin-leaf`) | veg-10 | 절정 | 5~9월 / 7~8월 | 5·6·7·8·9월 / 5월 |
| 홍고추 (`red-chili`) | veg-10 | 절정 | 6~11월 / 8~9월 | 6·7·8·9·10·11월 / 8월 |

## 부록 C. 유지할 항목(A 형식)의 보완 대상

출처를 1개만 단 항목 (45개): 대저토마토 (`daejeo-tomato`, fruit-01), 대추 (`jujube`, fruit-01), 레드향 (`red-hyang`, fruit-01), 앵두 (`aengdu`, fruit-04), 귀리 (`oat`, grain-01), 기장 (`proso-millet`, grain-01), 녹두 (`mung-bean`, grain-01), 대두 (`soybean`, grain-01), 땅콩 (`peanut`, grain-01), 가지버섯 (`branching-mushroom`, mixed-01), 노루궁뎅이버섯 (`lions-mane`, mixed-01), 목이버섯 (`wood-ear`, mixed-01), 호박씨 (`pumpkin-seed`, mixed-01), 가숭어 (`redlip-mullet`, sea-01), 간재미 (`ganjaemi`, sea-01), 감성돔 (`black-seabream`, sea-01), 갑오징어 (`cuttlefish`, sea-01), 명태 (`pollock`, sea-04), 임연수어 (`atka-mackerel`, sea-07), 근대 (`chard`, veg-02), 껍질콩 (`green-bean`, veg-02), 꽈리고추 (`shishito-pepper`, veg-02), 노각 (`old-cucumber`, veg-02), 늙은 호박 (`aged-pumpkin`, veg-02), 단호박 (`sweet-pumpkin`, veg-02), 달래 (`wild-chive`, veg-02), 당근 (`carrot`, veg-02), 대파 (`green-onion`, veg-02), 부추 (`garlic-chive`, veg-05), 브로콜리 (`broccoli`, veg-05), 비름나물 (`bireum-namul`, veg-05), 비트 (`beet`, veg-05), 산마늘 (`alpine-leek`, veg-05), 삼채 (`samchae`, veg-05), 상추 (`lettuce`, veg-05), 샐러리 (`celery`, veg-05), 생강 (`ginger`, veg-05), 여주 (`bitter-melon`, veg-08), 연근 (`lotus-root`, veg-08), 열무 (`young-radish`, veg-08), 우엉 (`burdock`, veg-08), 울외 (`uloe-melon`, veg-08), 유채나물 (`rapeseed-greens`, veg-08), 인삼 (`ginseng-root`, veg-08), 적채 (`red-cabbage`, veg-08)

한 줄 소개에 제철 달이 없는 항목: 딸기 (`strawberry`), 송이버섯 (`matsutake`), 갯장어 (`pike-conger`), 멸치 (`anchovy`), 물메기 (`snailfish`), 미더덕 (`mideodeok`), 바다장어 (`conger-eel`), 쌍동가리 (`sixbar-sandperch`), 쏨뱅이 (`marbled-rockfish`), 임연수어 (`atka-mackerel`), 자바리 (`longtooth-grouper`)

공공기관이 아닌 출처: 금귤(`kumquat`)의 baroinfo.com, 자리돔(`pearl-spot-chromis`)의 visitjeju.net
