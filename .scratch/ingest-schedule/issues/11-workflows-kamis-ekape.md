# 11. 수집 워크플로 (KAMIS·축평원)

Status: open
Type: task (AFK)
Blocked by: 03, 08, 09

## Question

`.github/workflows/ingest-kamis.yml`, `ingest-ekape.yml`가 pipeline.md 5-1 시각에 07의 CLI를 부른다.

## 할 일

- [ ] cron은 UTC: KAMIS 매일 06:30 KST(`30 21 * * *`), 축평원 06:40, KAMIS 주간 월 07:10(14일 다시 받기). 재등록 감시는 KAMIS 매일 실행에 함께
- [ ] `concurrency: { group: ingest-<source>, cancel-in-progress: false }`, `timeout-minutes`, `workflow_dispatch`(날짜 입력)
- [ ] `permissions`는 최소(`contents: read`). Secrets 네 개만 env로
- [ ] 02 Answer의 워크플로 규칙 다섯 가지 적용 (Secret은 단계 `env:`로만, 인코딩 변형 `::add-mask::`, 덤프·`set -x`·디버그 로깅 금지, 오류 본문을 이슈에 붙이지 않음, DB 주소 비밀번호는 퍼센트 인코딩)
- [ ] 의존성 설치는 `pnpm --filter @workspace/price-ingest...`만, 캐시
- [ ] `workflow_dispatch`로 운영에서 한 번씩 돌려 운영 DB·Storage에 들어간 것을 확인

## 완료 기준

- 정기 실행이 하루 이상 사람 손 없이 돌아 운영 `source_day`에 두 출처의 `ok`가 생겼다. 로그에 키·접속 주소가 없다.
