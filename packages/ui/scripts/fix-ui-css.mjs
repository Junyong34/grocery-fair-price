// shadcn CLI로 cojeev 컴포넌트를 추가한 뒤 src/styles/cojeev.css의 @import 목록을 맞춘다.
//
// components.json의 tailwind.css는 src/styles/.cli-staging.css(빈 임시 파일)를 가리킨다. CLI가 cojeev.css를 직접 고치면
// `@import "@/styles/..."`(Tailwind가 "@/" 별칭을 못 풀어 빌드가 깨진다)와 dark 변형이 들어가고, 그 사이에 next dev가
// 반쯤 쓴 파일을 읽어 오류 상태를 붙잡는다. 그래서 CLI는 임시 파일에 쓰게 하고, 이 스크립트가 cojeev.css를 한 번에 고친다.
// - src/styles/cojeev/*.css 가운데 아직 import하지 않은 파일을 이름순으로 뒤에 붙인다. 기존 순서(tokens → theme → base …)는 유지한다.
// - 임시 파일에 CLI가 남긴 @import가 있으면 "./..."로 바꿔 함께 넣고, 임시 파일은 지운다.
// - dark 변형은 넣지 않는다. 다크 모드는 쓰지 않는다.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const styles = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/styles")
const file = path.join(styles, "cojeev.css")
const staging = path.join(styles, ".cli-staging.css")

const importOf = (line) => line.match(/^@import\s+"([^"]+)";\s*$/)?.[1].replace(/^@\/styles\//, "./")

const lines = fs.readFileSync(file, "utf8").split("\n")
const imports = []
const rest = []
for (const line of lines) {
  const spec = importOf(line)
  if (spec) {
    if (!imports.includes(spec)) imports.push(spec)
  } else if (!/^\s*@custom-variant dark /.test(line)) {
    rest.push(line)
  }
}

if (fs.existsSync(staging)) {
  for (const line of fs.readFileSync(staging, "utf8").split("\n")) {
    const spec = importOf(line)
    if (spec && !imports.includes(spec)) imports.push(spec)
  }
  fs.rmSync(staging)
}

for (const name of fs.readdirSync(path.join(styles, "cojeev")).filter((f) => f.endsWith(".css")).sort()) {
  const spec = `./cojeev/${name}`
  if (!imports.includes(spec)) imports.push(spec)
}

const body = rest.join("\n").replace(/^\n+/, "").replace(/\n{3,}/g, "\n\n")
const next = `${imports.map((spec) => `@import "${spec}";`).join("\n")}\n\n${body}`
if (next !== lines.join("\n")) {
  // 다 쓴 뒤 바꿔 넣는다. next dev가 반쯤 쓴 파일을 읽지 않게 한다.
  fs.writeFileSync(`${file}.tmp`, next)
  fs.renameSync(`${file}.tmp`, file)
}
console.log(`fix-ui-css: ${imports.length} imports → ${path.relative(process.cwd(), file)}`)
