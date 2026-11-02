import { describe, expect, it } from "vitest"
import { detectDevice } from "./detect"

describe("기기 판별", () => {
  it.each([
    ["iPhone like Mac OS X", 0, "mobile", "ios"],
    ["iPad", 5, "tablet", "ios"],
    ["Macintosh", 5, "tablet", "ios"],
    ["Macintosh", 0, "desktop", "macos"],
    ["Linux; Android 15; Mobile", 5, "mobile", "android"],
    ["Linux; Android 15", 5, "tablet", "android"],
    ["Linux; Android TV", 0, "desktop", "android"],
    ["Windows NT 10.0", 10, "desktop", "windows"],
    ["X11; Linux", 0, "desktop", "linux"],
  ])("%s", (ua, maxTouchPoints, type, os) => {
    expect(detectDevice({ ua, maxTouchPoints })).toEqual({ type, os })
  })

  it("데스크톱 모드 아이폰은 화면의 짧은 변으로 구분한다", () => {
    expect(
      detectDevice({
        ua: "Macintosh",
        maxTouchPoints: 5,
        screen: { width: 390, height: 844 },
      })
    ).toEqual({ type: "mobile", os: "ios" })
  })

  it("Client Hints를 UA보다 우선한다", () => {
    expect(
      detectDevice({
        ua: "Linux",
        uaData: { mobile: true, platform: "Android" },
      })
    ).toEqual({ type: "mobile", os: "android" })
  })

  it("신호가 없으면 기본값 또는 지정한 대체값을 쓴다", () => {
    expect(detectDevice()).toEqual({ type: "desktop", os: "unknown" })
    expect(
      detectDevice(undefined, { fallback: { type: "tablet", os: "ios" } })
    ).toEqual({ type: "tablet", os: "ios" })
  })
})
