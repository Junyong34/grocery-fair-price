import { SeasonalTabs } from "@/features/seasonal/components/sub-tabs"

export default function SeasonLayout({ children }: LayoutProps<"/seasonal">) {
  return (
    <>
      <SeasonalTabs />
      {children}
    </>
  )
}
