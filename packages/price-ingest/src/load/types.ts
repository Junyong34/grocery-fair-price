import type { Source } from "../errors.ts"

// DB 스키마와 저장 경로에서 쓰는 출처 이름 (price 스키마의 source 검사 값과 같다).
// 어댑터 초안은 chamgagyeok이라 부르고, 저장과 DB는 chamga라 부른다.
export type DbSource = "kamis" | "ekape" | "chamga"

export function dbSourceOf(source: Source): DbSource {
  return source === "chamgagyeok" ? "chamga" : source
}
