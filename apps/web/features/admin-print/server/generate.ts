import "server-only"

import { mkdir, readdir, readFile, rm } from "node:fs/promises"
import path from "node:path"

import { downloadDir, downloadPath, type BuildRecord, type Edition } from "@workspace/seasonal/print/edition"
import { PAPER_SIZES, PAPERS, pageCount, specHash, type Paper } from "@workspace/seasonal/print/spec"

import { routes } from "@/shared/routes"

import { editionDownloadDir, PUBLIC_DIR } from "./files"

const pt = (mm: number) => Math.round((mm * 72) / 25.4)

export async function generatePdfs(edition: Edition, origin: string): Promise<BuildRecord> {
  const { chromium } = await import("playwright-core")
  const browser = await chromium.launch({ channel: "chrome" })
  const bytes: Record<string, number> = {}
  try {
    const page = await browser.newPage()
    for (const paper of PAPER_SIZES) {
      const url = `${origin}${routes.print(edition.spec, paper)}`
      const response = await page.goto(url, { waitUntil: "networkidle" })
      if (!response?.ok()) throw new Error(`${url} 응답 ${response?.status()}`)
      await page.evaluate(async () => {
        await document.fonts.ready
        await Promise.all([...document.images].map((image) => image.decode()))
      })
      const file = downloadPath(edition.id, paper)
      const target = path.join(PUBLIC_DIR, file)
      await mkdir(path.dirname(target), { recursive: true })
      await page.pdf({ path: target, preferCSSPageSize: true, printBackground: true })
      bytes[file] = checkPdf(await readFile(target, "latin1"), edition, paper)
    }
  } finally {
    await browser.close()
  }
  await removeUnused(edition.id, bytes)
  return { specHash: specHash(edition.spec), generatedAt: new Date().toISOString(), bytes }
}

async function removeUnused(id: string, made: Readonly<Record<string, number>>) {
  const root = editionDownloadDir(id)
  const files = await readdir(root, { recursive: true }).catch(() => [])
  await Promise.all(files.filter((file) => file.endsWith(".pdf") && !(`${downloadDir(id)}/${file}` in made)).map((file) => rm(path.join(root, file), { force: true })))
}

function checkPdf(pdf: string, edition: Edition, paper: Paper): number {
  const boxes = [...pdf.matchAll(/\/MediaBox\s*\[\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)\s*\]/g)].map((match) => [Math.round(Number(match[1])), Math.round(Number(match[2]))])
  const { width, height } = PAPERS[paper]
  const expected = edition.spec.orientation === "portrait" ? [pt(width), pt(height)] : [pt(height), pt(width)]
  const count = pageCount(edition.spec)
  if (boxes.length !== count) throw new Error(`${edition.id} ${paper}: 쪽 수 ${boxes.length}, 기대 ${count}`)
  const wrong = boxes.find(([w, h]) => Math.abs(w! - expected[0]!) > 1 || Math.abs(h! - expected[1]!) > 1)
  if (wrong) throw new Error(`${edition.id} ${paper}: 쪽 크기 ${wrong.join("×")}pt, 기대 ${expected.join("×")}pt`)
  return pdf.length
}
