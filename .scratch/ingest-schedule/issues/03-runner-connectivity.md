# 03. GitHub 러너에서 data.go.kr·Supabase 접속 실측

Status: resolved
Type: task (AFK)
Blocked by: 01, 02

## Question

GitHub 호스팅 러너(`ubuntu-latest`)에서 세 출처 API와 Supabase(Supavisor 5432, Storage)에 실제로 붙는가? martmemo-data는 러너 → data.go.kr 연결 시간 초과가 2주 연속 났다 (pipeline.md 5-3). 안 되면 ADR 0002의 배치 위치를 다시 정해야 하므로 수집 코드를 다 만들기 전에 확인한다.

## 할 일

- [x] `workflow_dispatch` 전용 임시 워크플로: 출처마다 가장 가벼운 호출 1회(계약 테스트의 probe 재사용), 응답 시간·HTTP 상태만 출력. DB는 `select current_user`, Storage는 `raw` 버킷 목록 1회
- [x] 며칠에 걸쳐 KST 06:30~07:10 근처에 3번 이상 돌려 본다 (같은 시간대가 수집 시각). 예약은 06:35·07:05였지만 GitHub가 늦게 돌려 실제로는 09:42~10:43 KST에 돌았다
- [x] 로그에 키·접속 주소가 없는지 직접 확인 (02)
- [x] 결과를 `## Answer`에 표로. 실패하면 지도의 "러너에서 data.go.kr이 안 되면" 안개를 티켓으로 꺼낸다
- [x] 임시 워크플로는 결과를 적은 뒤 지운다 (2026-10-29)

## 완료 기준

- 세 출처·DB·Storage 각각 성공/실패와 응답 시간이 기록돼 있다.

## 진행 기록

**1차 (2026-10-26 16:07 KST, 수동 실행)**. 임시 워크플로 `.github/workflows/probe-runner.yml`과 스크립트 `packages/price-ingest/scripts/probe-runner.ts`(`pnpm --filter @workspace/price-ingest probe:runner`, 로컬에서도 돈다). 정기 실행도 넣었다: 매일 KST 06:35·07:05 (cron `35 21 * * *`, `5 22 * * *`). 사흘(10/27~10/29) 돌린 뒤 결과를 모아 아래 `## Answer`에 적고 워크플로를 지운다. 스크립트는 남겨 둔다 (러너를 바꾸거나 접속이 의심될 때 다시 쓴다).

| 대상 | 로컬 (16:07) | 러너 ubuntu-latest (16:07, [run](https://github.com/Junyong34/grocery-fair-price/actions/runs/40283847336)) |
|---|---|---|
| KAMIS perDay/price | 성공 101ms | 성공 916ms |
| 축평원 consumerPriceDaily | 성공 90ms | 성공 953ms |
| 참가격 getProductPriceInfoSvc | 성공 874ms | 성공 1,069ms |
| Supabase DB (Supavisor 5432, `ingest_writer`) | 성공 304ms | 성공 803ms |
| Supabase Storage (목록) | 성공 788ms | 성공 417ms |

- 러너 로그 223줄을 로컬 `.env`의 비밀값 세 개와 그 인코딩 변형으로 대조했다: 남은 것 없음. 단계 `env:` 표시는 GitHub가 `***`로 가린다.
- 낮 시간 한 번이라 martmemo-data 사례(수집 시각대에 연결 시간 초과가 2주 연속)를 반박하지는 못한다. 정기 실행 결과를 보고 판단한다.

## Answer

**러너에서 세 출처·DB·Storage 모두 붙는다. 다만 가끔 러너 하나가 data.go.kr에 닿지 않는다.** 배치 위치(ADR 0002)는 바꾸지 않는다 (2026-10-29).

정기 probe 6번 (10-27~10-29, 하루 2번), 모두 성공:

| 대상 | 결과 | 걸린 시간 |
|---|---|---|
| KAMIS perDay/price | 6/6 성공 | 0.8~1.2초 |
| 축평원 consumerPriceDaily | 6/6 성공 | 0.9~1.2초 |
| 참가격 getProductPriceInfoSvc | 6/6 성공 | 0.6~1.2초 |
| Supabase DB (Supavisor 5432, `ingest_writer`) | 6/6 성공 | 0.8~1.1초 |
| Supabase Storage (목록) | 6/6 성공 | 0.7~0.9초 |

- 예약 시각(06:35·07:05 KST)보다 약 3시간 늦게 돌았다 (09:42~10:43 KST). 수집 워크플로도 똑같이 늦게 돈다 ([11](11-workflows-kamis-ekape.md)).
- 반례 하나: 10-28 정기 KAMIS 실행에서 러너 하나가 data.go.kr 호출 88번에 모두 응답을 받지 못했다. 같은 시각 다른 러너는 됐다. 대응은 [11](11-workflows-kamis-ekape.md)에 있다: 3번 이어서 닿지 않으면 바로 멈추고, KST 09:30에 다시 받는다.
- 정기 수집 사흘 중 이틀(10-27, 10-29)은 세 출처가 모두 사람 손 없이 성공했다.
- 임시 워크플로 `probe-runner.yml`은 지웠다. 스크립트 `probe:runner`는 남긴다 (러너를 바꾸거나 접속이 의심될 때 로컬·수동 워크플로로 다시 쓴다).
