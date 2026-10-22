import { readFileSync } from "node:fs"

// 저장소의 응답 샘플 (grocery-price/reference/public-data/samples/, 2026-10-12 저장분)
export const SAMPLES_DIR = new URL("../../../grocery-price/reference/public-data/samples/", import.meta.url)

// 테스트용 가짜 키. 실제 인증키가 아니다.
export const FAKE_KEY = "FAKEKEY0123456789"

export function readSampleText(path: string): string {
  return readFileSync(new URL(path, SAMPLES_DIR), "utf8")
}

// 샘플 응답에서 행 배열의 필드 이름을 바꾼다 (계약이 깨졌을 때를 흉내 낸다).
export function renameKey(rows: Record<string, unknown>[], from: string, to: string): void {
  for (const row of rows) {
    if (!(from in row)) continue
    row[to] = row[from]
    delete row[from]
  }
}
