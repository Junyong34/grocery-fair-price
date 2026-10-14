// shadcn CLI로 cojeev 컴포넌트를 추가한 뒤 src/styles/cojeev.css를 정리한다.
// - CLI가 넣는 `@import "@/styles/..."`는 Tailwind의 @import 해석기가 "@/" 별칭을 몰라 빌드가 깨진다 → "./..."로 바꾼다.
// - 같은 @import가 여러 번 들어가면 하나만 남기고, 모든 @import를 파일 맨 위로 모은다.
// - CLI가 다시 넣는 dark 변형은 지운다. 다크 모드는 쓰지 않고, data-mode 변형은 globals.css에 하나만 둔다.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/styles/cojeev.css")
const lines = fs.readFileSync(file, "utf8").split("\n")

const imports = []
const rest = []
for (const line of lines) {
  const m = line.match(/^@import\s+"([^"]+)";\s*$/)
  if (m) {
    const spec = m[1].replace(/^@\/styles\//, "./")
    const out = `@import "${spec}";`
    if (!imports.includes(out)) imports.push(out)
    continue
  }
  if (/^\s*@custom-variant dark /.test(line)) continue
  rest.push(line)
}

const body = rest.join("\n").replace(/^\n+/, "").replace(/\n{3,}/g, "\n\n")
fs.writeFileSync(file, `${imports.join("\n")}\n\n${body}`)
console.log(`fix-ui-css: ${imports.length} imports → ${path.relative(process.cwd(), file)}`)
