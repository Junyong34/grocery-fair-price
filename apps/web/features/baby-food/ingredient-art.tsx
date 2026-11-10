import Image from "next/image"

import { PAIRING_ART } from "./data"

/** 재료 그림. "브로콜리/콜리플라워"는 두 그림을 겹쳐 둔다. eager는 인쇄물처럼 PDF로 찍는 화면에서 그림이 빠지지 않게 바로 불러온다. */
export function IngredientArt({ name, src, eager = false }: { name: string; src?: string; eager?: boolean }) {
  const paths = src
    ? [src]
    : name === "브로콜리/콜리플라워"
      ? [PAIRING_ART["브로콜리"], PAIRING_ART["콜리플라워"]]
      : [PAIRING_ART[name]]
  return (
    <span className="pairing-art" aria-hidden="true">
      {paths.map((path, index) =>
        path ? (
          <Image
            key={path}
            src={path}
            alt=""
            width={64}
            height={64}
            unoptimized
            loading={eager ? "eager" : "lazy"}
          />
        ) : (
          <span key={index} className="pairing-placeholder" />
        )
      )}
    </span>
  )
}
