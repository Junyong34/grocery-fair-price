"use client"

import { useState, useTransition } from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"

import { CATEGORIES, FIELD, lines, MonthPicker } from "../components/month-picker"
import { INFANT_KIND_LABEL, type ArtRow } from "../lib/art-view"
import { addSeasonalFood, linkFoodArt, setInfantUse, type UseResult } from "../server/use-actions"

export type UseOptions = {
  /** 그림을 연결할 수 있는 기존 품종. */
  foods: readonly { id: string; name: string }[]
  /** 그림을 연결할 수 있는 이유식 항목. */
  infantKeys: { fruits: readonly string[]; pairings: readonly string[] }
}


// 그림의 용도: 이 그림을 가리키는 화면 데이터와, 제철 · 이유식 용도를 새로 정하는 폼.
// 저장은 품종 원본과 이유식 그림 목록 파일만 고친다. 화면에 나오려면 "웹에 반영"을 누른다.
export function ArtUses({ art, foods, infantKeys }: { art: ArtRow } & UseOptions) {
  const [pending, start] = useTransition()
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null)
  const [form, setForm] = useState<"new" | "link" | "infant" | null>(null)
  const run = (action: () => Promise<UseResult>) =>
    start(async () => {
      const result = await action()
      setMessage(result.ok ? { tone: "ok", text: result.message } : { tone: "error", text: result.error })
      if (result.ok) setForm(null)
    })

  return (
    <section className="flex flex-col gap-3 text-sm">
      <h3 className="font-semibold">가리키는 화면</h3>
      {art.uses.seasonal.length === 0 && art.uses.infant.length === 0 && <p className="text-stone">아직 어느 화면도 쓰지 않아요. 검수를 마쳐도 웹에는 나가지 않아요.</p>}
      {art.uses.seasonal.map((food) => (
        <p key={food.id}>
          {food.verified ? "제철달력" : "제철 미검증(달력에 안 나옴)"} · {food.name} <code className="text-stone">{food.id}</code>
        </p>
      ))}
      {art.uses.infant.map((use) => (
        <p key={`${use.kind}:${use.key}`} className="flex items-center justify-between gap-2">
          <span>
            이유식 {INFANT_KIND_LABEL[use.kind]} · {use.key}
          </span>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setInfantUse(use.kind, use.key, null))}>
            끊기
          </Button>
        </p>
      ))}

      <div role="group" aria-label="용도 지정" className="flex flex-wrap gap-1.5">
        {(
          [
            ["new", "제철: 새 품종"],
            ["link", "제철: 기존 품종에 연결"],
            ["infant", "이유식"],
          ] as const
        ).map(([value, label]) => (
          <Button key={value} size="sm" variant={form === value ? "default" : "outline"} aria-pressed={form === value} onClick={() => setForm(form === value ? null : value)}>
            {label}
          </Button>
        ))}
      </div>

      {form === "new" && <NewFoodForm art={art} disabled={pending} onSave={(input) => run(() => addSeasonalFood(input))} />}
      {form === "link" && <LinkForm foods={foods} disabled={pending} onSave={(foodId) => run(() => linkFoodArt(foodId, art.id))} />}
      {form === "infant" && <InfantForm infantKeys={infantKeys} disabled={pending} onSave={(kind, key) => run(() => setInfantUse(kind, key, art.id))} />}

      <p role="status" aria-live="polite" className={message?.tone === "error" ? "text-error" : "text-stone"}>
        {message?.text}
      </p>
    </section>
  )
}

function NewFoodForm({ art, disabled, onSave }: { art: ArtRow; disabled: boolean; onSave: (input: Parameters<typeof addSeasonalFood>[0]) => void }) {
  const [foodId, setFoodId] = useState(art.id)
  const [name, setName] = useState(art.name)
  const [aliases, setAliases] = useState("")
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("채소")
  const [months, setMonths] = useState<number[]>([])
  const [peak, setPeak] = useState<number[]>([])
  const [sources, setSources] = useState("")
  const [checkedAt, setCheckedAt] = useState("")
  const verified = lines(sources).length > 0 && checkedAt !== ""

  return (
    <form
      className="grid gap-3 rounded-xl bg-canvas p-3"
      onSubmit={(event) => {
        event.preventDefault()
        onSave({ foodId, artId: art.id, name, aliases: lines(aliases), category, months, peak: peak.filter((month) => months.includes(month)), sources: lines(sources), checkedAt })
      }}
    >
      <label className={FIELD}>
        <span className="text-stone">품종 ID (영문, 만든 뒤 바꿀 수 없어요)</span>
        <Input value={foodId} onChange={(event) => setFoodId(event.target.value)} autoComplete="off" required />
      </label>
      <label className={FIELD}>
        <span className="text-stone">표시명</span>
        <Input value={name} onChange={(event) => setName(event.target.value)} autoComplete="off" required />
      </label>
      <label className={FIELD}>
        <span className="text-stone">별칭 (쉼표로 구분, 검색에 써요)</span>
        <Input value={aliases} onChange={(event) => setAliases(event.target.value)} autoComplete="off" />
      </label>
      <label className={FIELD}>
        <span className="text-stone">카테고리</span>
        <NativeSelect value={category} onChange={(event) => setCategory(event.target.value as (typeof CATEGORIES)[number])}>
          {CATEGORIES.map((item) => (
            <NativeSelectOption key={item} value={item}>
              {item}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </label>
      <MonthPicker label="제철 달" value={months} onChange={setMonths} />
      <MonthPicker label="대표 달 (비우면 제철 달 전체)" value={peak.filter((month) => months.includes(month))} allowed={months} onChange={setPeak} />
      <label className={FIELD}>
        <span className="text-stone">근거 출처 (한 줄에 하나. URL이나 자료명)</span>
        <textarea value={sources} onChange={(event) => setSources(event.target.value)} rows={2} className="rounded-lg bg-surface p-2 text-sm shadow-[inset_0_0_0_1px_var(--color-hairline)]" />
      </label>
      <label className={FIELD}>
        <span className="text-stone">확인일</span>
        <Input type="date" value={checkedAt} onChange={(event) => setCheckedAt(event.target.value)} />
      </label>
      <p className={verified ? "text-xs text-stone" : "rounded-lg bg-gold-wash px-3 py-2 text-xs text-espresso"}>
        {verified ? "근거가 있어 제철 검증된 품종으로 저장해요. 웹에 반영하면 제철달력에 나와요." : "근거 출처와 확인일이 비어 있어 제철 미검증으로 저장해요. 제철달력에는 나오지 않아요."}
      </p>
      <Button type="submit" disabled={disabled}>
        {verified ? "제철 품종으로 저장" : "제철 미검증으로 저장"}
      </Button>
    </form>
  )
}

function LinkForm({ foods, disabled, onSave }: { foods: UseOptions["foods"]; disabled: boolean; onSave: (foodId: string) => void }) {
  const [foodId, setFoodId] = useState("")
  return (
    <form
      className="grid gap-3 rounded-xl bg-canvas p-3"
      onSubmit={(event) => {
        event.preventDefault()
        onSave(foodId)
      }}
    >
      <label className={FIELD}>
        <span className="text-stone">이 그림을 쓸 품종 (품종 ID는 그대로예요)</span>
        <NativeSelect value={foodId} onChange={(event) => setFoodId(event.target.value)} required>
          <NativeSelectOption value="">품종 고르기</NativeSelectOption>
          {foods.map((food) => (
            <NativeSelectOption key={food.id} value={food.id}>
              {food.name} ({food.id})
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </label>
      <Button type="submit" disabled={disabled || !foodId}>
        이 품종에 연결
      </Button>
    </form>
  )
}

function InfantForm({ infantKeys, disabled, onSave }: { infantKeys: UseOptions["infantKeys"]; disabled: boolean; onSave: (kind: "fruits" | "pairings", key: string) => void }) {
  const [kind, setKind] = useState<"fruits" | "pairings">("pairings")
  const [key, setKey] = useState("")
  return (
    <form
      className="grid gap-3 rounded-xl bg-canvas p-3"
      onSubmit={(event) => {
        event.preventDefault()
        onSave(kind, key)
      }}
    >
      <label className={FIELD}>
        <span className="text-stone">화면</span>
        <NativeSelect
          value={kind}
          onChange={(event) => {
            setKind(event.target.value as "fruits" | "pairings")
            setKey("")
          }}
        >
          <NativeSelectOption value="pairings">궁합표의 재료</NativeSelectOption>
          <NativeSelectOption value="fruits">과일 도감의 과일 · 주의 식재료</NativeSelectOption>
        </NativeSelect>
      </label>
      <label className={FIELD}>
        <span className="text-stone">{kind === "pairings" ? "재료 이름" : "과일 id 또는 주의 식재료 id"}</span>
        <NativeSelect value={key} onChange={(event) => setKey(event.target.value)} required>
          <NativeSelectOption value="">항목 고르기</NativeSelectOption>
          {infantKeys[kind].map((item) => (
            <NativeSelectOption key={item} value={item}>
              {item}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </label>
      <p className="text-xs text-stone">그림만 연결해요. 궁합과 월령 본문은 이유식 데이터 파일에서 고쳐요. 이미 그림이 있는 항목을 고르면 이 그림으로 바뀌어요.</p>
      <Button type="submit" disabled={disabled || !key}>
        이유식에 연결
      </Button>
    </form>
  )
}
