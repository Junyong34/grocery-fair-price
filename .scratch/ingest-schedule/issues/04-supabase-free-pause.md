# 04. Supabase Free 일시정지 기준

Status: open
Type: research (AFK)
Blocked by: -

## Question

Supabase Free 프로젝트는 무엇을 "활동"으로 보고 언제 일시정지되는가? 매일 `ingest_writer`가 Supavisor로 붙어 쓰고 Storage에 올리는 것만으로 일시정지를 막는가? 일시정지되면 수집이 멈추고, 되살리는 방법(대시보드 수동 복구 등)과 그 사이 데이터가 어떻게 되는지도 확인한다. pipeline.md 6장 "확인해야 한다"의 답이다.

## 완료 기준

- 출처(Supabase 공식 문서·가격 페이지·공식 토론) 링크와 함께 답이 있고, heartbeat(14)나 알림(13)에 더할 것이 있으면 적혀 있다.
