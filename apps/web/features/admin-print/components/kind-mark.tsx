import { ShapeMorph } from "@workspace/ui/components/shape"
import { cn } from "@workspace/ui/lib/utils"

import type { PrintKind } from "@workspace/seasonal/print/spec"

import { KIND_LOOKS } from "../constants"

/** ShapeMorph는 부모 크기를 꽉 채우므로(.v-shape-morph 100%) 크기는 감싸는 span에 준다. */
export function KindMark({ kind, className }: { kind: PrintKind; className?: string }) {
  const look = KIND_LOOKS[kind]
  return (
    <span aria-hidden="true" className={cn("block size-10 shrink-0", className)} style={{ color: `var(--v-${look.tone})` }}>
      <ShapeMorph name={look.shape} />
    </span>
  )
}
