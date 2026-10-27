import { beforeEach, describe, expect, it, vi } from "vitest"

// 불러오기는 앱에서 한 번뿐이라 테스트마다 모듈(과 메모리 저장소)을 새로 읽는다.
let deviceStorage: typeof import("./device-store").deviceStorage
let deviceStore: typeof import("./device-store").deviceStore
let rehydrateDeviceStores: typeof import("./device-store").rehydrateDeviceStores
beforeEach(async () => {
  vi.resetModules()
  ;({ deviceStorage, deviceStore, rehydrateDeviceStores } = await import("./device-store"))
})

// 노드에는 localStorage가 없어 deviceStorage가 메모리 저장소다.
const saved = (name: string) => JSON.parse(String(deviceStorage().getItem(name))).state
const seed = (name: string, state: object, version = 1) => deviceStorage().setItem(name, JSON.stringify({ state, version }))

describe("deviceStore", () => {
  it("불러오기 전에는 기본값이고, 불러오면 저장값이다", () => {
    seed("test:load", { n: 3 })
    const store = deviceStore("test:load", { n: 0 })
    expect(store.get().n).toBe(0)
    rehydrateDeviceStores()
    expect(store.get().n).toBe(3)
  })

  it("불러오기 전에 쓴 값은 불러온 값 위에 얹힌다(덮이지 않는다)", () => {
    seed("test:early", { ids: ["a"] })
    const store = deviceStore("test:early", { ids: [] as string[] })
    store.set((state) => ({ ids: [...state.ids, "b"] }))
    expect(store.get().ids).toEqual([])
    rehydrateDeviceStores()
    expect(store.get().ids).toEqual(["a", "b"])
    expect(saved("test:early").ids).toEqual(["a", "b"])
  })

  it("불러온 뒤 만든 store는 만들 때 바로 불러온다(나중에 받은 코드 조각)", () => {
    rehydrateDeviceStores()
    seed("test:late", { on: true })
    const store = deviceStore("test:late", { on: false })
    expect(store.get().on).toBe(true)
    store.set({ on: false })
    expect(saved("test:late").on).toBe(false)
  })

  it("옛 판의 저장값은 migrate로 옮긴다", () => {
    seed("test:migrate", { old: 2 }, 1)
    const store = deviceStore("test:migrate", { count: 0 }, {
      version: 2,
      migrate: (persisted) => ({ count: (persisted as { old: number }).old }),
    })
    rehydrateDeviceStores()
    expect(store.get().count).toBe(2)
  })
})
