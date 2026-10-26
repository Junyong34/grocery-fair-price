# 11. 수집 워크플로 (KAMIS·축평원)

Status: claimed
Type: task (AFK)
Blocked by: 03, 08, 09

## Question

`.github/workflows/ingest-kamis.yml`, `ingest-ekape.yml`가 pipeline.md 5-1 시각에 07의 CLI를 부른다.

## 할 일

- [x] cron은 UTC: KAMIS 매일 06:30 KST(`30 21 * * *`), 축평원 06:40, KAMIS 주간 월 07:10(14일 다시 받기). 재등록 감시는 KAMIS 매일 실행에 함께
- [x] `concurrency: { group: ingest-<source>, cancel-in-progress: false }`, `timeout-minutes`, `workflow_dispatch`(날짜 입력)
- [x] `permissions`는 최소(`contents: read`). Secrets 네 개만 env로
- [x] 02 Answer의 워크플로 규칙 다섯 가지 적용 (Secret은 단계 `env:`로만, 인코딩 변형 `::add-mask::`, 덤프·`set -x`·디버그 로깅 금지, 오류 본문을 이슈에 붙이지 않음, DB 주소 비밀번호는 퍼센트 인코딩)
- [x] 의존성 설치는 `pnpm --filter @workspace/price-ingest...`만, 캐시
- [ ] `workflow_dispatch`로 운영에서 한 번씩 돌려 운영 DB·Storage에 들어간 것을 확인

## 완료 기준

- 정기 실행이 하루 이상 사람 손 없이 돌아 운영 `source_day`에 두 출처의 `ok`가 생겼다. 로그에 키·접속 주소가 없다.

## 진행 기록

- 2026-10-26: `.github/workflows/ingest-kamis.yml`(매일 `30 21 * * *`, 월 `10 22 * * 0`에 `--recheck-days 14`, 실행 종류 `recheck`), `ingest-ekape.yml`(`40 21 * * *`). CLI에 `--recheck-days N`(KAMIS만, 1~31). 재등록 감시는 이 티켓에 넣지 않고 09에 둔다.
- 운영 수동 실행 1차 (22:53 KST):
  - 축평원 성공: 21회, 5초, 관측 81·평년 81행.
  - **KAMIS는 "수집 시작" 뒤 아무 로그 없이 30분 timeout으로 취소** (실행 3). 업로드 전이라 원본도 없다. 로컬에서 같은 호출은 한 번에 60~230ms. 호출별 로그가 없어 원인을 모른다. 실행 3은 `running`으로 남아 손으로 `failed`·`cancelled`로 닫았다 (13이 이런 실행을 잡아야 한다).
- 대응 (원인과 관계없이):
  - 로그에 20회마다 진행, 5초 넘는 호출과 실패 호출의 대상·걸린 시간·HTTP 상태 (키·주소 없음).
  - 실행마다 호출 시간 한도 `CALL_TIME_LIMIT_MS`(KAMIS 20분, 축평원 8분, 참가격 45분). 넘기면 받은 데이터까지 올리고 `partial`(`time_limit`, 종료 코드 1)로 끝낸다. 전에는 취소되면 받은 것을 다 잃었다.
- 운영 수동 실행 2차 (23:25 KST, 로그 추가 뒤): KAMIS 140회 54초, 실패 0, 6,676행 적재. 느린 호출 로그 없음. **1차가 왜 멈췄는지는 재현되지 않았다.** 정기 실행 로그로 계속 본다.
- 품종 매핑(ingest-foundation/09)이 적재에서 바로 돈다: KAMIS 6,676행 중 6,583행 품종, 6,519행 기준 단위 가격. 축평원 81행 전부. 원천 키 KAMIS 177·축평원 27 `mapped`, KAMIS 5개 `pending`(코드표 실측 10-19 뒤 처음 온 키: 멜론 중품, 고등어 냉장 中, 오징어 냉동 中, 굴, 가리비). 카탈로그에 더할지는 운영자가 정한다.
- 남은 것: 정기 실행이 하루 이상 사람 손 없이 돈 것 확인 (10/27 06:30·06:40 KST).
