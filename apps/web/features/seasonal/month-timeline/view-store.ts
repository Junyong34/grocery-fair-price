import { create } from "zustand"

// 2b 보기 전환(열 수). 달을 바꿔도 유지되도록 페이지 밖에 둔다. 저장은 하지 않는다(새로 열면 기본값).
export const MOBILE_COLUMNS = [2, 4, 6] as const
export const DESKTOP_COLUMNS = [4, 6, 8] as const

type ViewState = {
  mobile: (typeof MOBILE_COLUMNS)[number]
  desktop: (typeof DESKTOP_COLUMNS)[number]
}

export const useMonthView = create<ViewState>()(() => ({
  mobile: 2,
  desktop: 4,
}))
