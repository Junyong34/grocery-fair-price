"use client"

import { Search } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"

import {
  InputAffix,
  InputClear,
  InputControl,
  InputWrapper,
} from "@workspace/ui/components/input"

import { PRICE_COPY } from "@workspace/price/copy"
import { pickByIds } from "@workspace/price/list"
import {
  matchRange,
  searchVarieties,
  type SearchResult,
} from "@workspace/price/search"
import type { SearchIndex, VarietySummary } from "@workspace/price/types"

import { routes } from "@/shared/routes"
import { BackButton } from "@/shared/shell/sub-header"

import { AddButton } from "../components/add-button"
import { useRecentVarieties } from "../components/recent-varieties"
import { PriceHint, VarietyRow } from "../components/variety-row"

type SearchViewProps = {
  varieties: readonly VarietySummary[]
  featuredIds: readonly string[]
  index: SearchIndex
}

/**
 * P2 품종 검색 화면. Cache Components는 떠난 화면을 <Activity>로 숨겨 두어 검색어가 남는다.
 * 새로 들어올 때(🔍 · 검색창 · 링크, push/replace)는 bfcacheId가 바뀌어 다시 그려 주소 ?q=(없으면 빈 칸)로 시작하고 자동 포커스도 다시 잡는다.
 * 뒤로 · 앞으로 가기로 돌아오면 bfcacheId가 같아 치던 검색어와 결과를 그대로 둔다(품종 상세 ‹ 뒤 다른 결과 보기).
 * 화면이 숨을 때 지우는 방식(useLayoutEffect 정리)은 뒤로 가기에서도 지워져 쓰지 않는다.
 */
export function SearchView(props: SearchViewProps) {
  const { bfcacheId } = useRouter()
  return <SearchScreen key={bfcacheId} {...props} />
}

/**
 * P2 품종 검색. 치는 동안 결과가 바뀐다. 검색어는 주소 ?q=에 맞추되 기록을 쌓지 않아(replaceState) 뒤로 가기 한 번이면 진입했던 화면이다.
 * 검색은 서버가 내려 준 searchIndex로 브라우저에서 한다.
 */
function SearchScreen({ varieties, featuredIds, index }: SearchViewProps) {
  const initial = useSearchParams().get("q") ?? ""
  const [query, setQuery] = useState(initial)
  const result = useMemo(() => searchVarieties(index, query), [index, query])

  const change = (next: string) => {
    setQuery(next)
    window.history.replaceState(null, "", routes.price.searchFor(next.trim()))
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-4 px-[18px] lg:pt-7">
      {/* 모바일은 사이트 헤더 대신 이 검색 줄이 맨 위에 붙는다(검색 헤더, .scratch/shell-unify/spec.md 3장).
          ‹는 하위 헤더(P3 등)와 같은 자리에 둔다: 모바일은 줄 높이 56 · 버튼 40 · 입력창 44(위아래 6px 여유), 데스크톱은 -ml-2로 꺾쇠를 본문 왼쪽 끝에 맞추고 pt-7로 세로 중심을 P3 제목 줄과 맞춘다. */}
      <form
        role="search"
        onSubmit={(event) => event.preventDefault()}
        className="flex items-center gap-3 max-lg:sticky max-lg:top-0 max-lg:z-(--z-dock) max-lg:-mx-[18px] max-lg:bg-canvas/94 max-lg:h-14 max-lg:px-[18px] max-lg:backdrop-blur-md"
      >
        <BackButton
          fallbackHref={routes.home}
          className="-ml-[3px] lg:-ml-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
        {/* 입력창의 모든 상태에서 같은 밝은 크림을 쓰고, focus의 금색 테두리는 기존 UI 표현을 유지한다. */}
        <InputWrapper as="label" variant="cream" className="min-w-0 flex-1 bg-pair-light text-pair-light-foreground [--input:var(--color-pair-light)] [--v-canvas:var(--color-pair-light)] max-lg:h-11">
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
          {query && (
            <InputClear aria-label="검색어 지우기" onClear={() => change("")} />
          )}
        </InputWrapper>
      </form>
      <div aria-live="polite">
        <Results
          result={result}
          query={query}
          varieties={varieties}
          featuredIds={featuredIds}
          index={index}
          onQuery={change}
        />
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
          name={
            highlight ? (
              <Highlighted name={variety.name} query={query} />
            ) : undefined
          }
          action={<AddButton variety={variety} />}
        />
      ))}
    </ul>
  )

  // 카테고리에서 둘러보기: 누르면 그 카테고리 이름으로 검색한다. 빈 검색(최근 본 품종 아래)과 결과 없음에서 쓴다.
  const browse = (
    <Group title={PRICE_COPY.search.browse}>
      <Pills
        labels={index.categories.map((category) => ({
          key: category,
          label: category,
          onClick: () => onQuery(category),
        }))}
      />
    </Group>
  )

  switch (result.kind) {
    case "empty":
      return (
        <div className="flex flex-col gap-6">
          {recent.length > 0 && (
            <Group title={PRICE_COPY.home.recent}>
              <ul>
                {recent.map((variety) => (
                  <VarietyRow
                    key={variety.id}
                    variety={variety}
                    action={<AddButton variety={variety} />}
                  />
                ))}
              </ul>
            </Group>
          )}
          {browse}
          <Group title={PRICE_COPY.home.featured}>
            <Pills
              labels={featured.map((variety) => ({
                key: variety.id,
                label: variety.name,
                href: routes.price.variety(variety.id),
              }))}
            />
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
      return (
        <Group title={PRICE_COPY.search.item(result.item)}>
          {rows(result.ids)}
        </Group>
      )
    case "alias":
      return (
        <Group title={PRICE_COPY.search.alias(query.trim())}>
          {rows(result.ids)}
        </Group>
      )
    case "typo":
      return (
        <Group title={PRICE_COPY.search.typo(query.trim())}>
          {rows(result.ids)}
        </Group>
      )
    case "category":
      return (
        <Group title={PRICE_COPY.search.category(result.category)}>
          {rows(result.ids)}
        </Group>
      )
    case "none":
      return (
        <div className="flex flex-col gap-6">
          {/* 큰 아이콘 · 가운데 정렬 대신 두 줄 안내로 줄여 아래 찾는 법 · 카테고리가 첫 화면에 들어오게 한다. */}
          <div className="flex flex-col gap-1 pt-2">
            <p className="text-base font-semibold text-ink">
              {PRICE_COPY.search.noResult(query.trim())}
            </p>
            <p className="text-sm text-caption">
              {PRICE_COPY.search.noResultHint}
            </p>
          </div>
          <Group title={PRICE_COPY.search.tipsTitle}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-2xl bg-pair-light px-4 py-2.5 text-sm text-pair-light-foreground">
              {PRICE_COPY.search.tips.map(({ how, example }) => (
                <div key={how} className="contents">
                  <dt className="text-caption">{how}</dt>
                  <dd className="font-medium">{example}</dd>
                </div>
              ))}
            </dl>
          </Group>
          {browse}
          <Group title={PRICE_COPY.home.featured}>
            <ul>
              {featured.slice(0, 3).map((variety) => (
                <VarietyRow
                  key={variety.id}
                  variety={variety}
                  action={<AddButton variety={variety} />}
                />
              ))}
            </ul>
          </Group>
        </div>
      )
  }
}

function Group({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[13px] font-semibold text-stone">{title}</h2>
      {children}
    </section>
  )
}

type Pill = { key: string; label: string } & (
  { href: string } | { onClick: () => void }
)

function Pills({ labels }: { labels: readonly Pill[] }) {
  const pillClassName =
    "inline-flex h-9 items-center rounded-full border border-hairline bg-pair-light px-3.5 text-sm text-pair-light-foreground no-underline hover:border-stone"
  return (
    <ul className="flex flex-wrap gap-2">
      {labels.map((pill) => (
        <li key={pill.key}>
          {"href" in pill ? (
            <Link href={pill.href} className={pillClassName}>
              {pill.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={pill.onClick}
              className={pillClassName}
            >
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
      <mark className="rounded-sm bg-gold-wash text-ink">
        {chars.slice(range[0], range[1]).join("")}
      </mark>
      {chars.slice(range[1]).join("")}
    </>
  )
}
