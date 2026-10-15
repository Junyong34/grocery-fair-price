import { SeasonsHero } from "@/features/seasonal/seasons/seasons-hero"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"

export const metadata = createMetadata({
  title: "사계절 제철",
  description: "봄, 여름, 가을, 겨울 사계절의 순환 속에서 만나는 가장 풍성한 제철 이야기.",
  path: routes.seasonal.seasons,
  ogImage: {
    title: "사계절 제철 이야기",
    subtitle: "봄 · 여름 · 가을 · 겨울 언제 뭐가 맛있을까",
    badge: "사계절",
  },
})

export default function Page() {
  return <SeasonsHero />
}
