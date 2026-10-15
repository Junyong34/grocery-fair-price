import {
  HeroButton,
  type HeroButtonAppearance,
} from "@workspace/ui/components/hero-button"

export const metadata = { title: "관련 명절 버튼 비교" }

// heroButtonAppearances는 "use client" 모듈의 값이라 서버 컴포넌트에서 읽을 수 없어 목록을 옮겨 둔다.
const APPEARANCES: readonly HeroButtonAppearance[] = [
  "liquid",
  "split-arrow",
  "paper-fold",
  "pressed-key",
  "ribbon",
  "ticket",
  "seal",
  "ink-sweep",
  "orbit",
  "sliding-window",
  "stacked-paper",
  "spotlight",
]

// 품종 상세 "관련 명절" 링크 후보. cojeev hero-button의 모양(appearance)을 sm 크기로 나란히 본다.
export default function Page() {
  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-8 p-6">
      <h1 className="font-heading text-3xl">관련 명절 버튼 비교</h1>
      <div className="grid gap-6 sm:grid-cols-2">
        {APPEARANCES.map((appearance) => (
          <section
            key={appearance}
            className="flex flex-col gap-2 rounded-lg border border-hairline p-4"
          >
            <h2 className="text-sm text-stone">{appearance}</h2>
            <div className="flex flex-wrap gap-2">
              <HeroButton appearance={appearance} size="sm">
                추석
              </HeroButton>
              <HeroButton appearance={appearance} size="sm" variant="outline">
                정월대보름
              </HeroButton>
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
