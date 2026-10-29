import "server-only"

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import type { Page } from "playwright-core"

import { downloadDir, downloadPath, thumbnailPages, thumbnailPath, type BuildRecord, type Edition, type Thumbnail } from "@workspace/seasonal/print/edition"
import { PAPER_SIZES, pageCount, sheetSize, specHash, type Paper } from "@workspace/seasonal/print/spec"

import { routes } from "@/shared/routes"

import { editionDownloadDir, PUBLIC_DIR } from "./files"

const pt = (mm: number) => Math.round((mm * 72) / 25.4)

/** 썸네일 폭(px). 목록 칸 · 시트 미리보기의 2배 밀도 */
const THUMBNAIL_WIDTH = 480
/** 썸네일을 찍는 용지. 사용자가 받는 용지와 같다. */
const THUMBNAIL_PAPER: Paper = "A4"

export async function generatePdfs(edition: Edition, origin: string): Promise<BuildRecord> {
  const { chromium } = await import("playwright-core")
  const browser = await chromium.launch({ channel: "chrome" })
  const bytes: Record<string, number> = {}
  let thumbnails: Thumbnail[] = []
  try {
    const page = await browser.newPage({ deviceScaleFactor: 2 })
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
      if (paper === THUMBNAIL_PAPER) thumbnails = await captureThumbnails(page, edition)
    }
  } finally {
    await browser.close()
  }
  await removeUnused(edition.id, new Set([...Object.keys(bytes), ...thumbnails.map((thumbnail) => thumbnail.path)]))
  return { specHash: specHash(edition.spec), generatedAt: new Date().toISOString(), bytes, thumbnails }
}

/** 화면에 그린 인쇄 페이지의 시트를 찍어 WebP로 줄인다. 목록 · 상세의 미리보기다. */
async function captureThumbnails(page: Page, edition: Edition): Promise<Thumbnail[]> {
  const { default: sharp } = await import("sharp")
  const sheets = page.locator(".print-sheet")
  return Promise.all(
    thumbnailPages(edition.spec).map(async (sheet, index) => {
      const png = await sheets.nth(sheet).screenshot({ animations: "disabled" })
      const { data, info } = await sharp(png).resize({ width: THUMBNAIL_WIDTH }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true })
      const file = thumbnailPath(edition.id, index)
      await writeFile(path.join(PUBLIC_DIR, file), data)
      return { path: file, width: info.width, height: info.height }
    }),
  )
}

async function removeUnused(id: string, made: ReadonlySet<string>) {
  const root = editionDownloadDir(id)
  const files = await readdir(root, { recursive: true }).catch(() => [])
  const generated = (file: string) => file.endsWith(".pdf") || file.endsWith(".webp")
  await Promise.all(files.filter((file) => generated(file) && !made.has(`${downloadDir(id)}/${file}`)).map((file) => rm(path.join(root, file), { force: true })))
}

function checkPdf(pdf: string, edition: Edition, paper: Paper): number {
  const boxes = [...pdf.matchAll(/\/MediaBox\s*\[\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)\s*\]/g)].map((match) => [Math.round(Number(match[1])), Math.round(Number(match[2]))])
  const { width, height } = sheetSize(paper, edition.spec.orientation)
  const expected = [pt(width), pt(height)]
  const count = pageCount(edition.spec)
  if (boxes.length !== count) throw new Error(`${edition.id} ${paper}: 쪽 수 ${boxes.length}, 기대 ${count}`)
  const wrong = boxes.find(([w, h]) => Math.abs(w! - expected[0]!) > 1 || Math.abs(h! - expected[1]!) > 1)
  if (wrong) throw new Error(`${edition.id} ${paper}: 쪽 크기 ${wrong.join("×")}pt, 기대 ${expected.join("×")}pt`)
  return pdf.length
}
