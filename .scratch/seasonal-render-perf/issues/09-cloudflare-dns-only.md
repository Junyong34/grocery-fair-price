# 09. Cloudflare 프록시 끄기

Status: resolved (2026-11-11, 사용자가 DNS only로 전환, 확인 결과 baseline.md "09")
Type: task (HITL)
Blocked by: 없음

## 목적

한국 요청이 Cloudflare LA → Vercel SF를 거쳐 모든 페이지 TTFB가 0.7~1.5초 늘어난다. Cloudflare는 HTML을 캐시하지 않아(`DYNAMIC`) 얻는 것이 없다(spec 6.1, `architecture.md` 1장).

## 할 일 (사용자)

- [ ] dash.cloudflare.com → `jangbol.kr` → Rules(Page · Redirect Rules), Security → WAF, SSL/TLS → Edge Certificates에 쓰는 규칙이 있는지 본다. 있으면 Vercel 쪽 대체를 먼저 정한다
- [ ] DNS → Records에서 `jangbol.kr` · `www`의 Proxy status를 "DNS only"(회색 구름)로 바꾼다. 값은 Vercel → Project → Settings → Domains에 나온 값(apex `A 76.76.21.21`, www `CNAME cname.vercel-dns.com`)과 맞춘다
- [ ] 사용자가 적은 시간에 바꾼다. 인증서 재발급 동안 잠깐 경고가 날 수 있다

## 확인 (에이전트가 해도 됨)

```bash
dig +short A jangbol.kr
curl -sI https://jangbol.kr/seasonal | grep -iE 'server|cf-ray|x-vercel-id'   # server: Vercel, cf-ray 없음, icn1
curl -sI https://www.jangbol.kr | grep -i location                            # 리다이렉트 유지
```

## 완료 기준

- 위 확인이 기대대로 나오고, `/`와 `/seasonal`의 TTFB 3회를 `baseline.md`에 덧붙였다
