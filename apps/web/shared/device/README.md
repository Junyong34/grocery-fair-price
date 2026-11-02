# 기기 판별

[react-device-check](https://github.com/umsungjun/react-device-check)의 커밋 `6d7dc8363919a8edb40af2865c2151191fb27135`에서 판별 엔진·브라우저 신호·구독 저장소를 가져왔다. MIT 저작권과 이용 조건은 옆의 `LICENSE`에 보존한다. React 17 호환 계층과 DPR 훅은 가져오지 않고 React 19의 `useSyncExternalStore`를 직접 사용한다. 별도 의존성이나 Provider는 없다.

클라이언트 컴포넌트에서 사용한다.

```tsx
"use client"

import { useDevice } from "@/shared/use-device"

export function DownloadButton() {
  const { isHydrated, isMobile, os } = useDevice()

  function download() {
    if (!isHydrated) return
    if (isMobile && os === "ios") {
      // iPhone 전용 처리를 실행한다.
      return
    }
    // 나머지 기기에서 실행할 처리를 넣는다.
  }

  return (
    <button disabled={!isHydrated} onClick={download}>
      다운로드
    </button>
  )
}
```

- `type`: `mobile | tablet | desktop`. `isMobile`은 휴대폰만 뜻하며 태블릿은 `isTablet`으로 구분한다.
- `os`: `ios | android | windows | macos | linux | unknown`.
- `isTouchPrimary`: 주 포인터가 터치인지, `orientation`: `portrait | landscape`. 미디어 쿼리가 바뀌면 갱신한다. 마지막 사용자가 사라지면 리스너를 해제한다.
- `isHydrated`: 서버와 첫 하이드레이션에서는 `false`, 브라우저 판별 후 `true`. 초기 `desktop`은 실제 판정이 아니므로 기기별 부작용과 화면 분기는 이 값으로 먼저 확인한다.
- 편의 훅: `useDeviceType`, `useOS`, `useIsMobile`, `useIsTablet`, `useIsDesktop`. 같은 모듈에서 가져온다.

기기 유형과 OS는 페이지가 살아 있는 동안 고정된다. 화면 크기를 줄여도 데스크톱이 모바일로 바뀌지 않는다. 반응형 배치는 CSS로 처리한다. UA 위장·브라우저 신호 제한 때문에 판별은 추정값이며 권한 검사에 사용하지 않는다. Chrome OS는 `linux`, TV는 `desktop`으로 분류한다.
