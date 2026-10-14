import { foodsInMonth } from "@workspace/seasonal/data/foods"
import { MONTHS } from "@workspace/seasonal/data/months"

import { WheelCompare } from "./wheel-compare"

export const metadata = { title: "달 이동 휠 비교" }

// 2a 데스크톱 왼쪽 패널의 달 이동 휠 비교(spec "option-wheel 형태"). 실제 패널 폭(280px)으로 나란히 둔다.
export default function Page() {
  const counts = MONTHS.map((month) => foodsInMonth(month).length)
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl">달 이동 휠 비교</h1>
        <p className="text-sm text-stone">
          2a 데스크톱 왼쪽 패널(폭 280px)에 들어갈 cojeev option-wheel의 두 형태다. 마우스 휠, 클릭, 화살표 키로 움직여 본다.
        </p>
      </div>
      <WheelCompare counts={counts} />
    </main>
  )
}
