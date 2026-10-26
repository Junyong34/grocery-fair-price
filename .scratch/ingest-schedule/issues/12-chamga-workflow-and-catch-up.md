# 12. 참가격 워크플로와 2026-06-12 이후 빈 조사일 채우기

Status: open
Type: task (AFK)
Blocked by: 03, 10

## Question

참가격 정기 수집을 Actions에 올리고, 2026-06-12부터 지금까지 빠진 조사일을 운영 DB에 채운다. 늦을수록 이력을 잃는다.

## 할 일

- [ ] `.github/workflows/ingest-chamga.yml`: 매일 07:00 KST(`0 22 * * *`), 11과 같은 규칙(concurrency, timeout, 최소 권한, 로그 가리기)
- [ ] 빈 조사일 채우기: 조사일당 457회, 일일 한도와 실행당 예산 1,500 안에서 며칠로 나눈다 (search-first-view/04는 9개 조사일 약 4,113회를 3일로 나눴다. 오늘 기준으로 다시 센다). `workflow_dispatch`로 돌리거나 정기 실행이 이어 받게
- [ ] 채운 조사일 목록과 빠진 날을 `## Answer`에

## 완료 기준

- 2026-06-12 이후 모든 조사일의 원본이 Storage에, 관측값이 운영 Postgres에 있다.
- 다음 조사일이 사람 손 없이 저장됐다.
