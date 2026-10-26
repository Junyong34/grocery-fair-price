# 03. GitHub 러너에서 data.go.kr·Supabase 접속 실측

Status: open
Type: task (AFK)
Blocked by: 01, 02

## Question

GitHub 호스팅 러너(`ubuntu-latest`)에서 세 출처 API와 Supabase(Supavisor 5432, Storage)에 실제로 붙는가? martmemo-data는 러너 → data.go.kr 연결 시간 초과가 2주 연속 났다 (pipeline.md 5-3). 안 되면 ADR 0002의 배치 위치를 다시 정해야 하므로 수집 코드를 다 만들기 전에 확인한다.

## 할 일

- [ ] `workflow_dispatch` 전용 임시 워크플로: 출처마다 가장 가벼운 호출 1회(계약 테스트의 probe 재사용), 응답 시간·HTTP 상태만 출력. DB는 `select current_user`, Storage는 `raw` 버킷 목록 1회
- [ ] 며칠에 걸쳐 KST 06:30~07:10 근처에 3번 이상 돌려 본다 (같은 시간대가 수집 시각)
- [ ] 로그에 키·접속 주소가 없는지 직접 확인 (02)
- [ ] 결과를 `## Answer`에 표로. 실패하면 지도의 "러너에서 data.go.kr이 안 되면" 안개를 티켓으로 꺼낸다
- [ ] 임시 워크플로는 결과를 적은 뒤 지운다

## 완료 기준

- 세 출처·DB·Storage 각각 성공/실패와 응답 시간이 기록돼 있다.
