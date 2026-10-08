# 04. 공공 가격 API 요청·응답 명세

`DATA_GO_KR_SERVICE_KEY`(공공데이터포털 인증키)로 2026-10-08에 실제로 호출해 확인한 내용이다. 명세서와 실제 동작이 다른 부분은 **실측**으로 표시한다.

공통 사항:
- 인증키는 64자 영숫자라서 URL 인코딩 없이 그대로 쓴다.
- 응답 필드는 숫자도 모두 **문자열**이다.
- 인증 실패나 없는 주소는 HTTP 400과 함께 `OpenAPI_ServiceResponse` XML로 온다. 예: `NO_OPENAPI_SERVICE_ERROR`(returnReasonCode 12).
- 업무 오류(파라미터 누락 등)는 **HTTP 200**에 `resultCode`가 `00`이 아닌 값으로 온다. HTTP 상태만 보지 말고 `resultCode`를 확인한다.

| 소스 | 주소 | 형식 | 개발계정 한도 |
|---|---|---|---|
| KAMIS 일별 | `https://apis.data.go.kr/B552845/perDay/price` | JSON/XML | 10,000건/일 |
| 축평원 | `http://data.ekape.or.kr/openapi-data/service/user/grade/…` (https 아님) | XML | 1,000건/일 |
| 참가격 | `https://apis.data.go.kr/B551919/ProductPriceInfoService/…` | XML | 2,000건/일 |

---

## 1. KAMIS 일별 도·소매 가격 (`perDay/price`)

원본 명세: `reference/public-data/kamis/perDay-api-spec.txt`, 코드표: `reference/public-data/kamis/code-table.txt`

### 요청 (GET)

| 파라미터 | 필수 | 설명 |
|---|---|---|
| `serviceKey` | 필수 | 인증키 |
| `returnType` | 필수 | `JSON` / `XML` (기본 JSON) |
| `pageNo` | 필수 | 페이지 번호 (기본 1) |
| `numOfRows` | 필수 | 페이지당 건수 (기본 10, 최대 1000) |
| `cond[exmn_ymd::GTE]` | 필수 | 조사일 시작 `YYYYMMDD` |
| `cond[exmn_ymd::LTE]` | 필수 | 조사일 끝 `YYYYMMDD` |
| `cond[ctgry_cd::EQ]` | 필수 | 부류코드 (예: 200 채소류) |
| `cond[item_cd::EQ]` | 필수 | 품목코드 (예: 211 배추) |
| `cond[se_cd::EQ]` | 옵션 | 구분코드: 01 소매, 02 중도매, 03 친환경, 07 친환경(신규) |
| `cond[vrty_cd::EQ]` | 옵션 | 품종코드 |
| `cond[grd_cd::EQ]` | 옵션 | 등급코드 |
| `cond[sgg_cd::EQ]` | 옵션 | 시군구코드 |
| `cond[mrkt_cd::EQ]` | 옵션 | 시장코드 |
| `selectable` | 옵션 | 받을 컬럼만 지정 (쉼표 구분, 예: `item_cd,vrty_cd`) |

`[`, `]`, `::`는 URL 인코딩한다 (`cond%5Bexmn_ymd%3A%3AGTE%5D`).

### 응답

```
response.header: resultCode, resultMsg
response.body:   numOfRows, pageNo, totalCount, dataType, items.item[]
```

| 필드 | 설명 | 실측 예 |
|---|---|---|
| `exmn_ymd` | 조사일 | `20261001` |
| `se_cd` / `se_nm` | 구분 | `02` / 중도매 |
| `ctgry_cd` / `ctgry_nm` | 부류 | `200` / 채소류 |
| `item_cd` / `item_nm` | 품목 | `211` / 배추 |
| `vrty_cd` / `vrty_nm` | 품종 | `02` / 여름(고랭지) |
| `grd_cd` / `grd_nm` | 등급 | `04` / 상품 |
| `sgg_cd` / `sgg_nm` | 시군구 | `1101` / 서울 |
| `mrkt_cd` / `mrkt_nm` | 시장 | `0110211` / 가락도매 |
| `unit` / `unit_sz` | 단위 / 단위크기 | `kg(그물망 3포기)` / `10` |
| `exmn_dd_prc` | 조사일 가격 (원) | `21200` |
| `exmn_dd_cnvs_prc` | 조사일 kg 환산가격 | `21200` |
| `orgnl_reg_dt` | 원본 등록일시 (UTC) | `2026-10-01T15:16:27Z` |

페이지 나누기는 `totalCount`로 계산한다.

---

## 2. 축평원 일자별 소비자가격 (`grade/consumerPriceDaily`)

원본 명세: `reference/public-data/ekape/openapi-guide.txt` (같은 서비스에 순별·월별·연도별, 등급판정, 재고량 등 다른 기능도 있다)

### 요청 (GET)

| 파라미터 | 필수 | 설명 |
|---|---|---|
| `serviceKey` | 필수 | 인증키 |
| `standYmd` | 필수 | 기준일 `YYYYMMDD` |
| `judgeKind` | 필수 | 축종: 4301 소, 4304 돼지, 4401 수입 소고기, 4402 수입 돼지고기, 9901 닭, 9903 계란, 9908 우유 |
| `itemCd` | 명세상 필수 | 품목코드. **실측: 빼면 해당 축종 전 품목이 온다** |

품목코드 예: 소 21 안심, 22 등심, 36 설도, 40 양지, 50 갈비 / 돼지 25 앞다리, 27 삼겹살, 28 갈비, 68 목살 / 수입쇠고기 31 갈비(냉동), 37 갈비살(냉장) / 수입돼지고기 27 삼겹살 / 우유 01 흰우유

### 응답 (XML)

```
response.header: resultCode, resultMsg   (정상: 00 / NORMAL SERVICE.)
response.body.items.item[]
```

| 필드 | 설명 | 예 |
|---|---|---|
| `standYmd` | 날짜 (또는 평년) | `20220630` |
| `judgeKind` / `judgeKindNm` | 축종 | `4304` / 돼지 |
| `itemCd` / `itemNm` | 품목 | `68` / 목심 |
| `grdNm` | 등급 또는 원산지 | `1+등급`, `구분없음` |
| `ntslPrc` | 평균가격 | `2859` |
| `maxPrc` / `minPrc` | 최고 / 최저가격 | `3152` / `2701` |
| `regionPrc1`~`regionPrc17` | 지역별 가격: 1 서울, 2 부산, 3 대구, 4 인천, 5 광주, 6 대전, 7 울산, 8 세종, 9 경기, 10 강원, 11 충북, 12 충남, 13 전북, 14 전남, 15 경북, 16 경남, 17 제주 | |
| `unit` | 단위 | `원/100g` |

---

## 3. 참가격 생필품 가격 (`ProductPriceInfoService`)

data.go.kr 페이지(15158701)의 Swagger 명세에서 뽑았다. 기능은 4개다. **가격 조회만 `.do`가 없고, 나머지 세 개는 `.do`가 붙는다.**

### 3-1. 생필품 가격 조회 `GET /getProductPriceInfoSvc`

| 파라미터 | 필수 | 설명 |
|---|---|---|
| `serviceKey` | 필수 | 인증키 |
| `goodInspectDay` | 필수 | 조사일 `YYYYMMDD` |
| `entpId` | 둘 중 하나 필수 | 업체 아이디 |
| `goodId` | 둘 중 하나 필수 | 상품 아이디 |

- 페이지 나누기 파라미터가 **없다**. `pageNo`, `numOfRows`를 보내도 무시하고 전부 준다.
- **실측: 격주 금요일 조사.** 업체 100 기준으로 8/28, 9/11, 9/25에는 369건이 있었고 9/4, 9/18, 10/2는 비어 있었다. 명세에는 "매주 금요일"이라고 되어 있다.
- 조사일이 아니면 `resultCode 00`에 빈 `<result/>`가 온다. 오류로 오지 않는다.
- 입력일시(`inputDttm`)는 조사일보다 0~2일 이르다 (예: 9/25 조사분이 9/23 입력).
- **과거 조회는 2026-06-12 조사분부터만 된다.** 06-12는 365건이 나왔고, 05-29·2024-01-05·2020-01-03은 비어 있었다.
- 호출 1번으로 업체 1곳의 전 상품(약 369건, 100KB) 또는 상품 1개의 전 업체(약 419건, 114KB)를 받는다.

| resultCode | 의미 |
|---|---|
| `00` | 정상 (`ok`) |
| `01` | 올바른 조사일자가 아님 (날짜 누락 등) |
| `05` | `entpId`, `goodId`가 둘 다 없음 |

응답: `response.result.iros.openapi.service.vo.goodPriceVO[]`

| 필드 | 설명 | 예 |
|---|---|---|
| `goodInspectDay` | 조사일 | `20260925` |
| `entpId` | 업체 아이디 | `100` |
| `goodId` | 상품 아이디 | `1000` |
| `goodPrice` | 가격 (원) | `1500` |
| `goodDcYn` | 할인 여부 | 업체 100의 8/28~9/25 조회에서는 `Y`가 한 건도 없었다 |
| `goodDcStartDay` / `goodDcEndDay` | 할인 시작 / 종료일 | `goodDcYn=Y`일 때만 |
| `plusoneYn` | 1+1 여부 | |
| `inputDttm` | 입력일시 | `2026-09-23 12:08:15` |

### 3-2. 판매점 정보 `GET /getStoreInfoSvc.do`

| 파라미터 | 필수 | 설명 |
|---|---|---|
| `ServiceKey` | 필수 | 인증키 |
| `entpId` | 옵션 | 한 곳만 조회할 때. 빼면 전체(실측 630곳, 310KB) |

응답: `response.result.iros.openapi.service.vo.entpInfoVO[]`

| 필드 | 설명 | 예 |
|---|---|---|
| `entpId` / `entpName` | 업체 아이디 / 이름 | `100` / 현대백화점미아점 |
| `entpTypeCode` | 업태 코드 (`BU`) | `DP` |
| `entpAreaCode` / `areaDetailCode` | 지역 / 지역상세 코드 (`AR`) | `020100000` / `020105000` |
| `entpTelno`, `postNo` | 전화번호, 우편번호 | |
| `plmkAddrBasic` / `plmkAddrDetail` | 지번 주소 | 서울 성북구 길음동 / 20-1 |
| `roadAddrBasic` / `roadAddrDetail` | 도로명 주소 | |
| `xMapCoord` / `yMapCoord` | 좌표 | **실측: x가 위도(37.6…), y가 경도(127.0…)** |

### 3-3. 상품 정보 `GET /getProductInfoSvc.do`

| 파라미터 | 필수 | 설명 |
|---|---|---|
| `ServiceKey` | 필수 | 인증키 |
| `goodId` | 옵션 | 한 개만 조회할 때. 빼면 전체(실측 604개, 222KB) |

응답: `response.result.item[]` (다른 기능과 달리 태그 이름이 `item`). Swagger 명세에는 `datailMean`으로 적혀 있지만 실제 태그는 `detailMean`이다.

| 필드 | 설명 | 예 |
|---|---|---|
| `goodId` / `goodName` | 상품 아이디 / 이름 | `1000` / 팔도 왕뚜껑(110g) |
| `productEntpCode` | 제조사 코드 | `1819` |
| `goodSmlclsCode` | 상품 소분류 코드 (`AL`) | `030201024` |
| `goodTotalCnt` / `goodTotalDivCode` | 용량 / 용량 단위 코드 (`UT`) | `110` / `G` |
| `goodBaseCnt` / `goodUnitDivCode` | 단위량 / 단위 코드 (`UT`) | `100` / `G` (100g당 가격 표시용으로 보임) |
| `detailMean` | 상세내용. 604개 중 203개만 값이 있다 | `120g*5개`, `캔`, `PET` |

### 3-4. 기준정보 `GET /getStandardInfoSvc.do`

| 파라미터 | 필수 | 설명 |
|---|---|---|
| `ServiceKey` | 필수 | 인증키 |
| `classCode` | 필수 | 코드 종류. 명세에 값 목록이 없어 실측으로 찾았다 |

| classCode | 내용 | 건수 | 예 |
|---|---|---|---|
| `AL` | 상품 분류 (대·중·소) | 188 | `030100000` 신선식품 |
| `UT` | 단위 | 29 | `BE` 병, `BO` 봉, `G` |
| `AR` | 지역 (`highCode`로 계층) | 311 | `020100000` 서울특별시 |
| `BU` | 업태 | 5 | `CS` 편의점, `DP` 백화점, `LM` 대형마트, `SM` 슈퍼마켓, `MF` 제조사 |

잘못된 값을 넣으면 `resultCode 02` (classCode 값이 정확하지 않습니다).

### 3-5. 제조사 코드(`productEntpCode`) → 이름: API로는 받을 수 없다

확인한 경로는 모두 막혀 있다.
- 판매점 전체 목록 630곳에 업태 `MF`(제조사)가 한 곳도 없다 (SM 441, LM 163, DP 22, CS 4).
- 제조사 코드를 `getStoreInfoSvc.do?entpId=`에 넣으면 빈 결과가 온다 (539, 463, 469, 1819).
- 기준정보 `classCode`로 MF, PE, MK, MA, PC, EP, CP, CO, PR을 넣어 봤지만 모두 오류였다.

코드가 어떻게 나뉘는지 (상품 604개, 제조사 코드 130개):
- 코드는 브랜드가 아니라 **공급 회사 단위**다. 539에는 백설·해찬들·햇반·비비고(CJ제일제당)가, 545에는 게토레이·아이시스·델몬트·펩시(롯데칠성)가, 512에는 비타500·삼다수(광동제약)가, 517에는 농심 라면과 켈로그가 모여 있다.
- `469`에는 배추·고등어·돼지고기 같은 신선식품 29개만 있다. '제조사 없음' 코드로 보인다.
- 상품명 첫 단어로는 코드를 가려낼 수 없다. 첫 단어가 100% 같은 코드는 130개 중 76개뿐이고, 해표·롯데·동원·CJ 같은 이름은 여러 코드에 걸쳐 나온다.

이름이 필요하면 상품명을 보고 회사명을 사람이 붙인 매핑표를 따로 관리하거나, 한국소비자원(043-880-5786)에 코드표를 문의해야 한다.

응답: `response.result.iros.openapi.service.vo.stdInfoVO[]` → `code`, `codeName`, `highCode`

---

## 4. 다른 프로젝트는 참가격 코드를 어떻게 썼나

2026-10-08에 GitHub 코드 검색으로 참가격 API를 쓰는 공개 저장소 20여 곳을 살펴봤다. 웹 검색 엔진은 결과를 주지 못해서 블로그 글은 보지 못했다.

**제조사 코드(`productEntpCode`)를 이름으로 바꾼 곳은 하나도 없었다.** 확인한 6곳 모두 받은 값을 그대로 저장하기만 했다 (wecart, shrink-server, team12-food-compass 등). 화면에는 `goodName`을 그대로 보여 준다.

다른 코드는 이렇게 썼다.

| 코드 | 쓰는 방식 | 예 |
|---|---|---|
| `goodSmlclsCode` (상품 분류) | 앞자리를 잘라 대·중분류로 쓴다. `AL` 기준정보와 조인한 곳도 있다 | team12: 앞 4자리 `0301`(신선식품)·`0302`(가공식품)만 식품으로 골라 적재. TEAM_LS: `// 1000`으로 중분류 카테고리를 만든다. sugarglider: 코드 테이블에 FK로 묶고, 목록에 없는 코드는 로그를 남긴다 |
| `goodUnitDivCode`, `goodTotalDivCode` (단위) | `UT` 기준정보를 코드 테이블로 저장하고 조인한다 | sugarglider |
| `entpTypeCode` (업태) | 값이 몇 개뿐이라 코드에 직접 박아 둔다 | ljh `DB.sql`: LM, DP, SM, JM, CS. 지금 `BU` 응답에는 JM(전통시장)이 없다 |
| `entpAreaCode`, `areaDetailCode` (지역) | `AR` 기준정보로 시도·시군구 이름을 붙인다. 주소 문자열로 지역을 다시 나눈 곳도 있다 | wecart, StoreRader: `classCode=AR`. team12: `plmkAddrBasic`로 권역을 직접 분류 |

`classCode`는 다들 `AL`, `UT`, `AR`만 썼고, 값 목록을 못 찾았다는 기록도 있다 (Petling: "30여 개 시도 실패"). 제조사용 `classCode`를 쓴 곳은 없었다.

### 함께 얻은 정보 (novoodi/Petling 계획 문서, 2026-09-02 실측)

- **과거 가격은 2026-06-12 조사분부터만 조회된다.** 그 전은 빈 응답이다. 그 전 기간은 공공데이터포털의 파일데이터(생필품 가격동향 XLS)로 채우는 방안을 적어 두었다. 우리가 2024-01-05, 2020-01-03을 호출했을 때 비어 있었던 것과 맞는다.
- 격주 금요일 조사이고, 8/28처럼 끼어든 날도 있어서 매주 조사로 바뀌었을 가능성을 적어 두었다. (우리 실측: 9/4·9/18은 비어 있음.)
- 조사 후 입력까지 약 6일 걸린다고 적었다. 우리 실측은 0~2일이었다.
- 가격을 호출 수가 고정된 배치로 모아 JSON으로 게시하는 구조를 쓴다. GitHub Actions로 매주 토요일에 수집하고 GitHub Pages로 게시해서, 앱이 API를 직접 부르지 않는다. 사용자마다 API를 부르면 개발계정 한도(2,000건/일)를 금방 넘고 인증키가 노출되기 때문이다.

---

## 남은 확인 사항

- [x] 참가격 과거 데이터 조회 범위: **2026-06-12부터** (업체 100 실측: 06-12 365건, 05-29 0건). 그 전 기간은 파일데이터 XLS로 채워야 한다
- [ ] 참가격 격주 주기가 모든 업체에 같은지
- [ ] 참가격 제조사 코드 → 이름 매핑: API에 없음 (3-5). 매핑표를 직접 만들지, 소비자원에 문의할지 결정
- [ ] 축평원 갱신 시각
- [ ] KAMIS 자체 API(cert_key) 명세: 평년, 1년 전, 1개월 전 가격
