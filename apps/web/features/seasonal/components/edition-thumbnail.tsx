import Image from "next/image"

import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"
import type { Thumbnail } from "@workspace/seasonal/print/edition"
import { cn } from "@workspace/ui/lib/utils"

/**
 * 생성 때 찍은 쪽 그림 하나. 이미 480px WebP라 다시 줄이지 않는다.
 * 크림 용지는 화면 배경(canvas)과 같은 색이라, 테두리 선과 가깝고 먼 그림자를 겹쳐 종이 가장자리를 세운다.
 */
export function EditionThumbnail({ thumbnail, name, index = 0, className, priority }: { thumbnail: Thumbnail; name: string; index?: number; className?: string; priority?: boolean }) {
  return (
    <Image
      src={thumbnail.path}
      width={thumbnail.width}
      height={thumbnail.height}
      alt={DOWNLOADS_COPY.thumbnailAlt(name, index)}
      unoptimized
      priority={priority}
      className={cn(
        "h-auto w-full rounded-[3px] bg-surface shadow-[0_0_0_1px_rgb(0_0_0/0.07),0_1px_2px_rgb(0_0_0/0.08),0_8px_18px_-8px_rgb(0_0_0/0.28)]",
        className,
      )}
    />
  )
}

/** 썸네일을 올려 두는 받침(mat). 캔버스보다 한 톤 진해 크림·흰 용지가 모두 떠 보인다. 여백은 안에 든 종이 크기에 맞춰 부르는 쪽이 정한다. */
export function ThumbnailMat({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex items-center justify-center rounded-xl bg-mat", className)}>{children}</div>
}
