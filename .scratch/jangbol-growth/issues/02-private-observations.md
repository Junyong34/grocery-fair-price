# 운영 로그와 검색·분석 관측 공백 확보

Parent: ../map.md
Label: wayfinder:task
Type: task
Mode: HITL
Status: open
Assignee: —
Blocked by: —

## Question

결정을 막는 비공개 관측을 어떤 계정·화면에서 읽을 수 있는지 확인하고, 현재 상태의 증거를 확보한다.

운영자가 주 2시간 안에서 수행할 체크리스트:

- Vercel: 현재 배포 SHA·시각, OG 실패 요청의 함수 로그(개인정보·키 제거), 함수 실행 리전 확인.
- Supabase: 프로젝트 리전만 확인한다. DB 접속 문자열이나 비밀 키를 문서에 넣지 않는다.
- Search Console·네이버·Bing: 기존 등록/소유 확인/제출 상태와 최근 데이터 유무 확인. 이미 등록되었으면 신규 등록 작업으로 만들지 않는다.
- GA4: 속성과 운영 태그 유무, 기존 print_download·print_entry_click 관측 유무, DebugView 검증 여부 확인. 기존 절차는 apps/web/docs/analytics.md를 따른다.
- 연결 도구나 기존 계정으로 읽을 수 있는 내용은 에이전트가 먼저 확인한다. 계정 조작·신규 등록·환경 변수 변경은 별도 실행 인계다. 접근 권한이 없으면 필요한 화면·최소 관측값·담당을 남기고 증거 확보 전에는 resolved로 닫지 않는다.

완료 산출물: 관측값 또는 민감정보를 제거한 증거 링크, 확인 시각, 계정 담당, 남은 차단 조건. 이 작업은 등록·배포 자체를 납품하기 위한 티켓이 아니다.
