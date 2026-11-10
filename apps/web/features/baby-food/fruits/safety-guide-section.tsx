import { PROHIBITED_FOODS } from "@workspace/seasonal/data/infant-fruits"

import { FRUIT_GUIDE_ART } from "../data"
import { IngredientArt } from "../ingredient-art"

export function SafetyGuideSection() {
  const forbiddenList = PROHIBITED_FOODS.filter(
    (item) => item.targetStage === "before-12m"
  )
  const cautionList = PROHIBITED_FOODS.filter(
    (item) => item.targetStage === "before-24m"
  )

  return (
    <section className="safety-section" aria-labelledby="safety-heading">
      <div className="safety-section-header">
        <h2 id="safety-heading">🛡️ 영유아 시기별 금지 & 주의 식재료 도감</h2>
        <p>
          소아청소년과 전문의 가이드라인에 따른 돌 전 절대 금지 식품과 두 돌 전
          주의 식품입니다.
        </p>
      </div>

      {/* 돌 전 절대 금지 */}
      <div className="safety-cards-group">
        <h3 className="safety-group-title group-danger">
          <span aria-hidden="true">🚫</span>
          <span>만 12개월(돌) 이전 절대 금지 식품</span>
        </h3>
        <div className="safety-cards-grid">
          {forbiddenList.map((item) => {
            const src = FRUIT_GUIDE_ART[item.iconId]
            return (
              <article key={item.id} className="safety-card card-forbidden">
                <div className="safety-card-head">
                  <h4 className="safety-card-name">{item.name}</h4>
                  <span className="safety-card-badge badge-forbidden-pill">
                    돌 전 절대 금지
                  </span>
                </div>
                {src && <IngredientArt name={item.name} src={src} />}
                <p className="safety-card-reason">
                  <strong>위험 요인:</strong> {item.reason}
                </p>
                <p className="safety-card-guide">
                  <strong>대처 및 수칙:</strong> {item.guide}
                </p>
              </article>
            )
          })}
        </div>
      </div>

      {/* 두 돌 전 강력 주의 */}
      <div className="safety-cards-group">
        <h3 className="safety-group-title group-warning">
          <span aria-hidden="true">⚠️</span>
          <span>만 24개월(두 돌)까지 강력 주의·제한 식품</span>
        </h3>
        <div className="safety-cards-grid">
          {cautionList.map((item) => (
            <article key={item.id} className="safety-card card-caution">
              <div className="safety-card-head">
                <h4 className="safety-card-name">{item.name}</h4>
                <span className="safety-card-badge badge-caution-pill">
                  두 돌 전 주의
                </span>
              </div>
              <p className="safety-card-reason">
                <strong>위험 요인:</strong> {item.reason}
              </p>
              <p className="safety-card-guide">
                <strong>대처 및 수칙:</strong> {item.guide}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
