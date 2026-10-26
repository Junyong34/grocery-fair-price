import type { Food } from "./foods"
import { orderSeasonMonths } from "./months"

/**
 * 품종 친숙도. 1은 누구나 흔히 사 먹는 품종, 2는 기본, 3은 지역·계절 특산처럼 드물게 먹는 품종이다.
 * 인쇄물에서 칸에 다 못 넣을 때 대표 달(peak) 다음 기준으로 쓴다. 조사로 검증한 값이 아니라 편집 판단이라 손으로 고친다.
 */
export type Familiarity = 1 | 2 | 3

/**
 * 1등급 품종과 그 품종의 최적 달. 연간 한 장(Y-A·Y-B·Y-C)은 한 품종을 한 해에 한 번, 이 달에만 놓는다.
 * 최적 달은 대표 달(peak) 안에서 고르고, 1등급이 한 달에 몰리지 않게 나눈다(딸기·굴은 12월이 아니라 1월).
 */
export const COMMON_FOODS: Readonly<Record<string, number>> = {
  // 1월
  strawberry: 1,
  oyster: 1,
  spinach: 1,
  // 2월
  "olive-flounder": 2,
  hallabong: 2,
  mussel: 2,
  // 3월
  "manila-clam": 3,
  // 4월
  garlic: 4,
  "long-arm-octopus": 4,
  // 5월
  lettuce: 5,
  cabbage: 5,
  "oriental-melon": 5,
  // 6월
  potato: 6,
  "cherry-tomato": 6,
  blueberry: 6,
  "korean-zucchini": 6,
  cucumber: 6,
  // 7월
  tomato: 7,
  onion: 7,
  corn: 7,
  plum: 7,
  watermelon: 7,
  abalone: 7,
  // 8월
  peach: 8,
  "garlic-chive": 8,
  squid: 8,
  eggplant: 8,
  "green-grape": 8,
  // 9월
  "yellow-croaker": 9,
  shrimp: 9,
  pear: 9,
  "shiitake-mushroom": 9,
  chestnut: 9,
  // 10월
  hairtail: 10,
  "blue-crab": 10,
  "green-onion": 10,
  radish: 10,
  "sweet-potato": 10,
  apple: 10,
  // 11월
  persimmon: 11,
  "sweet-pumpkin": 11,
  paprika: 11,
  mackerel: 11,
  "napa-cabbage": 11,
  // 12월
  carrot: 12,
  broccoli: 12,
  kiwi: 12,
  mandarin: 12,
}

/** 3등급 품종. 지역 나물·특수 채소, 지역 수산물, 산과일·특수 과일, 잡곡, 값비싼 송이버섯. */
export const RARE_FOODS: ReadonlySet<string> = new Set([
  // 채소
  "winter-melon",
  "uloe-melon",
  "bangah-leaf",
  "samchae",
  "luffa",
  "ashitaba",
  "thistle-greens",
  "turnip",
  "yacon",
  "jerusalem-artichoke",
  "kudzu-root",
  "bireum-namul",
  "sebal-namul",
  "pine-chive",
  "ixeris-root-greens",
  "gondeure",
  "alpine-leek",
  "bangpung-namul",
  "butterbur-stalk",
  "sweet-potato-stem",
  "taro-stem",
  "soybean-leaf",
  "pumpkin-leaf",
  "old-cucumber",
  "bitter-melon",
  "beet",
  "kohlrabi",
  "chwicheong-cucumber",
  "ginseng-root",
  // 버섯
  "branching-mushroom",
  "lions-mane",
  "wood-ear",
  "matsutake",
  // 수산
  "maesaengi",
  "monkfish",
  "snailfish",
  "loach",
  "catfish",
  "tongue-sole",
  "bird-clam",
  "sea-urchin",
  "jaecheop-clam",
  "horse-mackerel",
  "scallop",
  "mideodeok",
  "east-sea-hanchi",
  "jeju-hanchi",
  "pen-shell",
  "pomfret",
  // 과일
  "wild-grape",
  "silverberry",
  "aengdu",
  "mulberry",
  "omija",
  "quince",
  "green-mandarin",
  "pomegranate",
  "aronia",
  "raspberry",
  "black-raspberry",
  // 곡물·견과
  "oat",
  "proso-millet",
  "mung-bean",
  "wheat",
  "chestnut-bean",
  "barley",
  "seoritae",
  "sorghum",
  "adlay",
  "foxtail-millet",
  "mouse-eye-bean",
  "glutinous-rice",
  "rye",
  "pumpkin-seed",
  "black-rice",
  "buckwheat",
])

export function familiarity(id: string): Familiarity {
  return id in COMMON_FOODS ? 1 : RARE_FOODS.has(id) ? 3 : 2
}

/** 연간 한 장에 품종을 놓을 달. 1등급은 COMMON_FOODS에 적은 달, 나머지는 대표 달(peak)이 시작하는 달(해를 넘으면 계절 순서로 첫 달). */
export function bestMonth(food: Food): number {
  return COMMON_FOODS[food.id] ?? orderSeasonMonths(food.peak)[0]!
}
