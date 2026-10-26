# 15. 사람 손 없이 일주일 돌았는지 확인하고 닫기

Status: open
Type: task (AFK)
Blocked by: 11, 12, 13, 14

## Question

목적지에 닿았는가? 운영에서 일주일 동안 세 출처가 정한 시각에 사람 손 없이 쌓였는지 기록으로 확인하고, 나눠 담았던 원래 티켓을 정리한다.

## 할 일

- [ ] 운영 `ingest_run`·`source_day`로 7일간 출처별 실행·상태 표 (빠진 실행, 늦은 실행, 메워진 날)
- [ ] Actions 로그 무작위 몇 개에서 키·접속 주소가 없는지
- [ ] [ingest-foundation/03](../../ingest-foundation/issues/03-ingest-package-and-actions.md)과 [search-first-view/04](../../search-first-view/issues/04-chamgagyeok-scheduled-fetch.md)에 결과를 적고, 이 지도 Out of scope로 미룬 것(재계산, 관측값 정리·재등록 복원, merge-product, 원본 삭제)을 03의 남은 일로 옮긴 뒤 상태를 고친다. `ingest-foundation/spec.md` 표도
- [ ] pipeline.md 5장에 실측과 다른 점이 있으면 고친다
- [ ] 지도의 "수집 시각 조정" 안개는 2주 뒤 일이므로 03의 남은 일로 넘긴다

## 완료 기준

- 일주일 표가 `## Answer`에 있고, 원래 티켓들이 이 지도의 결과를 가리킨다.
