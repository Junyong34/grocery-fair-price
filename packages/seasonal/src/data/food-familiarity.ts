import type { Food } from "./foods"
import { orderSeasonMonths } from "./months"

/**
 * 품종 친숙도(용어집 "친숙도"). 일반 사용자가 얼마나 자주 사 먹고 좋아하는지를 나눈 다섯 등급이다.
 * 1: 거의 매주 장바구니에 들어가는 품종, 2: 한 철에 한 번 이상은 꼭 사 먹는 품종, 3: 알고 있고 가끔 사는 품종,
 * 4: 이름은 알지만 일부러 찾아야 하는 품종, 5: 이름을 들어도 잘 모르는 품종.
 * 인쇄물 칸에 다 못 넣을 때 친숙한 품종부터 넣는다(.scratch/food-familiarity/spec.md). 조사값이 아니라 편집 판단이라 손으로 고친다.
 * 1·2·4·5등급만 적고, 적지 않은 품종은 3등급이다.
 */
export type Familiarity = 1 | 2 | 3 | 4 | 5

/**
 * 1등급 품종과 최적 달. 연간 한 장(Y-A·Y-B·Y-C)·표지·막대표는 한 품종을 한 해에 한 번, 이 달에만 놓는다.
 * 최적 달은 대표 달(peak) 안에서 고르고, 1·2등급이 한 달에 몰리지 않게 달마다 셋에서 여섯으로 나눈다.
 */
export const FAMILIARITY_1: Readonly<Record<string, number>> = {
  // 1월
  spinach: 1, // 시금치
  strawberry: 1, // 딸기
  // 4월
  garlic: 4, // 마늘
  // 5월
  cabbage: 5, // 양배추
  lettuce: 5, // 상추
  cucumber: 5, // 오이
  // 6월
  potato: 6, // 감자
  "korean-zucchini": 6, // 애호박
  "cherry-tomato": 6, // 방울토마토
  // 7월
  onion: 7, // 양파
  tomato: 7, // 토마토
  // 8월
  "garlic-chive": 8, // 부추
  squid: 8, // 오징어
  // 9월
  "shiitake-mushroom": 9, // 표고버섯
  // 10월
  "sweet-potato": 10, // 고구마
  "green-onion": 10, // 대파
  apple: 10, // 사과
  rice: 10, // 쌀
  // 11월
  radish: 11, // 무
  paprika: 11, // 파프리카
  mackerel: 11, // 고등어
  // 12월
  carrot: 12, // 당근
  "napa-cabbage": 12, // 배추
  broccoli: 12, // 브로콜리
  mandarin: 12, // 귤
}

/** 2등급 품종과 최적 달. 고르는 법은 FAMILIARITY_1과 같다. */
export const FAMILIARITY_2: Readonly<Record<string, number>> = {
  // 1월
  oyster: 1, // 굴
  pollock: 1, // 명태
  // 2월
  hallabong: 2, // 한라봉
  "olive-flounder": 2, // 광어
  mussel: 2, // 홍합
  // 3월
  "manila-clam": 3, // 바지락
  "webfoot-octopus": 3, // 주꾸미
  "snow-crab": 3, // 대게
  "shepherds-purse": 3, // 냉이
  // 4월
  "long-arm-octopus": 4, // 낙지
  "water-dropwort": 4, // 미나리
  // 5월
  "oriental-melon": 5, // 참외
  // 6월
  blueberry: 6, // 블루베리
  // 7월
  watermelon: 7, // 수박
  plum: 7, // 자두
  abalone: 7, // 전복
  // 8월
  peach: 8, // 복숭아
  eggplant: 8, // 가지
  corn: 8, // 옥수수
  // 9월
  "green-grape": 9, // 포도
  pear: 9, // 배
  chestnut: 9, // 밤
  shrimp: 9, // 대하
  "yellow-croaker": 9, // 조기
  // 10월
  "blue-crab": 10, // 꽃게
  hairtail: 10, // 갈치
  // 11월
  persimmon: 11, // 감
  "sweet-pumpkin": 11, // 단호박
  // 12월
  kiwi: 12, // 키위
  yellowtail: 12, // 방어
}

/** 4등급 품종. 지역·특수 채소, 산과일, 잡곡, 아는 사람은 찾아 먹는 수산물. */
export const FAMILIARITY_4: ReadonlySet<string> = new Set([
  // 채소
  "sweet-potato-stem", // 고구마순
  "ixeris-root-greens", // 고들빼기
  "gondeure", // 곤드레
  "gomchwi", // 곰취
  "chard", // 근대
  "green-bean", // 껍질콩
  "old-cucumber", // 노각
  "stringy-stonecrop", // 돌나물
  "jerusalem-artichoke", // 돼지감자
  "butterbur", // 머위
  "brussels-sprout", // 방울양배추
  "beet", // 비트
  "alpine-leek", // 산마늘
  "seomcho", // 섬초
  "ixeris", // 씀바귀
  "mallow", // 아욱
  "yacon", // 야콘
  "bitter-melon", // 여주
  "rapeseed-greens", // 유채나물
  "ginseng-root", // 인삼
  "red-cabbage", // 적채
  "bamboo-shoot", // 죽순
  "chamnamul", // 참나물
  "chicory", // 치커리
  "kohlrabi", // 콜라비
  "cauliflower", // 콜리플라워
  "soybean-leaf", // 콩잎
  "taro-stem", // 토란대
  "pumpkin-leaf", // 호박잎
  // 과일
  "wild-grape", // 머루
  "quince", // 모과
  "black-raspberry", // 복분자
  "raspberry", // 산딸기
  "pomegranate", // 석류
  "aronia", // 아로니아
  "aengdu", // 앵두
  "mulberry", // 오디
  "omija", // 오미자
  "green-mandarin", // 청귤
  // 수산
  "pike-conger", // 갯장어
  "rock-bream", // 돌돔
  "east-sea-hanchi", // 동해한치
  "maesaengi", // 매생이
  "catfish", // 메기
  "snailfish", // 물메기
  "loach", // 미꾸라지
  "mideodeok", // 미더덕
  "sardinella", // 밴댕이
  "blackfish", // 벵에돔
  "pomfret", // 병어
  "pufferfish", // 복어
  "gray-rockfish", // 볼락
  "bird-clam", // 새조개
  "sea-urchin", // 성게
  "monkfish", // 아귀
  "atka-mackerel", // 임연수어
  "pearl-spot-chromis", // 자리돔
  "jaecheop-clam", // 재첩
  "horse-mackerel", // 전갱이
  "jeju-hanchi", // 제주한치
  "yellowfin-flounder", // 참가자미
  "herring", // 청어
  "pen-shell", // 키조개
  "halfbeak", // 학꽁치
  "scallop", // 해만가리비
  "skate", // 홍어
  // 버섯
  "lions-mane", // 노루궁뎅이버섯
  "wood-ear", // 목이버섯
  "matsutake", // 송이버섯
  // 곡물·견과
  "oat", // 귀리
  "mung-bean", // 녹두
  "buckwheat", // 메밀
  "wheat", // 밀
  "barley", // 보리
  "seoritae", // 서리태
  "sorghum", // 수수
  "adlay", // 율무
  "mouse-eye-bean", // 쥐눈이콩
  "glutinous-rice", // 찹쌀
  "pumpkin-seed", // 호박씨
  "black-rice", // 흑미
])

/** 5등급 품종. 지역 나물·특수 채소, 횟집에서나 만나는 지역 횟감, 드문 잡곡. */
export const FAMILIARITY_5: ReadonlySet<string> = new Set([
  // 채소
  "winter-melon", // 동아
  "butterbur-stalk", // 머위대
  "bangah-leaf", // 방아잎
  "bangpung-namul", // 방풍나물
  "bireum-namul", // 비름나물
  "samchae", // 삼채
  "sebal-namul", // 세발나물
  "pine-chive", // 솔부추
  "luffa", // 수세미
  "turnip", // 순무
  "ashitaba", // 신선초
  "thistle-greens", // 엉겅퀴
  "uloe-melon", // 울외
  "chwicheong-cucumber", // 취청오이
  "kudzu-root", // 칡
  // 과일
  "silverberry", // 보리수열매
  // 수산
  "redlip-mullet", // 가숭어
  "ganjaemi", // 간재미
  "goedorachi", // 괴도라치
  "longtail-blackfish", // 긴꼬리벵에돔
  "banded-grouper", // 능성어
  "lumpfish", // 도치
  "rabbitfish", // 독가시치
  "stone-flounder", // 돌가자미
  "black-scraper", // 말쥐치
  "goby", // 망둥어
  "chicken-grunt", // 벤자리
  "borimyeol", // 보리멸
  "yellowstripe-jack", // 부시리
  "red-rockfish", // 불볼락
  "red-spotted-grouper", // 붉바리
  "tongue-sole", // 서대
  "searobin", // 성대
  "sixbar-sandperch", // 쌍동가리
  "marbled-rockfish", // 쏨뱅이
  "longtooth-grouper", // 자바리
  "roughscale-flounder", // 줄가자미
  // 버섯
  "branching-mushroom", // 가지버섯
  // 곡물·견과
  "proso-millet", // 기장
  "chestnut-bean", // 밤콩
  "foxtail-millet", // 조
  "rye", // 호밀

])

export function familiarity(id: string): Familiarity {
  if (id in FAMILIARITY_1) return 1
  if (id in FAMILIARITY_2) return 2
  if (FAMILIARITY_4.has(id)) return 4
  if (FAMILIARITY_5.has(id)) return 5
  return 3
}

/** 한 해에 한 번만 놓는 인쇄물에서 품종을 놓을 달. 1·2등급은 적은 달, 나머지는 대표 달(peak)이 시작하는 달(해를 넘으면 계절 순서로 첫 달). */
export function bestMonth(food: Food): number {
  return FAMILIARITY_1[food.id] ?? FAMILIARITY_2[food.id] ?? orderSeasonMonths(food.peak)[0]!
}
