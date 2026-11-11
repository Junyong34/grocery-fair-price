import { todayKey } from "@workspace/seasonal/calendar/today-marks"

export { todayKey }

type Keys = string | readonly string[]

const join = (keys: Keys) => (typeof keys === "string" ? keys : keys.join(" "))

/**
 * 오늘에 맞을 때만 보이는 부분. 정적 HTML에 숨겨 두었다가, <head>의 TODAY_MARK_SCRIPT가 첫 그리기 전에 그날의 키를 켠다
 * (packages/seasonal/src/calendar/today-marks.ts, 숨김 기본값은 app/globals.css). 서버와 브라우저 마크업이 같아 하이드레이션이 맞는다.
 * 감싸개는 display:contents라 레이아웃에 끼지 않는다. 키를 여러 개 주면 그중 하나만 맞아도 보인다.
 * 날짜에 따라 숫자나 목록이 바뀌는 내용에는 쓰지 않는다. 그런 곳은 useSeoulToday()(마운트 뒤 값)를 쓴다.
 */
export function TodayShow({ when, children }: { when: Keys; children: React.ReactNode }) {
  return <span data-today-show={join(when)}>{children}</span>
}

/** 오늘에 맞으면 숨는 부분. TodayShow와 짝으로 "오늘 모양 / 보통 모양"을 나란히 둘 때 쓴다. */
export function TodayHide({ when, children }: { when: Keys; children: React.ReactNode }) {
  return <span data-today-hide={join(when)}>{children}</span>
}
