import { renderToStaticMarkup } from "react-dom/server"
import { expect, it } from "vitest"

import { wireframeOf } from "../lib/wireframe-catalog"
import { Wireframe } from "./wireframe"

it("P-C 원형판 선 좌표는 서버·브라우저 삼각함수 오차가 드러나지 않게 소수 여섯 자리로 그린다", () => {
  const html = renderToStaticMarkup(<Wireframe entry={wireframeOf("P-C")!} orientation="portrait" />)
  const lines = html.match(/<line [^>]+/g) ?? []
  expect(lines.length).toBeGreaterThan(0)
  for (const line of lines) {
    for (const coordinate of line.matchAll(/(?:x1|y1|x2|y2)="([^"]+)"/g)) {
      expect(coordinate[1]).toMatch(/^-?\d+(\.\d{1,6})?$/)
    }
  }
})
