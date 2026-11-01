import { SOURCES_COPY } from "./copy"

/** 데이터 출처(/settings/sources): 출처마다 무엇을 언제 조사하는지 한 줄씩. */
export function SourcesView() {
  return (
    <div className="mx-auto flex max-w-[680px] flex-col gap-6 px-[18px] pt-4 pb-12 lg:px-6 lg:pt-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold text-ink">{SOURCES_COPY.title}</h1>
        <p className="text-[15px] leading-relaxed text-ink">{SOURCES_COPY.intro}</p>
      </header>
      <ul className="flex flex-col divide-y divide-hairline">
        {SOURCES_COPY.sources.map((source) => (
          <li key={source.name} className="flex flex-col gap-1 py-3">
            <span className="text-[15px] font-semibold text-ink">{source.name}</span>
            <span className="text-[13px] text-stone">{source.by}</span>
            <span className="text-sm text-ink">
              {source.what} · {source.when}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
