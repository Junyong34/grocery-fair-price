// 메뉴 · 탭 활성 판정. 순수 함수라 서버 · 클라이언트 · 테스트가 같이 쓴다.

export type ActiveRule = {
  /** 이 경로들에 있을 때도 활성이다(하위 경로 포함). */
  also?: readonly string[]
  /** true면 href와 같을 때만 활성이다. 아니면 하위 경로까지 활성이다. */
  exact?: boolean
}

/** pathname이 href(와 also)에 해당하는지. */
export function matchesPath(
  pathname: string,
  href: string,
  { also = [], exact = false }: ActiveRule = {}
): boolean {
  const under = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`)
  return (exact ? pathname === href : under(href)) || also.some(under)
}
