import Image from "next/image"

import { isDishDrawn, type TraditionalDish } from "@workspace/seasonal/data/dishes"
import { cn } from "@workspace/ui/lib/utils"

/**
 * 전통 음식 일러스트 자리(1g). FoodImage와 같은 모양이지만 품종과 섞지 않으려 따로 둔다.
 * 그림이 있으면 public/dishes/<id>/color.svg(pnpm foods:sync), 없으면 옅은 원으로 대신한다.
 * 이름은 카드에 따로 쓰므로 원 안에는 쓰지 않는다. 크기는 부모가 정한다(정사각형으로 채운다).
 */
export function DishImage({ dish, sizes, className }: { dish: TraditionalDish; sizes: string; className?: string }) {
  if (!isDishDrawn(dish.id)) {
    return <div aria-hidden className={cn("aspect-square w-full rounded-full bg-hairline/60", className)} />
  }
  return (
    <div className={cn("relative aspect-square w-full", className)}>
      <Image
        src={`/dishes/${dish.id}/color.svg`}
        alt=""
        fill
        sizes={sizes}
        draggable={false}
        className="object-contain select-none"
      />
    </div>
  )
}
