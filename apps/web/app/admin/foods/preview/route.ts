import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import path from "node:path"

import { ART_ID, PREVIEW_DIR } from "@/features/admin-foods/server/paths"
import { adminEnabled } from "@/features/admin-print/server/guard"

// 그림 원본에서 그린 미리보기 SVG (scripts/render-art-previews.mjs의 출력). 개발 서버에서만 열린다.
export async function GET(request: Request) {
  if (!adminEnabled) return new Response(null, { status: 404 })

  const params = new URL(request.url).searchParams
  const art = params.get("art") ?? ""
  const variant = params.get("variant")
  if (!ART_ID.test(art) || (variant !== "color" && variant !== "motion")) return new Response(null, { status: 400 })

  const file = path.join(/*turbopackIgnore: true*/ PREVIEW_DIR, art, `${variant}.svg`)
  if (!existsSync(/*turbopackIgnore: true*/ file)) return new Response(null, { status: 404 })
  // 그림을 고치면 바로 보여야 하므로 캐시하지 않는다.
  return new Response(await readFile(/*turbopackIgnore: true*/ file), { headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "no-store" } })
}
