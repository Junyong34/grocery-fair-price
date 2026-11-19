import { PRICE_COPY } from "@workspace/price/copy"
import { monthDay, won } from "@workspace/price/format"

import type { VarietySpecQuote } from "../data/price-source"

import { P3_SECTIONS } from "./section-ids"

const COPY = PRICE_COPY.detail.specQuotes
const SOURCE_NAMES: Record<string, string> = { kamis: "KAMIS", ekape: "축평원" }

export function SpecQuotesSection({ quotes, unit }: { quotes: readonly VarietySpecQuote[]; unit: string }) {
  return (
    <section id={P3_SECTIONS.specs} aria-labelledby="spec-quotes-title" className="flex scroll-mt-28 flex-col gap-3">
      <h2 id="spec-quotes-title" className="text-[17px] font-semibold text-ink">{COPY.title}</h2>
      <div className="rounded-2xl bg-mat px-3.5">
        <table aria-label={COPY.title} className="w-full text-sm">
          <thead className="border-b border-hairline text-xs text-caption">
            <tr>
              <th scope="col" className="py-2.5 pr-2 text-left font-medium">{COPY.spec}</th>
              <th scope="col" className="py-2.5 text-right font-medium">{COPY.price(unit)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {quotes.map((quote) => (
              <tr key={quote.slug}>
                <th scope="row" className="py-2.5 pr-2 text-left font-semibold text-ink">{quote.name}</th>
                <td className="py-2.5 text-right">
                  {quote.price == null ? (
                    <span className="block text-sm text-stone">{COPY.unitPending}</span>
                  ) : (
                    <span className="block font-semibold text-ink tabular-nums">{won(quote.price)}원</span>
                  )}
                  <span className="block text-xs text-caption">
                    <time dateTime={quote.surveyedOn}>{monthDay(quote.surveyedOn)}</time>
                    {" · "}{quote.sources.map((source) => SOURCE_NAMES[source] ?? source).join(" · ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
