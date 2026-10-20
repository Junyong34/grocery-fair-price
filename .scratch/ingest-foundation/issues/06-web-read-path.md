# 06. 웹앱이 Supabase를 읽는 방식

Status: resolved
Type: research
Blocked by: 02

## 목적

`apps/web`(Next.js 16, Cache Components)이 판정·집계를 어떻게 읽고 캐시할지 정한다. 화면 구현(로드맵 ④)의 전제다. 시작 전에 `apps/web/node_modules/next/dist/docs/`의 캐시 문서와 `apps/web/docs/nextjs-16-patterns.md`를 읽는다.

## 정할 것

- [x] 접속 방식: 서버 전용 Postgres 접속(읽기 전용 롤) vs supabase-js + anon 키 + RLS. 어느 쪽이든 서버 컴포넌트에서만 읽고 `server-only`로 막는다 → 서버 전용 (아래 Answer)
- [ ] 캐시: `cacheLife`·`cacheTag`로 판정 payload를 캐시하는 단위 (품종별 태그) → ④로 넘김 (Answer "아직 열림")
- [ ] 갱신 신호: 수집·재계산이 끝나면 Actions가 웹앱의 갱신 엔드포인트(비밀 토큰)를 불러 태그를 버리게 하는 경로 → ④로 넘김
- [x] Vercel 환경변수 목록 (01의 표에 추가) → `WEB_DATABASE_URL` 하나
- [ ] 수집이 멈췄을 때 화면이 받는 값 (`freshness`, `notices`) → ④로 넘김

## 완료 기준

- 정한 방식과 이유가 이 파일 `## Answer`에 있고, 01의 변수 표가 갱신돼 있다.

## Answer

2026-10-20 사용자 결정.

**접속: 서버 전용.** `apps/web`의 서버 컴포넌트가 전용 로그인 롤 `web_reader`로 Supavisor를 거쳐 Postgres에 직접 붙는다. 브라우저에는 Supabase 키가 없고, 표는 Data API로 노출하지 않는 스키마 `price`에 있다 (pipeline.md 3-0 "스키마와 노출", "역할").

- 이유: 판정 payload는 배치가 미리 만들어 두므로(pipeline.md 4-3) 브라우저가 DB를 부를 일이 없다. supabase-js + 공개 키 + RLS는 판정 하나를 읽는 데도 여러 표의 정책과 권한이 맞물려야 하고(예전 설계의 `judgment_current` 하위 질의), 틀리면 오류 없이 빈 결과만 나온다. 서버 전용이면 권한은 `web_reader`의 GRANT 하나로 정해지고, 키가 새어 나갈 곳도 없다.
- 권한: `web_reader`는 읽기 표의 `select`만 (목록은 pipeline.md 3-0). 롤에 `default_transaction_read_only = on`, `statement_timeout = '5s'`. 판정은 뷰 `price.current_judgment`(`security_invoker = true`)로 읽는다.
- 연결: Vercel 서버리스라 Supavisor **트랜잭션 모드(6543)**. 이름 있는 prepared statement를 끈다 (`postgres.js`면 `prepare: false`).
- 환경변수: `WEB_DATABASE_URL` 하나 (Vercel, 로컬 `.env`). `NEXT_PUBLIC_`을 붙이지 않는다. DB 모듈은 `import 'server-only'`로 클라이언트 번들에서 막는다. 01의 표를 고쳤다.
- 상품 화면의 점포별 가격도 같은 롤로 읽는다. 블록이 ③에서 정해지면 `observation`(참가격 행만, RLS `using (product_id is not null)`), `obs_place`, `store`에 `select`를 더한다. 익명용 공개 요약 표는 만들지 않는다.

**아직 열림 (④ 구현에서 정한다).** 위 접속 방식과 무관하게 남은 것들이다. 화면 코드는 ④에서만 쓰므로 그때 정한다 (로드맵 ④ "웹앱이 Supabase를 읽는 경로").
- [ ] 캐시: `cacheLife`·`cacheTag`로 판정 payload를 캐시하는 단위 (품종별 태그)
- [ ] 갱신 신호: 수집·재계산이 끝나면 Actions가 웹앱의 갱신 엔드포인트(비밀 토큰, 01에 변수 추가)를 불러 태그를 버리게 하는 경로
- [ ] 수집이 멈췄을 때 화면이 받는 값 (`freshness`, `notices`): payload에 미리 넣는 방향 (pipeline.md 4-1, 5-2)
