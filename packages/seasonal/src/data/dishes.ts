import { DISH_ROWS } from "./dish-rows"
import { DRAWN_DISH_IDS } from "./drawn-dishes.generated"

/** 전통 음식 전체(dish-rows.ts). 품종이 아니므로 품종 상세로 연결하지 않고, 품종 타입과 섞지 않는다. */
export const TRADITIONAL_DISHES = DISH_ROWS

export type TraditionalDish = (typeof TRADITIONAL_DISHES)[number]
export type DishId = TraditionalDish["id"]

/** id로 전통 음식 찾기. 없는 id면 undefined. */
export function findDish(id: string): TraditionalDish | undefined {
  return TRADITIONAL_DISHES.find((dish) => dish.id === id)
}

/** id 목록을 이름 목록으로. 문구(검색 설명, 공유 이미지)에 쓴다. */
export function dishNames(ids: readonly DishId[]): string[] {
  return ids.map((id) => findDish(id)!.name)
}

const DRAWN = new Set<string>(DRAWN_DISH_IDS)

/** 그림이 있는 전통 음식인지. 없으면 화면에서 이름 카드로 대신한다. */
export function isDishDrawn(id: string): boolean {
  return DRAWN.has(id)
}
