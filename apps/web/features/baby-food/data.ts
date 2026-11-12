import { FRUIT_ART_IDS, PAIRING_ART_IDS } from "@workspace/seasonal/data/infant-art"

type ArtPath = `/foods/${string}/color.svg`

/** 그림 ID 목록을 웹 그림 경로로 바꾼다. 어느 재료가 어느 그림을 쓰는지는 packages/seasonal의 infant-art.json에서 고친다. */
function artPaths(ids: Readonly<Partial<Record<string, string>>>): Readonly<Partial<Record<string, ArtPath>>> {
  return Object.fromEntries(Object.entries(ids).map(([key, id]) => [key, `/foods/${id}/color.svg`]))
}

/** 과일 시기 도감의 과일 id와 주의 식재료 iconId → 그림 경로. */
export const FRUIT_GUIDE_ART = artPaths(FRUIT_ART_IDS)

/** 이유식 궁합의 재료 이름 → 그림 경로. */
export const PAIRING_ART = artPaths(PAIRING_ART_IDS)

export const PAIRING_REFERENCES = {
  sweetPotato: {
    title: "영국 국민보건서비스(NHS) · 고구마와 당근 퓌레",
    href: "https://www.nhs.uk/best-start-in-life/baby/recipes-and-meal-ideas/root-vegetable-mash/",
  },
  spinach: {
    title: "영국 NHS 영유아 조리서(NEON) · 시금치 소스 예시",
    href: "https://www.justonenorfolk.nhs.uk/media/cublqwzg/eating-well-6-months-to-2-years-for-south-asian-children-neon-recipe-book-final-version-web-compressed.pdf#page=34",
  },
  milk: {
    title: "영국 국민보건서비스(NHS) · 이유식과 우유 사용 조건",
    href: "https://www.nhs.uk/baby/weaning-and-feeding/drinks-and-cups-for-babies-and-young-children/",
  },
  calcium: {
    title: "미국 국립보건원(NIH) · 칼슘과 옥살산",
    href: "https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/",
  },
} as const
