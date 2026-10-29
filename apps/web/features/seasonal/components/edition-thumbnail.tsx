import Image from "next/image"

import { DOWNLOADS_COPY } from "@workspace/seasonal/data/copy"
import type { Thumbnail } from "@workspace/seasonal/print/edition"
import { cn } from "@workspace/ui/lib/utils"

/** 생성 때 찍은 쪽 그림 하나. 이미 480px WebP라 다시 줄이지 않는다. */
export function EditionThumbnail({ thumbnail, name, index = 0, className, priority }: { thumbnail: Thumbnail; name: string; index?: number; className?: string; priority?: boolean }) {
  return (
    <Image
      src={thumbnail.path}
      width={thumbnail.width}
      height={thumbnail.height}
      alt={DOWNLOADS_COPY.thumbnailAlt(name, index)}
      unoptimized
      priority={priority}
      className={cn("h-auto w-full rounded-[3px] bg-surface shadow-[0_1px_4px_rgb(0_0_0/0.12)]", className)}
    />
  )
}
