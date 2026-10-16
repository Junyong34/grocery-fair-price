import "server-only"

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { buildManifest, downloadDir, parseEdition, type BuildRecord, type Edition } from "@workspace/seasonal/print/edition"

// 에디션 원본(print-editions/<id>.json)과 생성 기록(<id>.build.json), 다운로드 폴더(public/downloads)를 읽고 쓴다.
// 개발 서버에서만 부른다. 결과는 관리자가 커밋해 배포한다.

const ROOT = process.cwd()
export const EDITIONS_DIR = path.join(ROOT, "print-editions")
export const PUBLIC_DIR = path.join(ROOT, "public")
const MANIFEST = path.join(PUBLIC_DIR, "downloads", "manifest.json")

/** 에디션 하나의 PDF가 모이는 폴더(디스크 경로) */
export const editionDownloadDir = (id: string) => path.join(PUBLIC_DIR, downloadDir(id))

const editionFile = (id: string) => path.join(EDITIONS_DIR, `${id}.json`)
const buildFile = (id: string) => path.join(EDITIONS_DIR, `${id}.build.json`)

export async function listEditions(): Promise<Edition[]> {
  const files = (await readdir(EDITIONS_DIR)).filter((file) => file.endsWith(".json") && !file.endsWith(".build.json"))
  const editions = await Promise.all(files.map(async (file) => parseEdition(JSON.parse(await readFile(path.join(EDITIONS_DIR, file), "utf8")))))
  const broken = editions.find((edition) => edition instanceof Error)
  if (broken) throw broken
  return (editions as Edition[]).sort((a, b) => a.id.localeCompare(b.id))
}

export async function readEdition(id: string): Promise<Edition | undefined> {
  return (await listEditions()).find((edition) => edition.id === id)
}

/** 생성 기록 하나. 아직 만든 적이 없으면 undefined */
export async function readBuild(id: string): Promise<BuildRecord | undefined> {
  return (await readBuilds())[id]
}

export async function readBuilds(): Promise<Record<string, BuildRecord>> {
  const files = (await readdir(EDITIONS_DIR)).filter((file) => file.endsWith(".build.json"))
  const entries = await Promise.all(
    files.map(async (file) => [file.replace(/\.build\.json$/, ""), JSON.parse(await readFile(path.join(EDITIONS_DIR, file), "utf8"))] as const),
  )
  return Object.fromEntries(entries)
}

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`

export async function writeEdition(edition: Edition) {
  await writeFile(editionFile(edition.id), json(edition))
}

export async function writeBuild(id: string, build: BuildRecord) {
  await writeFile(buildFile(id), json(build))
}

/** 에디션 원본·생성 기록·만든 PDF를 모두 지운다. 없는 파일은 넘어간다. */
export async function removeEdition(id: string) {
  await Promise.all([
    rm(editionFile(id), { force: true }),
    rm(buildFile(id), { force: true }),
    rm(editionDownloadDir(id), { recursive: true, force: true }),
  ])
}

/** 공개된 에디션으로 매니페스트를 다시 쓴다. 저장·생성 뒤마다 부른다. */
export async function writeManifest() {
  const manifest = buildManifest(await listEditions(), await readBuilds())
  await mkdir(path.dirname(MANIFEST), { recursive: true })
  await writeFile(MANIFEST, json(manifest))
}
