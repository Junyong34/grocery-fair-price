/** 설정 화면의 섹션 하나: 작은 제목과 행 묶음(.scratch/shell-unify/spec.md 5장). */
export function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col">
      <h2 className="pb-2 text-[13px] font-semibold text-stone">{title}</h2>
      <div className="flex flex-col divide-y divide-hairline rounded-xl bg-pair-light px-4 py-1 text-pair-light-foreground">{children}</div>
    </section>
  )
}

/** 행 이름 옆에 붙는, 그 설정이 영향을 주는 곳(예: "제철달력"). */
export function SettingWhere({ children }: { children: React.ReactNode }) {
  return <span className="ml-1.5 rounded-full bg-gold-wash px-1.5 py-0.5 align-middle text-[11px] text-stone">{children}</span>
}
