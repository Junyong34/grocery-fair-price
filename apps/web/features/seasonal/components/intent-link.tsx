"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, type ComponentProps } from "react"

type IntentLinkProps = Omit<ComponentProps<typeof Link>, "prefetch" | "href"> & { href: string }

/**
 * 화면에 들어올 때는 프리패치하지 않고, 누를 기미(포인터 올림·포커스·누르기 시작)가 보일 때 한 번만 프리패치하는 Link.
 * 그림 링크가 수백 개인 이달 화면에서 스크롤하거나 목록을 펼칠 때마다 수십 건씩 나가던 프리패치를 없앤다.
 * App Router에서 prefetch={false}는 hover 프리패치까지 끄므로 직접 부른다.
 */
export function IntentLink({ href, onPointerEnter, onPointerDown, onFocus, ...props }: IntentLinkProps) {
  const router = useRouter()
  const done = useRef(false)
  const prefetch = () => {
    if (done.current) return
    done.current = true
    router.prefetch(href)
  }
  return (
    <Link
      {...props}
      href={href}
      prefetch={false}
      onPointerEnter={(event) => {
        prefetch()
        onPointerEnter?.(event)
      }}
      onPointerDown={(event) => {
        prefetch()
        onPointerDown?.(event)
      }}
      onFocus={(event) => {
        prefetch()
        onFocus?.(event)
      }}
    />
  )
}
