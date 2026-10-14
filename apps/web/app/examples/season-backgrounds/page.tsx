import { SEASONS } from "@workspace/seasonal/data/seasons"

import { SeasonBackground } from "@/features/seasonal/seasons/season-background"
import { SeasonCard } from "@/features/seasonal/seasons/season-card"
import { SEASON_BACKGROUNDS } from "@/features/seasonal/seasons/season-style"

export const metadata = { title: "계절 카드 배경 비교" }

const LABELS: Record<(typeof SEASON_BACKGROUNDS)[number], string> = {
  sunwash: "sunwash — 넓고 옅은 색 웅덩이 (SVG)",
  sprouts: "sprouts — 작은 잎·씨앗 무늬 (SVG)",
  contours: "contours — 등고선 (SVG)",
  pigment: "pigment-field — 움직이는 물감 (WebGL)",
  plain: "plain — 계절색 그라데이션만 (CSS)",
}

// 3a 계절 카드 배경 후보 비교(spec "3a 계절 히어로 카드"). 실제 카드 비율(모바일 339폭)로 네 계절을 한 줄에 둔다.
export default function Page() {
  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-10 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl">계절 카드 배경 비교</h1>
        <p className="text-sm text-stone">
          모두 계절색 토큰(season-spring·summer·autumn·winter)으로 칠했다. 아래
          그라데이션은 공통 바탕이다.
        </p>
      </div>
      {SEASON_BACKGROUNDS.map((variant) => (
        <section key={variant} className="flex flex-col gap-3">
          <h2 className="font-semibold">{LABELS[variant]}</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {SEASONS.map((season) => (
              <SeasonCard
                key={season}
                season={season}
                sharedTitle={false}
                className="h-[460px] w-[300px] shrink-0"
                background={
                  <SeasonBackground season={season} variant={variant} />
                }
              />
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
