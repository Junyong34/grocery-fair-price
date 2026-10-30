import { describe, expect, it } from "vitest"

import type { BuildRecord, Edition, EditionStatus } from "@workspace/seasonal/print/edition"
import { DEFAULT_SPECS, specHash } from "@workspace/seasonal/print/spec"

import { savePlan } from "./publish"

const spec = DEFAULT_SPECS.monthly
const edition = (status: EditionStatus, year = spec.year): Edition => ({ id: "monthly-1", title: "t", description: "d", status, spec: { ...spec, year } })
const build: BuildRecord = { specHash: specHash(spec), generatedAt: "2026-10-30T00:00:00.000Z", bytes: {}, thumbnails: [] }
const ready = { build, storageReady: true }

describe("savePlan", () => {
  it("처음 공개할 때 지금 옵션으로 만든 PDF가 있으면 올린다", () => {
    expect(savePlan(edition("draft"), edition("published"), ready)).toEqual({ storage: "upload" })
    expect(savePlan(edition("withdrawn"), edition("published"), ready)).toEqual({ storage: "upload" })
  })

  it("처음 공개할 때 PDF가 없거나 옛 옵션으로 만든 것이면 막는다", () => {
    expect(savePlan(edition("draft"), edition("published"), { ...ready, build: undefined })).toEqual({ error: "PDF를 만든 뒤 공개하세요." })
    expect(savePlan(edition("draft"), edition("published", 2030), ready)).toEqual({ error: "지금 옵션으로 PDF를 다시 만든 뒤 공개하세요." })
  })

  it("공개 중인 에디션은 옵션 · 설명을 바꿔도 저장만 한다(다시 만들 때 올린다)", () => {
    expect(savePlan(edition("published"), edition("published", 2030), ready)).toEqual({ storage: "none" })
  })

  it("공개를 내리거나 초안으로 돌려도 저장소는 그대로 둔다(배포 뒤 R2 정리로 지운다)", () => {
    expect(savePlan(edition("published"), edition("withdrawn"), { build, storageReady: false })).toEqual({ storage: "none" })
    expect(savePlan(edition("published"), edition("draft"), { build, storageReady: false })).toEqual({ storage: "none" })
  })

  it("공개와 상관없는 저장은 저장소를 건드리지 않는다", () => {
    expect(savePlan(edition("draft"), edition("draft"), { build: undefined, storageReady: false })).toEqual({ storage: "none" })
    expect(savePlan(edition("draft"), edition("withdrawn"), { build: undefined, storageReady: false })).toEqual({ storage: "none" })
  })

  it("공개할 때 쓰기 키가 없으면 막는다", () => {
    expect(savePlan(edition("draft"), edition("published"), { ...ready, storageReady: false })).toEqual({ error: "R2 쓰기 키(R2_WRITE_*)가 없어 공개할 수 없어요." })
  })
})
