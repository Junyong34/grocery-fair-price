// 비밀값이 로그·오류 출력에 남지 않게 지운다 (ingest-schedule/02, pipeline 5-3-1).
// 저장소가 공개라 Actions 로그를 누구나 본다. GitHub는 Secret 값을 그대로 찍을 때만 가리고,
// URL 인코딩된 값(+ → %2B, / → %2F, = → %3D)이나 접속 주소 안의 비밀번호는 가리지 못한다.
// 그래서 값마다 인코딩 변형까지 모아 지운다. 출력하는 쪽(CLI)은 모든 오류를 describeError로만 찍는다.
import { inspect } from "node:util"

export const MASK = "***"

// 수집이 쓰는 비밀 환경변수 (pipeline 5-3-1). SUPABASE_URL은 비밀이 아니다.
// OWNER_DATABASE_URL은 카탈로그 분류 표를 넣을 때만 로컬에서 쓴다 (ingest-foundation/08). Actions에는 넣지 않는다.
export const SECRET_ENV = ["DATA_GO_KR_SERVICE_KEY", "SUPABASE_SECRET_KEY", "INGEST_DATABASE_URL", "OWNER_DATABASE_URL"] as const

// 너무 짧은 값은 지우지 않는다. 다른 글자까지 지워 출력이 망가진다.
const MIN_LENGTH = 6

function tryDecode(value: string): string | undefined {
  try {
    return decodeURIComponent(value)
  } catch {
    return undefined
  }
}

// 접속 주소의 비밀번호. 주소가 아니거나 비밀번호가 없으면 undefined
function urlPassword(value: string): string | undefined {
  try {
    const password = new URL(value).password
    return password === "" ? undefined : password
  } catch {
    // 형식이 잘못된 주소: scheme://user:password@host 모양에서 직접 꺼낸다
    return /^[a-z][a-z0-9+.-]*:\/\/[^:/@]*:(.+)@[^@]*$/i.exec(value)?.[1]
  }
}

// 값 하나가 출력에 나타날 수 있는 모양들: 그대로, 퍼센트 인코딩, 폼 인코딩(URLSearchParams), 디코딩
export function secretVariants(value: string): string[] {
  const variants = new Set<string>()
  const add = (text: string | undefined) => {
    if (text === undefined || text.length < MIN_LENGTH) return
    variants.add(text)
    variants.add(encodeURIComponent(text))
    variants.add(new URLSearchParams([["k", text]]).toString().slice(2))
  }
  add(value)
  add(tryDecode(value))
  const password = urlPassword(value)
  add(password)
  if (password !== undefined) add(tryDecode(password))
  return [...variants]
}

export type Redactor = (text: string) => string

export function createRedactor(values: readonly (string | undefined)[]): Redactor {
  // 긴 것부터 지운다: 주소 전체를 먼저, 그 안의 비밀번호를 나중에
  const variants = [...new Set(values.flatMap((value) => (value ? secretVariants(value) : [])))].sort(
    (a, b) => b.length - a.length,
  )
  return (text) => variants.reduce((out, secret) => out.split(secret).join(MASK), text)
}

export function redactorFromEnv(env: NodeJS.ProcessEnv = process.env): Redactor {
  return createRedactor(SECRET_ENV.map((name) => env[name]))
}

// 오류를 찍을 글자로 바꾼다. 이름·메시지·스택과 오류에 붙은 속성(예: Invalid URL의 input)까지 담고 비밀값을 지운다.
export function describeError(error: unknown, redact: Redactor): string {
  return redact(error instanceof Error ? inspect(error, { depth: 3, breakLength: 120 }) : String(error))
}

// GitHub Actions에서 인코딩 변형까지 로그 가리기에 더하는 명령 줄. Actions 밖에서는 부르지 않는다.
// 이 명령 줄 자체는 로그에 보이지 않는다 (workflow command).
export function actionsMaskCommands(values: readonly (string | undefined)[]): string[] {
  return [...new Set(values.flatMap((value) => (value ? secretVariants(value) : [])))].map((v) => `::add-mask::${v}`)
}

// 오류 한 줄 요약: 이름, 코드(ECONNREFUSED·SQLSTATE·HTTP 상태), 메시지 첫 줄 앞부분. 비밀값은 지운다.
export function errorSummary(error: unknown, redact: Redactor): string {
  if (!(error instanceof Error)) return redact(String(error)).slice(0, 120)
  const { code, status, cause } = error as { code?: unknown; status?: unknown; cause?: { code?: unknown } }
  return redact([error.name, code ?? status, cause?.code, error.message.split("\n")[0]?.slice(0, 80)].filter(Boolean).join(" "))
}
