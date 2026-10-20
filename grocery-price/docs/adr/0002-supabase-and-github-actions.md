# 가격 데이터는 Supabase에 쌓고, 수집은 GitHub Actions로 돌린다

공공 API 3개(KAMIS 일별, 축평원 소비자가격, 참가격)의 데이터는 Supabase에 둔다. 정제한 관측값과 집계·판정은 **Supabase Postgres**에, API가 돌려준 원본 응답은 gzip으로 압축해 **Supabase Storage**에 둔다. 수집·정제는 **GitHub Actions** 정기 실행이 맡고, 화면은 이미 쓰고 있는 Vercel의 `apps/web`이 DB를 읽어 그린다. 당장 비용을 쓰지 않는 조합이고, 판정에 필요한 기간 집계(최근 N주 중앙값, 5년 평년)가 SQL로 쉽기 때문이다. 원본을 따로 남기는 이유는 두 가지다. 정제 규칙이 틀렸을 때 API를 다시 부르지 않고 다시 계산할 수 있어야 하고, 참가격처럼 과거를 다시 주지 않는 출처가 있으며, 무료 플랜에는 자동 백업이 없다.

정적 JSON 게시(GitHub Pages)와 SQLite 파일은 기간 질의와 정정 이력 관리가 어려워 고르지 않았다. 원본을 버리고 Postgres에만 넣는 방식은 정제 실수를 되돌릴 수 없어 고르지 않았다. Railway는 서비스가 커져 무료 조합으로 부족할 때 옮길 후보로 둔다. 옮기기 쉽도록 업무 로직은 Supabase 전용 기능(Edge Functions 등)에 넣지 않고 순수 Postgres와 실행 환경에 무관한 수집 CLI로만 만든다. 상세 설계(용량 추정, 테이블, 수집 일정, 장애 처리)는 [pipeline.md](../30-data/pipeline.md)에 있다.

원본 보존 기간은 용량을 실측한 뒤 정한다 (1년 지난 원본 삭제를 검토). 2026-10-19 결정.

## 보완 (2026-10-20)

스키마 검토(`supabase-postgres-best-practices`)에서 접근 방식을 정했다. 위 결정(Supabase Postgres + Storage, GitHub Actions)은 그대로다.

- **표는 스키마 `price`에 둔다.** Supabase Data API(REST·GraphQL)로 노출하지 않고, `anon`·`authenticated`의 권한을 걷는다. RLS는 모든 표에 켜지만 이중 장치이고, 접근은 롤별 GRANT로 정한다.
- **웹앱은 서버 전용으로 읽는다.** `apps/web` 서버 컴포넌트가 읽기 전용 로그인 롤 `web_reader`로 Supavisor를 거쳐 붙는다. 브라우저에는 Supabase 키가 없다. supabase-js + 공개 키 + RLS 방식은 고르지 않았다. 판정 하나를 읽는 데도 정책·권한이 여러 표에 맞물려야 하고, 틀리면 빈 결과로만 드러나기 때문이다.
- **수집은 Postgres 롤로 쓴다.** GitHub Actions는 `ingest_writer` 롤로 DB에 쓰고, Supabase 비밀 키(`sb_secret_…`)는 Storage 업로드에만 쓴다. 옛 `anon`·`service_role` 키는 쓰지 않는다. 표 소유자는 마이그레이션의 `postgres`다. 권한이 Postgres 롤·GRANT에만 있어서 다른 Postgres로 옮길 때도 그대로 간다.
- **백업은 정식 서비스 전으로 미룬다.** 계획은 주 1회 `pg_dump`(Actions 아티팩트로 최근분, 달마다 한 벌을 비공개 Storage 버킷에)다. 지금은 시제품이라 하지 않는다. 그래서 위 "원본이 백업 역할을 한다"는 관측값·집계에만 맞다. 운영자가 정한 매핑(원천 코드 매핑, 점포 → 판매처, 상품 → 품종, 점포 연결, 계산 상수, 시장 유형 수정)은 원본에서 되살릴 수 없고, 백업 전까지는 잃을 수 있다.

상세는 [pipeline.md](../30-data/pipeline.md) 3-0과 6-1에 있다.
