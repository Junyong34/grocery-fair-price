import { afterEach, describe, expect, it, vi } from "vitest"

import { TODAY_MARK_SCRIPT, TODAY_MARK_STYLE_ID, todayKey, todayKeys, todayMarkCss } from "./today-marks"

describe("todayKey", () => {
  it("일 · 연월 · 월 · 연 키는 0을 채우지 않은 숫자로 쓴다", () => {
    expect(todayKey.day({ year: 2026, month: 3, day: 5 })).toBe("d2026-3-5")
    expect(todayKey.yearMonth(2026, 3)).toBe("ym2026-3")
    expect(todayKey.month(3)).toBe("m3")
    expect(todayKey.year(2026)).toBe("y2026")
  })
})

describe("todayKeys", () => {
  it("그날에 켜지는 키 네 개를 돌려준다", () => {
    expect(todayKeys({ year: 2026, month: 11, day: 11 })).toEqual(["d2026-11-11", "ym2026-11", "m11", "y2026"])
  })
})

describe("todayMarkCss", () => {
  it("켜진 키의 show는 보이고 hide는 숨긴다", () => {
    const css = todayMarkCss(["m11", "y2026"])
    expect(css).toBe(
      ':root [data-today-show~="m11"],:root [data-today-show~="y2026"]{display:contents}' +
        ':root [data-today-hide~="m11"],:root [data-today-hide~="y2026"]{display:none}',
    )
  })
})

describe("TODAY_MARK_SCRIPT", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  /** 브라우저처럼 스크립트를 돌리고 head에 붙은 style을 돌려준다. */
  function run(now: string) {
    vi.useFakeTimers({ now: new Date(now) })
    const appended: { id: string; textContent: string }[] = []
    const document = {
      getElementById: (id: string) => appended.find((el) => el.id === id) ?? null,
      createElement: () => ({ id: "", textContent: "" }),
      head: { appendChild: (el: { id: string; textContent: string }) => appended.push(el) },
    }
    new Function("document", TODAY_MARK_SCRIPT)(document)
    return { appended, document }
  }

  it("서울 날짜로 계산한다(UTC 15시가 넘으면 다음 날)", () => {
    const { appended } = run("2026-11-10T15:30:00Z")
    expect(appended).toHaveLength(1)
    expect(appended[0]!.id).toBe(TODAY_MARK_STYLE_ID)
    expect(appended[0]!.textContent).toBe(todayMarkCss(todayKeys({ year: 2026, month: 11, day: 11 })))
  })

  it("해가 바뀌는 밤에도 서울 기준이다", () => {
    const { appended } = run("2026-12-31T16:00:00Z")
    expect(appended[0]!.textContent).toBe(todayMarkCss(todayKeys({ year: 2027, month: 1, day: 1 })))
  })

  it("style이 이미 있으면 다시 붙이지 않는다", () => {
    const { appended, document } = run("2026-11-10T00:00:00Z")
    new Function("document", TODAY_MARK_SCRIPT)(document)
    expect(appended).toHaveLength(1)
  })
})
