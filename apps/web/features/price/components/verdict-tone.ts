import type { VerdictKind } from "@workspace/price/types"

// 판정 종류 → 판정 색 클래스. 토큰은 packages/ui globals.css의 --color-verdict-*.
// Tailwind가 클래스를 찾을 수 있게 문자열을 통째로 쓴다. solid는 판정 색을 꽉 채운 칩(흰 글자).
export const VERDICT_TONE: Record<VerdictKind, { fill: string; solid: string; svg: string; text: string; wash: string; ink: string; border: string }> = {
  cheap: {
    fill: "bg-verdict-cheap",
    solid: "bg-verdict-cheap text-surface",
    svg: "fill-verdict-cheap",
    text: "text-verdict-cheap",
    wash: "bg-verdict-cheap-wash",
    ink: "text-verdict-cheap-ink",
    border: "border-verdict-cheap",
  },
  normal: {
    fill: "bg-verdict-normal",
    solid: "bg-verdict-normal text-surface",
    svg: "fill-verdict-normal",
    text: "text-verdict-normal",
    wash: "bg-verdict-normal-wash",
    ink: "text-verdict-normal-ink",
    border: "border-verdict-normal",
  },
  pricey: {
    fill: "bg-verdict-pricey",
    solid: "bg-verdict-pricey text-surface",
    svg: "fill-verdict-pricey",
    text: "text-verdict-pricey",
    wash: "bg-verdict-pricey-wash",
    ink: "text-verdict-pricey-ink",
    border: "border-verdict-pricey",
  },
  none: {
    fill: "bg-verdict-none",
    solid: "bg-verdict-none text-surface",
    svg: "fill-verdict-none",
    text: "text-verdict-none",
    wash: "bg-verdict-none-wash",
    ink: "text-verdict-none-ink",
    border: "border-verdict-none",
  },
}
