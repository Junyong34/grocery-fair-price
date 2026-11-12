"use client"

import { useState, useTransition } from "react"

import { Button } from "@workspace/ui/components/button"

import { publishFoods, type PublishResult } from "../server/use-actions"

export const CARD = "rounded-2xl bg-surface shadow-[inset_0_0_0_1px_var(--color-hairline)]"

// 웹에 반영: pnpm foods:sync와 같은 검사와 생성. 문제가 있으면 아무것도 바뀌지 않고 고칠 항목이 나온다.
export function Publish() {
  const [pending, start] = useTransition()
  const [result, setResult] = useState<PublishResult | null>(null)
  return (
    <div className={`${CARD} flex flex-col gap-3 p-4`}>
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={pending} onClick={() => start(async () => setResult(await publishFoods()))}>
          {pending ? "반영하는 중…" : "웹에 반영"}
        </Button>
        <p className="text-sm text-stone">검수를 마쳤고 용도가 정해진 그림과 품종 목록을 웹 파일로 만들어요. 커밋은 하지 않아요.</p>
      </div>
      {result && (
        <div role="status" aria-live="polite" className="flex flex-col gap-2 text-sm">
          {result.problems.length > 0 ? (
            <>
              <p className="font-semibold text-error">고칠 것 {result.problems.length}건. 웹 파일은 그대로 두었어요.</p>
              <ul className="list-disc pl-5 text-error">
                {result.problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="font-semibold">{result.changed.length ? `반영했어요. 바뀐 것: ${result.changed.join(", ")}` : "반영할 변경이 없어요."}</p>
          )}
          {result.notes.length > 0 && (
            <ul className="list-disc pl-5 text-stone">
              {result.notes.map((note) => (
                <li key={note} className="break-words">
                  {note}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
