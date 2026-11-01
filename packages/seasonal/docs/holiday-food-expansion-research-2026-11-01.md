# 설·추석 상차림 중심 전통 음식 추가 후보 조사

조사일: 2026-11-01 (Asia/Seoul)

범위: 현재 전통 음식 20종과 설·추석 가족 상차림의 누락 비교. 연구 메모만 작성했으며 음식 원천·생성물·앱·그림·선점은 변경하지 않았다.

## 판단

LA갈비구이를 추가하자는 생각은 **9/10**이다. 다만 오래된 명절별 대표 음식과 오늘날 가족이 함께 먹는 상차림을 같은 근거로 설명해서는 안 된다. LA갈비구이는 현대 명절 상차림의 후보로 소개하는 편이 맞다. 미국육류수출협회가 낸 2015년 추석 보도자료와 박찬일 셰프의 2025년 추석 칼럼에서 명절 음식으로 직접 다뤘다. 두 자료 모두 전국 가정의 섭취율을 조사한 통계는 아니다. [협회 보도자료](https://www.newswire.co.kr/newsRead.php?no=803844), [박찬일 셰프 칼럼](https://www.korea.kr/news/cultureWriterView.do?newsId=148950720)

LA갈비구이 외에도 **잡채·소갈비찜·동그랑땡·동태전**의 누락이 크다. 한국의집은 추석 상품에서 잡채·오색전·갈비찜을 대표 음식으로 직접 소개했고, 구체적인 상차림에 동태전·육원전 등을 넣었다. CJ제일제당은 2025년 설 상차림 기획전에서 동그랑땡·잡채를 주요 제품으로 소개했다. 전통 문화기관과 현대 식품업체의 서로 다른 선정 맥락에서 확인되는 후보들이다. [한국의집 보도자료](https://www.kh.or.kr/brd/board/715/L/menu/373?bbIdx=111350&brdType=R), [추석 상품 구성](https://www.kh.or.kr/brd/board/644/L/SITES/100/menu/509?bbIdx=111358&brdType=R&searchField=&searchText=&thisPage=1), [CJ 설 상차림 기획전](https://cjnews.cj.net/cj%EC%A0%9C%EC%9D%BC%EC%A0%9C%EB%8B%B9-cj%EB%8D%94%EB%A7%88%EC%BC%93-%EC%84%A4%EB%82%A0-%EC%83%81%EC%B0%A8%EB%A6%BC-%EA%B8%B0%ED%9A%8D%EC%A0%84-%EC%A7%84%ED%96%89/)

여기서 점수는 **자료의 직접성, 현 목록의 빈자리, 그림으로 구별되는 정도를 합친 제품 추가 우선순위**다. 실측 인기·섭취 빈도나 공식 순위가 아니다. 전국에서 얼마나 자주 먹는지, 후보끼리 어느 것이 더 흔한지를 확정할 대표성 있는 조사 자료는 이번에 확인하지 못했다.

## 현재 목록과 빈자리

조사 시점의 `prototypes/seasonal-food/docs/seasonal-lists/dishes.json`에는 고유 음식 20종이 있다. `scripts/build_seasonal_lists.py`의 `DISHES`와 함께 확인했다.

| 명절 | 현재 연결된 음식 |
|---|---|
| 설날 | 떡국, 만두, 식혜, 수정과 |
| 정월대보름 | 오곡밥, 묵은 나물, 부럼, 귀밝이술 |
| 단오 | 수리취떡, 제호탕 |
| 삼복 | 삼계탕, 육개장, 팥죽 |
| 추석 | 송편, 토란탕, 화양적, 닭찜 |
| 동지 | 팥죽, 동치미 |
| 유두 | 밀전병 |
| 시월 상달 고사 | 시루떡 |

현재 목록은 명절별 상징 음식이 중심이다. 목록 자체가 틀렸다기보다 잡채·갈비류·개별 전 같은 가족 상차림 음식이 빠져 있어, 사용자가 경험하는 설·추석과 차이가 생길 수 있다. 이는 현재 목록과 아래 자료를 비교한 제품 판단이다.

## 우선 추가할 5개

| 후보 | 우선순위 | 권하는 명절 연결 | 근거와 주의점 | 그림으로 남길 구별점 |
|---|---:|---|---|---|
| 잡채 | 10/10 | 설날·추석 | 한국의집 추석 대표 음식 및 CJ 설 상차림에 모두 등장한다. [한국의집](https://www.kh.or.kr/brd/board/715/L/menu/373?bbIdx=111350&brdType=R), [CJ](https://cjnews.cj.net/cj%EC%A0%9C%EC%9D%BC%EC%A0%9C%EB%8B%B9-cj%EB%8D%94%EB%A7%88%EC%BC%93-%EC%84%A4%EB%82%A0-%EC%83%81%EC%B0%A8%EB%A6%BC-%EA%B8%B0%ED%9A%8D%EC%A0%84-%EC%A7%84%ED%96%89/) | 갈색 반투명 당면의 얽힘과 가는 채소·고기. 국물 있는 면으로 그리지 않는다. |
| 소갈비찜 | 9/10 | 설날·추석 | 한국의집 추석 선정에 갈비찜이 있고, 삼성서울병원의 설 음식 설명에도 갈비찜이 등장한다. 소갈비찜이라는 구체적인 형태는 박찬일 셰프의 추석 칼럼에서 확인된다. [한국의집](https://www.kh.or.kr/brd/board/715/L/menu/373?bbIdx=111350&brdType=R), [삼성서울병원](https://www.samsunghospital.com/home/healthInfo/content/contenView.do?CONT_CLS_CD=001021005002&CONT_ID=4247&CONT_SRC=HOMEPAGE&CONT_SRC_ID=31911), [셰프 칼럼](https://www.korea.kr/news/cultureWriterView.do?newsId=148950720) | 뼈가 붙은 두툼한 고기 토막·갈색 양념·함께 익힌 채소. 기존 닭찜과 고기 구조를 구별한다. |
| LA갈비구이 | 9/10 | 추석 우선, 설날 연결은 추가 확인 | 협회 자체 추석 보도자료와 2025년 셰프 칼럼에 직접 등장한다. 선물 판매나 칼럼을 국민 섭취율로 확대하지 않는다. 이름은 원육·절단 형태인 LA갈비보다 완성 음식인 LA갈비구이로 잡는 것이 분명하다. [협회](https://www.newswire.co.kr/newsRead.php?no=803844), [셰프 칼럼](https://www.korea.kr/news/cultureWriterView.do?newsId=148950720) | 얇고 넓은 갈빗살·나란한 뼈 단면·구운 자국. 소갈비찜의 두꺼운 토막과 구별한다. |
| 동그랑땡 | 9/10 | 설날·추석 | CJ 설 기획전에 직접 등장하며, 한국의집 추석상에는 육원전이 들어간다. 농촌진흥청도 2026년 추석에 동그랑땡을 활용 음식으로 소개했다. 육원전과의 용어 연결은 식재료·조리 형태가 같은 범위를 기준으로 정리해야 한다. [CJ](https://cjnews.cj.net/cj%EC%A0%9C%EC%9D%BC%EC%A0%9C%EB%8B%B9-cj%EB%8D%94%EB%A7%88%EC%BC%93-%EC%84%A4%EB%82%A0-%EC%83%81%EC%B0%A8%EB%A6%BC-%EA%B8%B0%ED%9A%8D%EC%A0%84-%EC%A7%84%ED%96%89/), [한국의집 구성](https://www.kh.or.kr/brd/board/644/L/SITES/100/menu/509?bbIdx=111358&brdType=R&searchField=&searchText=&thisPage=1), [농촌진흥청](https://m.korea.kr/briefing/pressReleaseView.do?gubun=pressRelease&newsId=156783551&pageIndex=1&repCode=) | 작고 둥글납작한 모양·다진 고기와 채소가 보이는 속·노란 달걀옷. |
| 동태전 | 8/10 | 추석 우선, 설날은 생선전 범위 근거 확인 | 한국의집 추석상에 동태전이 명시돼 있다. 삼성서울병원의 설 자료에는 생선전이 등장하지만 그 생선이 반드시 동태라고 적혀 있지는 않다. 설·추석 공통 등록을 하려면 이 구체성 차이를 받아들이거나 설 동태전 자료를 더 확인한다. [한국의집 구성](https://www.kh.or.kr/brd/board/644/L/SITES/100/menu/509?bbIdx=111358&brdType=R&searchField=&searchText=&thisPage=1), [삼성서울병원](https://www.samsunghospital.com/home/healthInfo/content/contenView.do?CONT_CLS_CD=001021005002&CONT_ID=4247&CONT_SRC=HOMEPAGE&CONT_SRC_ID=31911) | 둥근 완자 대신 불규칙한 생선살 조각·흰 결·얇은 달걀옷. |

그림 특징 열은 후속 제작을 위한 제안이다. 관찰·작도·검수는 실제 그림 작업을 시작할 때 `seasonal-food-illustrator` 스킬로 다시 수행해야 한다. 이번 조사에서 SVG를 만들거나 그림 id를 확정하지 않았다.

## 차순위 후보

| 후보 | 우선순위 | 권하는 범위 | 판단 |
|---|---:|---|---|
| 삼색나물 | 8/10 | 설날·추석 | 한국의집 추석상은 고사리·도라지·시금치를 별도로 명시하고 삼성서울병원은 설 상차림에서 삼색나물을 설명한다. 현재 정월대보름의 묵은 나물과 구성·표현을 달리해 추가할 가치가 있다. [한국의집 구성](https://www.kh.or.kr/brd/board/644/L/SITES/100/menu/509?bbIdx=111358&brdType=R&searchField=&searchText=&thisPage=1), [삼성서울병원](https://www.samsunghospital.com/home/healthInfo/content/contenView.do?CONT_CLS_CD=001021005002&CONT_ID=4247&CONT_SRC=HOMEPAGE&CONT_SRC_ID=31911) |
| 약과 | 7/10 | 설날·추석 | 한국의집 추석상에 약과·산자가 있고, 삼성서울병원 설 설명에도 약과·한과가 등장한다. 약과는 구체적인 음식이고 한과는 여러 종류를 아우르는 이름이므로 둘을 독립된 같은 단계 후보로 중복 추가하지 않는 편이 낫다. [한국의집 구성](https://www.kh.or.kr/brd/board/644/L/SITES/100/menu/509?bbIdx=111358&brdType=R&searchField=&searchText=&thisPage=1), [삼성서울병원](https://www.samsunghospital.com/home/healthInfo/content/contenView.do?CONT_CLS_CD=001021005002&CONT_ID=4247&CONT_SRC=HOMEPAGE&CONT_SRC_ID=31911) |
| 불고기 | 7/10 | 설날·추석, 고기 종류와 조리 형태는 추가 확정 | CJ 설 기획전은 소불고기 양념·소불고기전골을, 농촌진흥청 추석 자료는 돼지고기 앞다리 불고기 활용을 소개한다. 가족 상차림의 고기 메뉴를 넓힐 수 있으나 소불고기·돼지불고기·전골을 한 음식으로 묶어 그려서는 안 된다. 자료가 말하는 음식의 범위를 먼저 좁혀야 한다. [CJ](https://cjnews.cj.net/cj%EC%A0%9C%EC%9D%BC%EC%A0%9C%EB%8B%B9-cj%EB%8D%94%EB%A7%88%EC%BC%93-%EC%84%A4%EB%82%A0-%EC%83%81%EC%B0%A8%EB%A6%BC-%EA%B8%B0%ED%9A%8D%EC%A0%84-%EC%A7%84%ED%96%89/), [농촌진흥청](https://m.korea.kr/briefing/pressReleaseView.do?gubun=pressRelease&newsId=156783551&pageIndex=1&repCode=) |
| 약식(약밥) | 7/10 | 정월대보름 우선 | 국립민속박물관은 약밥을 대보름에 먹는 음식으로 설명한다. 설·추석의 보편성을 먼저 내세우기보다 현재 대보름 목록의 빈자리로 검토하는 것이 근거에 맞는다. [국립민속박물관](https://www.nfm.go.kr/kids/elecontents/view.do?topic=38) |

호박전은 삼성서울병원 설 자료의 식사 예시에 등장하므로 후속 세분화 후보로 둘 수 있다. 녹두빈대떡·배추전·육전은 지역·가정별 대표성이나 그림의 중복을 더 확인하고 다음 순서로 돌리는 편이 낫다. 배추전은 한국의집 추석 구성에 있어 추석 연관 자체는 확인됐지만, 전국 공통 섭취 빈도가 높다는 뜻은 아니다. [삼성서울병원](https://www.samsunghospital.com/home/healthInfo/content/contenView.do?CONT_CLS_CD=001021005002&CONT_ID=4247&CONT_SRC=HOMEPAGE&CONT_SRC_ID=31911), [한국의집 구성](https://www.kh.or.kr/brd/board/644/L/SITES/100/menu/509?bbIdx=111358&brdType=R&searchField=&searchText=&thisPage=1)

## 중복과 명절 연결을 정리할 부분

### 모둠전과 개별 전

모둠전 그림 1개로 대표 종류를 묶는 방식과 동그랑땡·동태전·호박전 등을 각각 등록하는 방식 중 목적에 맞는 것을 고른다. 모둠전과 그 안의 개별 전을 같은 목록에서 별도 추가 음식으로 모두 세면 종류가 실제보다 부풀어 보인다. 이는 데이터 설계 제안이며 역사·섭취 빈도에 관한 사실 주장이 아니다.

### 화양적과 꼬치전·산적

현재 화양적은 소고기·도라지·표고버섯·당근·오이·달걀을 재료로 둔다. 현대의 햄·맛살 꼬치전과 대표 재료·보이는 모습이 다를 수 있으므로 사용자가 부르는 이름을 확인할 필요가 있다. 그러나 **화양적은 달걀옷을 입히지 않고 꼬치전은 입힌다는 구분을 고정 규칙으로 삼으면 안 된다.** 한국학중앙연구원 자료의 각색화양적 정의에는 익힌 재료를 꿴 형태와 밀가루즙·달걀옷을 입혀 지진 형태가 함께 나온다. 꼬치전·산적을 무조건 새 음식으로 늘리거나 화양적의 동의어로 자동 합치는 판단을 모두 보류한다. [한국학중앙연구원, 각색화양적](https://dh.aks.ac.kr/hanyang/wiki/index.php/%EA%B0%81%EC%83%89%ED%99%94%EC%96%91%EC%A0%81)

### 삼색나물과 묵은 나물

현재 묵은 나물은 취나물·가지·호박고지·시래기·표고버섯·고사리의 말린 나물 모둠이다. 새 삼색나물은 시금치·도라지·고사리의 세 색 모둠으로 범위를 정하면 재료와 식별 특징이 달라진다. 단, 가정마다 흰 나물을 무나물로 바꾸는 등 변형이 있으므로 유일한 정답인 구성처럼 표현하지 않는다. [현재 음식 원천](../../../prototypes/seasonal-food/scripts/build_seasonal_lists.py), [서대문구 삼색나물 안내](https://tongblog.sdm.go.kr/5422)

### 새 그림 없이 개선할 수 있는 것

- **식혜의 추석 연결**: 현재 설날에만 연결돼 있지만 한국의집 추석상에 식혜가 직접 명시돼 있다. 기존 그림을 재사용해 추석에도 연결하는 제안은 근거가 분명하다. [한국의집 구성](https://www.kh.or.kr/brd/board/644/L/SITES/100/menu/509?bbIdx=111358&brdType=R&searchField=&searchText=&thisPage=1)
- **수정과의 추석 연결**: 함께 마실 수 있다는 상식만으로 자동 확장하지 않는다. 이번에 직접 확인한 1차 메뉴 근거는 식혜 쪽이 더 명확하므로 수정과는 추가 확인 대상으로 남긴다.
- **상에 그대로 놓는 과실**: 사과·배·밤 등은 기존 품종 그림과 연결해 재사용하는 편이 낫다. 한국의집 추석상에도 생률·곶감·사과·배·대추가 나온다. 이를 모두 별도의 전통 음식 id와 그림으로 만들 필요는 없다는 제품 제안이다. 품종과 품종으로 조리한 전통 음식을 구분한다. [한국의집 구성](https://www.kh.or.kr/brd/board/644/L/SITES/100/menu/509?bbIdx=111358&brdType=R&searchField=&searchText=&thisPage=1), [프로젝트 용어집](../../../grocery-price/GLOSSARY.md)

## 근거의 한계와 후속 적용

1. 전국 대표 표본의 설·추석 음식별 섭취율·조리 빈도 조사는 확인하지 못했다. 제품 추가 점수를 공식 인기 순위로 표현하지 않는다.
2. 한국의집 자료는 2021년, 삼성서울병원 자료는 2015년이다. 명절 연관과 음식 구성은 확인할 수 있지만 2026년 소비 비율을 설명하지는 못한다. 최신성은 CJ 2025년 설 기획전, 셰프의 2025년 추석 칼럼, 농촌진흥청 2026년 추석 보도자료로 보완했다. 이 역시 조사 통계는 아니다.
3. 한국의집은 서울·경기 반가 상차림을 기초로 했다고 명시한다. 특정 지역 차례상을 전국 가정의 필수 규범으로 확대하지 않는다. 이번 추천은 가족이 즐기는 음식의 후보이며 모두를 차례상에 반드시 올려야 한다는 뜻이 아니다.
4. 미국육류수출협회의 보도자료는 산업단체 홍보자료다. LA갈비의 명절 활용이라는 직접 언급만 사용하고 기원·안전성·우수성·전국 보편성 등의 홍보 주장을 검증된 사실로 옮기지 않았다.
5. `americanmeat.co.kr/story/meatpedia?mod=document&uid=555`와 `/recipe/6481`는 검색 결과에 옛 본문 일부가 남아 있지만 직접 열면 칼럼·레시피 목록으로 이동했다. 본문 검증 근거에서 제외했다.
6. 검색은 wigolo 캐시부터 확인했다. 검색 엔진이 무관한 결과와 결과 없음(`engine_pool degraded`)을 반복해 URL 발견에는 웹 검색을 보완 사용했다. 확보한 1차 URL은 wigolo fetch로 읽었다. 국립민속박물관 약밥은 fetch에서 본문이 빠져 웹 페이지를 직접 다시 열어 확인했다.
7. 실제 추가 시에는 이름·완성 음식의 범위·대표 재료·명절 연결을 먼저 정한다. 원천을 바꾼 뒤 체크리스트를 재생성하고 그림은 지정 스킬로 제작한다. 이번 조사에서 그 단계는 실행하지 않았다.

## 직접 확인한 자료

| 자료 | 발행 주체·시기 | 이 조사에서 확인한 범위 |
|---|---|---|
| [한국의집, 친환경 차례상 출시로 착한 소비 앞장](https://www.kh.or.kr/brd/board/715/L/menu/373?bbIdx=111350&brdType=R) | 한국문화재재단, 2021-09-03, 현 국가유산진흥원 게시 | 추석 대표 음식으로 잡채·오색전·갈비찜을 선정 |
| [한국의집 추석맞이 투고 상품 상세](https://www.kh.or.kr/brd/board/644/L/SITES/100/menu/509?bbIdx=111358&brdType=R&searchField=&searchText=&thisPage=1) | 한국문화재재단, 2021-09-07 | 동태전·육원전·삼색 나물 재료·약과·산자·식혜 등 실제 구성 |
| [CJ더마켓 설날 상차림 기획전](https://cjnews.cj.net/cj%EC%A0%9C%EC%9D%BC%EC%A0%9C%EB%8B%B9-cj%EB%8D%94%EB%A7%88%EC%BC%93-%EC%84%A4%EB%82%A0-%EC%83%81%EC%B0%A8%EB%A6%BC-%EA%B8%B0%ED%9A%8D%EC%A0%84-%EC%A7%84%ED%96%89/) | CJ제일제당, 2025-01 | 설 기획전의 동그랑땡·잡채·소불고기 관련 제품 |
| [추석 명절상, 더 풍성하게! 돼지고기 부위별로 즐겨요](https://m.korea.kr/briefing/pressReleaseView.do?gubun=pressRelease&newsId=156783551&pageIndex=1&repCode=) | 농촌진흥청, 2026-09-29 | 갈비찜·산적·전·불고기·수육·동그랑땡의 추석 활용 제안 |
| [설날, 체중과의 대결 1탄](https://www.samsunghospital.com/home/healthInfo/content/contenView.do?CONT_CLS_CD=001021005002&CONT_ID=4247&CONT_SRC=HOMEPAGE&CONT_SRC_ID=31911) | 삼성서울병원, 2015-02-16, 2015-03-09 갱신 | 설 음식 예시로 갈비찜·전·삼색나물·잡채·약과·한과 등을 제시. 영양 수치·건강 조언은 이 조사에 사용하지 않음 |
| [약밥](https://www.nfm.go.kr/kids/elecontents/view.do?topic=38) | 국립민속박물관 어린이박물관 | 약밥의 대보름 연결과 조리 구성 |
| [각색화양적](https://dh.aks.ac.kr/hanyang/wiki/index.php/%EA%B0%81%EC%83%89%ED%99%94%EC%96%91%EC%A0%81) | 한국학중앙연구원 디지털인문학 자료 | 화양적의 꼬치·달걀옷 변형을 함께 설명 |
| [미국육류수출협회 추석 보도자료](https://www.newswire.co.kr/newsRead.php?no=803844) | 미국육류수출협회, 2015-09-17 | LA갈비구이를 명절 가족 메뉴로 직접 언급 |
| [추석 음식에 관한 박찬일 셰프 칼럼](https://www.korea.kr/news/cultureWriterView.do?newsId=148950720) | 박찬일 셰프, 정책브리핑 게시, 2025-10 | 갈비찜·LA갈비구이·잡채·전의 현대 추석 상차림 맥락. 정부 통계가 아닌 당사자 문화 칼럼 |
| [추석 삼색나물 만들기](https://tongblog.sdm.go.kr/5422) | 서대문구 블로그, 2020-10-01 | 시금치·도라지·고사리 구성과 무나물 변형 |
