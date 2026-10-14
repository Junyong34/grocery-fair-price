import { SeasonTabs } from "@/features/seasonal/components/sub-tabs"

export default function SeasonLayout({ children }: LayoutProps<"/seasonal">) {
  return (
    <>
      <SeasonTabs />
      {children}
    </>
  )
}
