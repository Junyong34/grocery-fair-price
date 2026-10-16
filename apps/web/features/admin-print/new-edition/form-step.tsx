export function FormStep({ order, title, id, children }: { order: number; title: string; id: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-3">
      <h3 id={id} className="flex items-center gap-2.5 text-base font-semibold text-ink">
        <span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-stone text-[13px] font-semibold text-canvas tabular-nums">
          {order}
        </span>
        {title}
      </h3>
      {children}
    </li>
  )
}
