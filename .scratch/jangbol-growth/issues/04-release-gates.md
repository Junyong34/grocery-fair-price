# 공유·다운로드·색인 장애의 출시 차단 기준

Parent: ../map.md
Label: wayfinder:grilling
Type: grilling
Mode: HITL
Status: open
Assignee: —
Blocked by: 01, 02

## Question

원안의 즉시 조치 중 실제 출시 차단 항목은 무엇이며 어떤 증거로 통과시키는가?

- OG는 기본 URL의 HTTP 200뿐 아니라 실제 메타 태그가 가리키는 URL의 이미지 MIME·디코딩·대표 쿼리·카카오 표시까지 어느 범위를 검증할지 정한다. Vercel 로그 없이 원인을 단정하지 않는다.
- c6bf089는 현재 로컬 HEAD에서 확인되지만 원격/배포 반영은 별도 확인한다. 다운로드 제목 중복, 검색어, PDF CTA의 기존 구현과 남은 변경을 분리한다.
- 2027년판은 단순 연도 변경으로 보지 않는다. 에디션 사양·공휴일/날짜·생성 PDF 육안 검수·게시 상태·파일 접근의 통과 조건과 담당을 정한다. 발행 절차는 기존 calendar-download 명세를 따른다.
- 없는 가격 slug의 hard 404가 필요한 범위와 Next Cache Components/스트리밍 제약을 확인한다. apps/web/docs/seo.md에는 제철 경로에서 Suspense 밖 검증도 200이 된 반례가 있다. 이동만으로 해결된다고 확정하지 않는다.
- 검색엔진 등록·소유 확인·sitemap 제출은 각각 완료 증거를 정하고, 등록과 실제 색인은 구분한다.

완료 산출물: 우선 복구/기존 구현 확인/추가 설계 필요 목록, 재현·회귀 검증 계약, 롤백/재확인 조건. 구현은 별도 인계한다.

## 선행 티켓

- [공개 운영 상태와 기존 주장의 기준선 확인](01-public-baseline.md)
- [운영 로그와 검색·분석 관측 공백 확보](02-private-observations.md)
