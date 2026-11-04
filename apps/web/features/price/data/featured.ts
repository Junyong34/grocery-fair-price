/** 자주 사는 품종: 운영자가 정한 고정 목록(2026-10-27 결정, 검색 기록을 모으게 되면 바꾼다).
 * 판정 목록에 없는 id는 화면의 pickByIds가 건너뛴다. */
export const FEATURED_IDS: readonly string[] = [
  "egg",
  "onion",
  "apple",
  "mackerel-kr",
  "korean-zucchini",
  "pork-belly",
  "green-onion",
  // "소고기 한우"는 부위별 품종뿐이라 대표 부위인 등심으로 둔다(2026-11-04).
  "hanwoo-sirloin",
]
