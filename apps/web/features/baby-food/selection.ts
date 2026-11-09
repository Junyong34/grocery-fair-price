import { PAIRINGS } from "@workspace/seasonal/data/infant-pairings"

type Query = Record<string, string | string[] | undefined>

export async function readPairingSelection(searchParams: Promise<Query>) {
  const { food } = await searchParams
  const names = new Set(Array.isArray(food) ? food : [food])
  return {
    selected: PAIRINGS.filter((row) => names.has(row.name)).map(
      ({ name }) => name
    ),
  }
}
