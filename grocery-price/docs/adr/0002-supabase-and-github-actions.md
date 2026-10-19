# 가격 데이터는 Supabase에 쌓고, 수집은 GitHub Actions로 돌린다

공공 API 3개(KAMIS 일별, 축평원 소비자가격, 참가격)의 데이터는 Supabase에 둔다. 정제한 관측값과 집계·판정은 **Supabase Postgres**에, API가 돌려준 원본 응답은 gzip으로 압축해 **Supabase Storage**에 둔다. 수집·정제는 **GitHub Actions** 정기 실행이 맡고, 화면은 이미 쓰고 있는 Vercel의 `apps/web`이 DB를 읽어 그린다. 당장 비용을 쓰지 않는 조합이고, 판정에 필요한 기간 집계(최근 N주 중앙값, 5년 평년)가 SQL로 쉽기 때문이다. 원본을 따로 남기는 이유는 두 가지다. 정제 규칙이 틀렸을 때 API를 다시 부르지 않고 다시 계산할 수 있어야 하고, 참가격처럼 과거를 다시 주지 않는 출처가 있으며, 무료 플랜에는 자동 백업이 없다.

정적 JSON 게시(GitHub Pages)와 SQLite 파일은 기간 질의와 정정 이력 관리가 어려워 고르지 않았다. 원본을 버리고 Postgres에만 넣는 방식은 정제 실수를 되돌릴 수 없어 고르지 않았다. Railway는 서비스가 커져 무료 조합으로 부족할 때 옮길 후보로 둔다. 옮기기 쉽도록 업무 로직은 Supabase 전용 기능(Edge Functions 등)에 넣지 않고 순수 Postgres와 실행 환경에 무관한 수집 CLI로만 만든다. 상세 설계(용량 추정, 테이블, 수집 일정, 장애 처리)는 [pipeline.md](../30-data/pipeline.md)에 있다.

원본 보존 기간은 용량을 실측한 뒤 정한다 (1년 지난 원본 삭제를 검토). 2026-10-19 결정.
