# 14. 주 1회 heartbeat 워크플로

Status: claimed
Type: task (AFK)
Blocked by: 08, 11, 12, 13

## Question

공개 저장소는 60일 동안 저장소 활동이 없으면 schedule 워크플로를 끈다. 매일 수집이 돌아도 커밋이 없으면 꺼진다 (5-3-1). 주 1회 점검이 꺼진 수집을 다시 켜고, 멈춘 출처를 알린다.

## 할 일

- [x] `.github/workflows/heartbeat.yml`: 주 1회. `gh workflow list`로 수집 워크플로 상태를 보고 꺼졌으면 `gh workflow enable` (`permissions: actions: write`)
- [x] 출처별 `source_day`의 마지막 `ok`가 기대보다 2일 넘게 멈췄으면 13의 방식으로 알림 이슈. 참가격은 조사일 주기를 감안한 기대값
- [ ] heartbeat 자신도 꺼질 수 있다: 50일째 되기 전에 사람이 확인할 일정을 정해 `## Answer`에 적는다 (달력, 또는 다른 장치)
- [ ] 04(Supabase 일시정지)의 결과에 더할 감시가 있으면 여기 넣는다
- [ ] `workflow_dispatch`로 수집 워크플로 하나를 꺼 둔 채 돌려 다시 켜지는지 확인

- [x] Supabase 일시정지 확인: 비밀 키로 Storage를 한 번 조회해 540·접속 실패면 13의 방식으로 알림 (04 Answer)
## 완료 기준

- 꺼 둔 수집 워크플로가 heartbeat 한 번에 다시 켜지고, 멈춘 출처 알림이 생긴다.

## 진행 기록

**1차 (2026-10-29): heartbeat** (`.github/workflows/heartbeat.yml`, `packages/price-ingest/src/alert/heartbeat.ts`)
- 주 1회 수 11:00 KST (매일 수집과 09:30 다시 받기 뒤). 수동 실행 가능.
- 수집 워크플로 3개 중 `active`가 아닌 것(`disabled_inactivity`, `disabled_manually`)을 `gh workflow enable`로 켜고 `workflow_disabled` 알림. 수집 워크플로가 아닌 것(probe-runner)은 건드리지 않는다.
- 멈춤 기준 (10-29 운영 `source_day`로 정함. KAMIS·축평원은 주말에도 행이 와 매일 ok다):
  - KAMIS·축평원: 마지막 ok(또는 partial) 날이 오늘(KST) − 3일보다 오래면 (기대는 어제, 그보다 2일 넘게)
  - 참가격: 감지 기록(`last_checked_at`)이 3일 넘게 없으면 수집이 멈춘 것, 마지막 ok 조사일이 35일(가장 긴 간격 3주 + 등록 10일 + 여유)보다 오래면 데이터가 안 오는 것
- Supabase: 비밀 키로 Storage 목록을 한 번 보고, DB에 붙어 위 기준을 읽는다. 실패하면 `source:supabase`로 알림(`storage_failed`·`db_unreachable`). 둘 다 닿으면 열린 supabase 알림을 닫는다.
- 로컬에서 운영에 대고 한 번 돌렸다: 모두 켜져 있음, KAMIS·축평원 마지막 ok 10-28, 참가격 10-09·감지 기록 10-29. 알림 없음.

## Answer

- **heartbeat 자신도 60일 규칙으로 꺼진다.** 저장소에 커밋이 60일 없으면 heartbeat와 수집 워크플로가 함께 꺼진다. 지금은 커밋이 잦아 문제가 없다. 커밋이 뜸해지면 **마지막 커밋에서 50일째 되는 날 전에 사람이 아무 커밋이나 하나 하거나 Actions에서 워크플로를 켠다.** 달력 알림은 사람이 넣는다.

