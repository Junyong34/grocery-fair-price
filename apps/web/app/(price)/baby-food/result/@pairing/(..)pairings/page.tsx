import { Suspense } from "react"

import { PAIRING_SHEETS } from "@workspace/seasonal/data/infant-pairings"
import { PairingGrid } from "@/features/baby-food/pairing-grid"
import { PairingModalRoute } from "@/features/baby-food/pairing-modal"
import { readPairingSelection } from "@/features/baby-food/selection"

export { metadata } from "../../../pairings/page"

export default function Page({
  searchParams,
}: PageProps<"/baby-food/pairings">) {
  return (
    <Suspense>
      <Overview searchParams={searchParams} />
    </Suspense>
  )
}

async function Overview({
  searchParams,
}: Pick<PageProps<"/baby-food/pairings">, "searchParams">) {
  const { selected } = await readPairingSelection(searchParams)
  const sheets = PAIRING_SHEETS.map(({ title, rows }) => ({
    title,
    names: rows.map(({ name }) => name),
    content: <PairingGrid rows={rows} selected={selected} />,
  }))
  return <PairingModalRoute sheets={sheets} />
}
