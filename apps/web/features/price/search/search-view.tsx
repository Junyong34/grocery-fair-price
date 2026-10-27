"use client"

import { Search } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"

import { InputAffix, InputClear, InputControl, InputWrapper } from "@workspace/ui/components/input"

import { PRICE_COPY } from "@workspace/price/copy"
import { pickByIds } from "@workspace/price/list"
import { matchRange, searchVarieties, type SearchResult } from "@workspace/price/search"
import type { SearchIndex, VarietySummary } from "@workspace/price/types"

import { routes } from "@/shared/routes"

import { AddButton } from "../components/add-button"
import { useRecentVarieties } from "../components/recent-varieties"
import { PriceHint, VarietyRow } from "../components/variety-row"

/**
 * P2 품종 검색. 치는 동안 결과가 바뀐다. 검색어는 주소 ?q=에 맞추되 기록을 쌓지 않아(replaceState) 뒤로 가기 한 번이면 메인이다.
 * 검색은 서버가 내려 준 searchIndex로 브라우저에서 한다.
 */
export function SearchView({
  varieties,
  featuredIds,
  index,
}: {
  varieties: readonly VarietySummary[]
  featuredIds: readonly string[]
  index: SearchIndex
}) {
  const router = useRouter()
  const initial = useSearchParams().get("q") ?? ""
  const [query, setQuery] = useState(initial)
  const result = useMemo(() => searchVarieties(index, query), [index, query])

  const change = (next: string) => {
    setQuery(next)
    window.history.replaceState(null, "", routes.price.searchFor(next.trim()))
  }
  const cancel = () => {
    // 메인에서 왔으면 뒤로, 주소로 바로 들어왔으면 메인으로
    if (window.history.length > 1) router.back()
    else router.push(routes.home)
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4 px-[18px] pt-3 lg:pt-8">
      <form role="search" onSubmit={(event) => event.preventDefault()} className="flex items-center gap-3">
        <InputWrapper as="label" variant="cream" className="flex-1">
          <InputAffix>
            <Search aria-hidden size={18} />
          </InputAffix>
          <InputControl
            type="search"
            enterKeyHint="search"
            autoFocus
            autoComplete="off"
            aria-label={PRICE_COPY.search.label}
            placeholder={PRICE_COPY.search.placeholder}
            value={query}
            onChange={(event) => change(event.target.value)}
            className="text-base [&::-webkit-search-cancel-button]:hidden"
          />
          {query && <InputClear aria-label="검색어 지우기" onClear={() => change("")} />}
        </InputWrapper>
        <button type="button" onClick={cancel} className="shrink-0 text-[15px] text-stone hover:text-ink">
          {PRICE_COPY.search.cancel}
        </button>
      </form>
      <div aria-live="polite">
        <Results result={result} query={query} varieties={varieties} featuredIds={featuredIds} index={index} onQuery={change} />
      </div>
    </div>
  )
}

function Results({
  result,
  query,
  varieties,
  featuredIds,
  index,
  onQuery,
}: {
  result: SearchResult
  query: string
  varieties: readonly VarietySummary[]
  featuredIds: readonly string[]
  index: SearchIndex
  onQuery: (query: string) => void
}) {
  const recent = useRecentVarieties(varieties)
  const featured = pickByIds(varieties, featuredIds)
  const rows = (ids: readonly string[], highlight = false) => (
    <ul>
      {pickByIds(varieties, ids).map((variety) => (
        <VarietyRow
          key={variety.id}
          variety={variety}
          name={highlight ? <Highlighted name={variety.name} query={query} /> : undefined}
          action={<AddButton variety={variety} />}
        />
      ))}
    </ul>
  )

  switch (result.kind) {
    case "empty":
      return (
        <div className="flex flex-col gap-6">
          {recent.length > 0 && (
            <Group title={PRICE_COPY.home.recent}>
              <ul>
                {recent.map((variety) => (
                  <VarietyRow key={variety.id} variety={variety} action={<AddButton variety={variety} />} />
                ))}
              </ul>
            </Group>
          )}
          <Group title={PRICE_COPY.home.featured}>
            <Pills labels={featured.map((variety) => ({ key: variety.id, label: variety.name, href: routes.price.variety(variety.id) }))} />
          </Group>
        </div>
      )
    case "hits":
      return (
        <div className="flex flex-col gap-2">
          <PriceHint />
          {rows(result.ids, true)}
        </div>
      )
    case "item":
      return <Group title={PRICE_COPY.search.item(result.item)}>{rows(result.ids)}</Group>
    case "alias":
      return <Group title={PRICE_COPY.search.alias(query.trim())}>{rows(result.ids)}</Group>
    case "typo":
      return <Group title={PRICE_COPY.search.typo(query.trim())}>{rows(result.ids)}</Group>
    case "category":
      return <Group title={PRICE_COPY.search.category(result.category)}>{rows(result.ids)}</Group>
    case "none":
      return (
        <div className="flex flex-col gap-7">
          <div className="flex flex-col items-center gap-3 pt-8 text-center">
            <span aria-hidden className="grid size-14 place-items-center rounded-full bg-verdict-none-wash text-stone">
              <Search size={22} />
            </span>
            <p className="text-base font-semibold text-ink">{PRICE_COPY.search.noResult(query.trim())}</p>
          </div>
          <Group title={PRICE_COPY.search.tipsTitle}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-2xl bg-surface px-4 py-3 text-sm">
              {PRICE_COPY.search.tips.map(({ how, example }) => (
                <div key={how} className="contents">
                  <dt className="text-caption">{how}</dt>
                  <dd className="font-medium text-ink">{example}</dd>
                </div>
              ))}
            </dl>
          </Group>
          <Group title={PRICE_COPY.search.browse}>
            <Pills labels={index.categories.map((category) => ({ key: category, label: category, onClick: () => onQuery(category) }))} />
          </Group>
          <Group title={PRICE_COPY.home.featured}>
            <ul>
              {featured.slice(0, 3).map((variety) => (
                <VarietyRow key={variety.id} variety={variety} action={<AddButton variety={variety} />} />
              ))}
            </ul>
          </Group>
        </div>
      )
  }
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[13px] font-semibold text-stone">{title}</h2>
      {children}
    </section>
  )
}

type Pill = { key: string; label: string } & ({ href: string } | { onClick: () => void })

function Pills({ labels }: { labels: readonly Pill[] }) {
  const className =
    "inline-flex h-9 items-center rounded-full border border-hairline bg-surface px-3.5 text-sm text-ink no-underline hover:border-stone"
  return (
    <ul className="flex flex-wrap gap-2">
      {labels.map((pill) => (
        <li key={pill.key}>
          {"href" in pill ? (
            <Link href={pill.href} className={className}>
              {pill.label}
            </Link>
          ) : (
            <button type="button" onClick={pill.onClick} className={className}>
              {pill.label}
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

/** 이름에서 검색어가 맞은 글자를 강조한다. */
function Highlighted({ name, query }: { name: string; query: string }) {
  const range = matchRange(name, query)
  if (!range) return name
  const chars = [...name]
  return (
    <>
      {chars.slice(0, range[0]).join("")}
      <mark className="rounded-sm bg-gold-wash text-ink">{chars.slice(range[0], range[1]).join("")}</mark>
      {chars.slice(range[1]).join("")}
    </>
  )
}
