import { SeasonalShell } from "@/features/seasonal/components/seasonal-shell"

export default function SeasonalLayout({ children, sheet }: LayoutProps<"/seasonal">) {
  return <SeasonalShell sheet={sheet}>{children}</SeasonalShell>
}
