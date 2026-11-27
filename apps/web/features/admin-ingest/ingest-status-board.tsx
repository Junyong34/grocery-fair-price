import { monthDay } from "@workspace/price/format"

import {
  DAY_STATUS_LABEL,
  dayGrid,
  SOURCE_LABEL,
  summarizeSources,
  type DayStatus,
  type PartRow,
  type RunRow,
} from "./lib/status-view"
import { STATUS_DAYS, type IngestStatus } from "./server/status"

/**
 * 수집 상태 어드민 (ingest-foundation/05, pipeline 5-3): 출처별 마지막 정상 날짜, 최근 14일 source_day 상태, 일부만 온 품목, 최근 실패한 실행.
 * 고치지 않는다. 빈 날은 다음 수집이 다시 받는다 (ingest-schedule/08). 사람이 볼 일은 알림 이슈로도 열린다.
 */
const TONE: Record<DayStatus | "none", string> = {
  ok: "bg-verdict-cheap-wash text-verdict-cheap-ink",
  partial: "bg-gold-wash text-espresso",
  pending: "bg-gold-wash text-espresso",
  failed: "bg-verdict-pricey-wash text-verdict-pricey-ink",
  empty_unexpected: "bg-verdict-pricey-wash text-verdict-pricey-ink",
  empty_expected: "bg-mat text-stone",
  none: "bg-mat text-mute",
}

const SHORT: Record<DayStatus | "none", string> = {
  ok: "받음",
  partial: "일부",
  pending: "대기",
  failed: "실패",
  empty_unexpected: "빔",
  empty_expected: "휴일",
  none: "—",
}

const RUN_STATUS: Record<RunRow["status"], string> = { running: "도는 중", ok: "성공", partial: "부분 실패", failed: "실패" }

export function IngestStatusBoard({ status }: { status: IngestStatus }) {
  const grid = dayGrid(status.days, status.today, STATUS_DAYS)
  const summary = summarizeSources(status.days, status.lastOk)
  return (
    <section className="flex flex-col gap-10">
      <dl className="grid grid-cols-3 gap-3">
        {summary.map((s) => (
          <div key={s.source} className="flex flex-col gap-1 rounded-xl bg-mat px-4 py-3">
            <dt className="text-sm text-stone">{SOURCE_LABEL[s.source]} 마지막 정상 날짜</dt>
            <dd className="font-number text-3xl text-ink tabular-nums">{s.lastOk ? monthDay(s.lastOk) : "없음"}</dd>
            <dd className="text-sm text-stone">
              최근 {STATUS_DAYS}일 끝나지 않은 날 {s.unsettled}일 · 정정 {s.corrections}건
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold">최근 {STATUS_DAYS}일 날짜별 상태</h2>
        <div className="overflow-x-auto rounded-2xl bg-surface shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-mat">
                <th scope="col" className="px-4 py-3 text-xs font-semibold text-stone">
                  출처
                </th>
                {grid.days.map((d) => (
                  <th key={d} scope="col" className="px-1 py-3 text-center text-xs font-semibold whitespace-nowrap text-stone tabular-nums">
                    {monthDay(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.rows.map((r) => (
                <tr key={r.source} className="border-b border-mat last:border-0">
                  <th scope="row" className="px-4 py-3 text-left font-semibold whitespace-nowrap text-ink">
                    {SOURCE_LABEL[r.source]}
                  </th>
                  {r.cells.map((c) => (
                    <td key={c.day} className="px-1 py-2 text-center">
                      <span
                        title={`${DAY_STATUS_LABEL[c.status]} · 행 ${c.rowCount} · 확인 ${c.attempts}번`}
                        className={`inline-block min-w-11 rounded-md px-1.5 py-1 text-xs font-semibold whitespace-nowrap ${TONE[c.status]}`}
                      >
                        {SHORT[c.status]}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-stone">
          {(Object.keys(SHORT) as (DayStatus | "none")[]).map((k) => `${SHORT[k]} = ${DAY_STATUS_LABEL[k]}`).join(" · ")}. 참가격은 조사일(금요일)만
          기록이 있다.
        </p>
      </div>

      <Parts parts={status.parts} />
      <Runs runs={status.runs} />
    </section>
  )
}

function Parts({ parts }: { parts: readonly PartRow[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-heading text-2xl font-bold">일부만 온 품목</h2>
      <p className="max-w-[70ch] text-sm text-pretty text-stone">
        KAMIS 품목별 건수가 최근 4주 같은 요일 평균의 절반보다 적거나(일부) 0건(빠짐)인 날. 제철이 끝난 품목도 4주 동안은 여기에 보인다.
      </p>
      {parts.length === 0 ? (
        <p className="rounded-xl bg-mat px-4 py-6 text-center text-stone">일부만 온 품목이 없어요.</p>
      ) : (
        <SimpleTable
          head={["날짜", "출처", "품목 코드", "건수", "기준", "상태"]}
          rows={parts.map((p) => [monthDay(p.day), SOURCE_LABEL[p.source], p.item, String(p.rows), p.baseline === null ? "—" : String(p.baseline), p.status === "missing" ? "빠짐" : "일부"])}
        />
      )}
    </div>
  )
}

function Runs({ runs }: { runs: readonly RunRow[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-heading text-2xl font-bold">최근 14일 성공하지 못한 실행</h2>
      {runs.length === 0 ? (
        <p className="rounded-xl bg-mat px-4 py-6 text-center text-stone">실패한 실행이 없어요.</p>
      ) : (
        <SimpleTable
          head={["시작 (KST)", "출처", "작업", "상태", "원인", "호출"]}
          rows={runs.map((r) => [
            kst(r.startedAt),
            r.source === "all" ? "전체" : SOURCE_LABEL[r.source],
            r.job,
            RUN_STATUS[r.status],
            r.errorCode ?? "—",
            String(r.callsUsed),
          ])}
        />
      )}
    </div>
  )
}

// ISO 시각 → "11-27 09:41" (KST)
function kst(iso: string): string {
  return new Date(Date.parse(iso) + 9 * 3_600_000).toISOString().slice(5, 16).replace("T", " ")
}

function SimpleTable({ head, rows }: { head: readonly string[]; rows: readonly (readonly string[])[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-surface shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-mat">
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 text-xs font-semibold whitespace-nowrap text-stone">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-b border-mat last:border-0">
              {cells.map((c, j) => (
                <td key={j} className="px-4 py-3 whitespace-nowrap tabular-nums">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
