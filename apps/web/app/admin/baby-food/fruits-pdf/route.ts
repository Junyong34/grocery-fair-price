import { generateA4CustomPdf } from "@/features/admin-print/server/generate"
import { adminEnabled } from "@/features/admin-print/server/guard"
import { routes } from "@/shared/routes"

export async function POST(request: Request) {
  if (!adminEnabled) return new Response(null, { status: 404 })

  const url = new URL(request.url)
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  if (!local || request.headers.get("origin") !== url.origin) {
    return new Response("로컬 어드민에서 PDF를 생성해 주세요.", { status: 403 })
  }

  try {
    const formData = await request.formData()
    const orientationParam = formData.get("orientation")
    const orientation =
      orientationParam === "landscape" ? "landscape" : "portrait"

    const preview = new URL(routes.admin.babyFoodFruitsPrint, url)
    preview.searchParams.set("orientation", orientation)

    const pdf = await generateA4CustomPdf(
      preview.href,
      1,
      orientation,
      "월령별 아기 과일 시기 A4"
    )

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="baby-food-fruits-a4-${orientation}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류"
    return new Response(`PDF를 생성하지 못했어요. ${message}`, { status: 500 })
  }
}
