"use client"

import { OverlayProvider } from "overlay-kit"
import { useEffect } from "react"

import { useEatenStore } from "./eaten-store"

// 앱 전역 클라이언트 Provider. overlay.open()으로 여는 시트·다이얼로그가 여기에 그려진다.
export function Providers({ children }: { children: React.ReactNode }) {
  // 기기에 저장된 기록은 하이드레이션이 끝난 뒤에 불러온다. 서버 HTML과 첫 렌더가 같아야 하기 때문이다.
  useEffect(() => {
    void useEatenStore.persist.rehydrate()
  }, [])
  return <OverlayProvider>{children}</OverlayProvider>
}
