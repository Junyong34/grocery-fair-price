"use client"

import { useSyncExternalStore } from "react"
import { create } from "zustand"
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware"

// 기기(localStorage)에 저장하는 상태(먹음 기록, ⚙ 설정, 옮긴 배치, 담은 품종, 최근 본 품종)를 만드는 곳.
// 규칙: 서버 HTML과 첫 클라이언트 렌더는 기본값으로 같게 그리고, Providers가 마운트된 뒤 한 번에 저장값을 불러온다.
// 그 전에 쓴 값(자식 effect가 Providers보다 먼저 돈다)은 불러온 값 위에 얹는다. 덮이지 않게 하는 일은 여기서만 한다.

const memory = new Map<string, string>()
const memoryStorage: StateStorage = {
  getItem: (name) => memory.get(name) ?? null,
  setItem: (name, value) => void memory.set(name, value),
  removeItem: (name) => void memory.delete(name),
}

/** 브라우저는 localStorage, 서버와 테스트(노드)는 메모리 저장소. */
export function deviceStorage(): StateStorage {
  return typeof window === "undefined" ? memoryStorage : window.localStorage
}

/** 아직 불러오지 않은 store들의 불러오기. */
const pending: Array<() => void> = []
let started = false

/** 저장값을 불러온다. Providers가 마운트된 뒤 한 번 부른다. 그 뒤에 만든 store(나중에 받은 코드 조각)는 만들 때 바로 불러온다. */
export function rehydrateDeviceStores(): void {
  started = true
  for (const load of pending.splice(0)) load()
}

export type DeviceStore<S> = {
  /** 고른 값을 구독한다(컴포넌트 안에서). */
  use: <T>(selector: (state: S) => T) => T
  get: () => S
  /** 고친다. 저장값을 불러오기 전이면 불러온 뒤에 얹는다. */
  set: (update: Partial<S> | ((state: S) => Partial<S>)) => void
  /** 저장값을 불러왔는지. 불러오기 전에는 기본값이라 "비어 있음" 같은 안내를 그리지 않을 때 쓴다. */
  useHydrated: () => boolean
}

/**
 * 기기에 저장하는 상태. name은 localStorage 키(`seasonal:<이름>`, `price:<이름>`)이고 한번 쓴 키는 바꾸지 않는다.
 * 저장 모양이 바뀌면 version을 올리고 migrate로 옛 값을 옮긴다.
 */
export function deviceStore<S extends object>(
  name: string,
  initial: S,
  options: { version?: number; migrate?: (persisted: unknown, version: number) => S } = {}
): DeviceStore<S> {
  const store = create<S>()(
    persist(() => initial, {
      name,
      version: options.version ?? 1,
      migrate: options.migrate,
      storage: createJSONStorage(deviceStorage),
      skipHydration: true,
    })
  )
  const early: Array<Partial<S> | ((state: S) => Partial<S>)> = []
  store.persist.onFinishHydration(() => {
    for (const update of early.splice(0)) store.setState(update)
  })
  const load = () => void store.persist.rehydrate()
  if (started) load()
  else pending.push(load)

  const subscribeHydration = (onChange: () => void) => store.persist.onFinishHydration(onChange)
  return {
    use: (selector) => store(selector),
    get: store.getState,
    set: (update) => (store.persist.hasHydrated() ? store.setState(update) : early.push(update)),
    useHydrated: () => useSyncExternalStore(subscribeHydration, store.persist.hasHydrated, () => false),
  }
}
