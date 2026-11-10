import {
  PROHIBITED_FOODS,
  type ProhibitedFood,
} from "@workspace/seasonal/data/infant-fruits"

import { FRUIT_GUIDE_ART } from "../data"
import { IngredientArt } from "../ingredient-art"

function SafetyCard({ item }: { item: ProhibitedFood }) {
  const src = FRUIT_GUIDE_ART[item.iconId]

  return (
    <article id={`safety-${item.id}`} className="safety-card">
      <div className="safety-card-head">
        {src && <IngredientArt name={item.name} src={src} />}
        <h4 className="safety-card-name">{item.name}</h4>
      </div>
      <dl className="safety-card-body">
        <dt>왜 위험한가요</dt>
        <dd>{item.reason}</dd>
        <dt>이렇게 하세요</dt>
        <dd className="safety-card-guide">{item.guide}</dd>
      </dl>
    </article>
  )
}

const GROUPS = [
  {
    id: "before-12m",
    tone: "danger",
    title: "돌 전에는 먹이지 마세요",
    note: "만 12개월 전",
    match: (item: ProhibitedFood) => item.targetStage === "before-12m",
  },
  {
    id: "after-12m",
    tone: "caution",
    title: "두 돌까지 조심하세요",
    note: "만 24개월까지, 일부는 만 5세까지",
    match: (item: ProhibitedFood) => item.targetStage !== "before-12m",
  },
] as const

export function SafetyGuideSection() {
  return (
    <section className="safety-section" aria-labelledby="safety-heading">
      <header className="safety-section-header">
        <h2 id="safety-heading">시기별 금지·주의 식재료</h2>
        <p>대한소아청소년과학회와 AAP 지침을 바탕으로 정리했어요.</p>
      </header>

      {GROUPS.map((group) => {
        const items = PROHIBITED_FOODS.filter(group.match)
        if (items.length === 0) return null
        return (
          <div
            key={group.id}
            className="safety-cards-group"
            data-tone={group.tone}
            role="group"
            aria-labelledby={`safety-group-${group.id}`}
          >
            <h3 id={`safety-group-${group.id}`} className="safety-group-title">
              {group.title}
              <small>{group.note}</small>
            </h3>
            <div className="safety-cards-grid">
              {items.map((item) => (
                <SafetyCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )
}
