import { existsSync } from "node:fs"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it } from "vitest"

import { PROHIBITED_FOODS } from "@workspace/seasonal/data/infant-fruits"

import { FRUIT_GUIDE_ART } from "../data"
import { SafetyGuideSection } from "./safety-guide-section"

it("돌 전 금지와 두 돌 전 주의 카드에 준비된 그림을 표시한다", () => {
  const html = renderToStaticMarkup(<SafetyGuideSection />)

  for (const item of PROHIBITED_FOODS) {
    if (item.targetStage === "under-5y") continue
    const src = FRUIT_GUIDE_ART[item.iconId]
    if (!src) continue

    expect(html, item.name).toContain(`src="${src}"`)
    expect(
      existsSync(new URL(`../../../public${src}`, import.meta.url)),
      item.name
    ).toBe(true)
  }
})
