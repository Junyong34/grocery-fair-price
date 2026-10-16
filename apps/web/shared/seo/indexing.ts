import type { Metadata } from "next"

// 검색엔진 연결 스위치. 배포처와 도메인이 정해지기 전이라 호스팅 변수에 기대지 않고 환경 변수만 본다.
// 빌드 때 읽는 값이므로 바꾸면 다시 빌드한다. turbo.json의 build.env에도 선언되어 있어야 빌드에 전달된다.

/**
 * 색인 허용 여부. 운영 환경에만 SITE_INDEXABLE=true를 넣는다(프리뷰·스테이징에는 넣지 않는다).
 * 거짓이면 robots.txt가 전체를 막고 모든 페이지에 noindex가 붙는다.
 */
export function isIndexable(): boolean {
  return process.env.SITE_INDEXABLE === "true"
}

/** 검색엔진 소유 확인 메타. Search Console·서치어드바이저에서 받은 값을 환경 변수에 넣는다. 값이 없으면 태그를 내지 않는다. */
export function searchVerification(): Metadata["verification"] {
  const google = process.env.GOOGLE_SITE_VERIFICATION
  const naver = process.env.NAVER_SITE_VERIFICATION
  return {
    ...(google && { google }),
    ...(naver && { other: { "naver-site-verification": naver } }),
  }
}
