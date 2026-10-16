/**
 * app/ 기준 page 파일 경로를 Next 라우트 패턴으로 바꾼다. 예: `seasonal/(this-month)/months/(detail)/[month]/page.tsx` → `/seasonal/months/[month]`.
 * 라우트 그룹 `(x)`는 주소에 나오지 않으므로 지운다. `@slot` 아래와 가로채기 라우트(`(.)x`)는 자기 주소가 없으므로 null이다.
 * 가드 테스트(pages.test.ts)가 모든 페이지를 SEO 레지스트리와 맞춰 보는 데 쓴다.
 */
export function routePatternOf(pageFile: string): string | null {
  const segments = pageFile.split(/[\\/]/).slice(0, -1)
  if (segments.some((segment) => segment.startsWith("@") || /^\(\.{1,3}\)/.test(segment))) return null
  const kept = segments.filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")))
  return `/${kept.join("/")}`
}
