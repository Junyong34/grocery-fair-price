import type { z } from "zod"

import { ApiContractError, type Source } from "./errors.ts"

type ZodIssue = z.core.$ZodIssue

// 검사 실패 항목을 사람이 읽는 줄로 바꾼다. 받은 값은 넣지 않는다.
export function formatIssues(error: z.ZodError, limit = 10): string[] {
  const lines = error.issues.slice(0, limit).map(formatIssue)
  if (error.issues.length > limit) lines.push(`… 외 ${error.issues.length - limit}건`)
  return lines
}

function formatIssue(issue: ZodIssue): string {
  const where = pathText(issue.path)
  if (issue.code === "unrecognized_keys") return `${where}: 정의되지 않은 필드 ${issue.keys.join(", ")}`
  if (issue.code === "invalid_type") return `${where}: 필수 값이 없거나 타입이 다르다 (기대: ${issue.expected})`
  if (issue.code === "invalid_value") return `${where}: 허용되지 않은 값`
  if (issue.code === "invalid_format") return `${where}: 형식이 맞지 않음`
  return `${where}: ${issue.message}`
}

function pathText(path: readonly PropertyKey[]): string {
  if (path.length === 0) return "(루트)"
  return path.reduce<string>((text, key) => {
    if (typeof key === "number") return `${text}[${key}]`
    return text === "" ? String(key) : `${text}.${String(key)}`
  }, "")
}

// 검사 결과를 줄 목록으로만 본다 (계약 테스트, 실측 비교).
export function checkWith(schema: z.ZodType, raw: unknown): string[] {
  const result = schema.safeParse(raw)
  return result.success ? [] : formatIssues(result.error)
}

// 검사를 통과한 값만 돌려준다. 실패하면 계약 오류로 끊는다.
export function parseOrThrow<T>(source: Source, schema: z.ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw)
  if (!result.success) throw new ApiContractError(source, formatIssues(result.error))
  return result.data
}
