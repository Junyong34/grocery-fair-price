import "server-only"

import path from "node:path"

// 그림 어드민이 읽고 쓰는 저장소 안 경로. 개발 서버는 apps/web에서 돌므로 저장소 루트는 두 칸 위다.
// 경로를 만드는 곳과 그 경로로 파일을 읽는 곳마다 turbopackIgnore를 단다. 달지 않으면 Turbopack이 경로 패턴을 따라 prototypes/의 파일 수십만 개를 서버 번들에 추적한다.
export const REPO = path.resolve(/*turbopackIgnore: true*/ process.cwd(), "../..")
/** 그림 원본. Git에 없어 이 기기에만 있다. */
export const ART_DIR = path.join(/*turbopackIgnore: true*/ REPO, "prototypes/seasonal-food/foods")
/** scripts/render-art-previews.mjs가 그린 미리보기. */
export const PREVIEW_DIR = path.join(/*turbopackIgnore: true*/ REPO, "node_modules/.cache/art-preview")
export const REGISTRY_FILE = path.join(/*turbopackIgnore: true*/ REPO, "packages/seasonal/src/data/food-registry.json")
export const INFANT_ART_FILE = path.join(/*turbopackIgnore: true*/ REPO, "packages/seasonal/src/data/infant-art.json")

export const ART_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/
export const artFile = (id: string, file: "art.json" | "NOTES.md" | "food.mjs") => path.join(/*turbopackIgnore: true*/ ART_DIR, id, file)
