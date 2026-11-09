import { PAIRINGS, PAIRING_AGES } from "./data"

type Query = Record<string, string | string[] | undefined>

export async function readPairingSelection(searchParams: Promise<Query>) {
  const { food, age } = await searchParams
  const names = new Set(Array.isArray(food) ? food : [food])
  return {
    selected: PAIRINGS.filter((row) => names.has(row.name)).map(
      ({ name }) => name
    ),
    age: PAIRING_AGES.find((option) => option === age) ?? "",
  }
}
