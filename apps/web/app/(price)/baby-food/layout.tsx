import { SeasonalTabs } from "@/features/seasonal/components/sub-tabs"

import "@/features/baby-food/pairing.css"

export default function BabyFoodLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SeasonalTabs />
      {children}
    </>
  )
}
