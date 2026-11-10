import {
  BABY_FRUIT_STAGES,
  getFruitsByStage,
} from "@workspace/seasonal/data/infant-fruits"

import "./fruits-print.css"

export function FruitsPrint({
  title = "월령별 아기 과일 시기 & 안전 가이드",
  orientation = "portrait",
}: {
  title?: string
  orientation?: "portrait" | "landscape"
}) {
  return (
    <div className="fruits-print-document">
      <section
        className="fruits-print-sheet print-sheet"
        data-paper="A4"
        data-orientation={orientation}
      >
        <header className="fruits-print-head">
          <div>
            <p className="fruits-print-brand">장볼날 · 냉장고 부착용 이유식 가이드</p>
            <h2 className="fruits-print-title">
              {title}
            </h2>
          </div>
          <div className="fruits-print-head-sub">
            <p>소아청소년과 전문의 지침 기반</p>
            <p>질식 예방 손질법 & 금기 식재료</p>
          </div>
        </header>

        {/* 6단계 과일 박스 */}
        <div className="fruits-print-stages">
          {BABY_FRUIT_STAGES.map((stage) => {
            const fruits = getFruitsByStage(stage.id)
            return (
              <div key={stage.id} className="fruits-print-stage-box">
                <div className="fruits-print-stage-head">
                  <h3>
                    {stage.name} <small>({stage.subTitle})</small>
                  </h3>
                  <span>{fruits.length}종</span>
                </div>
                <ul className="fruits-print-items-list">
                  {fruits.slice(0, 5).map((fruit) => (
                    <li key={fruit.id} className="fruits-print-item-row">
                      <span className="fruits-print-item-name">
                        <span
                          className={`fruits-print-item-tag ${
                            fruit.safetyStatus === "safe"
                              ? "tag-safe"
                              : fruit.safetyStatus === "caution"
                                ? "tag-caution"
                                : "tag-conventional"
                          }`}
                        >
                          {fruit.safetyStatus === "safe"
                            ? "안전"
                            : fruit.safetyStatus === "caution"
                              ? "주의"
                              : "관행"}
                        </span>
                        {fruit.name}
                      </span>
                      <span className="fruits-print-item-tip">
                        {fruit.cuttingGuide
                          ? fruit.cuttingGuide.split("!")[0]
                          : fruit.prepMethod.split(".")[0]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* 하단 돌 전 절대 금지 & 두 돌 주의 경고 */}
        <div className="fruits-print-danger-box">
          <p className="fruits-print-danger-title">
            <span>🚨 영유아기 절대 금지 & 필수 안전 수칙</span>
          </p>
          <div className="fruits-print-danger-grid">
            <div className="fruits-print-danger-item">
              <strong>돌 전(12개월 미만) 절대 금지:</strong> 꿀(영아 보툴리누스증
              사망 위험, 가열해도 포자 불사멸), 생우유(신장 과부하·빈혈), 생과일주스(밥 거부·비만),
              생식류(식중독 위험).
            </div>
            <div className="fruits-print-danger-item">
              <strong>만 4~5세까지 질식 주의:</strong> 통견과류(땅콩/아몬드 통째
              금지), 통포도/체리/방울토마토 반드시 세로 4등분 컷팅 필수.
              첨가당(설탕) 두 돌까지 0g 권고.
            </div>
          </div>
        </div>

        <footer className="fruits-print-foot">
          <span>
            * 본 자료는 최신 소아과학 가이드라인(AAP, 대한소아청소년과학회)을
            반영한 참고용 요약표입니다.
          </span>
          <span>장볼날 · jangbol.kr/baby-food/fruits</span>
        </footer>
      </section>
    </div>
  )
}
