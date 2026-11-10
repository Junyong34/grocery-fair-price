import { INFANT_PAIRING_COPY } from "@workspace/seasonal/data/copy"

import { PAIRING_REFERENCES } from "./data"

/**
 * 출처. 전체표와 재료별 페이지 맨 아래에 접어 둔다.
 * conflict가 false면(우유와 상관없는 재료 페이지) 우유 O·X 중복 해석을 뺀다.
 */
export function PairingSource({ conflict = true }: { conflict?: boolean }) {
  return (
    <details className="pairing-source pairing-source-details">
      <summary>출처</summary>
      <p>{INFANT_PAIRING_COPY.source}</p>
      <p>{INFANT_PAIRING_COPY.limit}</p>
      {conflict && <p>{INFANT_PAIRING_COPY.conflict}</p>}
      <h3 className="mt-2 font-semibold text-ink">참고 자료</h3>
      <ul className="grid gap-1 text-sm">
        {Object.values(PAIRING_REFERENCES).map(({ title, href }) => (
          <li key={href}>
            <a href={href} className="underline underline-offset-4">
              {title}
            </a>
          </li>
        ))}
      </ul>
    </details>
  )
}
