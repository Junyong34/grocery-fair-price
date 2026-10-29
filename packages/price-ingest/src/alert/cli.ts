// 수집 워크플로의 알림 잡이 부른다 (ingest-schedule/13). 수집 잡의 종료 코드를 받아 알릴지 정하고 이슈를 열거나 댓글을 단다.
// 성공이면 그 출처의 열린 알림 이슈를 닫는다.
//   pnpm --filter @workspace/price-ingest alert --source kamis|ekape|chamga --workflow ingest-kamis.yml [--exit-code N]
// --exit-code를 비우면 종료 코드 없이 끝난 것이다 (시간 초과·취소).
// 환경변수: GH_TOKEN(issues: write, actions: read), GH_REPO, GITHUB_RUN_ID, GITHUB_SERVER_URL. 비밀값은 받지 않는다.
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { parseArgs } from "node:util"

import { decideAlert, summaryOf } from "./decide.ts"
import { raiseAlert, resolveAlerts, type AlertSource, type Gh } from "./issues.ts"

const USAGE = "사용법: alert --source kamis|ekape|chamga --workflow <파일 이름> [--exit-code N]"
const SOURCES: readonly AlertSource[] = ["kamis", "ekape", "chamga"]

export const ghCli: Gh = async (args) => (await promisify(execFile)("gh", [...args], { maxBuffer: 1 << 20 })).stdout

// 같은 워크플로의 직전 완료 실행(이번 실행 제외)이 실패였나
export async function previousRunFailed(gh: Gh, workflow: string, currentRunId: string): Promise<boolean> {
  const out = await gh(["run", "list", "--workflow", workflow, "--limit", "10", "--json", "databaseId,status,conclusion"])
  const runs = JSON.parse(out || "[]") as { databaseId: number; status: string; conclusion: string }[]
  const previous = runs.find((r) => String(r.databaseId) !== currentRunId && r.status === "completed")
  return previous?.conclusion === "failure"
}

export function runUrlOf(env: NodeJS.ProcessEnv): string | null {
  const { GITHUB_SERVER_URL: server, GH_REPO: repo, GITHUB_RUN_ID: run } = env
  return server && repo && run ? `${server}/${repo}/actions/runs/${run}` : null
}

export async function runAlert(
  input: { source: AlertSource; workflow: string; exitCode: number | null; runId: string; runUrl: string | null; now: Date },
  gh: Gh,
): Promise<string> {
  if (input.exitCode === 0) {
    const closed = await resolveAlerts(gh, input.source, `수집이 성공해 닫는다.${input.runUrl ? ` ${input.runUrl}` : ""}`)
    return closed.length > 0 ? `성공: 알림 이슈 ${closed.map((n) => `#${n}`).join(", ")}를 닫았다` : "성공: 열린 알림 없음"
  }
  const run = { exitCode: input.exitCode }
  const decision = decideAlert(run, await previousRunFailed(gh, input.workflow, input.runId))
  if (!decision.alert) return `알리지 않음: ${decision.reason}`
  const raised = await raiseAlert(gh, {
    source: input.source,
    cause: decision.cause,
    summary: summaryOf(run, decision),
    runUrl: input.runUrl,
    at: input.now.toISOString(),
  })
  return `알림: ${decision.cause} → 이슈 #${raised.number} (${raised.action === "created" ? "새로 엶" : "댓글"})`
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: { source: { type: "string" }, workflow: { type: "string" }, "exit-code": { type: "string" } },
    strict: true,
  })
  const source = values.source as AlertSource | undefined
  if (!source || !SOURCES.includes(source)) throw new Error(`--source가 필요하다. ${USAGE}`)
  if (!values.workflow || !/^[\w.-]+\.ya?ml$/.test(values.workflow)) throw new Error(`--workflow는 워크플로 파일 이름이다. ${USAGE}`)
  const raw = values["exit-code"] ?? ""
  if (raw !== "" && !/^\d+$/.test(raw)) throw new Error(`--exit-code는 정수다. ${USAGE}`)
  console.log(
    await runAlert(
      {
        source,
        workflow: values.workflow,
        exitCode: raw === "" ? null : Number(raw),
        runId: process.env.GITHUB_RUN_ID ?? "",
        runUrl: runUrlOf(process.env),
        now: new Date(),
      },
      ghCli,
    ),
  )
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    // gh 오류 문구에는 토큰이 없다. 그래도 첫 줄만 남긴다
    console.error(`알림 실패: ${(error instanceof Error ? error.message : String(error)).split("\n")[0]}`)
    process.exitCode = 1
  })
}
