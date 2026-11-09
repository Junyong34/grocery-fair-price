import { generateA4PortraitPdf } from "@/features/admin-print/server/generate"
import { adminEnabled } from "@/features/admin-print/server/guard"
import { PAIRING_SHEETS } from "@/features/baby-food/data"
import { routes } from "@/shared/routes"

export async function POST(request: Request) {
  if (!adminEnabled) return new Response(null, { status: 404 })

  const url = new URL(request.url)
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  if (!local || request.headers.get("origin") !== url.origin) {
    return new Response("로컬 어드민에서 PDF를 생성해 주세요.", { status: 403 })
  }

  try {
    const preview = new URL(routes.admin.babyFoodPrint, url)
    const pdf = await generateA4PortraitPdf(preview.href, PAIRING_SHEETS.length)
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="baby-food-pairings-a4.pdf"',
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류"
    return new Response(`PDF를 생성하지 못했어요. ${message}`, { status: 500 })
  }
}
