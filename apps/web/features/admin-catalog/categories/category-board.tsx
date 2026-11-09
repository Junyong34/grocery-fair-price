"use client"

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import { CATEGORY_NAME_MAX } from "../lib/category"
import type { CategoryRow } from "../server/categories"
import {
  createCategory,
  deleteCategory,
  moveCategory,
  renameCategory,
  renumberCategories,
  type CategoryResult,
} from "../server/category-actions"

// 아이콘 버튼: 44px 누르는 영역. cojeev 비활성 스타일은 배경을 채워 오히려 눈에 띄어, 비활성이면 배경 없이 흐리게 둔다
const ICON_BUTTON = "size-11 px-0 disabled:bg-transparent! disabled:opacity-30! disabled:shadow-none!"

type Props = { rows: readonly CategoryRow[]; dbLabel: "로컬 DB" | "운영 DB" | "설정 없음" }

export function CategoryBoard({ rows, dbLabel }: Props) {
  const [pending, start] = useTransition()
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null)
  const run = (action: () => Promise<CategoryResult>, done: string) =>
    start(async () => {
      const result = await action()
      setMessage(result.ok ? { tone: "ok", text: done } : { tone: "error", text: result.error })
    })
  const needsRenumber = rows.some((r, i) => r.sort !== i + 1)

  return (
    <section className="flex flex-col gap-6">
      <p
        className={
          dbLabel === "운영 DB"
            ? "rounded-xl bg-gold-wash px-4 py-3 text-sm font-semibold text-espresso"
            : "rounded-xl bg-mat px-4 py-3 text-sm text-stone"
        }
      >
        지금 고치는 곳: {dbLabel}
        {dbLabel === "운영 DB" ? " — 저장하면 바로 운영 카탈로그가 바뀌어요." : ""}
      </p>

      <NewCategory disabled={pending} onCreate={(input) => run(() => createCategory(input), `‘${input.name}’를 추가했어요.`)} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone">카테고리 {rows.length}개</p>
        <Button
          variant="outline"
          size="sm"
          disabled={pending || !needsRenumber}
          onClick={() => run(renumberCategories, "순서를 1부터 다시 매겼어요.")}
        >
          순서 보정
        </Button>
      </div>

      <ol className="flex flex-col divide-y divide-hairline overflow-hidden rounded-2xl bg-surface shadow-[inset_0_0_0_1px_var(--color-hairline)]">
        {rows.map((row, i) => (
          <CategoryItem
            key={`${row.id}:${row.name}`}
            row={row}
            first={i === 0}
            last={i === rows.length - 1}
            disabled={pending}
            onRename={(name) => run(() => renameCategory(row.id, name), "이름을 고쳤어요.")}
            onMove={(direction) => run(() => moveCategory(row.id, direction), "순서를 바꿨어요.")}
            onDelete={() => {
              if (window.confirm(`‘${row.name}’ 카테고리를 지울까요? 되돌릴 수 없어요.`)) run(() => deleteCategory(row.id), `‘${row.name}’를 지웠어요.`)
            }}
          />
        ))}
      </ol>

      <p role="status" aria-live="polite" className={message?.tone === "error" ? "text-sm text-error" : "text-sm text-stone"}>
        {message?.text}
      </p>
    </section>
  )
}

function NewCategory({ disabled, onCreate }: { disabled: boolean; onCreate: (input: { slug: string; name: string }) => void }) {
  const [slug, setSlug] = useState("")
  const [name, setName] = useState("")
  return (
    <form
      className="grid gap-3 rounded-2xl bg-surface p-4 shadow-[inset_0_0_0_1px_var(--color-hairline)] sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      onSubmit={(event) => {
        event.preventDefault()
        onCreate({ slug, name })
        setSlug("")
        setName("")
      }}
    >
      <label className="grid gap-1.5 text-sm">
        <span className="text-stone">slug (영문, 바꿀 수 없어요)</span>
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ramen-noodle" autoComplete="off" required />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="text-stone">이름</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="라면·면" maxLength={CATEGORY_NAME_MAX} autoComplete="off" required />
      </label>
      <Button type="submit" disabled={disabled}>
        추가
      </Button>
    </form>
  )
}

type ItemProps = {
  row: CategoryRow
  first: boolean
  last: boolean
  disabled: boolean
  onRename: (name: string) => void
  onMove: (direction: "up" | "down") => void
  onDelete: () => void
}

function CategoryItem({ row, first, last, disabled, onRename, onMove, onDelete }: ItemProps) {
  const [name, setName] = useState(row.name)
  const changed = name.trim() !== row.name
  return (
    <li className="grid gap-3 p-4 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center">
      <span className="font-number text-xl text-stone tabular-nums" title="순서(sort)">
        {row.sort ?? "–"}
      </span>
      <form
        className="flex min-w-0 flex-col gap-1.5"
        onSubmit={(event) => {
          event.preventDefault()
          if (changed) onRename(name)
        }}
      >
        <div className="flex gap-2">
          <Input aria-label={`${row.slug} 이름`} value={name} onChange={(e) => setName(e.target.value)} maxLength={CATEGORY_NAME_MAX} className="min-w-0 flex-1" />
          {changed && (
            <Button type="submit" size="sm" disabled={disabled}>
              저장
            </Button>
          )}
        </div>
        <span className="text-xs text-stone">
          {row.slug} · 품목 {row.items} · 품종 {row.varieties}
        </span>
      </form>
      <div className="flex items-center gap-1 justify-self-end">
        <Button variant="ghost" size="sm" className={ICON_BUTTON} aria-label="위로" disabled={disabled || first} onClick={() => onMove("up")}>
          <ArrowUp aria-hidden className="size-4" />
        </Button>
        <Button variant="ghost" size="sm" className={ICON_BUTTON} aria-label="아래로" disabled={disabled || last} onClick={() => onMove("down")}>
          <ArrowDown aria-hidden className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={ICON_BUTTON}
          aria-label={row.items > 0 ? "품목이 있어 지울 수 없어요" : "지우기"}
          title={row.items > 0 ? "품목이 있어 지울 수 없어요" : "지우기"}
          disabled={disabled || row.items > 0}
          onClick={onDelete}
        >
          <Trash2 aria-hidden className="size-4" />
        </Button>
      </div>
    </li>
  )
}
