# 12. API 호출 모듈과 계약 테스트

Status: resolved
Type: task
Blocked by: 01

## 목적

각 API를 호출하는 TypeScript 모듈과, **응답 형태가 이전과 같은지** 검증하는 테스트를 만든다. 공공 API의 필드·코드·성공 응답이 조용히 바뀌면 이후 저장 데이터의 무결성이 깨진다. 이를 테스트로 먼저 잡는다.

## 로드맵과의 관계

수집 코드는 로드맵 ①에서 바로 만든다 (2026-10-19 재편). 이 이슈의 클라이언트와 계약 테스트는 **실제 수집 패키지**의 첫 부분이 된다. GitHub Actions가 부르는 CLI(`ingest-foundation/03`)가 이 클라이언트를 쓴다.

## 결정할 것 (시작 시 제안 후 확인)

- 위치: `packages/price-ingest/` 제안 (워크스페이스 패키지, `ingest-foundation/03`과 같은 곳)
- 런타임·테스트·검증 도구: Node + TypeScript + vitest + zod 제안. 사용 전 Context7로 현재 버전 문서를 확인한다.
- XML 파싱 라이브러리 (축평원, 참가격이 XML)

## 할 일

- [x] 출처별 클라이언트 3개: 요청 만들기(KAMIS의 `cond[...]` 인코딩 포함), 호출, `resultCode` 확인, 파싱
  - 성공 코드가 출처마다 다르다 (KAMIS `"0"`, 나머지 `00`). HTTP 200이어도 업무 오류가 올 수 있다.
  - 키는 `.env`에서만 읽고 로그·오류 메시지에 남기지 않는다.
- [x] 출처별 **응답 스키마** (zod 등): 필드 이름, 타입(모두 문자열임), 필수 여부, 코드값 허용 범위
  - 알려진 명세 불일치를 코드로 고정: 참가격 `datailMean`이 아닌 `detailMean`, 좌표 x/y가 위도/경도
- [x] **오프라인 테스트** (기본): 01의 샘플 파일을 스키마로 검증. 키·네트워크 없이 항상 돈다.
- [x] **라이브 테스트** (명시적으로 켤 때만): 실제 호출 결과가 저장된 기준(baseline)과 같은 형태인지 비교
  - 비교 대상: 필드 집합, 필드 타입, 코드 체계(부류·품목 코드 목록, 참가격 AL/UT/AR/BU, 축평원 축종·부위), 건수의 대략적 범위
  - 값(가격)은 매일 바뀌므로 비교하지 않는다. 형태와 코드만 본다.
  - 호출 한도를 고려해 호출 수를 센다 (축평원 1,000건/일, 참가격 2,000건/일)
- [x] 변경이 감지되면 무엇이 달라졌는지 읽기 쉽게 출력 (추가/삭제된 필드, 바뀐 타입, 사라진 코드)
- [x] baseline 갱신 절차: 의도한 변경일 때 baseline을 다시 만드는 명령과 규칙

## 하지 않는 것

- 정기 실행(스케줄, 알림)은 `ingest-foundation/03`, `05`에서 다룬다. 여기서는 수동·로컬 실행까지.
- 우리 통합 스키마로의 변환 — 이슈 `p4-canonical-model/03`

## 완료 기준

- 오프라인 테스트가 키 없이 통과한다.
- 라이브 테스트가 3개 출처 모두에 대해 통과한다.
- 샘플 필드 하나의 이름을 일부러 바꾸면 테스트가 실패하고 어떤 필드인지 보여준다.

## Answer

2026-10-22. `packages/price-ingest`(`@workspace/price-ingest`)에 만들었다. 수집 CLI와 워크플로는 `ingest-foundation/03`이 이 패키지에 더한다.

- **출처별 호출 모듈** (`src/sources/`): `kamis.ts`, `ekape.ts`, `chamgagyeok.ts`(4기능). 요청 주소, 성공 코드 판정, 게이트웨이 오류(JSON·XML `OpenAPI_ServiceResponse`), HTTP 상태, XML·JSON 읽기. 값은 문자열 그대로 둔다.
  - 성공 코드: KAMIS `"0"`, 축평원·참가격 `00`. HTTP 200이어도 업무 오류가 온다.
  - 명세 불일치를 코드로 고정: 참가격 가격 조회만 `serviceKey`, 나머지 셋은 `ServiceKey`. `detailMean`(Swagger의 `datailMean` 아님). 좌표 `xMapCoord`는 위도, `yMapCoord`는 경도. 참가격 `resultCode`는 `response` 바로 아래 있다.
- **응답 스키마** (zod, strict): 필드 이름, 타입, 필수 여부, 코드 형식. 빈 태그(0건)는 union 대신 `preprocess`로 빈 목록으로 바꿔 검사한다. union은 실패할 때 안쪽 필드 이름을 가리기 때문이다.
- **키·주소 보호**: 오류 메시지에 키와 주소가 없다. 전송 오류는 원래 메시지를 버리고, 그 사실을 테스트로 고정했다.
- **오프라인 테스트 68개** (`pnpm test`, 키·네트워크 없음): 요청 주소, 가짜 응답으로 본 클라이언트 동작, 샘플 계약 전체, 필드 이름 변경 감지. `*.excerpt.xml`은 잘린 발췌본이라 뺐다.
- **필드 이름 변경 확인 (실제 샘플)**: `kamis/vegetable-baechu-retail.json`의 `exmn_dd_prc`를 `exmn_dd_prx`로 바꾸자 실패했다. `item[0].exmn_dd_prc: 필수 값이 없거나 타입이 다르다`와 `item[0]: 정의되지 않은 필드 exmn_dd_prx`가 나왔다. 샘플은 `git checkout`으로 되돌렸다.
- **기준 파일** `baseline/contract-baseline.json`: 실측 16항목(KAMIS 2, 축평원 축종 7, 참가격 기준정보 4·판매점·상품·가격 각 1)의 필드 타입, 코드 목록, 건수. 가격은 없다. 샘플이 아니라 라이브 실측으로 만든 이유는, 샘플(2026-10-12)에 축산 4402 같은 품목 전체 코드가 빠져 있어서다.
- **라이브 테스트 17개 통과** (`pnpm --filter @workspace/price-ingest test:live`): 16항목 + 한 번 실행의 호출 수 한도. 키는 루트 `.env`에서만 읽고 출력하지 않았다.
- **비교 규칙**: 실패는 타입 변경, 사라진 코드, 건수가 기준의 ±10%(최소 3건)를 벗어남. 경고는 필드 경로가 생기거나 사라짐, 새 코드. 필드 이름과 필수 여부는 strict 스키마가 실패시킨다. 선택 필드는 데이터에 따라 있다 없다 하므로 경고로만 둔다.
- **한계**: 코드 비교는 실측 항목이 본 값만 본다. KAMIS 부류·품목 전체 목록은 16항목 밖이라 비교하지 않는다.
- **의존성**: `zod@4.4.3`. 저장소 lockfile에 이미 있는 버전이다. 4.6.7로 설치했다가 다른 도구의 zod까지 올라가서 되돌렸다. lockfile 변경은 추가뿐이다. `fast-xml-parser@5.11.2`는 price-db와 같다. Context7은 이 세션에 없어서 설치된 zod의 API로 맞췄다.
- **호출량**: 이번 작업의 실측 호출은 기준 생성 두 번(첫 시도는 파일 쓰기에서 실패했지만 호출은 끝났다) 32회와 라이브 테스트 16회, 합 48회다. 모두 한도 안이다.
- **문서**: `docs/project-structure.md`에 패키지 줄과 8-2절(경로·명령·기준 갱신 규칙)을 더했다.

## Comments

- 2026-10-22 점검 뒤 고침:
  - **호출 기록**: 모든 호출이 `CallOptions.onCall`로 기록을 남긴다. 기록에는 엔드포인트, 인증키를 뺀 파라미터(`pageNo` 포함), HTTP 상태, `resultCode`, 행 수가 들어간다. 게이트웨이 오류는 `gateway:<코드>`, 응답을 못 받으면 HTTP 상태 0이다. 원본 파일 헤더와 `raw_object.requests`에 들어간다.
  - **KAMIS 모든 페이지**: `fetchKamisPerDayAll`이 `ceil(totalCount / 1000)` 페이지를 받는다. 받은 행 수가 `totalCount`와 다르거나 `totalCount`가 페이지 사이에 바뀌면 계약 오류로 끊는다.
  - **축평원 성공 판정**: `ekapeHasDayRows`. `resultCode 00`이어도 당일 행이 없으면(평년 행만 또는 0건) 성공이 아니다 (pipeline 3-11).
  - **계약 기준 버전**: `contractBaselineVersion()` = `baseline:<기준을 만든 시각>`. `raw_object.contract_baseline`에 들어간다.
  - 라이브 테스트 17개를 다시 통과했다 (호출 16회).
  - 남은 것: KAMIS 재등록 감시 조건 `cond[orgnl_reg_dt::GTE]`의 지원과 계약 고정, 게이트웨이 오류 분류(키 만료·한도 초과·일시 장애), KAMIS 부류·품목 코드 목록 비교. 각각 `ingest-foundation/03`, `05`에서 다룬다.
