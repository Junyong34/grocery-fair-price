import { resolveDownload } from "@workspace/seasonal/print/listing"

import { downloadUrl } from "@/features/seasonal/downloads/server/download-url"
import { DOWNLOADS } from "@/shared/downloads-manifest"
import { routes } from "@/shared/routes"

// 에디션 PDF 내려받기 주소. 저장소의 짧은 서명 링크로 302한다(ADR 0003).
// 응답은 색인하지 않고(X-Robots-Tag) 캐시하지 않는다. 서명 링크는 매번 새로 만든다.
const HEADERS = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" }

export async function GET(request: Request, ctx: RouteContext<"/seasonal/downloads/[edition]/[paper]">) {
  const { edition, paper } = await ctx.params
  const target = resolveDownload(DOWNLOADS, edition, paper)
  if (target.type === "withdrawn") return redirect(new URL(routes.seasonal.download(target.id), request.url))
  if (target.type === "missing") return new Response("Not Found", { status: 404, headers: HEADERS })
  // 나중에 광고를 본 뒤 내려받게 하면, 그 확인이 여기 들어간다(.scratch/calendar-download/spec.md "광고").
  const url = await downloadUrl(target.edition, target.paper)
  if (!url) return new Response("Service Unavailable", { status: 503, headers: HEADERS })
  return redirect(new URL(url, request.url))
}

const redirect = (url: URL) => new Response(null, { status: 302, headers: { ...HEADERS, Location: url.toString() } })
