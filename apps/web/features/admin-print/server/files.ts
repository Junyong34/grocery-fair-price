import "server-only"

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { buildManifest, downloadDir, parseEdition, type BuildRecord, type Edition } from "@workspace/seasonal/print/edition"

const ROOT = process.cwd()
export const EDITIONS_DIR = path.join(ROOT, "print-editions")
export const PUBLIC_DIR = path.join(ROOT, "public")
export const MANIFEST = path.join(PUBLIC_DIR, "downloads", "manifest.json")

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
  await writeManifest()
}

export async function writeBuild(id: string, build: BuildRecord) {
  await writeFile(buildFile(id), json(build))
  await writeManifest()
}

export async function removeEdition(id: string) {
  await Promise.all([
    rm(editionFile(id), { force: true }),
    rm(buildFile(id), { force: true }),
    rm(editionDownloadDir(id), { recursive: true, force: true }),
  ])
  await writeManifest()
}

async function writeManifest() {
  const manifest = buildManifest(await listEditions(), await readBuilds())
  await mkdir(path.dirname(MANIFEST), { recursive: true })
  await writeFile(MANIFEST, json(manifest))
}
