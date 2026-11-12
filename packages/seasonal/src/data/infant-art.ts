// 이유식 화면이 쓰는 그림. 값은 그림 ID다 (ADR 0006). 제철 품종이 아닌 재료의 그림도 여기서 가리킨다.
// 목록은 infant-art.json에서 고친다. 그림 어드민이 그 파일을 쓴다.
import infantArt from "./infant-art.json"

/** 과일 시기 도감의 과일 id 또는 주의 식재료 iconId → 그림 ID. */
export const FRUIT_ART_IDS: Readonly<Partial<Record<string, string>>> = infantArt.fruits

/** 이유식 궁합의 재료 이름 → 그림 ID. 이름과 품종 범위가 일치하는 그림만 연결한다. */
export const PAIRING_ART_IDS: Readonly<Partial<Record<string, string>>> = infantArt.pairings

/** 이유식 화면이 가리키는 그림 ID 전체. 겹치지 않는다. */
export function infantArtIds(): string[] {
  return [...new Set([...Object.values(infantArt.fruits), ...Object.values(infantArt.pairings)])].sort()
}
