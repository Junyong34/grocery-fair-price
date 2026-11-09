import "server-only"

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import type { Page } from "playwright-core"

import { downloadDir, downloadPath, thumbnailPages, thumbnailPath, type BuildRecord, type Edition, type Thumbnail } from "@workspace/seasonal/print/edition"
import { pageCount, papersForSpec, sheetSize, specHash, type Paper } from "@workspace/seasonal/print/spec"

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
    for (const paper of papersForSpec(edition.spec)) {
      const url = `${origin}${routes.print(edition.spec, paper)}`
      await loadPrintPage(page, url)
      if (edition.spec.kind === "baby-food-pairings") await assertPrintFits(page)
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

async function loadPrintPage(page: Page, url: string) {
  const response = await page.goto(url, { waitUntil: "networkidle" })
  if (!response?.ok()) throw new Error(`${url} 응답 ${response?.status()}`)
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].map((image) => {
      image.loading = "eager"
      return image.decode()
    }))
  })
}

/** 에디션이나 공개 목록에 넣지 않는 고정 A4 인쇄물. 파일은 브라우저로 바로 돌려준다. */
export async function generateA4PortraitPdf(url: string, pages: number) {
  const { chromium } = await import("playwright-core")
  const browser = await chromium.launch({ channel: "chrome" })
  try {
    const page = await browser.newPage()
    await page.emulateMedia({ media: "print" })
    await loadPrintPage(page, url)
    await assertPrintFits(page)
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true })
    checkPdfBoxes(pdf.toString("latin1"), "이유식 재료 궁합표 A4", sheetSize("A4", "portrait"), pages)
    return Uint8Array.from(pdf)
  } finally {
    await browser.close()
  }
}

async function assertPrintFits(page: Page) {
  const overflow = await page.locator(".print-sheet").evaluateAll((sheets) =>
    sheets.findIndex((sheet) => sheet.scrollHeight > sheet.clientHeight + 1 || sheet.scrollWidth > sheet.clientWidth + 1)
  )
  if (overflow >= 0) throw new Error(`${overflow + 1}쪽의 표가 용지 밖으로 나갔어요.`)
}

function checkPdf(pdf: string, edition: Edition, paper: Paper): number {
  checkPdfBoxes(pdf, `${edition.id} ${paper}`, sheetSize(paper, edition.spec.orientation), pageCount(edition.spec))
  return pdf.length
}

function checkPdfBoxes(pdf: string, label: string, size: { width: number; height: number }, count: number) {
  const boxes = [...pdf.matchAll(/\/MediaBox\s*\[\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)\s*\]/g)]
    .map((match) => ({ width: Math.round(Number(match[1])), height: Math.round(Number(match[2])) }))
  const width = pt(size.width)
  const height = pt(size.height)
  if (boxes.length !== count) throw new Error(`${label}: 쪽 수 ${boxes.length}, 기대 ${count}`)
  const wrong = boxes.find((box) => Math.abs(box.width - width) > 1 || Math.abs(box.height - height) > 1)
  if (wrong) throw new Error(`${label}: 쪽 크기 ${wrong.width}×${wrong.height}pt, 기대 ${width}×${height}pt`)
}
