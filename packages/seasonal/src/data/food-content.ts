// 품종 상세 원고(packages/seasonal/content/foods/*.md)의 형식과, 원고를 화면 데이터로 읽는 함수.
// 원고 작성 기준은 .scratch/seasonal-content-assignments/rewrite-criteria.md, 형식 검사는 같은 폴더의 check-chunk.py다.
// 파일을 읽지 않는다. scripts/build-food-content.mjs가 원고를 읽어 넘기고 food-content.generated.ts를 쓴다.
// 그 스크립트가 Node로 이 파일을 바로 불러오므로 다른 로컬 모듈을 값으로 불러오지 않는다.

/** 목록 한 줄. 보관·손질 섹션은 줄 앞의 굵은 머리말(보관법, 손질법)을 label로 나눈다. */
export type FoodContentItem = { label?: string; text: string }

export type FoodContentBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: FoodContentItem[] }

export type FoodContentSection = { title: string; blocks: FoodContentBlock[] }

export type FoodContentSource = { org: string; title: string; url: string; checkedAt: string }

export type FoodContent = {
  /** 한 줄 소개. 검색 설명문(description)과 상세 화면 첫 문단에 쓴다. */
  summary: string
  /** 대표 산지. 원고가 —이면 null. */
  origin: string | null
  /** 1~6번 섹션. 내용이 —인 섹션(자료가 없는 맛과 식감 등)은 뺀다. */
  sections: FoodContentSection[]
  /** 8번 출처 및 근거. */
  sources: FoodContentSource[]
}

const EMPTY = "—"

/** 원고 파일 하나(또는 여러 파일을 이은 것)를 품종 ID별 상세 내용으로 읽는다. 보류 항목(목차의 [ ])은 본문이 없어 나오지 않는다. */
export function parseFoodContent(markdown: string): Record<string, FoodContent> {
  const result: Record<string, FoodContent> = {}
  // 품종 블록은 "## <id> | <표시명>"으로 시작하고 다음 블록이나 파일 끝에서 끝난다.
  const blocks = markdown.split(/^## (?=[a-z0-9-]+ \| )/m).slice(1)
  for (const block of blocks) {
    const id = block.slice(0, block.indexOf(" |"))
    if (id in result) throw new Error(`${id}: 원고에 같은 품종이 두 번 있다`)
    try {
      result[id] = parseBlock(block.replace(/\n---\s*$/, ""))
    } catch (error) {
      throw new Error(`${id}: ${(error as Error).message}`)
    }
  }
  return result
}

function parseBlock(block: string): FoodContent {
  const summary = block.match(/^> \*\*한 줄 소개[^\n]*\n> (.+)$/m)?.[1]?.trim()
  if (!summary) throw new Error("한 줄 소개가 없다")
  const origin = block.match(/^\| \*\*대표 산지\*\* \| (.+?) \|$/m)?.[1]?.trim()
  if (!origin) throw new Error("대표 산지 행이 없다")

  const parts = block.split(/^### /m).slice(1)
  const sections: FoodContentSection[] = []
  let sources: FoodContentSource[] = []
  for (const part of parts) {
    const newline = part.indexOf("\n")
    const heading = (newline < 0 ? part : part.slice(0, newline)).trim()
    // 검수 메모는 화면에 내지 않는다.
    const body = (newline < 0 ? "" : part.slice(newline + 1)).split(/^\*\*검수 메모\*\*/m)[0]!.trim()
    const match = heading.match(/^(\d)\. (.+)$/)
    if (!match) throw new Error(`섹션 제목 형식이 다르다: ${heading}`)
    if (match[1] === "8") {
      sources = parseSources(body)
      continue
    }
    if (body === EMPTY) continue
    if (!body) throw new Error(`${match[2]} 섹션이 비어 있다`)
    sections.push({ title: match[2]!, blocks: parseBlocks(body) })
  }
  if (sections.length === 0) throw new Error("본문 섹션이 없다")
  if (sources.length === 0) throw new Error("출처가 없다")
  return { summary, origin: origin === EMPTY ? null : origin, sections, sources }
}

function parseBlocks(body: string): FoodContentBlock[] {
  const blocks: FoodContentBlock[] = []
  for (const chunk of body.split(/\n\s*\n/)) {
    const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean)
    if (lines.length === 0) continue
    if (lines.every((line) => line.startsWith("- "))) {
      blocks.push({ kind: "list", items: lines.map((line) => parseItem(line.slice(2).trim())) })
    } else if (lines.some((line) => line.startsWith("- "))) {
      throw new Error(`문단과 목록이 빈 줄 없이 섞였다: ${lines[0]}`)
    } else {
      blocks.push({ kind: "paragraph", text: lines.join(" ") })
    }
  }
  return blocks
}

function parseItem(line: string): FoodContentItem {
  const labelled = line.match(/^\*\*(.+?)\*\*\s+(.+)$/)
  return labelled ? { label: labelled[1]!, text: labelled[2]! } : { text: line }
}

function parseSources(body: string): FoodContentSource[] {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^- \[(.+?) · (.+)\]\((https?:\/\/[^)]+)\) · (\d{4}-\d{2}-\d{2}) 확인$/)
      if (!match) throw new Error(`출처 형식이 다르다: ${line}`)
      return { org: match[1]!, title: match[2]!, url: match[3]!, checkedAt: match[4]! }
    })
}
