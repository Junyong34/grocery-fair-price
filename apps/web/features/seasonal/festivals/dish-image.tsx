import Image from "next/image"

import { isDishDrawn, type TraditionalDish } from "@workspace/seasonal/data/dishes"
import { cn } from "@workspace/ui/lib/utils"

/**
 * 전통 음식 일러스트 자리(1g). FoodImage와 같은 모양이지만 품종과 섞지 않으려 따로 둔다.
 * 그림이 있으면 public/dishes/<id>/color.svg(pnpm foods:sync), 없으면 한지 원형 인장(첫 두 글자)으로 대신한다.
 * 크기는 부모가 정한다(정사각형으로 채운다).
 */
export function DishImage({
  dish,
  sizes,
  preload = false,
  className,
}: {
  dish: TraditionalDish
  sizes: string
  preload?: boolean
  className?: string
}) {
  if (!isDishDrawn(dish.id)) {
    return (
      <div
        aria-hidden
        className={cn(
          "@container grid aspect-square w-full place-items-center rounded-full border border-hairline bg-canvas/90 font-heading font-semibold text-stone select-none",
          className
        )}
      >
        <span className="[font-size:clamp(11px,34cqi,18px)] leading-none">{dish.name.slice(0, 2)}</span>
      </div>
    )
  }
  return (
    <div className={cn("relative aspect-square w-full", className)}>
      <Image
        src={`/dishes/${dish.id}/color.svg`}
        alt=""
        fill
        sizes={sizes}
        preload={preload}
        draggable={false}
        className="object-contain select-none"
      />
    </div>
  )
}
