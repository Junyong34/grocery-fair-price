"use client"

import { useRef, useState } from "react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

/**
 * 달력 칸의 공휴일 이름. 칸이 좁아 말줄임되면 마우스를 올리거나 눌러(터치) 전체 이름을 툴팁으로 본다.
 * 잘리지 않은 이름에는 툴팁을 띄우지 않는다.
 */
export function HolidayName({ names, className }: { names: string; className?: string }) {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLSpanElement>(null)
  // 잘렸는지는 열 때 잰다. 잘리지 않았으면 열지 않는다.
  const truncated = () => {
    const element = trigger.current
    return !!element && (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1)
  }

  return (
    // 마우스 올림·벗어남·포커스는 Radix가 열고 닫는다.
    <Tooltip open={open} onOpenChange={(next) => setOpen(next && truncated())}>
      {/* 핸들러는 TooltipTrigger에 단다. 여기서 막은 기본 동작이 있어야 Radix가 자기 닫기를 건너뛴다. */}
      <TooltipTrigger
        asChild
        // 터치·펜은 눌러 여닫는다. Radix는 누르면 툴팁을 닫으므로(마우스 포함) 기본 동작을 막는다.
        onPointerDown={(event) => {
          event.preventDefault()
          if (event.pointerType !== "mouse") setOpen((value) => !value && truncated())
        }}
        onClick={(event) => event.preventDefault()}
      >
        <span
          ref={trigger}
          role="button"
          tabIndex={-1}
          className={cn("cursor-default", className)}
        >
          {names}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        // 바깥을 누르면 닫히지만, 이름 자체를 누른 것은 위 핸들러가 여닫는다.
        onPointerDownOutside={(event) => {
          if (trigger.current?.contains(event.target as Node)) event.preventDefault()
        }}
      >
        {names}
      </TooltipContent>
    </Tooltip>
  )
}
