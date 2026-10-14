// 시트가 열린 뒤 다른 제철 경로로 이동하면 슬롯이 이전 시트를 그대로 들고 있다(병렬 라우트 동작).
// 모든 하위 경로를 null로 받아 시트를 닫는다. /seasonal 자체는 @sheet/page.tsx가 맡는다.
export default function CatchAll() {
  return null
}
