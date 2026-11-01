// P3 섹션 id. 서버 컴포넌트(detail-view)와 클라이언트 칩 줄(section-chips)이 같이 쓰므로 "use client" 밖에 둔다.

export const P3_SECTIONS = {
  title: "p3-title",
  price: "p3-price",
  places: "p3-places",
  why: "p3-why",
  myPrice: "p3-my-price",
} as const
