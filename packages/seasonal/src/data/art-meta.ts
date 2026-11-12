// 그림 한 장의 메타(prototypes/seasonal-food/foods/<그림 ID>/art.json) 형식.
// 그림 검수 상태의 원본이다. 제철 검증은 여기 적지 않고 품종 원본(food-registry.json)에 둔다 (ADR 0006).
// prototypes/는 Git에 없으므로 이 파일들도 그 기기에만 있다. 파일을 읽고 쓰는 일은 동기화 스크립트와 그림 어드민이 한다.
import { z } from "zod"

const artMeta = z
  .strictObject({
    /** 그림 ID. 그림 폴더 이름과 같다. */
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    /** 그림이 그린 것의 이름. 품종의 표시명과 다를 수 있다(새우 그림을 대하가 쓴다). */
    name: z.string().min(1),
    /** 그림 검수 상태. reviewed만 웹에 나갈 수 있다. */
    review: z.enum(["reviewed", "unreviewed"]),
    /** 그림 검수를 마친 날(YYYY-MM-DD). 이 파일을 두기 전에 웹에 나간 그림은 날짜를 몰라 없다. */
    reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    /** 그릴 때 본 참고 자료(URL, 자료명). 따라 그린 원본이 아니라 관찰에 쓴 자료다. */
    references: z.array(z.string().min(1)),
  })
  .refine((meta) => meta.review === "reviewed" || !meta.reviewedAt, "미검수 그림에 검수일이 있다")

export type ArtMeta = z.infer<typeof artMeta>

/** 그림 메타를 검사해 돌려준다. */
export function parseArtMeta(json: unknown): ArtMeta {
  return artMeta.parse(json)
}

/** 그림 메타를 파일에 쓸 글로 만든다. */
export function formatArtMeta(meta: ArtMeta): string {
  return `${JSON.stringify(meta, null, 2)}\n`
}
