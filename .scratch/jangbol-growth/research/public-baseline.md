# 공개 운영 응답 기준선

조사: public_baseline, 2026-11-04 15:12~15:16 서울. 공개 GET 소수 표본만 관측했으며 제품·환경변수·운영 설정을 수정하지 않았다. 조사 질문은 [공개 운영 상태와 기존 주장의 기준선 확인](../issues/01-public-baseline.md), 원안은 [입력 대응표](../input.md)다.

## 판단에 사용할 결론

- OG 실패는 표본에서 재현된다. 기본 주소와 실제 제철 가지 상세의 og:image 주소 모두 500, 본문 0바이트였다. 메타 태그에 URL이 있는 사실과 이미지 전달 성공은 다르다. 전 페이지·카카오 캐시·실패 원인은 미확인이다.
- sitemap은 페이지 URL 408개(가격 127, 제철 품종 240)다. 이미지 loc 243개는 페이지 수에서 제외했다. 검색엔진 실제 색인 수가 408개라는 뜻은 아니다.
- 없는 가격 slug는 HTTP 200과 noindex, Next 404 오류 표식을 함께 반환했다. 정상적인 404 상태가 필요하다는 원안의 관측 근거는 있으나, 수정 위치가 Suspense 밖이어야 한다는 해결책은 이번 조사로 입증하지 않는다.
- 다운로드 목록은 2026년 월간·연간 2종이며 상세에 실제 PDF 경로 링크가 있다. 파일 다운로드 성공이나 인쇄 품질은 검사하지 않았다. 제목의 달력 반복을 확인했다. 로컬 SEO 변경과 배포 응답이 다르지만 정확한 배포 SHA·push 상태는 확인하지 않았다.
- 가지 제철 상세의 품종별 가격 링크는 없다. 하지만 공통 셸의 시세(`/`)·제철달력(`/seasonal`) 링크는 양쪽 영역에 존재한다. 따라서 “두 영역 사이 링크 0”은 모든 링크가 아니라 품종별 문맥 링크로 범위를 좁혀야 한다. 119개 고아 페이지·43~48개 대응은 전수 확인하지 않았다.
- 11월 제철 회 본문은 자바리·붉바리 2종이다. 방어·광어가 목록에 없다는 표본 관측은 재현되나 그 둘을 넣어야 하는 식품 근거는 별도 조사다.

## 방법과 관측 한계

먼저 wigolo cache(`*jangbol.kr*`)를 확인했으며 결과가 없었다. wigolo fetch는 `force_refresh:true`, `render_js:never`, `include_full_markdown:true`로 robots·sitemap·다운로드 목록/월간 상세·가지 가격/제철 상세·없는 가격 slug·11월 회 8개 URL을 읽었다. fetch_method=http, http_status=200을 반환했지만 response_time_ms는 도구 처리시간이며 TTFB로 쓰지 않았다. sitemap 추출은 길이 제한으로 잘렸고, HTML 링크 추출 목록이 본문 링크를 일부 누락하는 현상도 있어 총수·링크 부재 판단에는 원문을 사용했다.

이후 원문 헤더/본문·상태·전송시간이 필요한 항목만 curl GET으로 보강했다. 인증/쿠키/사용자 지정 헤더 없이 TLS 기본 검증, 최대 25초, 병렬 최대3, 리다이렉트 미추적, `-D headers -o body -w '%{json}'`. 최초 sandbox 실행은 DNS 해석이 막혀 서버에 도달하지 못했다. 승인된 네트워크 재시도에서 10개 고유 URL와 가격 1회 반복의 실제 응답을 얻었다. sitemap 파서의 로컬 Python expat 로딩 실패로 후반 5개 요청은 재시도했고, 원문 URL 요소를 정규식으로 세었다. 이 로컬 오류는 서비스 장애가 아니다.

다음 표는 curl의 최종 성공 관측이다. 시각은 응답 수신 완료 시각(서울), 모든 표본의 Location 헤더/redirect_url은 없었다. HTML은 원문과 메타·본문을 확인했으나 브라우저 시각 렌더·콘솔·hydration·모바일 조작은 검사하지 않았다. 이미지 URL 문자열과 실제 SVG/썸네일 파일 전달도 구분하며, 이번에 실제 요청한 이미지는 OG 2개뿐이다.

| URL (https://jangbol.kr 기준) | 서울 시각 | 상태 / Content-Type | 본문 확인 |
| --- | --- | --- | --- |
| [/robots.txt](https://jangbol.kr/robots.txt) | 15:15:35 | 200 / text/plain; charset=utf-8 | `User-Agent: *`, `Allow: /`, sitemap 주소 |
| [/sitemap.xml](https://jangbol.kr/sitemap.xml) | 15:15:35 | 200 / application/xml | 51,013바이트 XML, `<url>` 408, 가격127·제철품종240·image:loc243 |
| [/api/og](https://jangbol.kr/api/og) | 15:15:36 | 500 / Content-Type 없음 | 0바이트, 이미지 확인 불가 |
| [가지 제철 상세 실제 OG 쿼리](https://jangbol.kr/api/og?title=%EA%B0%80%EC%A7%80&subtitle=%EC%A0%9C%EC%B2%A0+6%7E10%EC%9B%94&badge=%EC%A0%9C%EC%B2%A0+%EC%8B%9D%EC%9E%AC%EB%A3%8C) | 15:15:36 | 500 / Content-Type 없음 | 0바이트, 이미지 확인 불가 |
| [/seasonal/downloads](https://jangbol.kr/seasonal/downloads) | 15:15:35 | 200 / text/html; charset=utf-8 | 월간·연간 각각 1개, 상세 링크 |
| [/seasonal/downloads/monthly-1](https://jangbol.kr/seasonal/downloads/monthly-1) | 15:16:09 | 200 / text/html; charset=utf-8 | A4 세로13쪽8.5MB 표시, `/seasonal/downloads/monthly-1/a4` 링크 |
| [/prices/eggplant](https://jangbol.kr/prices/eggplant) | 15:16:10 | 200 / text/html; charset=utf-8 | 11/3 조사49곳, 가지1개827원·평소가 없음 표시 |
| [/prices/definitely-not-a-variety](https://jangbol.kr/prices/definitely-not-a-variety) | 15:16:09 | 200 / text/html; charset=utf-8 | noindex, `NEXT_HTTP_ERROR_FALLBACK;404`, canonical 없음 |
| [/seasonal/foods/eggplant](https://jangbol.kr/seasonal/foods/eggplant) | 15:16:09 | 200 / text/html; charset=utf-8 | 제철6~10월, “가격 보기 · 준비 중”, `/prices/eggplant` a[href] 없음 |
| [/seasonal/sashimi/11](https://jangbol.kr/seasonal/sashimi/11) | 15:16:09 | 200 / text/html; charset=utf-8 | 자바리·붉바리 품종 상세 링크 |

robots 허용은 공개 크롤링 차단이 없다는 뜻이다. 정상 HTML 표본 5개에는 noindex가 없으며 canonical·description·OG/Twitter 태그가 존재했다. 모든 페이지의 색인 가능성이나 검색엔진의 처리 결과까지 보장하지 않는다.

## 메타데이터와 배포 차이

| 공개 페이지 | 실제 title | description |
| --- | --- | --- |
| 다운로드 목록 | 달력·포스터 내려받기 \| 장볼날 | 제철 음식 달력과 계절·월별 제철 포스터를 A4 PDF로 내려받아 인쇄하세요. |
| 월간 상세 | 2026년도 달력 월간 달력 PDF \| 장볼날 | 2026년도 월간 달력 |
| 가지 가격 | 가지 시세 · 평소 가격 \| 장볼날 | 가지(1개) 오늘 시세가 평소보다 싼지 비싼지, 대형마트·전통시장은 얼마에 파는지 견줘 보세요. |
| 가지 제철 | 가지 제철 시기 \| 장볼날 | 가지 제철은 6~10월이에요. 같은 때 제철인 감자·껍질콩도 함께 확인해 보세요. |
| 11월 회 | 11월 제철 회 \| 장볼날 | 11월에 회로 맛있는 생선과 해산물, 자바리·붉바리 등. 맛과 식감을 한 줄씩 소개해요. |

입력 문서에서 확인한 로컬 `downloadsSeo`의 “제철달력 무료 다운로드 · A4 PDF”와 공개 목록 title은 다르다. 배포 지연/캐시/원격 브랜치 차이 중 원인은 미확인이다. “title에 검색어가 없다”는 말도 너무 넓다. 공개 title에 달력·PDF가 있으나 제철달력·무료 다운로드라는 구체 문구가 없다.

## 성능 표본

같은 로컬 실행 환경·대상IP216.198.79.1, 사용자 지정 캐시 무효화 없이 curl 새 프로세스로 가격 가지 URL을 2회 요청했다. wigolo 요청이 앞서 있었으므로 첫 curl을 서버 cold 요청으로 부를 수 없다. 발신 호스트의 실제 네트워크 지리 위치는 별도 검증하지 않았다.

| 요청 | 서울 수신 완료 | curl time_starttransfer | time_total | 전송량 | 캐시/공개 헤더 |
| --- | --- | --- | --- | --- | --- |
| 첫 curl | 15:16:10 | 58.927ms | 2.574675s | 103,666바이트 | HIT, Age1454, X-Vercel-Id `icn1::iad1::...` |
| 반복 curl | 15:16:11 | 46.610ms | 0.579684s | 103,666바이트 | HIT, Age1456, X-Vercel-Id `icn1::iad1::...` |

헤더 수신과 전체 HTML 수신 시간이 다르므로 “2초 초과”를 어느 지표인지 먼저 정의해야 한다. 이 표본은 35/127 페이지 TTFB 2초 초과 주장을 확인하거나 반박할 수 없다. 공개 헤더의 iad1 문자열은 보존하지만 실제 함수 설정·DB 리전·가까운 리전 변경 효과의 증명이 아니다. 제철 메인 782img·1.6MB도 이번에는 미측정이다.

## 후속 티켓으로 넘길 미확인

[운영 로그와 검색·분석 관측 공백 확보](../issues/02-private-observations.md)에서 실제 접근이 있는 담당자가 검색엔진 색인 수·등록/제출, GA 수집, 카카오 이미지 캐시, Vercel OG 오류 로그/배포 SHA/함수 설정, DB 리전을 구분해 수집한다. 공개 조사에서 비공개 권한을 요청하거나 찾아내지 않았다.

[리전과 제철 화면 성능의 투자 기준](../issues/08-performance.md)는 티켓 제목이 달라져도 같은 성능 질문을 소유한다. 실제 cold/warm·캐시 HIT/MISS·TTFB/콘텐츠 완료·측정 지역과 반복 수를 정한다. PDF 실제 파일/인쇄 검증, 축평원 22페이지 표본 의미, 119개 고아 페이지, 43~48개 대응, 검색 수요·외부 채널 편향 역시 이번 관측으로 판정하지 않는다.

## 보존

격리 worktree `/tmp/jangbol-public-baseline-worktree`, 연구 브랜치 `research/jangbol-public-baseline`에 이 문서만 보존한다. 제품 main에 합치거나 PR을 만들지 않는다. 원문 임시 응답은 `/tmp/jangbol-public-baseline/`에 있으며 영구 보존을 보장하지 않는다. 위 표와 인용은 이 문서에 남겨 후속 판단에 사용할 수 있다.

로컬 연구 커밋: `8f75db1`. 원격 push는 자동 승인 검토가 origin 소유권·전송 이력 범위·외부 전송 승인 미확인을 이유로 거절하여 재시도하지 않았다. 원격 보존은 미완료이며 별도 사용자 승인이 필요하다.

2026-11-04 추가 승인: 사용자가 지도·티켓·조사 기록의 커밋과 push를 요청했다. 조사 브랜치를 병합하는 대신 로컬 산출물을 지도와 함께 main의 문서 커밋으로 보존한다. 위 push 거절은 이 추가 승인 전의 기록이다.
