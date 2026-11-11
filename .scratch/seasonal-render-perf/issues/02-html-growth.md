# 02. HTML이 2.35MB로 커진 원인

Status: ready-for-agent
Type: task (AFK)
Blocked by: 없음

## 목적

2a HTML이 2026-11-05(1.58MB)에서 11-11(2.35MB)로 6일 만에 약 50% 늘었다. 원인을 모르면 다른 개선 효과가 다시 묻힌다(spec Q9).

## 할 일

- [ ] `66784fe`(11-05)와 `HEAD`를 각각 빌드하고 `next start`로 `/seasonal/at/2026-11`의 HTML, RSC payload(`RSC: 1` 헤더), `<img>` 수를 비교한다
- [ ] `git log --oneline 66784fe..HEAD -- packages/seasonal/src/data apps/web/features/seasonal`로 후보 커밋을 좁힌다(식재료 달력, 제철 회 추가 등). 필요하면 bisect
- [ ] RSC payload에서 큰 부분을 찾는다: client component에 넘기는 props(품종 객체 전체를 넘기는지), 같은 데이터의 중복
- [ ] 결과를 `baseline.md`의 "HTML 증가 원인" 절에 쓴다. 고칠 것이 작으면(예: client에 넘기는 품종 필드 줄이기) 이 티켓에서 고치고, 크면 새 티켓으로 남긴다

## 완료 기준

- 늘어난 크기를 원인별로 설명한 표가 있다(커밋 또는 데이터 → 바이트)
- 고쳤다면 `pnpm typecheck`, `pnpm lint`, `pnpm test` 통과, 2a를 375 · 1280에서 확인했고 콘솔 오류 · 하이드레이션 경고가 없다
