// 라우트 골격용 자리 표시 화면. 실제 화면을 만들면 지운다.
export function ScreenStub({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children?: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2 p-6">
      <span className="text-xs text-stone">와이어프레임 {id}</span>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {children}
    </section>
  )
}
