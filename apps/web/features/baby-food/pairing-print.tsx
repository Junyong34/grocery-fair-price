import { INFANT_PAIRING_COPY } from "@workspace/seasonal/data/copy"

import { PAIRING_REFERENCES } from "./data"
import { PairingGrid } from "./pairing-grid"
import { PAIRING_PRINT_SHEETS } from "./print-layout"

import "./pairing-print.css"

export function PairingPrint() {
  return (
    <div className="pairing-print-document">
      {PAIRING_PRINT_SHEETS.map((columns, index) => (
        <section
          key={index}
          className="print-sheet pairing-paper"
          data-paper="A4"
          data-orientation="portrait"
        >
          <header className="pairing-paper-head">
            <p className="pairing-paper-brand">장볼날 · 이유식 재료 노트</p>
            <h2 className="font-heading">이유식 재료 궁합표</h2>
            <p>
              {index + 1}장 · 기준 재료 {columns.flat().length}개
            </p>
          </header>
          <div className="pairing-paper-columns">
            {columns.map((rows, column) => (
              <PairingGrid key={column} rows={rows} printable />
            ))}
          </div>
          <footer className="pairing-paper-foot">
            <p>{INFANT_PAIRING_COPY.source}</p>
            <p>{INFANT_PAIRING_COPY.limit}</p>
            {columns.some((rows) =>
              rows.some(({ name }) => name === "우유")
            ) && (
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
              {index + 1} / {PAIRING_PRINT_SHEETS.length}
            </p>
          </footer>
        </section>
      ))}
    </div>
  )
}
