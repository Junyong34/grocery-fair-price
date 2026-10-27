# 04. P1 시세 메인 + 품종 행 + `/` 교체 + SEO

Status: ready-for-agent
Type: task (AFK)
Blocked by: 02, 03

## 할 일

- [ ] `routes.home`을 `/`로, `routes.price.*`(search, variety, basket) 추가
- [ ] 가격 영역 레이아웃(셸 + 가격 메뉴). 라우트 그룹으로 `/`, `/search`, `/prices/*`, `/basket`을 묶는다
- [ ] 공용 조각 `features/price/components/`: 품종 행(네 열 같은 폭: 품종 | 판정 칩 | 가격 두 줄 | 동작), 판정 칩("보통 +8%", 없으면 회색 "판정 전"), 가격 두 줄, 설명 한 줄
- [ ] P1: 큰 제목, 검색창 버튼(누르면 `/search`), 최근 본 품종 알약(기기 저장 `price:recent`), 자주 사는 품종(`featuredIds`), 설명 한 줄, 근거 한 줄
- [ ] `app/page.tsx` redirect를 P1로. `JsonLd website() · organization()`를 새 홈으로 옮기고 `homeSeo()`를 새 홈 문구로, 제철 메인은 별도 제목
- [ ] `shared/seo/pages.ts`: `/`를 `SEO_PAGES`로, `/prices/[variety]` · `/search` · `/basket` 자리는 각 티켓에서 등록. `proxy.ts` matcher 확인
- [ ] + 담기는 07에서 스토어를 잇는다 (이 티켓은 버튼 자리만)

## 완료 기준

- 375 · 1280에서 P1이 보이고 콘솔 오류 · 하이드레이션 경고 없음. 열 정렬 확인. 루트 검사 통과.
