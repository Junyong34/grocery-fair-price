import { INFANT_PAIRING_COPY } from "@workspace/seasonal/data/copy"

import { PAIRING_REFERENCES } from "./data"
import { PairingEvidence } from "./pairing-evidence"

/** 자료와 해석. 전체표와 재료별 페이지가 같은 문구를 쓴다. */
export function PairingSource() {
  return (
    <section className="pairing-source">
      <h2 className="font-heading text-xl">자료와 해석</h2>
      <p>{INFANT_PAIRING_COPY.source}</p>
      <p>{INFANT_PAIRING_COPY.limit}</p>
      <p>{INFANT_PAIRING_COPY.conflict}</p>
      <div className="pairing-controls">
        <PairingEvidence base="우유" name="고구마" sign="O">
          우유 + 고구마 근거 ↗
        </PairingEvidence>
        <PairingEvidence base="우유" name="시금치" sign="O">
          우유 + 시금치 근거 ↗
        </PairingEvidence>
      </div>
      <ul className="grid gap-1 text-sm">
        {Object.values(PAIRING_REFERENCES).map(({ title, href }) => (
          <li key={href}>
            <a href={href} className="underline underline-offset-4">
              {title}
            </a>
          </li>
        ))}
      </ul>
      <p className="text-sm text-caption">우유 조합 검토일 2026.11.07</p>
    </section>
  )
}
