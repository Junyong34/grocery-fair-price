// 영유아 이유식 과일 시기 및 주의 식재료 도메인 데이터
// 최신 소아과학(대한소아청소년과학회, AAP, 하정훈 삐뽀삐뽀 119) 지침과 육아 커뮤니티 관행을 함께 다룬다.

import { FOOD_ROWS } from "./foods.generated"

export type BabyFruitStageId =
  | "4-5-months"
  | "6-months"
  | "7-8-months"
  | "9-11-months"
  | "12-months"

export type BabyFruitStage = {
  readonly id: BabyFruitStageId
  readonly name: string
  readonly monthRange: string
  readonly subTitle: string
  readonly summary: string
  readonly cautionNote?: string
}

export const BABY_FRUIT_STAGES: readonly BabyFruitStage[] = [
  {
    id: "4-5-months",
    name: "4~5개월",
    monthRange: "4~5개월",
    subTitle: "준비기",
    summary: "과일보다 쌀·고기·채소를 먼저 정착시키는 시기입니다.",
    cautionNote:
      "최신 소아과학 가이드라인은 모유·분유 수유아 모두 만 6개월(180일)부터 이유식과 과일을 시작할 것을 강력히 권장합니다.",
  },
  {
    id: "6-months",
    name: "6개월",
    monthRange: "6개월",
    subTitle: "초기 이유식",
    summary:
      "쌀죽과 소고기, 채소 적응 후 부드럽게 익힌 첫 과일을 시작합니다.",
    cautionNote:
      "단맛에 익숙해지면 고기나 채소를 거부할 수 있으므로, 간식으로 소량만 맛보게 해주세요. 딱딱한 생과일은 질식 위험이 있으니 반드시 쪄서 퓨레로 만듭니다.",
  },
  {
    id: "7-8-months",
    name: "7~8개월",
    monthRange: "7~8개월",
    subTitle: "중기 이유식",
    summary: "잇몸으로 으깰 수 있는 부드러운 과육과 알갱이를 시도합니다.",
    cautionNote: "과일의 씨와 단단한 껍질은 완전히 제거하고 제공해야 합니다.",
  },
  {
    id: "9-11-months",
    name: "9~11개월",
    monthRange: "9~11개월",
    subTitle: "후기 이유식",
    summary:
      "손으로 집어먹는 핑거푸드를 시작하며, 새콤달콤한 과일을 접합니다.",
    cautionNote:
      "포도, 블루베리처럼 동그란 과일은 영유아 기도 질식사고 1위 위험군입니다. 절대 통째로 주지 마시고 반드시 4등분 이상 잘게 잘라주세요.",
  },
  {
    id: "12-months",
    name: "12개월+",
    monthRange: "12개월 이상",
    subTitle: "완료기 / 유아식",
    summary:
      "돌이 지나면 모든 생과일을 먹을 수 있으나, 어금니 발달과 질식 예방 손질법에 주의합니다.",
    cautionNote:
      "키위·복숭아 등 알레르기 유발 과일을 시도할 수 있습니다. 단, 두 돌(24개월) 전까지는 첨가당 0g 원칙을 지키고, 통포도·체리·통견과류는 만 4~5세까지 반드시 4등분해야 안전합니다.",
  },
] as const

export type FruitSafetyStatus = "safe" | "conventional" | "caution"

export type BabyFruit = {
  readonly id: string
  readonly name: string
  readonly stages: readonly BabyFruitStageId[]
  readonly firstStage: BabyFruitStageId
  readonly safetyStatus: FruitSafetyStatus
  readonly prepMethod: string
  readonly cuttingGuide?: string
  readonly chokingRisk: boolean
  readonly allergyNote?: string
  readonly seasonalFoodId?: string
  readonly isImported?: boolean
}

export const BABY_FRUITS: readonly BabyFruit[] = [
  // 6개월 초기
  {
    id: "apple",
    name: "사과",
    stages: [
      "4-5-months",
      "6-months",
      "7-8-months",
      "9-11-months",
      "12-months",
    ],
    firstStage: "6-months",
    safetyStatus: "safe",
    prepMethod:
      "껍질과 씨를 완전히 깎아낸 뒤 찜기에 찌거나 삶아 부드러운 퓨레 형태로 만듭니다.",
    cuttingGuide:
      "초기에는 퓨레나 강판에 간 즙으로, 후기부터는 얇고 부드럽게 편 썰어 핑거푸드로 제공합니다.",
    chokingRisk: false,
    allergyNote: "알레르기 위험이 낮아 아기 첫 과일로 가장 안전합니다.",
    seasonalFoodId: "apple",
  },
  {
    id: "pear",
    name: "배",
    stages: [
      "4-5-months",
      "6-months",
      "7-8-months",
      "9-11-months",
      "12-months",
    ],
    firstStage: "6-months",
    safetyStatus: "safe",
    prepMethod:
      "배 특유의 석세포(까끌까끌한 돌세포)로 인해 소화가 덜 될 수 있으므로 강판에 갈아 살짝 끓이거나 쪄서 줍니다.",
    cuttingGuide:
      "초기에는 익힌 퓨레, 중기 이후에는 강판에 갈거나 얇게 저며 줍니다.",
    chokingRisk: false,
    allergyNote: "수분이 많고 자극이 적어 감기나 열이 날 때도 좋습니다.",
    seasonalFoodId: "pear",
  },
  {
    id: "banana",
    name: "바나나",
    stages: [
      "6-months",
      "7-8-months",
      "9-11-months",
      "12-months",
    ],
    firstStage: "6-months",
    safetyStatus: "safe",
    prepMethod:
      "갈색 반점(슈가스팟)이 충분히 생긴 완숙 바나나를 포크로 곱게 으깨어 줍니다. 양 끝 1~2cm는 농약 잔류 우려로 잘라냅니다.",
    cuttingGuide:
      "덜 익은 초록색 바나나는 탄닌 성분 때문에 변비를 일으킬 수 있으니 반드시 노랗게 익은 것을 주세요.",
    chokingRisk: false,
    allergyNote: "드물게 라텍스 교차 반응 알레르기가 있을 수 있습니다.",
    isImported: true,
  },
  {
    id: "avocado",
    name: "아보카도",
    stages: [
      "6-months",
      "7-8-months",
      "9-11-months",
      "12-months",
    ],
    firstStage: "6-months",
    safetyStatus: "safe",
    prepMethod:
      "진한 녹갈색으로 부드럽게 완숙된 과육을 숟가락으로 긁어 포크로 으깨어 제공합니다.",
    cuttingGuide:
      "중기 이후에는 핑거푸드로 길쭉하게 스틱 형태로 잘라줄 수 있습니다.",
    chokingRisk: false,
    allergyNote: "불포화지방산이 풍부하고 단맛이 없어 채소 적응에 좋습니다.",
    isImported: true,
  },
  {
    id: "plum",
    name: "자두",
    stages: [
      "6-months",
      "7-8-months",
      "9-11-months",
      "12-months",
    ],
    firstStage: "6-months",
    safetyStatus: "conventional",
    prepMethod:
      "초기에는 껍질과 씨를 벗기고 과육만 살짝 쪄서 퓨레로 만듭니다. 중기부터는 껍질 벗긴 생과일을 으깨 줍니다.",
    cuttingGuide: "산도가 강한 자두는 신맛으로 아이가 놀랄 수 있으니 단맛이 도는 부드러운 과육을 고릅니다.",
    chokingRisk: false,
    allergyNote: "식이섬유가 풍부해 아기 변비 개선에 매우 효과적입니다.",
    seasonalFoodId: "plum",
  },

  // 7~8개월 중기
  {
    id: "watermelon",
    name: "수박",
    stages: ["7-8-months", "9-11-months", "12-months"],
    firstStage: "7-8-months",
    safetyStatus: "conventional",
    prepMethod:
      "검은 씨와 흰 덜 여문 씨를 핀셋이나 젓가락으로 완벽히 발라내고 부드러운 빨간 과육만 으깨거나 얇게 썹니다.",
    cuttingGuide: "수분이 너무 많아 한 번에 많이 먹으면 묽은 변을 볼 수 있습니다.",
    chokingRisk: false,
    allergyNote: "씨가 기도에 걸리지 않도록 주의가 필요합니다.",
    seasonalFoodId: "watermelon",
  },
  {
    id: "oriental-melon",
    name: "참외",
    stages: ["7-8-months", "9-11-months", "12-months"],
    firstStage: "7-8-months",
    safetyStatus: "conventional",
    prepMethod:
      "껍질을 깎고 씨와 씨 주변의 미끄러운 태좌(흰 부분)를 숟가락으로 완전히 파낸 뒤, 단단하지 않은 흰 과육만 강판에 갈거나 작게 다집니다.",
    cuttingGuide: "태좌와 씨는 아기 소화기에 설사를 유발할 수 있으므로 돌 전에는 주지 않습니다.",
    chokingRisk: false,
    allergyNote: "성질이 차가우므로 배앓이를 자주 하는 아기는 소량만 먹입니다.",
    seasonalFoodId: "oriental-melon",
  },
  {
    id: "melon",
    name: "멜론",
    stages: ["7-8-months", "9-11-months", "12-months"],
    firstStage: "7-8-months",
    safetyStatus: "conventional",
    prepMethod:
      "씨와 섬유질을 숟가락으로 긁어내고, 껍질 쪽 단단한 살을 피해 부드러운 중심부 과육만 으깨어 제공합니다.",
    cuttingGuide: "중기에는 으깨어 주고, 후기에는 깍둑썰기 핑거푸드로 줄 수 있습니다.",
    chokingRisk: false,
    allergyNote: "과육이 부드러워 아기들이 매우 선호합니다.",
    seasonalFoodId: "melon",
  },

  // 9~11개월 후기
  {
    id: "grape",
    name: "포도",
    stages: ["9-11-months", "12-months"],
    firstStage: "9-11-months",
    safetyStatus: "caution",
    prepMethod:
      "껍질을 완전히 벗기고 씨를 뺀 뒤, **반드시 세로(길이 방향)로 4등분 이상 잘게 잘라** 급여합니다.",
    cuttingGuide:
      "⚠️ 절대 통째로 주지 마세요! 동그란 알포도는 아기 기도를 완벽히 틀어막는 최고 위험 과일입니다. 가로로 자르면 안 되고 세로로 길쭉하게 4등분해야 합니다.",
    chokingRisk: true,
    allergyNote: "껍질과 씨를 삼키지 않도록 세심한 주의가 필요합니다.",
    seasonalFoodId: "green-grape",
  },
  {
    id: "blueberry",
    name: "블루베리",
    stages: ["9-11-months", "12-months"],
    firstStage: "9-11-months",
    safetyStatus: "caution",
    prepMethod:
      "포크 등으로 과육을 으깨거나, 칼로 2~4등분으로 조각내어 핑거푸드로 제공합니다.",
    cuttingGuide: "동그랗고 미끄러워 통째로 삼키면 질식 위험이 있으니 으깨어 주는 것이 가장 안전합니다.",
    chokingRisk: true,
    allergyNote: "안토시아닌이 풍부하나 껍질이 얇아 소화 변에 껍질이 그대로 나올 수 있습니다.",
    seasonalFoodId: "blueberry",
  },
  {
    id: "mandarin",
    name: "귤",
    stages: ["9-11-months", "12-months"],
    firstStage: "9-11-months",
    safetyStatus: "caution",
    prepMethod:
      "겉껍질을 벗긴 후 흰 섬유질(귤락)과 질긴 알맹이 속껍질을 일일이 벗겨 부드러운 속 알갱이만 줍니다.",
    cuttingGuide: "산도가 있어 입 주변에 침독처럼 붉은 발진(접촉성 피부염)이 생길 수 있으니 입가를 닦아주세요.",
    chokingRisk: false,
    allergyNote: "시트러스 계열의 산미로 인한 피부 자극에 유의합니다.",
    seasonalFoodId: "mandarin",
  },
  {
    id: "orange",
    name: "오렌지",
    stages: ["9-11-months", "12-months"],
    firstStage: "9-11-months",
    safetyStatus: "caution",
    prepMethod:
      "칼로 겉껍질과 두꺼운 흰 부분을 도려내고, V자로 칼집을 넣어 속껍질 없이 과육만 발라냅니다.",
    cuttingGuide: "과즙이 많아 사례가 걸릴 수 있으니 작게 썰어줍니다.",
    chokingRisk: false,
    allergyNote: "감귤류와 마찬가지로 강한 산미로 인한 구강 주위 자극 주의.",
    isImported: true,
  },
  {
    id: "persimmon",
    name: "감/홍시",
    stages: ["9-11-months", "12-months"],
    firstStage: "9-11-months",
    safetyStatus: "conventional",
    prepMethod:
      "홍시는 껍질과 꼭지, 씨를 제거하고 부드러운 속살만 소량 숟가락으로 떠 먹입니다. 단감은 단단하므로 얇게 저미거나 익혀줍니다.",
    cuttingGuide: "가운데 흰 심(도지) 부분은 탄닌이 많아 변비를 유발하므로 도려냅니다.",
    chokingRisk: false,
    allergyNote: "과다 섭취 시 아기 변비의 주원인이 되므로 소량만 급여합니다.",
    seasonalFoodId: "persimmon",
  },
  {
    id: "strawberry",
    name: "딸기",
    stages: ["9-11-months", "12-months"],
    firstStage: "9-11-months",
    safetyStatus: "caution",
    prepMethod:
      "흐르는 물에 깨끗이 씻은 후 초록색 꼭지 부분을 깊게 도려내고, 세로로 4~8등분하여 핑거푸드로 줍니다.",
    cuttingGuide: "표면의 미세한 털과 씨, 산도로 인해 입술 주위 발진이 잘 생깁니다. 평일 오전에 소량 테스트하세요.",
    chokingRisk: false,
    allergyNote: "과거에는 돌 이후 권장이었으나, 최신 지침은 조기 노출(8~9개월)을 허용합니다.",
    seasonalFoodId: "strawberry",
  },
  {
    id: "apricot",
    name: "살구",
    stages: ["9-11-months", "12-months"],
    firstStage: "9-11-months",
    safetyStatus: "conventional",
    prepMethod: "씨와 껍질을 벗겨 부드러운 과육만 잘게 썰어 제공합니다.",
    cuttingGuide: "씨에 독성이 있으므로 완전히 제거되었는지 확인합니다.",
    chokingRisk: false,
    allergyNote: "산도가 낮고 부드러워 소화가 잘 됩니다.",
    seasonalFoodId: "apricot",
  },

  // 12개월 이상 완료기 / 유아식
  {
    id: "kiwi",
    name: "키위",
    stages: ["12-months"],
    firstStage: "12-months",
    safetyStatus: "caution",
    prepMethod:
      "껍질을 두껍게 벗겨내고 가운데 딱딱하고 검은 씨가 밀집된 부위를 피해 부드러운 과육만 깍둑썰기합니다.",
    cuttingGuide: "그린키위는 산도와 털 자극이 강하므로 비교적 순한 골드키위로 먼저 시작하는 것이 좋습니다.",
    chokingRisk: false,
    allergyNote: "액티니딘 단백질 분해 효소로 인해 혀 따가움 및 알레르기 빈도가 높습니다.",
    seasonalFoodId: "kiwi",
  },
  {
    id: "peach",
    name: "복숭아",
    stages: ["12-months"],
    firstStage: "12-months",
    safetyStatus: "caution",
    prepMethod:
      "털 복숭아는 만지기만 해도 두드러기가 날 수 있으므로 천도복숭아나 껍질을 두껍게 깎은 백도/황도를 얇게 편 썰어 줍니다.",
    cuttingGuide: "첫 시도 시에는 살짝 익혀서 테스트하면 알레르기 위험을 줄일 수 있습니다.",
    chokingRisk: false,
    allergyNote: "대표적인 고위험 알레르기 과일이므로 반드시 소량으로 반응을 관찰하세요.",
    seasonalFoodId: "peach",
  },
  {
    id: "pineapple",
    name: "파인애플",
    stages: ["12-months"],
    firstStage: "12-months",
    safetyStatus: "caution",
    prepMethod:
      "가운데 질기고 딱딱한 심지를 완전히 제거하고, 겉껍질 쪽 눈(가시)을 깊게 도려낸 후 과육만 얇게 썹니다.",
    cuttingGuide: "브로멜라인 효소와 강한 산도로 입술과 혀가 헐 수 있으므로 소량만 급여합니다.",
    chokingRisk: false,
    allergyNote: "구강 점막 자극이 심한 편입니다.",
    isImported: true,
  },
  {
    id: "mango",
    name: "망고",
    stages: ["12-months"],
    firstStage: "12-months",
    safetyStatus: "caution",
    prepMethod:
      "껍질 안쪽에 옻 성분이 잔류할 수 있으므로 껍질 쪽 살을 넉넉히 도려내고 부드러운 속살만 큐브 모양으로 깍둑썰기합니다.",
    cuttingGuide: "옻나무과 식물로 옻 알레르기가 있는 가족력이 있다면 소아과 상담 후 시도하세요.",
    chokingRisk: false,
    allergyNote: "옻 알레르기(우루시올 유사 성분) 유발 주의.",
    isImported: true,
  },
  {
    id: "cherry",
    name: "체리",
    stages: ["12-months"],
    firstStage: "12-months",
    safetyStatus: "caution",
    prepMethod:
      "칼로 빙 둘러 씨를 완전히 빼내고, **반드시 4등분 이상 잘게 잘라서** 급여합니다.",
    cuttingGuide: "⚠️ 체리 씨에는 청산배당체 독성이 있고, 통째 삼키면 기도 폐쇄 위험이 있습니다.",
    chokingRisk: true,
    allergyNote: "씨 제거 여부를 두 번 확인하세요.",
    seasonalFoodId: "cherry",
  },
  {
    id: "grapefruit",
    name: "자몽",
    stages: ["12-months"],
    firstStage: "12-months",
    safetyStatus: "caution",
    prepMethod: "쓴맛과 신맛이 강하므로 속껍질을 완벽히 벗겨 알갱이만 소량 시도합니다.",
    cuttingGuide: "아기가 쓴맛으로 거부할 수 있으니 억지로 먹이지 않습니다.",
    chokingRisk: false,
    allergyNote: "위장 자극에 주의합니다.",
    isImported: true,
  },
] as const

export type HazardSeverity = "forbidden" | "caution"
export type HazardTargetStage = "before-12m" | "before-24m" | "under-5y"

export type ProhibitedFood = {
  readonly id: string
  readonly name: string
  readonly targetStage: HazardTargetStage
  readonly severity: HazardSeverity
  readonly reason: string
  readonly guide: string
  readonly iconId: string
}

export const PROHIBITED_FOODS: readonly ProhibitedFood[] = [
  // 만 12개월(돌) 미만 절대 금지
  {
    id: "honey",
    name: "꿀",
    targetStage: "before-12m",
    severity: "forbidden",
    reason:
      "영아 보툴리누스증(*Clostridium botulinum*). 돌 미만 아기는 위산과 장내 균총이 미숙해 꿀의 보툴리누스 포자가 장내에서 발아하여 신경독소를 분비, 전신 근육 마비와 호흡 곤란(사망 위험)을 일으킵니다.",
    guide:
      "돌 전에는 꿀 및 꿀이 함유된 과자, 빵, 시럽을 일체 먹이지 마세요. 가열 조리해도 포자가 죽지 않습니다. 돌 이후에는 의학적 금기는 해제되나, 첨가당 제한을 위해 두 돌 이후 권장합니다.",
    iconId: "honey",
  },
  {
    id: "milk",
    name: "생우유 (소젖)",
    targetStage: "before-12m",
    severity: "forbidden",
    reason:
      "생우유의 높은 단백질과 미네랄이 미숙한 아기 신장에 과부하를 주며, 미세 장출혈을 일으키고 철분 흡수를 방해해 철결핍성 빈혈을 유발합니다.",
    guide:
      "만 12개월(돌) 이후부터 하루 400~500ml 미만으로 생우유를 시작하세요. (단, 조리용 소량 버터나 무염 치즈는 7~8개월부터 가능합니다.)",
    iconId: "milk",
  },
  {
    id: "juice",
    name: "과일주스 / 착즙액",
    targetStage: "before-12m",
    severity: "forbidden",
    reason:
      "급격한 혈당 상승, 과당으로 인한 소아 비만, 충치, 영양가 있는 고형식(이유식) 거부 유발. 미국소아과학회(AAP)와 국내 소아과학회 모두 돌 전 주스를 전면 금지합니다.",
    guide:
      "100% 생과일 착즙액이나 아기 전용 주스라도 돌 전에는 주지 마세요. 과일은 씹어 먹는 생과일 자체로 섭취해야 섬유질을 얻고 올바른 식습관이 형성됩니다.",
    iconId: "juice",
  },
  {
    id: "raw-food",
    name: "생식류 (회, 육회, 날달걀, 생굴)",
    targetStage: "before-12m",
    severity: "forbidden",
    reason:
      "살모넬라, 장염비브리오, 노로바이러스, 기생충 감염 위험. 성인에게는 가벼운 식중독도 면역력이 약한 영유아에게는 치명적인 탈수와 패혈증을 부릅니다.",
    guide:
      "생선회나 날고기, 날달걀은 최소 두 돌(24개월) 이후, 소아과 전문의들은 만 5세 이후 면역과 소화기가 완전히 성숙했을 때 권장합니다.",
    iconId: "sashimi",
  },

  // 만 24개월(두 돌) 미만 강력 주의/제한
  {
    id: "whole-nuts",
    name: "통견과류 (땅콩, 아몬드, 호두)",
    targetStage: "before-24m",
    severity: "caution",
    reason:
      "기관지 흡인(기도 질식사고) 위험. 딱딱하고 둥근 견과류 조각은 기도로 넘어가 폐렴을 유발하거나 기도를 막을 위험이 극도로 높습니다.",
    guide:
      "알레르기 예방을 위한 곱게 간 분말이나 부드러운 페이스트 형태는 6개월 이후부터 권장되지만, **통째로 된 견과류는 만 4~5세 이전에는 절대 주지 마세요**.",
    iconId: "peanut",
  },
  {
    id: "added-sugar",
    name: "첨가당 (설탕, 물엿, 올리고당, 시럽)",
    targetStage: "before-24m",
    severity: "caution",
    reason:
      "어릴 때 형성된 단맛 선호는 평생 비만과 만성 질환의 원인이 됩니다. 단맛이 강한 음식을 먹으면 채소나 담백한 밥을 거부합니다.",
    guide:
      "세계보건기구(WHO)와 미국소아과학회(AAP)는 만 24개월 미만 영유아에게 **첨가당 0g(무가당)**을 강력 권고합니다. 단맛은 잘 익은 바나나나 과일로 대체하세요.",
    iconId: "sugar",
  },
  {
    id: "sodium",
    name: "나트륨 (소금, 간장, 조미료)",
    targetStage: "before-24m",
    severity: "caution",
    reason:
      "아기의 신장은 성인처럼 염분을 배출하는 능력이 부족합니다. 나트륨 과다 섭취 시 신장에 부담을 줍니다.",
    guide:
      "돌 전에는 철저한 무염식을 유지하고, 두 돌까지도 가급적 자연 식재료 자체의 맛으로 조리(저염식)하는 것이 안전합니다.",
    iconId: "salt",
  },
  {
    id: "choking-sweets",
    name: "질식 위험 간식 (구형 사탕, 젤리, 떡)",
    targetStage: "before-24m",
    severity: "caution",
    reason:
      "단단하고 둥근 사탕이나 끈적끈적한 젤리·인절미 떡은 기도 점막에 흡착되어 하임리히법으로도 쉽게 빠지지 않아 질식사고를 유발합니다.",
    guide:
      "어금니가 온전히 나고 씹는 조절 능력이 완전히 발달하는 만 4~5세 이전에는 급여를 엄격히 제한하세요.",
    iconId: "jelly",
  },
] as const

// --- 순수 함수 (Pure functions) ---

export function isStageValid(slug: string): slug is BabyFruitStageId {
  return BABY_FRUIT_STAGES.some((stage) => stage.id === slug)
}

export function findBabyFruit(id: string): BabyFruit | undefined {
  return BABY_FRUITS.find((fruit) => fruit.id === id)
}

export function getFruitsByStage(
  stageId: BabyFruitStageId | "all",
): readonly BabyFruit[] {
  if (stageId === "all") return BABY_FRUITS
  return BABY_FRUITS.filter((fruit) => fruit.stages.includes(stageId))
}

export function getProhibitedFoodsForStage(
  stageId: BabyFruitStageId,
): readonly ProhibitedFood[] {
  if (
    stageId === "4-5-months" ||
    stageId === "6-months" ||
    stageId === "7-8-months" ||
    stageId === "9-11-months"
  ) {
    // 돌 전: before-12m (꿀, 생우유, 주스, 생식)
    return PROHIBITED_FOODS.filter((food) => food.targetStage === "before-12m")
  }
  // 12개월 이상: before-24m 및 under-5y (통견과류, 첨가당 등)
  return PROHIBITED_FOODS.filter(
    (food) => food.targetStage === "before-24m" || food.targetStage === "under-5y",
  )
}

export function isBabyFruitSeasonal(
  fruit: BabyFruit,
  month: number,
): boolean {
  if (!fruit.seasonalFoodId) return false
  const match = FOOD_ROWS.find((f) => f.id === fruit.seasonalFoodId)
  if (!match) return false
  return (match.months as readonly number[]).includes(month)
}

export function getSeasonalFruitsForStage(
  stageId: BabyFruitStageId | "all",
  month: number,
): readonly BabyFruit[] {
  const stageFruits = getFruitsByStage(stageId)
  return stageFruits.filter((fruit) => isBabyFruitSeasonal(fruit, month))
}
