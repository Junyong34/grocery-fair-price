// 그림 주소 버전(food-versions.generated.ts)을 만드는 순수 함수. 파일을 읽는 일은 scripts/hash-food-svgs.mjs가 한다.
// 그 스크립트가 Node로 이 파일을 바로 import하므로 다른 로컬 모듈을 값으로 import하지 않는다(packages/seasonal/AGENTS.md).

/** 그림 한 폴더(apps/web/public/foods/<웹 폴더>)의 두 변형 SVG 글. */
export type FoodSvgs = { readonly color: string; readonly motion: string }

/**
 * 그림 한 폴더의 내용 버전: color와 motion을 NUL로 이은 글의 SHA-256 앞 8자(소문자 16진수).
 * 둘 중 하나만 바뀌어도 값이 바뀌어 두 주소가 함께 새로 받아진다. 화면이 주소에 ?v=로 붙인다.
 */
export async function foodVersion({ color, motion }: FoodSvgs): Promise<string> {
  const bytes = new TextEncoder().encode(`${color}\u0000${motion}`)
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))
  return Array.from(digest.subarray(0, 4), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

/** 웹 폴더 이름 → 버전 표로 food-versions.generated.ts의 글을 만든다. 폴더 이름순. */
export function foodVersionsText(versions: Readonly<Record<string, string>>): string {
  const rows = Object.keys(versions)
    .sort()
    .map((id) => `  ${JSON.stringify(id)}: ${JSON.stringify(versions[id])},`)
  return `// 생성 파일. 직접 고치지 않는다. \`pnpm foods:versions\`로 다시 만든다(\`pnpm foods:sync\`가 끝에 함께 만든다).
// 웹 그림 폴더(apps/web/public/foods/<id>) → color·motion 내용 해시 앞 8자. 화면이 그림 주소에 ?v=로 붙여 1년 immutable 캐시를 받는다.

export const FOOD_VERSIONS: Readonly<Record<string, string>> = {
${rows.join("\n")}
}
`
}
