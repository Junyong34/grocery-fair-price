import type { PrintSpec } from "./spec"

// 인쇄 사양을 URL 쿼리에 싣는 모양(UTF-8 JSON의 base64url). 검증(zod)은 spec.ts의 decodeSpec이 한다.
// 이 파일은 맨 위에서 아무것도 실행하지 않아야 한다. 모든 화면이 쓰는 shared/routes.ts가 이 파일만 import하므로,
// spec.ts(zod·품종 데이터)를 끌어오면 그것이 모든 페이지의 client 번들에 실린다(.scratch/bundle-audit/report.md 후보 1).

export function encodeSpec(spec: PrintSpec): string {
  const bytes = new TextEncoder().encode(JSON.stringify(spec))
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")
}

/** encodeSpec의 역. 검증하지 않은 JSON 값을 돌려주고, base64나 JSON이 깨졌으면 던진다. */
export function decodeSpecJson(encoded: string): unknown {
  const binary = atob(encoded.replaceAll("-", "+").replaceAll("_", "/"))
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0))))
}
