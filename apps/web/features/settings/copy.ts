// 설정 화면 문구(.scratch/shell-unify/spec.md 5장).

export const SETTINGS_COPY = {
  title: "설정",
  description: "제철달력 표시, 이 기기에 저장된 기록, 데이터 출처와 개인정보 처리방침을 한곳에서 봐요.",
  sections: { display: "화면 표시", records: "내 기록", info: "정보" },
  deviceNote: "설정과 기록은 로그인 없이 이 기기에만 저장돼요. 다른 기기나 브라우저에서는 보이지 않아요.",
  sourcesLink: "데이터 출처",
  privacyLink: "개인정보 처리방침",
  version: "버전",
} as const

/** 데이터 출처 화면. 조사 주기 근거는 grocery-price/docs/30-data/sources/. */
export const SOURCES_COPY = {
  title: "데이터 출처",
  description: "장볼날 시세와 판정에 쓰는 공공 데이터와 조사 주기예요.",
  intro: "시세와 평소 가격은 아래 공공 데이터를 매일 받아 계산해요. 제철 정보는 장볼날이 여러 자료를 모아 정리했어요.",
  sources: [
    { name: "KAMIS 농산물유통정보", by: "한국농수산식품유통공사", what: "농축산물 소매 · 도매 시세", when: "평일 조사(공휴일 제외)" },
    { name: "축산물 소비자가격", by: "축산물품질평가원", what: "소 · 돼지 · 닭 · 계란 소비자가격", when: "매일 조사" },
    { name: "참가격", by: "한국소비자원", what: "대형마트 · 슈퍼 · 백화점 · 편의점 판매가", when: "격주 조사" },
  ],
} as const
