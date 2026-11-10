import Image from "next/image"

import { PAIRING_ART } from "./data"

/** 재료 그림. "브로콜리/콜리플라워"는 두 그림을 겹쳐 둔다. */
export function IngredientArt({ name, src }: { name: string; src?: string }) {
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
          />
        ) : (
          <span key={index} className="pairing-placeholder" />
        )
      )}
    </span>
  )
}
