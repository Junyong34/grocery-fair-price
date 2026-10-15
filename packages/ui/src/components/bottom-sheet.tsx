"use client"

import { overlay } from "overlay-kit"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer"

// cojeev Drawer는 화면 아래에 떠 있는 어두운 트레이다. 와이어프레임의 하단 시트
// (크림 바탕, 위쪽만 둥근 모서리, 손잡이)로 쓰도록 위치와 색만 덮어쓴다.
const sheetClass =
  "outline-none [left:0] [right:0] [bottom:0] [max-height:88dvh] [border-radius:var(--r-sheet)_var(--r-sheet)_0_0] [background:var(--color-canvas)] [color:var(--color-ink)] [padding:var(--s-3)_var(--s-5)_calc(var(--s-6)_+_env(safe-area-inset-bottom))]"

type BottomSheetProps = {
  open: boolean
  onClose: () => void
  /** 닫힘 애니메이션이 끝나 시트가 DOM에서 빠진 뒤 호출된다. overlay-kit의 unmount를 넘긴다. */
  onExited?: () => void
  title: React.ReactNode
  /** 제목 줄 오른쪽 버튼(공유 등). 제목(h2) 밖에 둔다. */
  action?: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
}

export function BottomSheet({
  open,
  onClose,
  onExited,
  title,
  action,
  description,
  children,
  footer,
}: BottomSheetProps) {
  return (
    <Drawer open={open} onOpenChange={(next) => !next && onClose()}>
      <DrawerContent
        className={sheetClass}
        onCloseAutoFocus={() => onExited?.()}
        // 첫 초점은 시트 자체에 둔다. 첫 버튼(공유 등)에 가면 눌린 것처럼 테두리가 보인다. Tab으로 버튼에 간다.
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          ;(event.currentTarget as HTMLElement).focus()
        }}
      >
        <div
          aria-hidden="true"
          className="mx-auto h-1 w-10 rounded-full bg-silver"
        />
        <DrawerHeader className="flex-col gap-1">
          <div className="flex w-full items-center justify-between gap-3">
            <DrawerTitle className="text-left text-ink">{title}</DrawerTitle>
            {action && <div className="shrink-0">{action}</div>}
          </div>
          {/* drawer.css가 설명 색을 --v-on-ink(어두운 트레이 위 글자색)로 고정한다. 크림 바탕에 맞게 이 요소에서만 바꾼다. */}
          {description && (
            <DrawerDescription className="[--v-on-ink:var(--color-stone)]">
              {description}
            </DrawerDescription>
          )}
        </DrawerHeader>
        {children}
        {footer && <DrawerFooter>{footer}</DrawerFooter>}
      </DrawerContent>
    </Drawer>
  )
}

type OpenOptions = Omit<
  BottomSheetProps,
  "open" | "onClose" | "onExited" | "children" | "footer"
>

/**
 * 결과를 돌려받는 하단 시트를 연다. 바깥을 누르거나 Esc로 닫으면 null로 끝난다.
 *
 * const range = await openBottomSheet<"month" | "year">({ title: "범위" }, (choose) => (
 *   <Button onClick={() => choose("month")}>이번 달</Button>
 * ))
 */
export function openBottomSheet<T>(
  options: OpenOptions,
  render: (choose: (value: T) => void) => React.ReactNode
): Promise<T | null> {
  return overlay.openAsync<T | null>(({ isOpen, close, unmount }) => (
    <BottomSheet
      {...options}
      open={isOpen}
      onClose={() => close(null)}
      onExited={unmount}
    >
      <div className="grid gap-[var(--s-2)]">{render(close)}</div>
    </BottomSheet>
  ))
}
