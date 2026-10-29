// 수집 알림과 heartbeat (ingest-schedule/13·14). gh는 메모리 속 가짜 저장소로 바꿔 끼운다.
import { describe, expect, it } from "vitest"

import { runAlert } from "../src/alert/cli.ts"
import { decideAlert } from "../src/alert/decide.ts"
import { enableWorkflows, staleSources, type SourceProgress } from "../src/alert/heartbeat.ts"
import { bodyOf, raiseAlert, resolveAlerts, type Gh } from "../src/alert/issues.ts"
import { EXIT } from "../src/ingest/run.ts"

type Issue = { number: number; title: string; body: string; labels: string[]; open: boolean; comments: string[] }

// gh 명령 중 알림이 쓰는 것만 흉내 낸다
function fakeGh(init: { runs?: { databaseId: number; status: string; conclusion: string }[]; workflows?: Record<string, string> } = {}) {
  const issues: Issue[] = []
  const labels = new Set<string>()
  const workflows = new Map(Object.entries(init.workflows ?? {}))
  const calls: string[][] = []
  const flag = (args: readonly string[], name: string) => args.flatMap((a, i) => (a === name ? [args[i + 1]!] : []))
  const gh: Gh = async (args) => {
    calls.push([...args])
    const [group, verb] = args
    if (group === "label" && verb === "create") {
      labels.add(args[2]!)
      return ""
    }
    if (group === "issue" && verb === "list") {
      const want = flag(args, "--label")
      const found = issues.filter((i) => i.open && want.every((l) => i.labels.includes(l)))
      return JSON.stringify(found.slice(0, Number(flag(args, "--limit")[0] ?? 30)).map((i) => ({ number: i.number })))
    }
    if (group === "issue" && verb === "create") {
      const wanted = flag(args, "--label")
      const missing = wanted.find((l) => !labels.has(l))
      if (missing) throw new Error(`could not add label: '${missing}' not found`)
      const issue = { number: issues.length + 1, title: flag(args, "--title")[0]!, body: flag(args, "--body")[0]!, labels: wanted, open: true, comments: [] }
      issues.push(issue)
      return `https://github.com/o/r/issues/${issue.number}\n`
    }
    if (group === "issue" && verb === "comment") {
      issues.find((i) => i.number === Number(args[2]))!.comments.push(flag(args, "--body")[0]!)
      return ""
    }
    if (group === "issue" && verb === "close") {
      const issue = issues.find((i) => i.number === Number(args[2]))!
      issue.open = false
      issue.comments.push(flag(args, "--comment")[0]!)
      return ""
    }
    if (group === "run" && verb === "list") return JSON.stringify(init.runs ?? [])
    if (group === "workflow" && verb === "list") return JSON.stringify([...workflows].map(([file, state]) => ({ path: `.github/workflows/${file}`, state })))
    if (group === "workflow" && verb === "enable") {
      workflows.set(args[2]!, "active")
      return ""
    }
    throw new Error(`흉내 내지 않은 gh 명령: ${args.join(" ")}`)
  }
  return { gh, issues, workflows, calls }
}

describe("알릴지 정하기", () => {
  it("인증키 오류·원본 저장 실패·예상하지 못한 실패는 첫 번에 알린다", () => {
    expect(decideAlert({ exitCode: EXIT.keyInvalid }, false)).toEqual({ alert: true, cause: "key_invalid", immediate: true })
    expect(decideAlert({ exitCode: EXIT.storageFailed }, false)).toMatchObject({ alert: true, cause: "storage_failed" })
    expect(decideAlert({ exitCode: EXIT.unexpected }, false)).toMatchObject({ alert: true, cause: "unexpected" })
  })

  it("일부 실패·DB 접속 실패·시간 초과는 직전 실행도 실패였을 때만 알린다", () => {
    for (const exitCode of [EXIT.partial, EXIT.dbUnreachable, null]) {
      expect(decideAlert({ exitCode }, false)).toMatchObject({ alert: false })
      expect(decideAlert({ exitCode }, true)).toMatchObject({ alert: true, immediate: false })
    }
    expect(decideAlert({ exitCode: EXIT.dbUnreachable }, true)).toMatchObject({ cause: "db_unreachable" })
    expect(decideAlert({ exitCode: null }, true)).toMatchObject({ cause: "unexpected" })
  })

  it("성공은 알리지 않는다", () => {
    expect(decideAlert({ exitCode: EXIT.ok }, true)).toMatchObject({ alert: false })
  })
})

describe("알림 이슈", () => {
  const alert = { source: "kamis", cause: "key_invalid", summary: "종료 코드 2", runUrl: "https://github.com/o/r/actions/runs/1", at: "2026-10-29T00:00:00.000Z" } as const

  it("처음에는 라벨을 만들고 이슈를 열고, 같은 출처·원인은 댓글로 묶고, 원인이 다르면 따로 연다", async () => {
    const { gh, issues } = fakeGh()
    expect(await raiseAlert(gh, alert)).toEqual({ number: 1, action: "created" })
    expect(issues[0]!.labels).toEqual(["ingest-alert", "source:kamis", "cause:key_invalid"])
    expect(await raiseAlert(gh, { ...alert, summary: "또" })).toEqual({ number: 1, action: "commented" })
    expect(await raiseAlert(gh, { ...alert, cause: "partial" })).toEqual({ number: 2, action: "created" })
    expect(await raiseAlert(gh, { ...alert, source: "ekape" })).toEqual({ number: 3, action: "created" })
    expect(issues[0]!.comments).toHaveLength(1)
  })

  it("성공하면 그 출처의 열린 알림만 닫고, 닫힌 원인이 다시 나면 새로 연다", async () => {
    const { gh, issues } = fakeGh()
    await raiseAlert(gh, alert)
    await raiseAlert(gh, { ...alert, cause: "partial" })
    await raiseAlert(gh, { ...alert, source: "chamga" })
    expect(await resolveAlerts(gh, "kamis", "성공")).toEqual([1, 2])
    expect(issues.map((i) => i.open)).toEqual([false, false, true])
    expect(await raiseAlert(gh, alert)).toEqual({ number: 4, action: "created" })
  })

  it("본문에 실행 주소와 원인만 있고 키·접속 주소 같은 값은 없다", () => {
    const body = bodyOf(alert)
    expect(body).toContain(alert.runUrl)
    expect(body).not.toMatch(/serviceKey|postgres(ql)?:\/\/|sb_secret/)
  })
})

describe("알림 잡 (runAlert)", () => {
  const base = { source: "kamis", workflow: "ingest-kamis.yml", runId: "9", runUrl: null, now: new Date("2026-10-29T00:00:00Z") } as const

  it("직전 완료 실행(이번 실행 제외)이 실패였으면 두 번째 일부 실패에 알린다", async () => {
    const first = fakeGh({ runs: [{ databaseId: 9, status: "in_progress", conclusion: "" }, { databaseId: 8, status: "completed", conclusion: "success" }] })
    expect(await runAlert({ ...base, exitCode: EXIT.partial }, first.gh)).toMatch(/^알리지 않음/)
    expect(first.issues).toHaveLength(0)

    const second = fakeGh({ runs: [{ databaseId: 9, status: "in_progress", conclusion: "" }, { databaseId: 8, status: "completed", conclusion: "failure" }] })
    expect(await runAlert({ ...base, exitCode: EXIT.partial }, second.gh)).toMatch(/이슈 #1/)
  })

  it("성공하면 열린 알림을 닫는다", async () => {
    const { gh, issues } = fakeGh()
    await runAlert({ ...base, exitCode: EXIT.keyInvalid }, gh)
    expect(await runAlert({ ...base, exitCode: EXIT.ok }, gh)).toMatch(/#1를 닫았다/)
    expect(issues[0]!.open).toBe(false)
  })
})

describe("heartbeat", () => {
  it("꺼진 수집 워크플로만 다시 켠다", async () => {
    const { gh, workflows } = fakeGh({
      workflows: { "ingest-kamis.yml": "active", "ingest-ekape.yml": "disabled_inactivity", "ingest-chamga.yml": "disabled_manually", "probe-runner.yml": "disabled_manually" },
    })
    expect(await enableWorkflows(gh)).toEqual([
      { file: "ingest-ekape.yml", source: "ekape", state: "disabled_inactivity" },
      { file: "ingest-chamga.yml", source: "chamga", state: "disabled_manually" },
    ])
    expect(workflows.get("ingest-chamga.yml")).toBe("active")
    expect(workflows.get("probe-runner.yml")).toBe("disabled_manually")
  })

  const now = new Date("2026-10-29T00:00:00Z") // KST 10-29 09:00
  const fresh: SourceProgress[] = [
    { source: "kamis", lastOk: "2026-10-28", lastChecked: "2026-10-29T00:00:00.000Z" },
    { source: "ekape", lastOk: "2026-10-26", lastChecked: "2026-10-28T00:00:00.000Z" },
    { source: "chamga", lastOk: "2026-09-25", lastChecked: "2026-10-28T01:00:00.000Z" },
  ]

  it("KAMIS·축평원은 어제보다 2일 넘게, 참가격은 감지 기록 3일·조사일 35일 넘게 멈추면 알린다", () => {
    expect(staleSources(fresh, now)).toEqual([])
    const stale = staleSources(
      [
        { ...fresh[0]!, lastOk: "2026-10-25" },
        { ...fresh[1]!, lastOk: null },
        { ...fresh[2]!, lastChecked: "2026-10-25T00:00:00.000Z" },
      ],
      now,
    )
    expect(stale.map((s) => s.source)).toEqual(["kamis", "ekape", "chamga"])
    expect(staleSources([{ ...fresh[2]!, lastOk: "2026-09-23" }], now)).toEqual([
      { source: "chamga", summary: "받은 조사일이 35일 넘게 없다 (마지막 2026-09-23)" },
    ])
  })
})
