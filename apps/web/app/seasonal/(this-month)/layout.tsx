import { SeasonalTabs } from "@/features/seasonal/components/sub-tabs"

export default function ThisMonthLayout({ children }: LayoutProps<"/seasonal">) {
  return (
    <>
      <SeasonalTabs />
      {children}
    </>
  )
}
