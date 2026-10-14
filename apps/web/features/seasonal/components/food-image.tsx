import Image from "next/image"

import { isDrawn, type Food } from "@workspace/seasonal/data/foods"
import { cn } from "@workspace/ui/lib/utils"

/**
 * 품종 일러스트 자리. 일러스트를 바꾸거나 늘릴 때 고칠 곳은 이 컴포넌트 하나다.
 * 그림이 있으면 public/foods/<id>/<variant>.svg(pnpm foods:sync), 없으면 이름 카드로 대신한다.
 * motion 변형은 SVG 안의 CSS 키프레임으로 움직인다. 줄인 모션 설정도 SVG가 스스로 처리한다.
 * 크기는 부모가 정한다(정사각형으로 채운다).
 */
export function FoodImage({
  food,
  variant = "color",
  sizes = "120px",
  preload = false,
  showName = true,
  className,
}: {
  food: Pick<Food, "id" | "name">
  variant?: "color" | "motion"
  /** next/image sizes. SVG라 해상도는 바뀌지 않지만 레이아웃 계산에 쓰인다. */
  sizes?: string
  /** 첫 화면 큰 그림(LCP)이면 true. Next 16에서 priority 대신 preload를 쓴다. */
  preload?: boolean
  /** 그림이 없을 때 이름 카드 안에 이름을 쓸지. 이름 라벨이 따로 있는 곳(흩어진 배치)은 false. */
  showName?: boolean
  className?: string
}) {
  if (!isDrawn(food.id)) {
    return (
      // 글자 크기는 카드 폭을 따른다(컨테이너 단위 cqi).
      <div role="img" aria-label={food.name} className={cn("aspect-square w-full @container", className)}>
        <div className="grid size-full place-items-center rounded-full border border-dashed border-silver bg-surface/50 p-[12%] text-center font-heading leading-tight text-stone [font-size:clamp(9px,20cqi,18px)]">
          {showName && food.name}
        </div>
      </div>
    )
  }
  return (
    <div className={cn("relative aspect-square w-full", className)}>
      <Image
        src={`/foods/${food.id}/${variant}.svg`}
        alt={food.name}
        fill
        sizes={sizes}
        preload={preload}
        draggable={false}
        className="object-contain select-none"
      />
    </div>
  )
}
