import type { FoodContent, FoodContentBlock } from "@workspace/seasonal/data/food-content"

/**
 * 1i 품종 상세의 조사 원고(한 줄 소개, 대표 산지, 개요~유통 특성). 원본은 packages/seasonal/content/foods/*.md다.
 * 서버 컴포넌트다. 시트는 이 본문을 children으로 받으니 원고 전체가 브라우저 번들에 들어가지 않는다.
 */
export function FoodContentBody({ content }: { content: FoodContent }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-base leading-relaxed text-ink">{content.summary}</p>
      {content.sections.map((section, index) => (
        <section key={section.title} aria-labelledby={`food-content-${index}`} className="flex flex-col gap-2">
          <h2 id={`food-content-${index}`} className="font-heading text-lg font-bold text-ink">
            {section.title}
          </h2>
          {section.blocks.map((block, blockIndex) => (
            <Block key={blockIndex} block={block} />
          ))}
        </section>
      ))}
    </div>
  )
}

function Block({ block }: { block: FoodContentBlock }) {
  if (block.kind === "paragraph") return <p className="text-base leading-relaxed text-ink">{block.text}</p>
  return (
    <ul className="flex list-disc flex-col gap-1.5 ps-5 text-base leading-relaxed text-ink marker:text-caption">
      {block.items.map((item, index) => (
        <li key={index}>
          {item.label && <strong className="me-1.5 font-semibold">{item.label}</strong>}
          {item.text}
        </li>
      ))}
    </ul>
  )
}

/** 원고의 대표 산지. 관련 명절 근처에 둔다. */
export function FoodContentOrigin({ origin }: { origin: string }) {
  return (
    <section aria-labelledby="food-content-origin" className="flex flex-col gap-2">
      <h2 id="food-content-origin" className="text-sm font-semibold text-stone">
        대표 산지
      </h2>
      <p className="text-sm text-ink">{origin}</p>
    </section>
  )
}

/** 원고의 출처. 검색엔진과 사용자가 내용의 근거를 볼 수 있게 상세 맨 아래에 둔다. */
export function FoodContentSources({ sources }: { sources: FoodContent["sources"] }) {
  return (
    <section aria-labelledby="food-content-sources" className="flex flex-col gap-2">
      <h2 id="food-content-sources" className="text-sm font-semibold text-stone">
        출처
      </h2>
      <ul className="flex flex-col gap-1.5 text-xs leading-5 text-caption">
        {sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noreferrer" className="text-stone underline-offset-2 hover:text-ink hover:underline">
              {source.org} · {source.title}
            </a>{" "}
            · {source.checkedAt} 확인
          </li>
        ))}
      </ul>
    </section>
  )
}
