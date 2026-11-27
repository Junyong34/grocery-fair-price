import { FOOD_VERSIONS } from "./food-versions.generated"

/**
 * 화면 <img>에 쓰는 그림 주소(apps/web/public/foods/<웹 폴더>/<변형>.svg). 웹 폴더는 품종 ID 또는 그림 ID다.
 * 내용 해시가 있으면 ?v=<해시>를 붙인다. apps/web/next.config.ts의 headers()가 ?v 있는 /foods/* 요청만
 * 1년 immutable로 캐시하므로, 그림이 바뀌면(pnpm foods:sync) 주소가 바뀌어 새로 받는다.
 * 해시가 없으면 버전 없는 주소(기본 캐시 헤더)다. 사이트맵 · JSON-LD처럼 오래 두는 주소는 이 함수를 쓰지 않는다.
 */
export function foodArtSrc(webId: string, variant: "color" | "motion" = "color"): string {
  const path = `/foods/${webId}/${variant}.svg`
  const version = FOOD_VERSIONS[webId]
  return version ? `${path}?v=${version}` : path
}
