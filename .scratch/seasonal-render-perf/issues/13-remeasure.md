# 13. 재설계 뒤 운영 재측정

Status: ready-for-agent
Type: task (AFK)
Blocked by: 09, 10, 11, 12

## 목적

재설계(spec 6장)가 목표(6.5)에 닿았는지 운영에서 판정한다.

## 할 일

- [ ] `baseline.md`의 방법으로 운영 `https://jangbol.kr/seasonal`을 잰다(Lighthouse 12.6.1 모바일 3회, curl 3회, 응답 헤더)
- [ ] 같은 표에 기준선 · 04+08 뒤 · 재설계 뒤를 나란히 적고 판정을 쓴다
- [ ] 목표에 못 미친 지표가 있으면 원인과 다음 후보(05 SVGO, 06 immutable 캐시, client 링크 수 등)를 적는다

## 완료 기준

- `baseline.md`에 판정이 있고, 남은 일은 티켓으로 있다
