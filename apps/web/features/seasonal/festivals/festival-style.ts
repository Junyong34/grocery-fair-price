import type { Festival } from "@workspace/seasonal/data/festivals"
import type { PatternBackgroundVariant } from "@workspace/ui/components/pattern-background"

export type FestivalStyle = {
  /** 명절 테마 색상 변수(Oura 토큰). */
  color: string
  /** 배경 무늬(cojeev pattern-background). */
  pattern: PatternBackgroundVariant
  patternSpacing: number
  patternOpacity: number
  /** 카드 우측 상단 워터마크 도형(cojeev shape). */
  shape: string
  /** 상단 미니 카드에 표시할 짧은 시기 문구. */
  shortPeriod: string
}

/**
 * 5개 명절의 시각 테마. 색은 Oura 토큰 변수만 쓴다.
 * - 설날: 새해 아침 퍼지는 금빛 햇살(sunwash)과 해(sunburst-24)
 * - 정월대보름: 초봄 새순·오곡 씨앗(sprouts)과 첫 보름달(circle)
 * - 삼복: 한여름 짙은 녹음 등고선(contours)과 뜨거운 해(star-8)
 * - 추석: 가을 추수 소쿠리 직조(weave)와 풍성한 한가위 달·송편(scallop)
 * - 동지: 붉은 팥죽 새알심(pebbles)과 가장 긴 겨울밤의 달(crescent)
 */
export const FESTIVAL_STYLE: Record<Festival, FestivalStyle> = {
  seollal: {
    color: "var(--color-gold)",
    pattern: "sunwash",
    patternSpacing: 26,
    patternOpacity: 0.4,
    shape: "sunburst-24",
    shortPeriod: "음력 1.1",
  },
  daeboreum: {
    color: "var(--color-season-spring)",
    pattern: "sprouts",
    patternSpacing: 28,
    patternOpacity: 0.28,
    shape: "circle",
    shortPeriod: "음력 1.15",
  },
  sambok: {
    color: "var(--color-season-summer)",
    pattern: "contours",
    patternSpacing: 28,
    patternOpacity: 0.24,
    shape: "star-8",
    shortPeriod: "7~8월 삼복",
  },
  chuseok: {
    color: "var(--color-season-autumn)",
    pattern: "weave",
    patternSpacing: 24,
    patternOpacity: 0.22,
    shape: "scallop",
    shortPeriod: "음력 8.15",
  },
  dongji: {
    color: "var(--color-clay)",
    pattern: "pebbles",
    patternSpacing: 26,
    patternOpacity: 0.26,
    shape: "crescent",
    shortPeriod: "12.22 무렵",
  },
}
