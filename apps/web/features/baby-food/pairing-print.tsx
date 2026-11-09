import { INFANT_PAIRING_COPY } from "@workspace/seasonal/data/copy"

import { PAIRING_REFERENCES, PAIRING_SHEETS } from "./data"
import { PairingGrid } from "./pairing-grid"

import "./pairing-print.css"

export function PairingPrint() {
  return (
    <div className="pairing-print-document">
      {PAIRING_SHEETS.map(({ title, rows }, index) => (
        <section
          key={title}
          className="print-sheet pairing-paper"
          data-paper="A4"
          data-orientation="portrait"
        >
          <header className="pairing-paper-head">
            <p className="pairing-paper-brand">장볼날 · 이유식 재료 노트</p>
            <h2 className="font-heading">이유식 재료 궁합표</h2>
            <p>
              {title} · 기준 재료 {rows.length}개
            </p>
          </header>
          <PairingGrid rows={rows} printable />
          <footer className="pairing-paper-foot">
            <p>{INFANT_PAIRING_COPY.source}</p>
            <p>{INFANT_PAIRING_COPY.limit}</p>
            {index === PAIRING_SHEETS.length - 1 && (
              <>
                <p>{INFANT_PAIRING_COPY.conflict}</p>
                <p>
                  근거 ·{" "}
                  {Object.values(PAIRING_REFERENCES).map(
                    ({ title: label, href }) => (
                      <a key={href} href={href}>
                        {label}
                      </a>
                    )
                  )}{" "}
                  · 검토일 2026.11.07
                </p>
              </>
            )}
            <p className="pairing-paper-number">
              {index + 1} / {PAIRING_SHEETS.length}
            </p>
          </footer>
        </section>
      ))}
    </div>
  )
}
