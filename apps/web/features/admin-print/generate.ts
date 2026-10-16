import { mkdir, readdir, readFile, rm } from "node:fs/promises"
import path from "node:path"

import { downloadPath, type BuildRecord, type Edition } from "@workspace/seasonal/print/edition"
import { encodeSpec, KIND_PAGES, PAPER_SIZES, PAPERS, pageCount, specHash, type PageKey, type Paper } from "@workspace/seasonal/print/spec"

import { PUBLIC_DIR } from "./files"

/** PDF 쪽 크기(pt). 1mm = 72/25.4pt */
const pt = (mm: number) => Math.round((mm * 72) / 25.4)

/**
 * 에디션 하나의 결과 PDF를 모두 만든다(용지 2벌 × KIND_PAGES). 이 컴퓨터의 Chrome으로 /print를 열어 저장한다.
 * 저장한 PDF의 쪽 크기와 쪽 수가 사양과 다르면 실패한다.
 */
export async function generatePdfs(edition: Edition, origin: string): Promise<BuildRecord> {
  const { chromium } = await import("playwright-core")
  const browser = await chromium.launch({ channel: "chrome" })
  const bytes: Record<string, number> = {}
  try {
    const page = await browser.newPage()
    for (const paper of PAPER_SIZES)
      for (const key of KIND_PAGES[edition.spec.kind] as readonly PageKey[]) {
        const url = `${origin}/print?spec=${encodeSpec(edition.spec)}&paper=${paper}&page=${key}`
        const response = await page.goto(url, { waitUntil: "networkidle" })
        if (!response?.ok()) throw new Error(`${url} 응답 ${response?.status()}`)
        await page.evaluate(async () => {
          await document.fonts.ready
          await Promise.all([...document.images].map((image) => image.decode()))
        })
        const file = downloadPath(edition.id, paper, key)
        const target = path.join(PUBLIC_DIR, file)
        await mkdir(path.dirname(target), { recursive: true })
        await page.pdf({ path: target, preferCSSPageSize: true, printBackground: true })
        bytes[file] = checkPdf(await readFile(target, "latin1"), edition, paper, key)
      }
  } finally {
    await browser.close()
  }
  await removeUnused(edition.id, bytes)
  return { specHash: specHash(edition.spec), generatedAt: new Date().toISOString(), bytes }
}

/** 이번에 만들지 않은 옛 PDF(예: 지금은 안 만드는 달별 파일)를 지운다. 다 만든 뒤에만 부르므로 실패하면 옛 파일이 남는다. */
async function removeUnused(id: string, made: Readonly<Record<string, number>>) {
  const root = path.join(PUBLIC_DIR, "downloads", id)
  const files = await readdir(root, { recursive: true }).catch(() => [])
  await Promise.all(files.filter((file) => file.endsWith(".pdf") && !(`/downloads/${id}/${file}` in made)).map((file) => rm(path.join(root, file), { force: true })))
}

/** 쪽 크기·쪽 수를 확인하고 파일 크기를 돌려준다. */
function checkPdf(pdf: string, edition: Edition, paper: Paper, key: PageKey): number {
  const boxes = [...pdf.matchAll(/\/MediaBox\s*\[\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)\s*\]/g)].map((match) => [Math.round(Number(match[1])), Math.round(Number(match[2]))])
  const { width, height } = PAPERS[paper]
  const expected = edition.spec.orientation === "portrait" ? [pt(width), pt(height)] : [pt(height), pt(width)]
  const count = pageCount(edition.spec, key)
  if (boxes.length !== count) throw new Error(`${edition.id} ${paper} ${key}: 쪽 수 ${boxes.length}, 기대 ${count}`)
  const wrong = boxes.find(([w, h]) => Math.abs(w! - expected[0]!) > 1 || Math.abs(h! - expected[1]!) > 1)
  if (wrong) throw new Error(`${edition.id} ${paper} ${key}: 쪽 크기 ${wrong.join("×")}pt, 기대 ${expected.join("×")}pt`)
  return pdf.length
}
