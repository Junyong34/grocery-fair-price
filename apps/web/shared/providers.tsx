"use client"

import { OverlayProvider } from "overlay-kit"

// 앱 전역 클라이언트 Provider. overlay.open()으로 여는 시트·다이얼로그가 여기에 그려진다.
export function Providers({ children }: { children: React.ReactNode }) {
  return <OverlayProvider>{children}</OverlayProvider>
}
