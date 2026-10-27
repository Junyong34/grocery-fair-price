"use client"

import { OverlayProvider } from "overlay-kit"
import { useEffect } from "react"

import { TooltipProvider } from "@workspace/ui/components/tooltip"

import { rehydrateDeviceStores } from "./device-store"

// 앱 전역 클라이언트 Provider. overlay.open()으로 여는 시트·다이얼로그가 여기에 그려지고, 툴팁이 지연 시간을 나눠 쓴다.
export function Providers({ children }: { children: React.ReactNode }) {
  // 기기에 저장된 값(먹음 기록 · 설정 · 배치 · 담은 품종 · 최근 본 품종)은 하이드레이션이 끝난 뒤에 불러온다.
  // 서버 HTML과 첫 렌더가 같아야 하기 때문이다.
  useEffect(() => rehydrateDeviceStores(), [])
  return (
    <TooltipProvider>
      <OverlayProvider>{children}</OverlayProvider>
    </TooltipProvider>
  )
}
