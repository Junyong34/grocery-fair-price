import { preload as preloadResource } from "react-dom"

import { isDrawn, type Food } from "@workspace/seasonal/data/foods"
import { cn } from "@workspace/ui/lib/utils"

/**
 * 품종 일러스트 자리. 일러스트를 바꾸거나 늘릴 때 고칠 곳은 이 컴포넌트 하나다.
 * 그림이 있으면 public/foods/<id>/<variant>.svg(pnpm foods:sync), 없으면 이름 카드(옅은 베이지 원)로 대신한다.
 * motion 변형은 SVG 안의 CSS 키프레임으로 움직인다. 줄인 모션 설정도 SVG가 스스로 처리한다.
 * 크기는 부모가 정한다(정사각형으로 채운다).
 *
 * next/image를 쓰지 않는다. SVG는 최적화(크기별 변환)를 받지 못하는데, 그림마다 client 컴포넌트가 되어
 * 2a처럼 그림이 수백 개인 화면에서 하이드레이션 비용만 늘었다(.scratch/seasonal-render-perf). 일반 <img>는 서버 HTML로 끝난다.
 */
export function FoodImage({
  food,
  variant = "color",
  preload = false,
  showName = true,
  className,
}: {
  food: Pick<Food, "id" | "name">
  variant?: "color" | "motion"
  /** 첫 화면 큰 그림(LCP)이면 true. 미리 받고 지연 로딩하지 않는다. */
  preload?: boolean
  /** 그림이 없을 때 이름 카드 안에 이름을 쓸지. 이름 라벨이 따로 있는 곳(흩어진 배치)은 false. */
  showName?: boolean
  className?: string
}) {
  if (!isDrawn(food.id)) {
    return (
      // 글자 크기는 카드 폭을 따른다(컨테이너 단위 cqi).
      <div role="img" aria-label={food.name} className={cn("aspect-square w-full @container", className)}>
        <div className="grid size-full place-items-center rounded-full bg-hairline/60 p-[12%] text-center font-heading leading-tight text-stone [font-size:clamp(9px,20cqi,18px)]">
          {showName && food.name}
        </div>
      </div>
    )
  }
  const src = `/foods/${food.id}/${variant}.svg`
  if (preload) preloadResource(src, { as: "image", fetchPriority: "high" })
  return (
    <div className={cn("relative aspect-square w-full", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG라 next/image가 줄 이득이 없고 하이드레이션 비용만 든다(위 설명) */}
      <img
        src={src}
        alt={food.name}
        loading={preload ? "eager" : "lazy"}
        fetchPriority={preload ? "high" : undefined}
        decoding="async"
        draggable={false}
        className="absolute inset-0 size-full object-contain select-none"
      />
    </div>
  )
}
