// 개인정보 처리방침 본문(.scratch/calendar-download/issues/10). 앱 전체 문서라 화면 문구(copy.ts)와 따로 둔다.
// 법률 자문을 거친 문서가 아니다. 개인정보보호위원회 "개인정보 처리방침 작성지침"의 항목 순서를 따랐고, 최종 문구는 운영자가 확인한다.
// 수집 도구(GA4)나 보존 기간을 바꾸면 이 파일과 shared/analytics, GA 관리 화면을 같이 고치고 CHANGES에 한 줄을 더한다.

export const PRIVACY_OPERATOR = "장볼날"
export const PRIVACY_CONTACT_EMAIL = "wnsdyd21@gmail.com"
/** GA4 관리 → 데이터 보존 기간과 같은 값 */
export const ANALYTICS_RETENTION = "14개월"

/** 시행일과 바뀐 내역. 새로 고치면 앞에 더한다. 첫 줄이 지금 판의 시행일이다. */
export const PRIVACY_CHANGES: readonly { date: string; note: string }[] = [{ date: "2026-10-30", note: "처음 만듦" }]

export type PrivacySection = { title: string; paragraphs?: readonly string[]; items?: readonly string[] }

export const PRIVACY_INTRO = `${PRIVACY_OPERATOR}(이하 "서비스")은 회원 가입을 받지 않고, 이름 · 연락처 같은 개인을 알아보는 정보를 모으지 않습니다. 서비스를 고치는 데 필요한 이용 기록만 아래처럼 모읍니다.`

export const PRIVACY_SECTIONS: readonly PrivacySection[] = [
  {
    title: "1. 모으는 정보",
    paragraphs: ["서비스는 이용 통계를 보려고 Google Analytics 4를 씁니다. Google Analytics가 아래 정보를 자동으로 모읍니다."],
    items: [
      "본 화면과 들어온 경로, 누른 버튼(예: 인쇄물 내려받기, 공유)",
      "기기 · 운영체제 · 브라우저 종류, 화면 크기, 언어",
      "대략의 지역(나라 · 시 단위). 정확한 위치는 모으지 않습니다.",
      "쿠키에 저장되는 무작위 식별자(같은 브라우저인지 구분하는 값)",
    ],
  },
  {
    title: "2. 모으는 목적",
    items: ["많이 보는 화면과 많이 받는 인쇄물을 알아 서비스를 고치는 데만 씁니다.", "광고 개인화나 다른 서비스와 연결하는 데 쓰지 않습니다(Google 신호 데이터를 꺼 두었습니다)."],
  },
  {
    title: "3. 보관 기간",
    paragraphs: [`Google Analytics의 이용 기록은 모은 날부터 ${ANALYTICS_RETENTION}이 지나면 지워집니다. 묶어 셈한 통계(예: 이달 내려받기 수)는 개인을 알아볼 수 없는 형태로 남을 수 있습니다.`],
  },
  {
    title: "4. 처리 위탁과 국외 이전",
    paragraphs: ["이용 기록의 저장과 분석을 Google에 맡깁니다. 이 과정에서 정보가 나라 밖으로 옮겨집니다."],
    items: [
      "받는 곳: Google LLC (미국), 연락처 https://support.google.com/analytics",
      "옮기는 나라: 미국 등 Google의 데이터 센터가 있는 나라",
      "옮기는 정보: 1항의 정보",
      "옮기는 때와 방법: 서비스를 이용할 때마다 인터넷으로 보냅니다.",
      `목적과 보관 기간: 2항과 3항(${ANALYTICS_RETENTION})`,
      "거부하는 방법: 6항. 거부해도 서비스는 그대로 쓸 수 있습니다.",
    ],
  },
  {
    title: "5. 이 기기에만 저장하는 정보",
    paragraphs: ["아래 정보는 쓰는 기기의 브라우저(localStorage)에만 저장하고 서버로 보내지 않습니다. 브라우저의 사이트 데이터를 지우면 함께 지워집니다."],
    items: ["먹음 기록, 화면 설정(공휴일 · 달 이름 표기 등), 옮긴 그림 자리", "담은 품종, 최근 본 품종", "\"A3도 원해요\"를 누른 인쇄물"],
  },
  {
    title: "6. 쿠키를 거부하는 방법",
    items: [
      "브라우저 설정에서 쿠키를 막거나 지울 수 있습니다(예: Chrome 설정 → 개인정보 보호 및 보안 → 서드 파티 쿠키).",
      "Google Analytics 차단 부가 기능: https://tools.google.com/dlpage/gaoptout",
    ],
  },
  {
    title: "7. 이용자의 권리와 문의",
    paragraphs: [
      "서비스는 개인을 알아보는 정보를 갖고 있지 않아 특정 이용자의 기록을 찾아 열람 · 정정 · 삭제해 드리기 어렵습니다. 6항의 방법으로 수집을 막을 수 있습니다.",
      `개인정보와 관련한 문의는 아래로 보내 주세요.`,
    ],
    items: [`운영: ${PRIVACY_OPERATOR}`, `이메일: ${PRIVACY_CONTACT_EMAIL}`],
  },
]
