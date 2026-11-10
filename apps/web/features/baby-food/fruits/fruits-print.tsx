import { INFANT_FRUIT_PRINT_COPY } from "@workspace/seasonal/data/copy"
import {
  BABY_FRUIT_STAGES,
  BABY_FRUITS,
  PROHIBITED_FOODS,
  type BabyFruit,
  type ProhibitedFood,
} from "@workspace/seasonal/data/infant-fruits"

import { FRUIT_GUIDE_ART } from "../data"
import { IngredientArt } from "../ingredient-art"
import { SAFETY_BADGES } from "./fruit-badges"

import "./fruits-print.css"

/** 4~5개월은 과일을 시작하지 않는 단계라 따로 한 줄로 두고, 나머지 단계에 처음 줄 수 있는 과일을 한 번씩 놓는다. */
const STAGE_ROWS = BABY_FRUIT_STAGES.filter((stage) => stage.id !== "4-5-months").map((stage) => ({
  stage,
  fruits: BABY_FRUITS.filter((fruit) => fruit.firstStage === stage.id),
}))

/** "생우유 (소젖)" → ["생우유", "소젖"] */
function splitName(name: string): [string, string | undefined] {
  const match = /^(.+?)\s*\((.+)\)$/.exec(name)
  return match ? [match[1]!, match[2]] : [name, undefined]
}

function StageNumber({ name }: { name: string }) {
  // "9~11개월" → 숫자와 단위를 나눠 숫자만 크게 쓴다. "12개월+"는 "12+".
  const match = /^([\d~]+)개월(\+?)$/.exec(name)
  if (!match) return <span className="fp-stage-num">{name}</span>
  return (
    <span className="fp-stage-num">
      {match[1]}
      {match[2]}
      <small>개월</small>
    </span>
  )
}

function FruitTile({ fruit }: { fruit: BabyFruit }) {
  const badge = SAFETY_BADGES[fruit.safetyStatus]
  return (
    <li className="fp-fruit" data-tone={badge.tone}>
      <IngredientArt name={fruit.name} src={FRUIT_GUIDE_ART[fruit.id]} eager />
      <span className="fp-fruit-name">
        {fruit.name}
        {fruit.chokingRisk && <span className="fp-choke">질식</span>}
      </span>
      <span className="fp-fruit-tip">{INFANT_FRUIT_PRINT_COPY.tips[fruit.id] ?? ""}</span>
    </li>
  )
}

function HazardItem({ item }: { item: ProhibitedFood }) {
  const [name, detail] = splitName(item.name)
  const src = FRUIT_GUIDE_ART[item.iconId]
  return (
    <li className="fp-hazard">
      {src ? <IngredientArt name={name} src={src} eager /> : <span className="pairing-art" aria-hidden />}
      <span className="fp-hazard-text">
        <strong>
          {name}
          {detail && <small> {detail}</small>}
        </strong>
        <span>{INFANT_FRUIT_PRINT_COPY.hazards[item.id] ?? ""}</span>
      </span>
    </li>
  )
}

export function FruitsPrint({
  title = "월령별 아기 과일 도감",
  orientation = "portrait",
}: {
  title?: string
  orientation?: "portrait" | "landscape"
}) {
  const before12 = PROHIBITED_FOODS.filter((item) => item.targetStage === "before-12m")
  const after12 = PROHIBITED_FOODS.filter((item) => item.targetStage !== "before-12m")
  const columns = Math.max(...STAGE_ROWS.map(({ fruits }) => fruits.length))

  return (
    <div className="fruits-print-document">
      <section
        className="fruits-print-sheet print-sheet"
        data-paper="A4"
        data-orientation={orientation}
        style={{ "--fp-cols": columns } as React.CSSProperties}
      >
        <header className="fp-head">
          <div>
            <p className="fp-brand">장볼날 · 냉장고에 붙여 두는 이유식 노트</p>
            <h2 className="fp-title">{title}</h2>
            <p className="fp-subtitle">{INFANT_FRUIT_PRINT_COPY.subtitle}</p>
          </div>
          <ul className="fp-legend">
            {Object.values(SAFETY_BADGES).map((badge) => (
              <li key={badge.tone} data-tone={badge.tone}>
                <i aria-hidden />
                {badge.label}
              </li>
            ))}
            <li>
              <span className="fp-choke">질식</span>꼭 잘게 잘라요
            </li>
          </ul>
        </header>

        <div className="fp-timeline">
          <div className="fp-row fp-row-note">
            <div className="fp-stage">
              <StageNumber name="4~5개월" />
              <span className="fp-stage-sub">준비기</span>
            </div>
            <p>{INFANT_FRUIT_PRINT_COPY.before6}</p>
          </div>
          {STAGE_ROWS.map(({ stage, fruits }) => (
            <div key={stage.id} className="fp-row">
              <div className="fp-stage">
                <StageNumber name={stage.name} />
                <span className="fp-stage-sub">{stage.subTitle}</span>
              </div>
              <ul className="fp-fruits">
                {fruits.map((fruit) => (
                  <FruitTile key={fruit.id} fruit={fruit} />
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="fp-hazards">
          <section className="fp-hazard-group" data-tone="danger">
            <h3>
              돌 전에는 먹이지 마세요<small>만 12개월 전</small>
            </h3>
            <ul>
              {before12.map((item) => (
                <HazardItem key={item.id} item={item} />
              ))}
            </ul>
          </section>
          <section className="fp-hazard-group" data-tone="caution">
            <h3>
              두 돌까지 조심하세요<small>통견과류는 만 4~5세까지</small>
            </h3>
            <ul>
              {after12.map((item) => (
                <HazardItem key={item.id} item={item} />
              ))}
            </ul>
          </section>
        </div>

        <footer className="fp-foot">
          <span>{INFANT_FRUIT_PRINT_COPY.footnote}</span>
          <span className="fp-foot-site">장볼날 · 월령별 과일 도감</span>
        </footer>
      </section>
    </div>
  )
}
