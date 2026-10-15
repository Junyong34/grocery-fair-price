"use client"

import { overlay } from "overlay-kit"
import { useRef } from "react"

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

/** 이만큼(px) 끌어내리거나, 이보다 빠르게(px/ms) 튕겨 내리면 닫는다. */
const CLOSE_DISTANCE = 96
const CLOSE_VELOCITY = 0.5

/**
 * 손잡이·제목 줄을 아래로 끌어 닫는다. 끄는 동안은 시트를 CSS translate로 따라 내린다.
 * transform이 아니라 translate를 쓰는 건 cojeev Drawer의 열고 닫는 애니메이션(transform)과 겹쳐 쓰기 위해서다.
 * 닫을 때는 끌어내린 자리에서 이어서 내려가고, 덜 끌었으면 제자리로 돌아온다.
 */
function useDragToClose(onClose: () => void) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{
    id: number
    startY: number
    dy: number
    lastY: number
    lastT: number
    velocity: number
  } | null>(null)

  const settle = () => {
    const sheet = sheetRef.current
    if (!sheet) return
    sheet.style.transition = "translate 220ms cubic-bezier(.2,.8,.2,1)"
    sheet.style.translate = ""
  }

  const handlers = {
    onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
      // 제목 줄의 버튼(공유 등)은 그대로 누르게 둔다.
      if (event.button !== 0 || (event.target as Element).closest("button, a"))
        return
      drag.current = {
        id: event.pointerId,
        startY: event.clientY,
        dy: 0,
        lastY: event.clientY,
        lastT: event.timeStamp,
        velocity: 0,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
      if (sheetRef.current) sheetRef.current.style.transition = "none"
    },
    onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
      const state = drag.current
      if (!state || state.id !== event.pointerId) return
      state.dy = Math.max(0, event.clientY - state.startY)
      const dt = event.timeStamp - state.lastT
      if (dt > 0) state.velocity = (event.clientY - state.lastY) / dt
      state.lastY = event.clientY
      state.lastT = event.timeStamp
      if (sheetRef.current) sheetRef.current.style.translate = `0 ${state.dy}px`
    },
    onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
      const state = drag.current
      if (!state || state.id !== event.pointerId) return
      drag.current = null
      if (
        state.dy > CLOSE_DISTANCE ||
        (state.dy > 8 && state.velocity > CLOSE_VELOCITY)
      )
        onClose()
      else settle()
    },
    onPointerCancel() {
      drag.current = null
      settle()
    },
  }
  return { sheetRef, handlers }
}

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
  const { sheetRef, handlers } = useDragToClose(onClose)
  return (
    <Drawer open={open} onOpenChange={(next) => !next && onClose()}>
      <DrawerContent
        ref={sheetRef}
        className={sheetClass}
        onCloseAutoFocus={() => onExited?.()}
        // 첫 초점은 시트 자체에 둔다. 첫 버튼(공유 등)에 가면 눌린 것처럼 테두리가 보인다. Tab으로 버튼에 간다.
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          ;(event.currentTarget as HTMLElement).focus()
        }}
      >
        {/* 손잡이·제목 줄: 아래로 끌어 닫는다(touch-none: 끄는 동안 페이지가 스크롤되지 않게). */}
        <div
          {...handlers}
          className="-mx-5 -mt-3 cursor-grab touch-none px-5 pt-3 select-none active:cursor-grabbing"
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
        </div>
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
