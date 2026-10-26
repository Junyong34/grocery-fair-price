# 10. KAMIS 일별 시세 재계산과 90일 보존 정리

Status: ready-for-agent
Type: task
Blocked by: 09, ingest-schedule/11

## 목적

KAMIS 관측값은 최근 90일만 남기고, 그보다 오래된 날은 일별 시세(`daily_quote`)로만 남긴다 (pipeline 3-9 보관 1, 6-1). 지우기 전에 그날의 `daily_quote`가 있어야 한다. 운영 DB에는 아직 KAMIS 관측값이 없어 `ingest-schedule/11`(KAMIS·축평원 정기 수집)이 먼저다.

## 할 일

- [ ] 적재 뒤 그날의 `daily_quote`를 다시 계산하는 단계 (`recompute`의 첫 조각, 3-4). 대표값 계산식은 로드맵 ②가 정하므로 지금은 `calc_version`을 붙인 중앙값
- [ ] 보존 정리: `daily_quote`가 있는 날 중 90일보다 오래된 KAMIS 관측값을 묶음 `delete`. 원본(Storage)은 지우지 않는다
- [ ] 보존 기간 밖 재등록: KAMIS가 90일 밖 날의 값을 다시 올리면 원본에서 그날을 다시 계산한다 (pipeline 3-3, `ingest-schedule/09`와 함께 본다)
- [ ] 실측: 정리 뒤 DB 크기
