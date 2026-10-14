import { BottomSheetDemo } from "./bottom-sheet-demo"

export const metadata = { title: "하단 시트 예시" }

export default function Page() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">하단 시트 예시</h1>
        <p className="text-sm text-stone">
          overlay-kit으로 cojeev Drawer를 여는 두 가지 방법이다. 와이어프레임
          2a의 ⚙ 설정 시트를 단순하게 옮겼다.
        </p>
      </div>
      <BottomSheetDemo />
    </main>
  )
}
