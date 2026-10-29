// 수집 알림 이슈 (ingest-schedule/13·14, pipeline 5-3). 알림은 GitHub 이슈다. 같은 출처·원인은 열린 이슈 하나에 댓글로 묶는다.
// 이슈를 고르는 키는 라벨 셋이다: ingest-alert, source:<출처>, cause:<원인>.
// 본문에는 출처·원인·종료 코드·실행 주소·시각만 넣는다. 키·접속 주소·원본 응답 본문·로그는 넣지 않는다.
// GitHub 작업은 gh CLI로 한다. 테스트는 Gh를 바꿔 끼운다.

export type AlertSource = "kamis" | "ekape" | "chamga" | "supabase"

export type Cause =
  | "key_invalid" // 인증키 오류. 다시 불러도 안 된다
  | "storage_failed" // 원본을 Storage에 올리지 못했다. 받은 것을 잃는다 (Supabase 일시정지면 HTTP 540)
  | "db_unreachable" // DB에 닿지 않았다 (일시정지·DNS·Supavisor 거부). 원본은 남아 다음 실행이 적재한다
  | "partial" // 일부 호출·적재 실패, 한도·예산 초과
  | "unexpected" // 코드 오류, 시간 초과 등
  | "stale" // 출처의 마지막 수집이 기대보다 오래 멈췄다 (heartbeat)
  | "workflow_disabled" // 수집 워크플로가 꺼져 있었다 (heartbeat가 다시 켰다)

export type Alert = { source: AlertSource; cause: Cause; summary: string; runUrl: string | null; at: string }

export const ALERT_LABEL = "ingest-alert"

export function labelsOf(alert: Pick<Alert, "source" | "cause">): string[] {
  return [ALERT_LABEL, `source:${alert.source}`, `cause:${alert.cause}`]
}

export function titleOf(alert: Pick<Alert, "source" | "cause">): string {
  return `[수집 알림] ${alert.source}: ${CAUSE_TEXT[alert.cause]}`
}

const CAUSE_TEXT: Record<Cause, string> = {
  key_invalid: "인증키 오류",
  storage_failed: "원본 저장 실패",
  db_unreachable: "DB 접속 실패",
  partial: "수집 실패 2회 연속",
  unexpected: "예상하지 못한 실패",
  stale: "수집이 멈춤",
  workflow_disabled: "수집 워크플로가 꺼져 있었음",
}

const CAUSE_HINT: Record<Cause, string> = {
  key_invalid: "data.go.kr 키가 만료·해지됐는지, Actions Secret `DATA_GO_KR_SERVICE_KEY`가 맞는지 본다 (ingest-schedule/01).",
  storage_failed: "Supabase 프로젝트가 일시정지됐는지 대시보드에서 본다 (HTTP 540). 그날 받은 원본은 잃었을 수 있다.",
  db_unreachable: "Supabase 프로젝트가 일시정지됐는지 본다. 원본은 Storage에 있어 DB가 돌아오면 다음 실행이 적재한다.",
  partial: "실행 로그의 실패 호출·적재 줄을 본다. 다음 실행이 빈 날을 메운다.",
  unexpected: "실행 로그의 마지막 오류를 본다. 코드 오류면 고칠 때까지 계속 실패한다.",
  stale: "수집 워크플로가 도는지, 실패가 이어지는지 Actions에서 본다.",
  workflow_disabled: "저장소 활동이 60일 없으면 GitHub이 예약 워크플로를 끈다. heartbeat가 다시 켰다. 꺼져 있던 동안 빠진 날을 확인한다.",
}

export function bodyOf(alert: Alert): string {
  return [
    `- 출처: \`${alert.source}\``,
    `- 원인: \`${alert.cause}\` (${CAUSE_TEXT[alert.cause]})`,
    `- 내용: ${alert.summary}`,
    `- 시각: ${alert.at}`,
    alert.runUrl ? `- 실행: ${alert.runUrl}` : null,
    "",
    CAUSE_HINT[alert.cause],
    "",
    "같은 출처·원인이 다시 나면 이 이슈에 댓글로 붙는다. 그 출처의 수집이 성공하면 자동으로 닫힌다.",
  ]
    .filter((line) => line !== null)
    .join("\n")
}

export function commentOf(alert: Alert): string {
  return [`다시 났다: ${alert.summary}`, `- 시각: ${alert.at}`, alert.runUrl ? `- 실행: ${alert.runUrl}` : null].filter(Boolean).join("\n")
}

// gh 실행: 인자 배열을 받아 표준 출력을 돌려준다. 실패하면 던진다
export type Gh = (args: readonly string[]) => Promise<string>

const LABEL_COLOR = "d93f0b"

// 열린 알림 이슈가 있으면 댓글, 없으면 새 이슈. 돌려주는 값: 이슈 번호와 무엇을 했는지
export async function raiseAlert(gh: Gh, alert: Alert): Promise<{ number: number; action: "created" | "commented" }> {
  const labels = labelsOf(alert)
  const open = await findOpen(gh, labels)
  if (open !== null) {
    await gh(["issue", "comment", String(open), "--body", commentOf(alert)])
    return { number: open, action: "commented" }
  }
  // 라벨이 없으면 gh issue create가 실패한다. --force는 있으면 그대로 둔다
  for (const label of labels) await gh(["label", "create", label, "--color", LABEL_COLOR, "--force"])
  const url = await gh(["issue", "create", "--title", titleOf(alert), "--body", bodyOf(alert), ...labels.flatMap((l) => ["--label", l])])
  return { number: issueNumberOf(url), action: "created" }
}

// 그 출처의 수집이 성공했다: 그 출처의 열린 알림 이슈를 모두 닫는다 (원인 무관). 돌려주는 값: 닫은 이슈 번호
export async function resolveAlerts(gh: Gh, source: AlertSource, note: string): Promise<number[]> {
  const out = await gh(["issue", "list", "--state", "open", "--label", ALERT_LABEL, "--label", `source:${source}`, "--json", "number", "--limit", "50"])
  const numbers = (JSON.parse(out || "[]") as { number: number }[]).map((i) => i.number)
  for (const n of numbers) await gh(["issue", "close", String(n), "--comment", note])
  return numbers
}

async function findOpen(gh: Gh, labels: readonly string[]): Promise<number | null> {
  const out = await gh(["issue", "list", "--state", "open", ...labels.flatMap((l) => ["--label", l]), "--json", "number", "--limit", "1"])
  const [first] = JSON.parse(out || "[]") as { number: number }[]
  return first?.number ?? null
}

function issueNumberOf(url: string): number {
  const match = /\/issues\/(\d+)\s*$/.exec(url.trim())
  if (!match) throw new Error("gh issue create가 이슈 주소를 돌려주지 않았다")
  return Number(match[1])
}
