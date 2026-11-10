# 문서 점검 보고서 (2026-11-10)

범위: `AGENTS.md`, `docs/`, `apps/web/docs/`, `apps/web/DESIGN.md`, `.scratch/*/`, `grocery-price/` 문서.
방법: 문서 안의 백틱 경로를 저장소 파일 목록(`git ls-files` + 추적 안 된 파일)과 대조했고, 라우트(`apps/web/app/**/page.tsx`)·feature 폴더·패키지 모듈을 `project-structure.md`와 맞춰 봤다. 티켓 상태는 `Status:` 줄, 남은 체크칸, 관련 커밋으로 판단했다.

제안 열의 뜻: **고침**(이번에 고쳤다), **고침 제안**(사실 확인이 더 필요해 고치지 않았다), **추가**, **삭제**, **보관**(지우지 않고 끝난 기록으로 옮긴다). 삭제·보관은 아직 아무것도 하지 않았다.

## 1. 이번에 바로 고친 것

| 문서 | 문제 | 제안 | 근거 |
|---|---|---|---|
| `AGENTS.md` (overlay 항목) | 하단 시트 예시 `features/seasonal/this-month/settings-panel.tsx`가 없다 | 고침: `features/seasonal/my-table/category-filter.tsx`로 | 2a 설정 시트는 shell-unify/03에서 `/settings`로 대체(`.scratch/shell-unify/spec.md` 106행). `category-filter.tsx`가 `BottomSheet`를 쓴다 |
| `AGENTS.md` (라우트 항목) | `(price)` 그룹을 `/`, `/search`, `/prices/[variety]`, `/basket`만으로 적음 | 고침: `/products/*`, `/baby-food/*`, `/settings/*`, `/privacy` 추가 | `apps/web/app/(price)/` 아래 페이지 목록 |
| `AGENTS.md` (`@sheet`) | `@sheet/(.)downloads/[edition]` 가로채기를 빠뜨림 | 고침 | `apps/web/app/seasonal/@sheet/(.)downloads/[edition]/page.tsx` |
| `AGENTS.md` (레이어 표) | feature 목록에 `sashimi`, `downloads`, `baby-food`, `settings`, `legal`, 개발 전용 `print`·`admin-*`가 없다. `packages/seasonal`에 `print/`, `geometry/`, 이유식 데이터가 없다 | 고침 | `apps/web/features/*`, `packages/seasonal/src/*` |
| `docs/project-structure.md` 머리말 | "2026-10-30 기준", `apps/web`을 "나중에 가격 비교"로 설명 | 고침: 2026-11-10, "시세 · 판정, 제철달력, 이유식" | 가격 화면은 10-27부터 `/` |
| `docs/project-structure.md` 4.2 라우트 | `/baby-food/pairings/[ingredient]`, `/baby-food/fruits`, `/baby-food/fruits/[stage]`, `/admin/baby-food/fruits-print`·`fruits-pdf`, `/admin/catalog/categories`·`varieties`가 없다 | 고침(행 추가) | 라우트 파일, `shared/routes.ts`의 `babyFood`·`admin` |
| `docs/project-structure.md` 라우팅 장치 | `(price)/layout.tsx`가 덮는 화면을 4개로만 적음 | 고침 | 위와 같음 |
| `docs/project-structure.md` 4.3 | `seasonal-shell`이 `this-month/settings-panel`을 import한다고 적음 | 고침: `search/`와 `shared/shell/settings-link` | `features/seasonal/components/seasonal-shell.tsx` 1~5행 |
| `docs/project-structure.md` 4.3 | "PDF를 둘 곳을 정하기 전까지는 에디션을 공개하지 않는다" | 고침: R2 + 서명 링크(ADR 0003) | ADR 0003, `app/seasonal/downloads/[edition]/[paper]/route.ts` |
| `docs/project-structure.md` | `features/baby-food/` 절이 없다 | 추가(4.3-2) | `apps/web/features/baby-food/**` |
| `docs/project-structure.md` 4.4 shared | `device/`, `use-device.ts`, `not-found-view`, `status-view`, `settings/`, `fonts/`, `shell/site-footer`, `shell/public-path`가 없다 | 추가 | `apps/web/shared/**`, 커밋 `e8f70a5`(푸터) |
| `docs/project-structure.md` 5장 상태 | `seasonal:a3-requests`, `price:install-prompt` 저장소가 없다. `price:recent`가 상품도 담는다 | 추가·고침 | `a3-request-store.ts`, `install-prompt.tsx`, `recent-store.ts` 7행 |
| `docs/project-structure.md` 6장 seasonal | 모듈 15개(`infant-*`, `print/spec-codec` 등)가 없다. 테스트 "23개 파일" | 추가, 34개로 고침 | `find packages/seasonal/src` |
| `docs/project-structure.md` 6-1장 price | `verdict-copy.ts`(`explainVerdict`), `axis.ts`가 없다 | 추가 | 커밋 `d24edcd` |
| `docs/project-structure.md` 8-2장 끝 | "수집 CLI와 워크플로는 ingest-foundation/03에서 더한다" (이미 운영 중) | 고침 | `.github/workflows/ingest-*.yml`, ingest-schedule/15 |
| `docs/project-structure.md` 11장 | catalog-evolution을 "구현 전 확인 단계, 기존 명세를 대체하지 않는다"고 적음 | 고침: catalog-scale이 정본, evolution은 대체됨 | `.scratch/catalog-evolution/spec.md` 맨 위 2026-11-09 메모, ADR 0005 |
| `docs/project-structure.md` 12장 | 수산 자료를 "화면 주소·세부 기능 미정"으로 적음 | 고침: `/seasonal/sashimi/[month]` | `.scratch/sashimi/` 01~06 resolved |
| `apps/web/docs/seafood-content/README.md` | "화면의 주소 … 미정" | 고침: 머리에 2026-11-10 메모 | 위와 같음 |
| `grocery-price/docs/00-overview/roadmap.md` ① 산출물 | "KAMIS 5년 이력 백필" | 고침: 3년(10-27 결정) | `judgment.md` 28행, `ingest-foundation/04` 제목 |
| `.scratch/ingest-foundation/spec.md` 티켓 표 | 04를 "5년 백필"로 적음 | 고침 | `issues/04-kamis-backfill.md` 제목 "3년" |

## 2. 고치지 않고 제안만 하는 문서 문제

| 문서 | 문제 | 제안 | 근거 |
|---|---|---|---|
| `grocery-price/README.md` 현재 단계 | "남은 것은 … 운영 배포", ①에 "축평원 백필(11-09 무렵)". 운영(jangbol.kr)은 이미 돌고 있고 축평원 백필은 3묶음 `failed`로 남았다. 화면 목록에 `/products`가 없다 | 고침 제안. "운영 배포"가 색인 켜기(`SITE_INDEXABLE`)·sitemap 제출을 뜻하는지 확인 후 문구를 바꾼다 | `.scratch/seasonal-static/spec.md` 1장(운영 측정), `ingest-foundation/04` 11-09 상태 |
| `grocery-price/docs/00-overview/roadmap.md` | 단계 머리의 상태 날짜가 10-30. 이후 catalog-scale(09·10 상품 화면) 진행이 ④에 반영 안 됨 | 고침 제안(README와 함께) | 커밋 `0f66507`, `bffe084` |
| `grocery-price/README.md`, `public-data-survey.md`, `pipeline.md`, `kamis.md` | "평년은 KAMIS 5년 이력으로 계산" 문장이 여러 곳 남았다. 실측 기록(5년 호출 수 등)은 사실이라 그대로 둬도 되지만, 계획 문장은 3년 계절비율과 어긋난다 | 고침 제안: 계획 문장만 3년으로, 실측 표는 유지 | `judgment.md` 1장 |
| `docs/agents/issue-tracker.md`, `triage-labels.md` | 티켓에 규칙 밖 상태가 쓰인다: `done (날짜)`(baby-food-ingredient-pages, catalog-scale 05·08·09·10), `in-progress`(catalog-scale 06·07), `open`(ingest-schedule 08·09, jangbol-growth). 규칙은 5개 역할 + wayfinder용 `claimed`·`resolved`뿐 | 고침 제안: `done` → `resolved`, `in-progress` → `claimed`, wayfinder 티켓의 `open`은 규칙에 명시하거나 `ready-for-agent`로 | 1장의 `Status:` 전수 목록(아래 3장) |
| `docs/agents/issue-tracker.md`, `domain.md` | `/wayfinder`, `/grill-with-docs`, `/improve-codebase-architecture` 스킬을 언급하지만 지금 설치된 스킬 목록에 없다(가까운 것: `domain-modeling`, `codebase-design`, `grilling`) | 고침 제안: 스킬 이름을 지금 것으로 | 세션의 스킬 목록 |
| `.scratch/*/spec.md` 상태 줄 | 다 끝난 스펙의 `Status:`가 그대로다: baby-food-fruits(`ready-for-agent`, 티켓 6개 모두 resolved), baby-food-ingredient-pages(`ready-for-agent`, 04만 남음), infant-food-pairing(`needs-triage`, 이미 구현), catalog-scale(`needs-triage`, 진행 중) | 고침 제안: 스펙 상태 줄을 실제에 맞추거나 스펙에서 상태 줄을 빼고 티켓만 원본으로 | 3장 |
| `apps/web/DESIGN.md` | 앞 330행과 뒤 530행 이후는 Oura 사이트 분석(영문, 마케팅 페이지·반지 사진·다크 모드 대응 표현, `scripts/derive-examples-block.mjs` 같은 없는 생성 스크립트)이고, 352~530행만 장볼날 규칙이다. AGENTS.md가 "Light mode only"라고 하는데 분석 부분은 dark 표면을 설명한다 | 고침 제안: 장볼날 규칙(352~530행)만 `DESIGN.md`에 두고 Oura 분석은 `apps/web/docs/reference/oura-analysis.md`로 보관. 7/10: 읽는 사람이 어느 쪽이 규칙인지 헷갈리는 비용이 실제로 있다 | `DESIGN.md` 제목 목록, `git log -- apps/web/DESIGN.md` |
| `docs/food-pairing-image-analysis.md` | 이유식 궁합 이미지 판독 원자료. 없는 첨부 경로(`.codex-attachments/…jpg`)를 가리키고, 데이터는 이미 `packages/seasonal/src/data/infant-pairings.ts`로 옮겨졌다 | 보관: `.scratch/infant-food-pairing/`로 옮김 | 커밋 `b5caf6d` |
| `docs/project-structure.md` 1장 표 | 시세 서비스 "운영 배포가 남음" (README와 같은 문제) | README와 함께 고침 제안 | 위 README 행 |
| `apps/web/docs/nextjs-16-patterns.md` | `cacheTag`/`revalidateTag` "가격 화면의 배치 후 갱신 신호는 아직 열려 있다 (`.scratch/price-db-read`)" — price-db-read 티켓은 모두 resolved라 열린 항목이 어디 있는지 찾을 수 없다 | 고침 제안: 열린 일로 남길 거면 티켓을 하나 만들고, 아니면 문장을 지운다 | `.scratch/price-db-read/issues/*` 모두 resolved |

## 3. `.scratch` 계획·이슈 문서 분류

분류 기준: **완료** = 모든 티켓이 resolved/wontfix이거나 남은 것이 사람 단계뿐. **진행 중** = 에이전트가 할 일이 남음. **폐기 가능** = 다른 계획으로 대체됐거나 더 할 이유가 없음.

| 문서 | 분류 | 남은 것 | 제안 | 근거 |
|---|---|---|---|---|
| `.scratch/seasonal-mvp/` | 완료(1건 남음) | 12 태블릿 폭·모션 점검 `ready-for-agent` | 보관. 12는 새 작은 티켓으로 옮기거나 `wontfix` 판단 | 01~11·13 resolved. 단, AGENTS.md가 앱 스펙으로 이 폴더를 가리키므로 보관 시 경로를 함께 고쳐야 한다 |
| `.scratch/price-screens/` | 완료 | 없음 | 보관(단 AGENTS.md가 "Price screens spec"으로 가리킴: 보관 시 경로 고침) | 01~07 resolved |
| `.scratch/price-db-read/` | 완료 | 없음 | 보관(AGENTS.md가 가리킴) | 01~04 resolved |
| `.scratch/p4-canonical-model/` | 완료 | 없음 | 보관 | 01~03 resolved |
| `.scratch/shell-unify/` | 완료 | 없음 | 보관(`project-structure.md`가 셸 규칙으로 가리킴) | 01~07 resolved |
| `.scratch/calendar-print/` | 완료 | 스펙의 "남은 일 2~4" | 보관 | 01~16 resolved |
| `.scratch/sashimi/` | 완료(사람 1건) | 07 다금바리 별칭 `ready-for-human`(prototypes 필요) | 보관 후보, 07만 남김 | 01~06 resolved |
| `.scratch/seo/` | 완료(1건 남음) | 08 품종 본문 보강 `needs-triage` | 보관 후보. 08은 장기 과제로 남김 | 01~07 resolved |
| `.scratch/calendar-download/` | 완료(사람 단계) | 08 GA 등록·10 처리방침 게시 `ready-for-human`(코드는 10-30 완료), 09 PDF 크기 `needs-triage` | 08·10을 사람이 마치면 보관 | 01~07 resolved |
| `.scratch/baby-food-fruits/` | 완료 | 없음(스펙 상태 줄만 낡음) | 보관 | 01~06 resolved, 커밋 `95dca59`·`c965cf0`·`e28ecea` |
| `.scratch/seasonal-static/` | 완료 | 없음 | 보관 | 커밋 `66784fe`(정적화 구현) |
| `.scratch/food-months/` | 완료 | 없음 | 보관 | `proposal.md` "반영함(2026-10-23)", 커밋 `c7ed614`·`ae261e8`. `renamed-foods.ts`가 이 문서를 인용 |
| `.scratch/bundle-audit/` | 완료 | 없음 | 보관 | 커밋 `71df009`이 보고서 결과를 반영. `project-structure.md`(vercel.json 설명)가 인용 |
| `.scratch/ingest-schedule/` | 진행 중(거의 끝) | 08 빈 날 메우기, 09 재등록 감시 `open` | 유지. 08·09가 끝나면 보관 | 01~07·10~15 resolved, 15 결산 |
| `.scratch/ingest-foundation/` | 진행 중 | 01 사람 체크칸 3개(비밀번호 보관, Vercel 변수, 메일함). 03 남은 일 ①~⑥. 04 축평원 2023-01 3묶음 실패. 05 장애 상황 테스트 | 유지. 01은 운영이 돌고 있으니 남은 칸만 확인해 닫기 제안. 03은 남은 일을 ingest-schedule 08·09·새 티켓으로 나누고 닫기 제안 | 03 머리의 11-09 메모, 04 11-09 메모 |
| `.scratch/catalog-scale/` | 진행 중 | 02 Pro 전환(미룸), 03·04 `claimed`(11-10 KAMIS 실행 결과 보고 닫기), 06·07 `in-progress`, 11~13 `needs-triage` | 유지. 03·04는 오늘 실행 결과를 확인해 닫을 수 있다 | 03·04 "남은 것" 문단 |
| `.scratch/baby-food-ingredient-pages/` | 진행 중(사람 1건) | 04 재료 본문 `ready-for-human` | 유지 | 01~03 done(11-09) |
| `.scratch/jangbol-growth/` | 진행 중(정체) | 02~11 모두 `open`, 11-04 이후 커밋 없음 | 재점검 필요. 결정 지도라 아직 유효할 수 있지만, 그 사이 끝난 항목(OG, 다운로드 화면, soft 404 등)이 있는지 다시 맞춰야 한다. 이번에 확인하지 않음 | `git log -- .scratch/jangbol-growth` |
| `.scratch/catalog-evolution/` | 폐기 가능(대체됨) | 없음 | 보관. 삭제는 안 됨: catalog-scale 11·12·09가 `plans/01`·`04`·`06`을 근거로 링크한다 | `spec.md` 맨 위 "catalog-scale로 대체", catalog-scale/11 본문 |
| `.scratch/infant-food-pairing/` | 폐기 가능(대체됨, 1건 확인 필요) | 01 일러스트 `needs-info` | 스펙은 보관. 01은 그 뒤 일러스트 커밋(`4f538a0`, `6d2e05c`)으로 얼마나 해소됐는지 확인 후 닫거나 baby-food-fruits/05처럼 정리 | 화면 구현됨, 데이터는 `infant-pairings.ts` |
| `.scratch/search-first-view/` | 폐기 가능(대부분 이관) | 05 판매처 매핑 남은 체크칸 2개(정부 화면 재대조), 07 도매 후보를 roadmap E3에 적기 | 보관. 05의 남은 확인은 작아서 닫거나 새 티켓, 07은 roadmap E3에 한 줄 쓰고 닫기 | 04 → ingest-schedule/12, 06 wontfix(price-screens로 대체), `store_seller` 마이그레이션 `20261029000100` |
| `.scratch/p2-data-source-spec/` | 폐기 가능(일부 확인 필요) | 03 축평원 갱신 시각 1건, 06 제조사 코드 결정, 07 라이선스·출처 표기, 08·09 맥락 데이터, 11 P2 마무리 | 보관. 11(P2 마무리)은 로드맵이 4단계로 바뀌어 의미가 없다 → `wontfix`. 07은 `/settings/sources` 화면과 `public-data-survey.md` 19행(공공누리 1유형)이 있어 대부분 된 듯하니 확인 후 닫기. 03은 남은 1건을 `wontfix`로 | `features/settings/sources-view.tsx`, `roadmap.md` 머리 |
| `.scratch/p3-variety-catalog/` | 진행 중(결정 1건) | 02 시세 없는 품종 대응 `ready-for-human`(grilling) | 유지. roadmap ②가 이 결정을 남은 일로 가리킨다 | roadmap ② 머리 |
| `.scratch/product-detail-ui/` (추적 안 됨) | 폐기 가능 | 문서 없이 전후 스크린샷 10장 | 삭제 후보(다른 세션의 검증 증거일 수 있어 확인 필요) | `git status` `??` |
| `.scratch/search-ui/` (추적 안 됨) | 폐기 가능 | 문서 없이 전후 스크린샷 13장 | 삭제 후보(위와 같음) | `git status` `??` |

## 4. 삭제·보관 후보 요약 (확인받은 뒤 진행)

**처리 (2026-11-10, 사용자 결정): 폴더는 옮기지 않고 스펙 맨 위에 "완료(날짜)" 또는 "종료(날짜)" 한 줄을 달았다.** 링크가 그대로라 다른 문서는 고치지 않았다. 스펙에 `Status:` 줄이 있던 곳(calendar-print, calendar-download, baby-food-fruits, catalog-evolution, infant-food-pairing)은 `Status: resolved`로 바꿨다. 날짜는 그 폴더 티켓의 마지막 커밋 날짜다. food-months는 이미 "반영함" 줄이 있어 그대로 두었다. 아래 삭제 후보와 `docs/food-pairing-image-analysis.md` 이동은 하지 않았다.

- **보관**: seasonal-mvp, price-screens, price-db-read, p4-canonical-model, shell-unify, calendar-print, baby-food-fruits, seasonal-static, food-months, bundle-audit, catalog-evolution, infant-food-pairing(01 확인 뒤), search-first-view, p2-data-source-spec, `docs/food-pairing-image-analysis.md`
- **조건부 보관**: sashimi(07), seo(08), calendar-download(08·10 사람 단계)
- **삭제**: `.scratch/product-detail-ui/`, `.scratch/search-ui/` (추적 안 된 스크린샷)
- **티켓 닫기 제안**: p2-data-source-spec/11 → wontfix, ingest-foundation/03 → 남은 일을 나눈 뒤 resolved, catalog-scale/03·04 → 11-10 실행 확인 뒤 resolved

## 5. 확인하지 못한 것

- `jangbol-growth` 티켓 10개의 내용이 지금 코드와 맞는지는 보지 않았다.
- `grocery-price/docs/30-data/pipeline.md`(895행), `sources/*.md`, `apps/web/docs/rendering-flow/`는 경로 대조만 했고 본문 사실은 검증하지 않았다. 경로 대조에서는 문제가 없었다(나온 것은 티켓 번호 약칭과 빌드 출력 파일뿐).
- `apps/web/docs/analytics.md`, `seo.md`, `brand-assets.md`는 경로 대조만 했다. `seo.md`의 `app/robots.txt/route.ts`는 "바꿔야 한다"는 미래 작업이라 오류가 아니다.
