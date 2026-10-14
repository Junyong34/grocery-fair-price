/** 명절 slug와 대략의 양력 월. 월은 다가오는 명절을 고를 때만 쓴다. 2026년 날짜 기준. */
export const FESTIVALS = [
  { slug: "seollal", month: 2 },
  { slug: "daeboreum", month: 3 },
  { slug: "dano", month: 6 },
  { slug: "sambok", month: 7 },
  { slug: "chuseok", month: 9 },
  { slug: "dongji", month: 12 },
] as const
export type Festival = (typeof FESTIVALS)[number]["slug"]

export function isFestival(value: string): value is Festival {
  return FESTIVALS.some((festival) => festival.slug === value)
}

/** month(1~12) 이후 가장 가까운 명절. 그해 명절이 다 지났으면 다음 해 첫 명절. */
export function upcomingFestival(month: number): Festival {
  return (FESTIVALS.find((festival) => festival.month >= month) ?? FESTIVALS[0]).slug
}
