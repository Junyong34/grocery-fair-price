import { PriceShell } from "@/features/price/components/price-shell"

// 가격 화면(/, /search, /prices/*, /basket)의 셸. URL에는 그룹 이름이 들어가지 않는다.
export default function PriceLayout({ children }: LayoutProps<"/">) {
  return <PriceShell>{children}</PriceShell>
}
