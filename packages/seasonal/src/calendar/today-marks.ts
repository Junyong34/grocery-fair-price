import type { CalendarDate } from "./month-calendar"

/**
 * 오늘 표시 키. 서버가 미리 그린 정적 HTML에 오늘 표시를 숨겨 두고(`data-today-show="키"`),
 * 브라우저가 첫 그리기 전에 서울 날짜로 그날의 키만 켠다(TODAY_MARK_SCRIPT). 요청 때 서버가 날짜를 계산하지 않아
 * 페이지가 완전 정적으로 남는다(.scratch/seasonal-render-perf/spec.md 6.2).
 * 키는 0을 채우지 않은 숫자다. 스크립트와 같은 약속이어야 한다(테스트가 둘을 맞춰 본다).
 */
export const todayKey = {
  day: (date: CalendarDate) => `d${date.year}-${date.month}-${date.day}`,
  yearMonth: (year: number, month: number) => `ym${year}-${month}`,
  month: (month: number) => `m${month}`,
  year: (year: number) => `y${year}`,
}

/** 그날 켜지는 키 전부. */
export function todayKeys(today: CalendarDate): string[] {
  return [todayKey.day(today), todayKey.yearMonth(today.year, today.month), todayKey.month(today.month), todayKey.year(today.year)]
}

/**
 * 켜진 키의 스타일. show 감싸개는 기본이 숨김이고(앱 globals.css), 켜지면 display:contents로 안의 요소가 그대로 놓인다.
 * hide 감싸개는 그 반대다. `~=`라서 한 감싸개에 키를 여러 개(공백 구분) 달면 그중 하나만 맞아도 켜진다.
 */
export function todayMarkCss(keys: readonly string[]): string {
  const select = (kind: "show" | "hide") => keys.map((key) => `:root [data-today-${kind}~="${key}"]`).join(",")
  return `${select("show")}{display:contents}${select("hide")}{display:none}`
}

export const TODAY_MARK_STYLE_ID = "today-marks"

/**
 * <head>에 넣는 인라인 스크립트. HTML을 읽는 도중 동기로 돌아 첫 그리기 전에 style을 붙인다.
 * React가 관리하는 노드를 건드리지 않으므로 하이드레이션 불일치가 없다. 실패하면 오늘 표시만 빠진다.
 * todayKeys · todayMarkCss와 같은 결과를 내야 한다(today-marks.test.ts).
 */
export const TODAY_MARK_SCRIPT = `(function(){try{if(document.getElementById("${TODAY_MARK_STYLE_ID}"))return;var t={};new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Seoul",year:"numeric",month:"numeric",day:"numeric"}).formatToParts(new Date()).forEach(function(p){t[p.type]=+p.value});var k=["d"+t.year+"-"+t.month+"-"+t.day,"ym"+t.year+"-"+t.month,"m"+t.month,"y"+t.year];var s=function(n){return k.map(function(x){return':root [data-today-'+n+'~="'+x+'"]'}).join(",")};var e=document.createElement("style");e.id="${TODAY_MARK_STYLE_ID}";e.textContent=s("show")+"{display:contents}"+s("hide")+"{display:none}";document.head.appendChild(e)}catch(_){}})()`
