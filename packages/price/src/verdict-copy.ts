// 판정 풀이(GLOSSARY): 판정 하나를 판정 카드 · 요약 문장 · 검색 설명에 쓰는 문장으로 푼다.
// 같은 판정은 어느 화면에서나 이 함수 하나로 같은 풀이를 쓴다. 문구 조각은 copy.ts(PRICE_COPY.detail)에 있다.
// 사용자가 적은 가격을 평소가와 견주는 문장(내가 본 가격)은 판정 풀이가 아니다(copy.ts verdictDiff).

import { isAverageBasis, PRICE_COPY, VERDICT_WORD, verdictDiff, withJosa } from "./copy"
import { agoLabel, daysBetween, monthDay, won } from "./format"
import type { VarietyDetail, VerdictKind } from "./types"

const COPY = PRICE_COPY.detail

/** 판정 풀이에 필요한 판정 묶음의 필드. 품종 상세(VarietyDetail)를 그대로 넘기면 된다. */
export type VerdictSubject = Pick<
  VarietyDetail,
  "name" | "baseUnit" | "price" | "usual" | "verdict" | "surveyedOn" | "sampleSize" | "stale" | "meetsMinN" | "basis" | "priceSpread"
>

/** 판정을 읽을 때 주의할 점. 판정 카드가 이 순서대로 제목 + 설명 상자로 놓는다. */
export type VerdictNotice = {
  kind: "stale" | "fewSamples" | "brandSpread"
  title: string
  body: string
}

export type VerdictExplanation = {
  /** 큰 판정 낱말: "비싸요" */
  word: string
  /** 판정 낱말 아래 차이 한 줄: "최근 조사 결과를 보면 평소보다 9% 높아요". 판정 전이면 평소가가 없다는 말. */
  diffLine: string
  /** 판정 근거 한 줄. 판정 전이면 null. */
  basisLine: string | null
  notices: VerdictNotice[]
  /** 품종 상세 맨 아래 요약 한 문장. 검색 결과 · AI 답변이 그대로 인용할 수 있게 날짜(연도 포함) · 출처 · 표본 · 숫자를 담는다. */
  summary: string
  /** 검색 결과 설명(meta description) */
  seoDescription: string
}

/**
 * 판정 묶음 하나의 판정 풀이.
 * today("YYYY-MM-DD", 서울)는 오래됨 안내의 "N주 전"에만 쓴다. 모르면(정적 화면) null을 넘기고, 그때는 조사일만 쓴다.
 */
export function explainVerdict(subject: VerdictSubject, today: string | null): VerdictExplanation {
  const { verdict } = subject
  const judged = verdict.kind !== "none" && verdict.pct != null && subject.usual != null
  return {
    word: VERDICT_WORD[verdict.kind],
    diffLine: verdict.pct == null ? COPY.noUsual : `최근 조사 결과를 보면 ${verdictDiff(verdict.pct)}`,
    basisLine: verdict.kind === "none" ? null : COPY.verdictBasis,
    notices: notices(subject, today),
    summary: summary(subject, judged),
    seoDescription: seoDescription(subject, judged),
  }
}

function notices(subject: VerdictSubject, today: string | null): VerdictNotice[] {
  const list: VerdictNotice[] = []
  if (subject.stale) {
    const title =
      today == null ? COPY.staleOn(subject.surveyedOn) : COPY.stale(subject.surveyedOn, agoLabel(daysBetween(subject.surveyedOn, today)))
    list.push({ kind: "stale", title, body: COPY.staleNote })
  }
  // 표본 적음: 그날 조사한 곳이 같은 규격 평소의 절반에 못 미침. 표본 수를 모르면(null) 보지 않는다.
  if (subject.meetsMinN === false) {
    list.push({ kind: "fewSamples", title: COPY.fewSamples(subject.sampleSize), body: COPY.fewSamplesNote(subject.verdict.kind !== "none") })
  }
  // 품종 · 브랜드마다 값이 크게 다른 품종(쌀 등, judgment.md 5-3): 판정은 그대로 두고, 가격 하나로 싸다 · 비싸다를 정할 필요는 없다고 알린다.
  if (subject.priceSpread === "brand") {
    list.push({
      kind: "brandSpread",
      title: `${withJosa(subject.name, "은/는")} 품종 · 브랜드 · 도정일마다 값이 꽤 달라요`,
      body: `판정은 ${subject.name}값 흐름을 보는 참고로 봐 주세요`,
    })
  }
  return list
}

/** 판정 낱말에 붙는 끝: "비싸요." / "보통이에요." */
const VERDICT_END: Record<Exclude<VerdictKind, "none">, string> = { cheap: "싸요.", normal: "보통이에요.", pricey: "비싸요." }

/** "평소보다 9% 높아" / "평소와 같아": 판정 낱말 앞에 이어 쓰는 차이. */
function diffClause(pct: number): string {
  return verdictDiff(pct).replace(/요$/, "")
}

/**
 * 단위는 괄호 밖에 쓴다("고등어(국산) 1개"). 이름에 괄호가 있으면 "고등어(국산)(1개)"처럼 겹친다.
 * 판정 차이는 최근 조사 편차의 중간값이라 두 금액의 단순 차이와 다를 수 있어 "최근 조사 결과를 보면"을 붙인다.
 */
function summary(subject: VerdictSubject, judged: boolean): string {
  const { basis } = subject
  const scope = isAverageBasis(basis) ? basis.scope : `${basis.scope} ${subject.sampleSize}곳 중간값`
  const head = `${longDate(subject.surveyedOn)} ${basis.source} ${scope} 기준, ${subject.name} ${subject.baseUnit} 시세는 ${won(subject.price)}원이에요.`
  if (!judged) return `${head} 평소가가 아직 쌓이지 않아 판정 전이에요.`
  const kind = subject.verdict.kind as Exclude<VerdictKind, "none">
  return `${head} 평소가는 ${won(subject.usual!)}원이에요. 최근 조사 결과를 보면 ${diffClause(subject.verdict.pct!)} ${VERDICT_END[kind]}`
}

/** 판정은 하루 1~2번 바뀌므로 그날 시세와 판정을 넣어 검색 결과에서 바로 답이 보이게 한다. */
function seoDescription(subject: VerdictSubject, judged: boolean): string {
  const verdict = judged ? `${diffClause(subject.verdict.pct!)} ${VERDICT_WORD[subject.verdict.kind]}` : "평소가는 아직 쌓이는 중"
  return `${subject.name}(${subject.baseUnit}) 시세 ${won(subject.price)}원, ${verdict}(${monthDay(subject.surveyedOn)} ${subject.basis.source} 조사). 대형마트·전통시장은 얼마에 파는지도 견줘 보세요.`
}

/** "2026-11-03" → "2026년 11월 3일" */
function longDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number)
  return `${year}년 ${month}월 ${day}일`
}
