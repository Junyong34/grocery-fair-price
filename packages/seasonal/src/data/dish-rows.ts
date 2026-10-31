/**
 * 명절에 차려 먹는 전통 음식(GLOSSARY). 품종이 아니므로 품종 상세로 연결하지 않고, 품종 타입과 섞지 않는다.
 * id는 그림 원본 prototypes/seasonal-food/dishes/<id>와 같은 영문 kebab-case다. 여러 명절에 나오는 음식(팥죽)도 한 번만 둔다.
 * 명절 순서(설날 → 동지)로 적는다. import 없이 두어 scripts/sync-food-images.mjs가 Node로 바로 읽는다.
 */
export const DISH_ROWS = [
  { id: "tteokguk", name: "떡국" },
  { id: "mandu", name: "만두" },
  { id: "sikhye", name: "식혜" },
  { id: "sujeonggwa", name: "수정과" },
  { id: "ogokbap", name: "오곡밥" },
  { id: "mugeun-namul", name: "묵은 나물" },
  { id: "bureom", name: "부럼" },
  { id: "gwibalgi-sul", name: "귀밝이술" },
  { id: "surichwi-tteok", name: "수리취떡" },
  { id: "jeho-tang", name: "제호탕" },
  { id: "samgyetang", name: "삼계탕" },
  { id: "yukgaejang", name: "육개장" },
  { id: "patjuk", name: "팥죽" },
  { id: "songpyeon", name: "송편" },
  { id: "toran-tang", name: "토란탕" },
  { id: "hwayangjeok", name: "화양적" },
  { id: "dakjjim", name: "닭찜" },
  { id: "dongchimi", name: "동치미" },
] as const
