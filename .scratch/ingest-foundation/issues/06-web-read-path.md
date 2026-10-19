# 06. 웹앱이 Supabase를 읽는 방식

Status: ready-for-agent
Type: research
Blocked by: 02

## 목적

`apps/web`(Next.js 16, Cache Components)이 판정·집계를 어떻게 읽고 캐시할지 정한다. 화면 구현(로드맵 ④)의 전제다. 시작 전에 `apps/web/node_modules/next/dist/docs/`의 캐시 문서와 `apps/web/docs/nextjs-16-patterns.md`를 읽는다.

## 정할 것

- [ ] 접속 방식: 서버 전용 Postgres 접속(읽기 전용 롤 + `DATABASE_URL`) vs supabase-js + anon 키 + RLS. 어느 쪽이든 서버 컴포넌트에서만 읽고 `server-only`로 막는다
- [ ] 캐시: `cacheLife`·`cacheTag`로 판정 payload를 캐시하는 단위 (품종별 태그)
- [ ] 갱신 신호: 수집·재계산이 끝나면 Actions가 웹앱의 갱신 엔드포인트(비밀 토큰)를 불러 태그를 버리게 하는 경로
- [ ] Vercel 환경변수 목록 (01의 표에 추가)
- [ ] 수집이 멈췄을 때 화면이 받는 값 (`freshness`, `notices`)

## 완료 기준

- 정한 방식과 이유가 이 파일 `## Answer`에 있고, 01의 변수 표가 갱신돼 있다.
