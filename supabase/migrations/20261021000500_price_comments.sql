-- ① 수집 기반: 표·열 주석 (pipeline.md 3장)
-- 열마다 뜻, 단위·형식, null의 뜻, 원천 필드명, 근거 절을 적는다. 용어는 GLOSSARY.md를 따른다.
-- 시각은 timestamptz(UTC 저장), 날짜는 KST 날짜다 (3-0 "타입"). 가격 단위는 원.
-- 새 표·열은 같은 마이그레이션에서 주석을 단다. 빠지면 pnpm db:test가 실패한다.

-- ── 3-2 지역 ─────────────────────────────────────────────────────────

comment on table price.region is '우리 지역 코드. 세 출처의 지역 코드를 이것 하나로 잇는다 (pipeline.md 3-2). 법정동 코드 앞자리, 전국 00 (6-1)';
comment on column price.region.code is '우리 지역 코드. 시도는 법정동 앞 2자리, 시군구는 5자리, 전국은 00. 표준 코드를 확인하지 못한 지역은 임시 코드(T1 전남광주통합특별시)';
comment on column price.region.name is '지역 이름 (예: 서울특별시)';
comment on column price.region.level is '지역 단계: nation 전국, sido 시도, sigungu 시군구';
comment on column price.region.parent_code is '상위 지역 코드. 전국은 null';
comment on column price.region.valid_from is '이 코드가 쓰이기 시작한 날. 모르면 null';
comment on column price.region.valid_to is '이 코드가 더 쓰이지 않게 된 날 (그날부터 무효). 지금도 쓰이면 null';
comment on column price.region.successor_code is '통합·개편으로 이 지역을 이어받은 지역 코드 (예: 광주 29·전남 46 → T1). 없으면 null';

-- ── 3-1 분류 ─────────────────────────────────────────────────────────

comment on table price.category is '카테고리: 품목을 묶는 가장 큰 분류 (채소, 과일, 수산, 축산, 가공식품). 운영자가 관리 (3-1)';
comment on column price.category.id is '카테고리 ID (우리가 발급, identity)';
comment on column price.category.slug is '바깥 이름 (URL·payload용 영문 소문자, 예: vegetable)';
comment on column price.category.name is '화면에 보이는 이름 (예: 채소)';
comment on column price.category.sort is '화면 표시 순서. 작을수록 앞. 정하지 않았으면 null';

comment on table price.item is '품목: 같은 종류의 식재료를 묶는 단위, 품종의 상위 분류 (예: 호박, 돼지고기). 운영자가 관리 (3-1)';
comment on column price.item.id is '품목 ID (우리가 발급, identity)';
comment on column price.item.category_id is '속한 카테고리';
comment on column price.item.slug is '바깥 이름 (URL·payload용, 예: hobak)';
comment on column price.item.name is '화면에 보이는 이름 (예: 호박)';

comment on table price.variety is '품종: 가격을 판정하는 단위 (예: 애호박, 국산 삼겹살). 제철 패키지의 품종 ID와 별도 체계이며 variety_seasonal_map으로 잇는다 (3-1)';
comment on column price.variety.id is '가격 품종 ID (우리가 발급, identity). 제철 품종 id와 다르다';
comment on column price.variety.item_id is '속한 품목';
comment on column price.variety.slug is '가격 품종의 바깥 이름 (URL·payload용, 예: aehobak)';
comment on column price.variety.name is '화면에 보이는 이름 (예: 애호박)';
comment on column price.variety.base_unit is '기준 단위의 종류: g 중량, ml 부피, ea 개수. 기준 단위 가격(price_per_base)이 이 단위로 계산된다';
comment on column price.variety.base_unit_qty is '기준 단위의 양 (예: 100 → 100g당, 1 → 1개당, 30 → 30구당). 0보다 크다';
comment on column price.variety.status is 'active 화면에 보임 / hidden 숨김. 기본 규격 검사는 active 품종만 본다';

comment on table price.spec is '규격: 같은 품종 안에서 가격대를 가르는 속성 (등급, 크기, 재배 방식). 판정은 규격별로 낸다. 품종마다 기본 규격이 꼭 하나 있어야 한다 (3-1)';
comment on column price.spec.id is '규격 ID (우리가 발급, identity). 다른 표는 (variety_id, spec_id) 복합 FK로 가리킨다';
comment on column price.spec.variety_id is '속한 품종';
comment on column price.spec.slug is '품종 안에서의 바깥 이름 (예: top 상품, grade-1plus 1+등급, default 기본)';
comment on column price.spec.name is '화면에 보이는 이름 (예: 상품, 1+등급)';
comment on column price.spec.is_default is '기본 규격 여부. 원천이 규격을 가르지 않으면(축평원 구분없음, 참가격 상품 대부분) 이 규격으로 매핑한다. 품종마다 많아야 하나 (spec_one_default)';
comment on column price.spec.sort is '품종 안 표시 순서. 정하지 않았으면 null';

comment on table price.unit_rule is '환산 규칙 한 버전: 원천 가격을 기준 단위 가격으로 바꾸는 방법. 행을 고치지 않고 새 버전을 더한다 (3-1)';
comment on column price.unit_rule.id is '규칙 버전 ID (identity). 관측값·매핑이 계산에 쓴 버전을 이것으로 남긴다';
comment on column price.unit_rule.rule_code is '규칙 이름 (예: same_unit). 같은 이름의 버전이 여럿일 수 있다';
comment on column price.unit_rule.version is '규칙 버전 번호. 환산 기준(애호박 1개 ≈ 300g 등)이 바뀌면 새 번호';
comment on column price.unit_rule.price_tier is '적용 가격 단계: retail 소매, wholesale 도매';
comment on column price.unit_rule.kind is '환산 방식: same_unit 원천 단위 = 기준 단위(수량만 나눔), weight_to_ea 중량 → 개수, ea_to_weight 개수 → 중량';
comment on column price.unit_rule.params is '규칙 값 (JSON). 예: {"from_unit":"ea","g_per_ea":300}. g_per_ea는 1개당 g (환산 기준)';
comment on column price.unit_rule.note is '운영자 메모';
comment on column price.unit_rule.created_at is '이 버전을 만든 시각';

comment on table price.source_code_table is '출처 코드표의 코드 하나. 같은 글자가 종류마다 다르므로 (source, code_class, code)로 구분한다. 응답에만 오는 코드도 넣는다 (3-1 "코드표")';
comment on column price.source_code_table.source is '출처: kamis, ekape(축평원), chamga(참가격)';
comment on column price.source_code_table.code_class is '코드 종류. KAMIS se·ctgry·item·vrty·grd·sgg·mrkt, 축평원 judge_kind·item, 참가격 AL·UT·AR·BU';
comment on column price.source_code_table.code is '원천 코드 (앞자리 0을 지키려고 text). KAMIS vrty는 {item_cd}-{vrty_cd}, grd는 {item_cd}-{vrty_cd}-{grd_cd}, 축평원 item은 {judgeKind}-{itemCd}';
comment on column price.source_code_table.name is '원천이 준 코드 이름';
comment on column price.source_code_table.parent_code is '상위 코드 (참가격 highCode, KAMIS 품종의 품목). 없으면 null';
comment on column price.source_code_table.in_official_table is '공식 코드표에 있는 코드인가. false면 응답에서만 본 코드 (KAMIS에 흔함)';
comment on column price.source_code_table.first_seen_on is '이 코드를 처음 본 날 (KST)';
comment on column price.source_code_table.last_seen_on is '이 코드를 마지막으로 본 날 (KST). 날짜가 늘 때만 고친다';
comment on column price.source_code_table.retired_on is '코드표에서 빠진 날. 아직 있으면 null';
comment on column price.source_code_table.attrs is '그 밖의 원천 속성 (JSON). 없으면 null';

comment on table price.source_item is '원천 키 등록부: 가격 행이 무엇의 값인지 가리키는 원천 키 하나. 관측값은 이 id만 든다 (3-1 "원천 키")';
comment on column price.source_item.id is '원천 키 ID (identity)';
comment on column price.source_item.source is '출처: kamis, ekape(축평원), chamga(참가격)';
comment on column price.source_item.source_key is '읽을 수 있는 원천 키. kamis:{se_cd}-{ctgry_cd}-{item_cd}-{vrty_cd}-{grd_cd}, ekape:{judgeKind}-{itemCd}-{grdNm}, chamga:{goodId}';
comment on column price.source_item.key_parts is '원천 키를 이루는 필드를 원천 필드명 그대로 (JSON, 예: {"se_cd":"01","item_cd":"224",...})';
comment on column price.source_item.label is '운영자 화면용 이름 (KAMIS item_nm/vrty_nm/grd_nm, 축평원 축종/품목/구분명, 참가격 goodName). 없으면 null';
comment on column price.source_item.first_seen_on is '가격 응답이나 마스터에서 이 키를 처음 본 조사일 (KST)';
comment on column price.source_item.last_seen_on is '이 키를 마지막으로 본 조사일 (KST). 날짜가 늘 때만 고친다';

comment on table price.source_code_map is '원천 키 → 품종·규격 매핑 (KAMIS·축평원). 다대일, 기간별. 같은 원천 키의 기간이 겹치면 거부한다. 참가격은 상품을 거치므로 쓰지 않는다 (3-1)';
comment on column price.source_code_map.id is '매핑 행 ID (identity)';
comment on column price.source_code_map.source_item_id is '매핑하는 원천 키';
comment on column price.source_code_map.valid_from is '유효 시작일 (이날 포함)';
comment on column price.source_code_map.valid_to is '유효 종료일 (이날부터 무효). 지금도 유효하면 null';
comment on column price.source_code_map.status is 'pending 처음 본 키라 운영자 처리 대기 / mapped 품종·규격·환산 규칙 확정 / ignored 쓰지 않는 키';
comment on column price.source_code_map.variety_id is '매핑된 품종. pending·ignored면 null';
comment on column price.source_code_map.spec_id is '매핑된 규격. 원천이 규격을 가르지 않으면 기본 규격. variety_id와 함께 null이거나 함께 찬다';
comment on column price.source_code_map.unit_rule_id is '이 키의 가격을 기준 단위로 바꿀 환산 규칙 버전. mapped면 반드시 있다';
comment on column price.source_code_map.role is '출처 중복 시 대표 여부: primary 집계에 센다 / secondary 저장만 (KAMIS 축산과 축평원이 겹칠 때, 6-1)';
comment on column price.source_code_map.note is '운영자 메모';
comment on column price.source_code_map.updated_at is '이 행을 마지막으로 고친 시각';

-- ── 3-5·3-7 수집 실행과 원본 ───────────────────────────────────────────

comment on table price.ingest_run is '수집 실행 한 번 (GitHub Actions 실행 하나 또는 로컬 CLI 한 번) (3-5)';
comment on column price.ingest_run.id is '실행 ID (identity)';
comment on column price.ingest_run.source is '출처: kamis, ekape, chamga. 출처를 가리지 않는 작업(recompute)은 all';
comment on column price.ingest_run.job is '작업 종류: daily 정기 수집, recheck 다시 받기, reregistration_watch KAMIS 재등록 감시, master 마스터 수집, backfill 과거분 채우기, recompute 집계·판정 재계산';
comment on column price.ingest_run.started_at is '시작 시각';
comment on column price.ingest_run.finished_at is '끝난 시각. 아직 도는 중이면 null';
comment on column price.ingest_run.status is 'running 진행 중, ok 정상, partial 일부 실패, failed 실패';
comment on column price.ingest_run.calls_used is '이 실행이 쓴 API 호출 수';
comment on column price.ingest_run.call_budget is '이 실행에 허용한 API 호출 상한 (개발계정 일일 한도 안에서)';
comment on column price.ingest_run.error_code is '실패 원인 코드 (우리 분류). 실패가 없으면 null';
comment on column price.ingest_run.error_detail is '실패 설명. 인증키·접속 주소·원천 오류 원문(ORA-… 등)은 남기지 않는다';
comment on column price.ingest_run.git_sha is '실행한 코드의 커밋. 모르면 null';

comment on table price.raw_object is 'Storage(raw 버킷)에 올린 원본 파일 하나. 실행 × 기능 × 대상 날짜 묶음마다 한 줄. 파일을 지워도 행은 남긴다 (3-7)';
comment on column price.raw_object.id is '원본 파일 ID (identity). 관측값·정정 이력·평년 행 등이 이것으로 자기 값을 준 파일을 가리킨다';
comment on column price.raw_object.source is '출처: kamis, ekape, chamga';
comment on column price.raw_object.endpoint is '호출한 기능 (perDay/price, consumerPriceDaily, getProductPriceInfoSvc, getStoreInfoSvc.do, getProductInfoSvc.do, getStandardInfoSvc.do)';
comment on column price.raw_object.storage_path is 'Storage 경로: raw/{source}/{YYYY}/{MM}/{DD}/{call-key}.ndjson.gz. DD는 KST 수집일, 파일은 gzip NDJSON';
comment on column price.raw_object.requests is '묶음 안 호출마다의 기록 (JSON 배열): 파라미터(serviceKey 제외), pageNo, HTTP 상태, resultCode, 행 수';
comment on column price.raw_object.call_count is '이 파일을 만든 API 호출 수';
comment on column price.raw_object.row_count is '파일에 담긴 원천 행 수';
comment on column price.raw_object.bytes_gz is 'gzip 압축 후 파일 크기 (바이트)';
comment on column price.raw_object.content_sha256 is '압축 전 내용의 SHA-256 (hex). 직전 파일과 같으면 올리지 않고 duplicate로 기록한다';
comment on column price.raw_object.target_from is '파일에 담긴 조사일 범위의 시작 (KST). 마스터처럼 날짜가 없으면 null';
comment on column price.raw_object.target_to is '파일에 담긴 조사일 범위의 끝 (KST, 이날 포함). 날짜가 없으면 null';
comment on column price.raw_object.fetched_at is 'API에서 받은 시각';
comment on column price.raw_object.ingest_run_id is '이 파일을 받은 수집 실행';
comment on column price.raw_object.contract_baseline is '응답 모양을 대조한 계약 테스트 baseline 버전 (p2/12)';
comment on column price.raw_object.adapter_version is '이 파일을 관측값으로 바꾼 어댑터 버전. 변환 규칙이 바뀌면 다시 적재할 파일을 이것으로 고른다';
comment on column price.raw_object.load_status is 'pending_load 올렸고 적재 대기(실패 시 다음 실행이 다시 적재) / loaded / partially_rejected 일부 행 거부 / rejected 전부 거부 / duplicate 직전 파일과 같아 올리지 않음';
comment on column price.raw_object.rejected_rows is '행 단위 검증에서 관측값으로 넘기지 못한 행 수 (형식 위반 등, 3-12 #26)';
comment on column price.raw_object.duplicate_of is 'duplicate일 때 내용이 같은 직전 파일. 그 밖에는 null';
comment on column price.raw_object.loaded_at is '적재를 마친 시각. 아직이면 null';
comment on column price.raw_object.purged_at is 'Storage 파일을 지운 시각 (보존 기간이 지난 KAMIS·축평원). 아직 있으면 null. 다시 계산할 때 이 파일은 API에서 다시 받는다';

comment on table price.source_day is '출처 × 대상 날짜(조사일)마다 한 줄: 그날 수집이 얼마나 됐나. 배치는 이 표를 보고 비거나 실패한 날을 다시 채운다 (3-5)';
comment on column price.source_day.source is '출처: kamis, ekape, chamga';
comment on column price.source_day.target_date is '대상 조사일 (KST)';
comment on column price.source_day.status is '수집 완결성만 뜻한다: pending 아직 안 옴, ok, partial 일부 누락, empty_expected 휴일·격주 비는 날 등, empty_unexpected 와야 하는데 없음, failed 호출 실패. 정정은 상태가 아니라 corrected_at으로 남긴다';
comment on column price.source_day.corrected_at is '받은 뒤 값(가격·행사)이 마지막으로 바뀐 시각 (정정, 3-3). 정정이 없었으면 null';
comment on column price.source_day.correction_count is '정정이 일어난 횟수 (원본 파일 하나에서 그날 행이 하나라도 바뀌면 1)';
comment on column price.source_day.expected_rows is '기준 행 수: KAMIS 최근 4주 같은 요일 중앙값, 참가격 최근 4 조사일 중앙값. 이력이 없으면 null';
comment on column price.source_day.row_count is '지금까지 받은 그날 행 수';
comment on column price.source_day.item_count is '받은 품목(원천 키) 수. 세지 않았으면 null';
comment on column price.source_day.place_count is '받은 관측 위치(점포·시장) 수. 세지 않았으면 null';
comment on column price.source_day.attempts is '그날을 받으려고 시도한 횟수';
comment on column price.source_day.first_ok_at is '처음 정상으로 받은 시각 (도착 시각 측정용). 아직이면 null';
comment on column price.source_day.last_checked_at is '마지막으로 다시 받아 확인한 시각. 행마다 last_seen_at을 두지 않는 대신 여기에 남긴다 (3-0)';
comment on column price.source_day.last_changed_at is '그날 데이터(행 수·값)가 마지막으로 달라진 시각';
comment on column price.source_day.max_source_registered_at is '그날 행의 원천 등록 시각 최댓값 (KAMIS orgnl_reg_dt, 참가격 inputDttm). 재등록 감지용';
comment on column price.source_day.stable_checks is '다시 받을 때 행 수가 연속으로 같았던 횟수 (참가격 완료 판단)';
comment on column price.source_day.closed_at is '더 다시 받지 않기로 한 시각 (참가격: 조사일 뒤 10일, 완료 후 다음 주 월요일). 열려 있으면 null';
comment on column price.source_day.last_error_code is '마지막 실패의 원인 코드. 없으면 null';
comment on column price.source_day.checksum is '그날 받은 내용의 해시. 다시 받은 내용이 같은지 빨리 본다. 없으면 null';
comment on column price.source_day.note is '운영자 메모';

comment on table price.source_day_part is '부분 누락을 판정하는 단위: 출처 × 날짜 × 부분(품목·판매처·점포·신선식품 표본) (3-5)';
comment on column price.source_day_part.source is '출처 (source_day와 복합 FK)';
comment on column price.source_day_part.target_date is '대상 조사일 (KST, source_day와 복합 FK)';
comment on column price.source_day_part.part_kind is '부분 종류: item 품목, seller 판매처, store 점포, fresh_panel 참가격 일반 신선식품 9개 점포 표본';
comment on column price.source_day_part.part_key is '부분 키: KAMIS item_cd, seller.id, 참가격 entpId, chamga-fresh-9';
comment on column price.source_day_part.row_count is '그 부분에서 받은 행 수';
comment on column price.source_day_part.baseline is '기준 행 수 (최근 4주 같은 부분의 중앙값). 이력이 없으면 null';
comment on column price.source_day_part.status is 'ok / partial 기준보다 적음 / missing 0행. store가 partial인 조사일은 상품 사라짐 횟수에 세지 않는다';

comment on table price.backfill_task is '과거분 채우기 작업 단위의 진행 상태. 중간에 끊겨도 이어 받는다 (3-5, 5-4)';
comment on column price.backfill_task.source is '출처: kamis, ekape, chamga';
comment on column price.backfill_task.task_key is '작업 묶음 키 (예: kamis:01-211:2023 = 소매 배추 2023년, ekape:4304:2024-03-01 = 돼지 하루)';
comment on column price.backfill_task.status is 'pending, running, done, failed';
comment on column price.backfill_task.rows is '받은 원천 행 수. 아직이면 null';
comment on column price.backfill_task.calls is '쓴 API 호출 수. 아직이면 null';
comment on column price.backfill_task.finished_at is '끝난 시각. 아직이면 null';
comment on column price.backfill_task.last_error_code is '마지막 실패의 원인 코드. 없으면 null';

-- ── 3-2 판매처·관측 위치·점포·조사 시장 ────────────────────────────────

comment on table price.seller is '판매처: 점포를 운영하는 회사·브랜드 (예: 이마트, GS25). 운영자가 관리 (3-2)';
comment on column price.seller.id is '판매처 ID (identity)';
comment on column price.seller.name is '판매처 이름. 점포 이름 앞부분으로 자동 제안하는 기준';
comment on column price.seller.channel is '업태 (GLOSSARY): large_mart 대형마트, department 백화점, ssm 기업형 슈퍼, convenience 편의점, traditional_market 전통시장, online_mall 온라인몰';
comment on column price.seller.note is '운영자 메모';

comment on table price.obs_place is '관측 위치: 가격 행이 어디의 값인지 가리키는 키 하나. 점포(참가격), 조사 시장(KAMIS), 지역 평균(KAMIS 축산, 축평원 전국) 중 하나 (3-2)';
comment on column price.obs_place.id is '관측 위치 ID (identity). 하위 표 store·market과 PK를 공유한다';
comment on column price.obs_place.source is '출처: kamis, ekape, chamga';
comment on column price.obs_place.kind is '위치 종류: store 점포, market 조사 시장, region_avg 지역 평균';
comment on column price.obs_place.scope is '값이 대표하는 범위 (위치마다 고정): store, market, sigungu, sido, national. 관측값에 복사하지 않고 여기에만 둔다';
comment on column price.obs_place.source_place_code is '원천 위치 코드: 참가격 entpId, KAMIS mrkt_cd, KAMIS 축산 sgg_cd(1000 = 전국), 축평원은 national';
comment on column price.obs_place.region_code is 'region_code_map으로 붙인 우리 지역 코드. 매핑 전이거나 지역이 없으면(KAMIS 9998 온라인) null';
comment on column price.obs_place.first_seen_on is '가격 응답에서 처음 본 조사일 (KST). 마스터로만 아는 점포는 null';
comment on column price.obs_place.last_seen_on is '가격 응답에서 마지막으로 본 조사일 (KST). 활동 여부 판단에 쓴다. 마스터로만 아는 점포는 null';

comment on table price.store is '점포 (참가격 판매점). obs_place의 하위 표로 PK를 공유한다 (3-2)';
comment on column price.store.place_id is '관측 위치 ID (obs_place.id와 같음)';
comment on column price.store.kind is '상수 store. (place_id, kind) 복합 FK로 점포 위치에만 붙게 한다';
comment on column price.store.name is '점포 이름 (참가격 entpName)';
comment on column price.store.channel is '업태: large_mart(BU LM), department(DP), ssm(SM), convenience(CS)';
comment on column price.store.region_scope is 'local 지역 집계에 넣음 / national_only 전국 집계에만 넣음 (서울 본사 주소인 편의점 4곳)';
comment on column price.store.area_code_raw is '참가격 AR 시도 코드 원천값 (entpAreaCode, 9자리)';
comment on column price.store.area_detail_code_raw is '참가격 AR 시군구 코드 원천값 (areaDetailCode). 없으면 null';
comment on column price.store.region_code is '우리 지역 코드 (시군구가 목표, 법정동 파일 전에는 시도). 옛 광주·전남 코드는 새 코드로. 모르면 null';
comment on column price.store.lat is '위도 (참가격 xMapCoord). 좌표가 없는 점포가 많아 null 가능';
comment on column price.store.lng is '경도 (참가격 yMapCoord). lat와 함께 null이거나 함께 찬다';
comment on column price.store.road_addr is '도로명 주소 (roadAddrBasic). 재등록 판별 입력. 없으면 null';
comment on column price.store.jibun_addr is '지번 주소 (plmkAddrBasic). 없으면 null';
comment on column price.store.status is 'active, inactive(연속 결측으로 조사 안 됨), superseded(새 entpId로 재등록되어 대체됨)';
comment on column price.store.missing_streak is '연속으로 가격 행이 0개인 조사일 수 (3이면 inactive)';
comment on column price.store.lineage_id is '재등록 사슬의 첫 점포 (자기 자신일 수 있음). 집계·추이·점포 수는 이것으로 센다';

comment on table price.market is '조사 시장 (KAMIS mrkt_cd). obs_place의 하위 표로 PK를 공유한다. 판매처로 매핑하지 않는다 (3-2)';
comment on column price.market.place_id is '관측 위치 ID (obs_place.id와 같음)';
comment on column price.market.kind is '상수 market. (place_id, kind) 복합 FK로 시장 위치에만 붙게 한다';
comment on column price.market.name is '시장 이름 (KAMIS mrkt_nm, 예: 경동, B-유통)';
comment on column price.market.sgg_code_raw is '시장 행의 KAMIS sgg_cd 원천값. 시장이 정하며 다른 값이 오면 행을 거부한다';
comment on column price.market.market_type is '시장 유형: traditional 실명 전통시장, large_retail 익명 대형유통(X-유통), wholesale 도매시장, eco_channel 친환경 업태 조사처, online 온라인몰, other 그 밖';
comment on column price.market.type_source is '시장 유형을 정한 방법: name_rule 이름 규칙(kamis.md 5-1), operator 운영자';
comment on column price.market.in_official_table is 'KAMIS 코드표에 있는 시장인가. false면 응답에서만 본 시장';

comment on table price.store_seller is '점포 → 판매처 매핑 (운영자, 기간별). 같은 점포의 기간이 겹치면 거부한다. 집계는 조사일이 속한 기간의 판매처로 센다 (3-2)';
comment on column price.store_seller.place_id is '점포';
comment on column price.store_seller.seller_id is '그 기간의 판매처';
comment on column price.store_seller.valid_from is '유효 시작일 (이날 포함)';
comment on column price.store_seller.valid_to is '유효 종료일 (이날부터 무효). 지금도 유효하면 null';

comment on table price.store_link is '점포 이력 연결: 새 entpId 재등록, 같은 점포 중복 등록 (3-2)';
comment on column price.store_link.old_place_id is '옛 점포 (또는 먼저 등록된 쪽)';
comment on column price.store_link.new_place_id is '새 점포. 옛 점포와 같을 수 없다';
comment on column price.store_link.reason is 're_registered 새 entpId로 재등록 / duplicate 같은 점포 동시 등록';
comment on column price.store_link.evidence is '판별 근거 (JSON): 이름(띄어쓰기 무시)·도로명 주소 일치 등';
comment on column price.store_link.linked_on is '연결한 날';
comment on column price.store_link.linked_by is '연결한 주체: auto 자동 판별 또는 운영자 이름';

comment on table price.region_code_map is '원천 지역 코드 → 우리 지역 코드 (기간별). 같은 원천 코드의 기간이 겹치면 거부한다 (3-2)';
comment on column price.region_code_map.source is '출처: kamis, ekape, chamga';
comment on column price.region_code_map.code_class is '원천 코드 종류: AR 참가격 지역, sgg KAMIS sgg_cd, region_prc_index 축평원 regionPrc 번호';
comment on column price.region_code_map.source_region_code is '원천 지역 코드 (예: 020200000, 1101, 1~17)';
comment on column price.region_code_map.valid_from is '유효 시작일 (이날 포함)';
comment on column price.region_code_map.valid_to is '유효 종료일 (이날부터 무효). 지금도 유효하면 null';
comment on column price.region_code_map.region_code is '우리 지역 코드. 지역이 없는 코드(KAMIS 9998 온라인)는 null';
comment on column price.region_code_map.note is '운영자 메모';

comment on table price.source_master_change is '마스터 변경 기록: 참가격 마스터를 월 1회 받아 비교한 결과 중 바뀐 것, 상품 병합 (3-2, 3-6)';
comment on column price.source_master_change.id is '변경 기록 ID (identity)';
comment on column price.source_master_change.source is '출처: kamis, ekape, chamga';
comment on column price.source_master_change.entity is '바뀐 대상: product 상품, store 점포, code 코드';
comment on column price.source_master_change.source_key is '원천 키: goodId, entpId, 코드 (예: AR:021800000)';
comment on column price.source_master_change.change_kind is 'added 새로 생김, removed 없어짐, changed 값이 바뀜';
comment on column price.source_master_change.field is '바뀐 필드 이름 (changed일 때). 없으면 null';
comment on column price.source_master_change.old_value is '바뀌기 전 값 (문자열). 없으면 null';
comment on column price.source_master_change.new_value is '바뀐 뒤 값 (문자열). 없으면 null';
comment on column price.source_master_change.detected_on is '변경을 발견한 날';
comment on column price.source_master_change.raw_object_id is '비교에 쓴 마스터 원본 파일. 상품 병합(action merged)은 운영자 작업이라 null';
comment on column price.source_master_change.action is '처리: recorded 기록만, mapping_reset 매핑 다시 확인, linked 점포 연결, attr_versioned 상품 속성 새 기간, merged 상품 병합';

-- ── 3-6 상품 (참가격) ──────────────────────────────────────────────────

comment on table price.product is '상품: 판매처가 실제로 파는 포장 단위의 물건. 우리가 발급하는 ID이며 재사용·삭제하지 않는다. 참가격(나중에 제보·온라인몰)용 (3-6)';
comment on column price.product.id is '상품 ID (identity). URL·요약은 이 내부 ID만 참조한다 (goodId를 드러내지 않는다)';
comment on column price.product.name is '현재 이름 (product_attr_history 최신 값의 복사)';
comment on column price.product.status is 'surveyed 조사 중, not_surveyed 연속 결측으로 조사 안 됨, merged 다른 상품에 병합됨';
comment on column price.product.registered_on is '등록일: 마스터나 가격 응답에서 이 상품을 처음 본 날';
comment on column price.product.first_price_on is '최초 확인일: 처음 가격이 관측된 조사일. 첫 관측 전 null';
comment on column price.product.last_price_on is '마지막 확인일: 마지막으로 가격이 관측된 조사일. 첫 관측 전 null';
comment on column price.product.missing_streak is '연속 결측 조사일 수. partial인 조사일은 세지 않는다. calc_param chamga.disappear_streak(3)에 닿으면 not_surveyed';
comment on column price.product.status_changed_on is 'status가 마지막으로 바뀐 날. 바뀐 적 없으면 null';
comment on column price.product.merged_into is '병합되어 이어받은 상품 (status merged일 때만). 사슬은 한 단계를 넘지 않는다';

comment on table price.product_source_key is '출처 키 → 상품 (기간별). 같은 원천 키의 기간이 겹치면 거부한다. goodId 재사용이 의심되면 valid_to로 끊는다 (3-6)';
comment on column price.product_source_key.source_item_id is '원천 키 (chamga:{goodId})';
comment on column price.product_source_key.valid_from is '유효 시작일 (이날 포함). 참가격 API의 첫 조사일은 2026-06-12';
comment on column price.product_source_key.valid_to is '유효 종료일 (이날부터 무효). 지금도 유효하면 null';
comment on column price.product_source_key.product_id is '그 기간에 이 키가 가리키는 상품';

comment on table price.product_attr_history is '상품 속성 이력: 이름·용량·분류가 바뀌면 새 기간 행을 더한다. 기간이 겹치면 거부한다 (3-6)';
comment on column price.product_attr_history.product_id is '상품';
comment on column price.product_attr_history.valid_from is '유효 시작일 (이날 포함)';
comment on column price.product_attr_history.valid_to is '유효 종료일 (이날부터 무효). 지금도 유효하면 null';
comment on column price.product_attr_history.name is '상품 이름 (goodName)';
comment on column price.product_attr_history.total_qty is '총 용량 수량 (goodTotalCnt, 예: 110)';
comment on column price.product_attr_history.total_unit is '총 용량 단위 (goodTotalDivCode, UT 코드, 예: G)';
comment on column price.product_attr_history.al_code is 'AL 상품 소분류 코드 (goodSmlclsCode, 예: 030201024 컵라면)';
comment on column price.product_attr_history.maker_code is '제조사 코드 (productEntpCode). 이름은 API에 없다. 없으면 null';
comment on column price.product_attr_history.detail_mean is '환산 기준·규격 판별 근거 (운영자가 읽음). 없으면 null';
comment on column price.product_attr_history.raw_object_id is '이 속성을 준 상품 마스터 원본 파일';

comment on table price.al_variety_rule is 'AL 소분류 → 품종·규격 기본값. 상품 → 품종 매핑을 먼저 이것으로 채운다 (search-first-view 결정 8, 3-6). 운영자가 관리';
comment on column price.al_variety_rule.al_code is '참가격 AL 소분류 코드';
comment on column price.al_variety_rule.variety_id is '기본 품종';
comment on column price.al_variety_rule.spec_id is '기본 규격. 규격을 가르지 않으면 그 품종의 기본 규격';
comment on column price.al_variety_rule.unit_rule_id is '이 소분류 상품에 쓸 환산 규칙 버전';
comment on column price.al_variety_rule.note is '운영자 메모';

comment on table price.product_variety_map is '상품 → 품종·규격 (기간별). 같은 상품의 기간이 겹치면 거부한다 (3-6)';
comment on column price.product_variety_map.product_id is '상품';
comment on column price.product_variety_map.valid_from is '유효 시작일 (이날 포함)';
comment on column price.product_variety_map.valid_to is '유효 종료일 (이날부터 무효). 지금도 유효하면 null';
comment on column price.product_variety_map.status is 'pending 대기(가공식품 품종 단위가 정해지기 전 등) / mapped 확정 / ignored 품종에 잇지 않음';
comment on column price.product_variety_map.variety_id is '품종. pending·ignored면 null';
comment on column price.product_variety_map.spec_id is '규격. variety_id와 함께 null이거나 함께 찬다';
comment on column price.product_variety_map.unit_rule_id is '상품 가격을 품종의 기준 단위로 바꿀 환산 규칙 버전. mapped면 반드시 있다';
comment on column price.product_variety_map.origin is '정한 방법: al_rule 소분류 기본값, operator 운영자';

-- ── 3-1 매핑 (계속) ───────────────────────────────────────────────────

comment on table price.alias is '별칭: 사용자가 검색할 때 쓰는 다른 이름. 품목이나 품종 하나를 가리킨다 (예: 대패삼겹 → 국산 삼겹살). 운영자가 관리 (3-1)';
comment on column price.alias.id is '별칭 ID (identity)';
comment on column price.alias.text is '별칭 글자. 검색은 lower(text)로 찾는다';
comment on column price.alias.item_id is '가리키는 품목. variety_id와 둘 중 하나만 찬다';
comment on column price.alias.variety_id is '가리키는 품종. item_id와 둘 중 하나만 찬다';

comment on table price.variety_seasonal_map is '가격 품종 ↔ 제철 품종(packages/seasonal) 연결. 다대다 (3-1)';
comment on column price.variety_seasonal_map.variety_id is '가격 품종';
comment on column price.variety_seasonal_map.seasonal_food_id is 'packages/seasonal의 품종 id (예: korean-zucchini)';

-- ── 3-3 ② 관측값 ─────────────────────────────────────────────────────

comment on table price.observation is '가격 관측 한 건: 한 번의 조사에서 나온 가격 하나. 세 출처가 같은 표에 들어간다. 보존: KAMIS 90일, 참가격 6 조사일, 축평원 영구 (3-3, 3-9)';
comment on column price.observation.source_item_id is '무엇의 값인가 (원천 키)';
comment on column price.observation.obs_date is '조사일 (KST). KAMIS exmn_ymd, 축평원 standYmd, 참가격 goodInspectDay';
comment on column price.observation.place_id is '어디의 값인가 (점포, 조사 시장, 지역 평균). 범위·지역은 obs_place에 있다';
comment on column price.observation.price_tier is '가격 단계: retail 소매(KAMIS se_cd 01·07, 축평원, 참가격), wholesale 도매(se_cd 02, MVP는 받지 않음)';
comment on column price.observation.obs_kind is 'quote_sample 시세 표본(KAMIS 조사 시장 한 곳), quote_aggregate 이미 집계된 시세(KAMIS 축산 시도·전국, 축평원 전국), shelf_price 판매가(참가격 점포 한 곳)';
comment on column price.observation.product_id is '상품 (참가격만, 조사일이 유효 기간 안인 product_source_key로). shelf_price면 반드시 있다. 그 밖에는 null';
comment on column price.observation.variety_id is '적재 시점의 품종 매핑. 매핑 전(pending)이면 null';
comment on column price.observation.spec_id is '적재 시점의 규격 매핑. variety_id와 함께 null이거나 함께 찬다';
comment on column price.observation.price_raw is '원천 가격 (원, 0보다 큰 정수). KAMIS exmn_dd_prc, 축평원 ntslPrc, 참가격 goodPrice(행사 반영가)';
comment on column price.observation.qty_raw is '원천 수량 (KAMIS unit_sz, 축평원 unit의 수량). 참가격은 상품 속성에 있어 null';
comment on column price.observation.unit_raw is '원천 단위 문자열 그대로 (개, 포기, kg(그물망 3포기), 원/100g). 참가격은 null';
comment on column price.observation.price_per_base is '기준 단위 가격 (원, 품종의 base_unit_qty × base_unit당) = price_raw ÷ 원천 수량(기준 단위로) × base_unit_qty. 매핑 전·환산 실패면 null';
comment on column price.observation.unit_rule_id is 'price_per_base 계산에 쓴 환산 규칙 버전. 환산하지 않았으면 null';
comment on column price.observation.promo_discount is '행사(할인) 여부: true(goodDcYn Y), false(N), null(필드 없음 = 모름). KAMIS·축평원은 null';
comment on column price.observation.promo_one_plus_one is '행사(1+1) 여부: true(plusoneYn Y), false(N), null(모름)';
comment on column price.observation.promo_from is '할인 시작일 (goodDcStartDay, 할인일 때만). 표시용이며 조사일과 어긋날 수 있다';
comment on column price.observation.promo_to is '할인 종료일 (goodDcEndDay, 할인일 때만). 표시용';
comment on column price.observation.flags is '표시 목록: carried_over 전일가 이월 후보, outlier 이상치, duplicate_of_ekape 축평원과 중복, unit_mismatch 단위 다름, one_plus_one_unverified 1+1 가격 미확인. 없으면 null';
comment on column price.observation.source_registered_at is '원천 등록 시각: KAMIS orgnl_reg_dt(UTC, 재등록 때 덮임), 참가격 inputDttm(KST로 해석). 축평원·KAMIS 축산은 null. 이것만 바뀐 것은 정정이 아니다';
comment on column price.observation.first_seen_at is '우리가 이 키를 처음 받은 시각 (첫 등록 시각의 대용). 고치지 않는다';
comment on column price.observation.revision is '가격·행사 값이 바뀐 횟수 (정정). 0이면 처음 값 그대로';
comment on column price.observation.raw_object_id is '지금 값을 준 원본 파일 (값이 바뀔 때만 바뀐다)';

comment on table price.observation_revision is '정정 이력: 관측값의 가격·행사가 바뀌기 전 값. 관측값이 보존 기간으로 지워져도 남도록 FK 없이 키만 든다 (3-3)';
comment on column price.observation_revision.id is '이력 ID (identity)';
comment on column price.observation_revision.source_item_id is '관측값 PK의 원천 키 (FK 없음)';
comment on column price.observation_revision.obs_date is '관측값 PK의 조사일 (FK 없음)';
comment on column price.observation_revision.place_id is '관측값 PK의 관측 위치 (FK 없음)';
comment on column price.observation_revision.revision is '바뀐 뒤 revision 번호';
comment on column price.observation_revision.old_price_raw is '바뀌기 전 원천 가격 (원). 보존 기간 밖 재등록에서 모르면 null';
comment on column price.observation_revision.new_price_raw is '바뀐 뒤 원천 가격 (원)';
comment on column price.observation_revision.old_promo is '바뀌기 전 행사 값 (JSON: discount, one_plus_one, from, to). 모르면 null';
comment on column price.observation_revision.new_promo is '바뀐 뒤 행사 값 (JSON: discount, one_plus_one, from, to)';
comment on column price.observation_revision.old_source_registered_at is '바뀌기 전 원천 등록 시각';
comment on column price.observation_revision.new_source_registered_at is '바뀐 뒤 원천 등록 시각';
comment on column price.observation_revision.rebuild_result is '보존 기간 밖 재등록일 때만: rebuilt 원본 전체로 집계 교체, kept 원본 불완전이라 집계 유지(경보), not_aggregated 집계 대상 아님. 보통 정정은 null';
comment on column price.observation_revision.detected_at is '바뀐 것을 발견한 시각';
comment on column price.observation_revision.raw_object_id is '바뀐 값을 준 원본 파일';

comment on table price.reference_observation is '원천이 준 비교값 (축평원 평년 행). 관측값이 아니라 요청 기준일을 붙여 따로 둔다 (3-3)';
comment on column price.reference_observation.source_item_id is '원천 키';
comment on column price.reference_observation.place_id is '관측 위치 (축평원 전국)';
comment on column price.reference_observation.ref_type is '비교값 종류: normal_year 평년';
comment on column price.reference_observation.ref_date is '요청한 standYmd (KST). 평년 행 자체에는 날짜가 없다';
comment on column price.reference_observation.value_raw is '원천 값 (원, ntslPrc)';
comment on column price.reference_observation.unit_raw is '원천 단위 (예: 원/100g)';
comment on column price.reference_observation.first_seen_at is '우리가 처음 받은 시각';
comment on column price.reference_observation.revision is '값이 바뀐 횟수';
comment on column price.reference_observation.raw_object_id is '지금 값을 준 원본 파일';

-- ── 3-4 ③ 집계·판정 ──────────────────────────────────────────────────

comment on table price.daily_quote is '품종·규격별 일자 요약 (시세·판매가의 대표값). 관측값에서 언제든 다시 만드는 파생 데이터이며 영구 보관 (3-4)';
comment on column price.daily_quote.variety_id is '품종';
comment on column price.daily_quote.spec_id is '규격';
comment on column price.daily_quote.price_tier is '가격 단계: retail 소매, wholesale 도매';
comment on column price.daily_quote.basis is '어디서 냈나: quote 시세(KAMIS·축평원), shelf_price 판매가(참가격)';
comment on column price.daily_quote.scope_key is '범위: national, market_type:<시장 유형>, channel:<업태>, region:<지역 코드>(MVP는 만들지 않음)';
comment on column price.daily_quote.obs_date is '조사일 (KST)';
comment on column price.daily_quote.value is '대표값 (원, 기준 단위당). 집계된 시세는 원천 값, 시세 표본·판매가는 중앙값';
comment on column price.daily_quote.median is '중앙값 (원, 기준 단위당). 행사 중(true)인 판매가는 뺀다';
comment on column price.daily_quote.min is '최솟값 (원, 기준 단위당)';
comment on column price.daily_quote.max is '최댓값 (원, 기준 단위당)';
comment on column price.daily_quote.n is '관측 수: 조사 시장 수, 점포 수(lineage 기준), 지역 평균이면 1';
comment on column price.daily_quote.n_sellers is '판매가일 때 판매처 수. 시세면 null';
comment on column price.daily_quote.sources is '값을 낸 출처 목록 (대표 출처만, 예: {kamis})';
comment on column price.daily_quote.promo_excluded_n is '행사(true)라 대표값에서 뺀 관측 수';
comment on column price.daily_quote.stale_days is '같은 값이 이어진 날 수 (갱신 지연·전일가 이월 의심). 세지 않았으면 null';
comment on column price.daily_quote.meets_min_n is '최소 표본 수 기준(calc_param aggregate.min_n)을 넘었나. 기준이 정해지기 전에는 null';
comment on column price.daily_quote.flags is '표시 목록 (예: outlier). 없으면 null';
comment on column price.daily_quote.calc_version is '계산식 버전 (calc_param 값을 포함한 계산 코드의 버전)';
comment on column price.daily_quote.computed_at is '계산한 시각';

comment on table price.product_daily_summary is '상품별 일자 요약. 검색 상품 목록·상품 화면이 읽는다. 영구 보관 (3-4)';
comment on column price.product_daily_summary.product_id is '상품';
comment on column price.product_daily_summary.scope_key is '범위: national, channel:<업태>, seller:<seller.id>, region:<시도 코드>. 편의점 본사(national_only)는 national·channel:convenience에만';
comment on column price.product_daily_summary.obs_date is '조사일 (KST)';
comment on column price.product_daily_summary.min is '최저 판매가 (원, 상품 한 개 가격)';
comment on column price.product_daily_summary.median is '판매가 중앙값 (원)';
comment on column price.product_daily_summary.max is '최고 판매가 (원)';
comment on column price.product_daily_summary.median_excl_promo is '행사(true) 판매가를 뺀 중앙값 (원). 행사가 아닌 값이 없으면 null';
comment on column price.product_daily_summary.seller_avg is '판매처별 평균을 다시 평균 낸 2단 평균 (원, 정부 화면과 같은 값). 판매처를 모르면 null';
comment on column price.product_daily_summary.n_stores is '점포 수 (lineage 기준)';
comment on column price.product_daily_summary.n_sellers is '판매처 수. 판매처 매핑이 없으면 0 또는 null';
comment on column price.product_daily_summary.promo_n is '행사(할인·1+1 중 하나라도 true) 관측 수';
comment on column price.product_daily_summary.promo_unknown_n is '행사 필드가 둘 다 없어 모르는 관측 수';
comment on column price.product_daily_summary.meets_min_n is '최소 표본 수 기준을 넘었나. 기준이 정해지기 전에는 null';
comment on column price.product_daily_summary.computed_at is '계산한 시각';

comment on table price.reference_price is '품종·규격 단위 비교값 (평년, 1년 전, 1달 전). 영구 보관 (3-4)';
comment on column price.reference_price.variety_id is '품종';
comment on column price.reference_price.spec_id is '규격';
comment on column price.reference_price.ref_type is '비교값 종류: normal_year 평년, year_ago 1년 전, month_ago 1달 전';
comment on column price.reference_price.source is '낸 곳: ekape 축평원 응답의 평년, computed KAMIS 5년 이력으로 직접 계산';
comment on column price.reference_price.scope_key is '범위 (daily_quote.scope_key와 같은 형식)';
comment on column price.reference_price.ref_date is '기준일 (KST): 이 날짜에 대한 비교값';
comment on column price.reference_price.value is '비교값 (원, 기준 단위당)';
comment on column price.reference_price.method is '계산 방법 이름 (예: ekape_response, kamis_5y_trimmed_mean)';
comment on column price.reference_price.computed_at is '계산한 시각';

comment on table price.usual_price is '평소가: 판정의 기준이 되는, 품종·규격이 평소에 팔리는 가격. 계산식은 로드맵 ② (3-4)';
comment on column price.usual_price.variety_id is '품종';
comment on column price.usual_price.spec_id is '규격';
comment on column price.usual_price.as_of is '기준일 (KST): 이 날짜 시점의 평소가';
comment on column price.usual_price.value is '평소가 (원, 기준 단위당)';
comment on column price.usual_price.method is '계산 방법 이름';
comment on column price.usual_price.components is '계산 근거 (JSON): 쓴 기간, 표본 수, 평년 등';
comment on column price.usual_price.confidence is '신뢰도 단계 (작을수록 낮음, 척도는 ②에서 정함). 정하지 않았으면 null';

comment on table price.calc_param is '계산 상수: 판정 설계(②)에서 정할 값의 자리. 계산 코드는 이 표에서 읽고 결과의 calc_version에 남긴다 (3-4)';
comment on column price.calc_param.key is '상수 이름 (예: chamga.disappear_streak)';
comment on column price.calc_param.value is '값 (JSON 숫자 등). 아직 정하지 않았으면 null';
comment on column price.calc_param.status is 'decided 정한 값, placeholder 임시 값이거나 빈 자리';
comment on column price.calc_param.decided_in is '근거 문서 (예: chamgagyeok.md 9장). 없으면 null';
comment on column price.calc_param.note is '설명';

comment on table price.judgment_batch is '판정 스냅샷 묶음 하나. 다 만든 뒤 judgment_current 포인터를 바꿔 한 번에 교체한다. ready는 최근 3개만 둔다 (3-4)';
comment on column price.judgment_batch.id is '묶음 ID (identity)';
comment on column price.judgment_batch.started_at is '만들기 시작한 시각';
comment on column price.judgment_batch.finished_at is '다 만든 시각. 아직이면 null';
comment on column price.judgment_batch.status is 'building 만드는 중, ready 검사 통과(교체 가능), failed 실패(포인터는 그대로)';
comment on column price.judgment_batch.trigger is '만든 계기 (예: daily, recompute, 운영자)';
comment on column price.judgment_batch.note is '메모 (실패 이유 등)';

comment on table price.judgment_current is '현재 보이는 판정 묶음을 가리키는 한 줄짜리 포인터 (3-4)';
comment on column price.judgment_current.singleton is '늘 true. 표가 한 줄만 갖게 하는 PK';
comment on column price.judgment_current.batch_id is '지금 화면에 보이는 판정 묶음';
comment on column price.judgment_current.swapped_at is '포인터를 마지막으로 바꾼 시각';

comment on table price.judgment_snapshot is '품종·규격별 판정 (묶음 단위). 화면은 뷰 current_judgment로 현재 묶음만 읽는다 (3-4)';
comment on column price.judgment_snapshot.batch_id is '속한 판정 묶음';
comment on column price.judgment_snapshot.variety_id is '품종';
comment on column price.judgment_snapshot.spec_id is '규격';
comment on column price.judgment_snapshot.as_of is '판정 기준일 (KST)';
comment on column price.judgment_snapshot.today_price is '오늘 가격 (원, 기준 단위당). 없으면 null';
comment on column price.judgment_snapshot.usual is '평소가 (원, 기준 단위당). 없으면 null';
comment on column price.judgment_snapshot.verdict is '판정: cheap 싸다, normal 보통, expensive 비싸다. 판정할 수 없으면 null';
comment on column price.judgment_snapshot.diff_pct is '평소가 대비 오늘 가격 차이 (%, (today_price / usual − 1) × 100). 판정할 수 없으면 null';
comment on column price.judgment_snapshot.confidence is '판정 신뢰도 단계 (척도는 ②에서 정함). 없으면 null';
comment on column price.judgment_snapshot.payload is '화면이 읽는 판정 payload 그대로 (JSON, 4-1 모양)';

comment on view price.current_judgment is '현재 묶음(judgment_current)의 판정. security_invoker라 읽는 롤의 권한과 RLS가 적용된다. 화면은 이것을 읽는다 (3-4)';
comment on column price.current_judgment.batch_id is '현재 판정 묶음';
comment on column price.current_judgment.variety_id is '품종';
comment on column price.current_judgment.spec_id is '규격';
comment on column price.current_judgment.as_of is '판정 기준일 (KST)';
comment on column price.current_judgment.today_price is '오늘 가격 (원, 기준 단위당). 없으면 null';
comment on column price.current_judgment.usual is '평소가 (원, 기준 단위당). 없으면 null';
comment on column price.current_judgment.verdict is '판정: cheap, normal, expensive. 판정할 수 없으면 null';
comment on column price.current_judgment.diff_pct is '평소가 대비 오늘 가격 차이 (%)';
comment on column price.current_judgment.confidence is '판정 신뢰도 단계. 없으면 null';
comment on column price.current_judgment.payload is '화면이 읽는 판정 payload (JSON, 4-1 모양)';

-- 보존 정리 함수 (20261021000400)
comment on function price.purge_expired_observations(date) is '주 1회 보존 정리: KAMIS 관측값은 p_today − 90일보다 오래된 것, 참가격은 최근 6 조사일보다 오래된 것을 지운다. 축평원은 건드리지 않는다. 출처별 지운 행 수를 돌려준다. ingest_writer만 실행 (3-9)';
