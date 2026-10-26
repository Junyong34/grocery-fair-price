# 14. 주 1회 heartbeat 워크플로

Status: open
Type: task (AFK)
Blocked by: 08, 11, 12, 13

## Question

공개 저장소는 60일 동안 저장소 활동이 없으면 schedule 워크플로를 끈다. 매일 수집이 돌아도 커밋이 없으면 꺼진다 (5-3-1). 주 1회 점검이 꺼진 수집을 다시 켜고, 멈춘 출처를 알린다.

## 할 일

- [ ] `.github/workflows/heartbeat.yml`: 주 1회. `gh workflow list`로 수집 워크플로 상태를 보고 꺼졌으면 `gh workflow enable` (`permissions: actions: write`)
- [ ] 출처별 `source_day`의 마지막 `ok`가 기대보다 2일 넘게 멈췄으면 13의 방식으로 알림 이슈. 참가격은 조사일 주기를 감안한 기대값
- [ ] heartbeat 자신도 꺼질 수 있다: 50일째 되기 전에 사람이 확인할 일정을 정해 `## Answer`에 적는다 (달력, 또는 다른 장치)
- [ ] 04(Supabase 일시정지)의 결과에 더할 감시가 있으면 여기 넣는다
- [ ] `workflow_dispatch`로 수집 워크플로 하나를 꺼 둔 채 돌려 다시 켜지는지 확인

## 완료 기준

- 꺼 둔 수집 워크플로가 heartbeat 한 번에 다시 켜지고, 멈춘 출처 알림이 생긴다.
