// react-device-check에서 가져와 React 19 환경에 맞춤. 출처와 이용 조건: ./README.md, ./LICENSE

export function listen(mql: MediaQueryList, cb: () => void): void {
  if (mql.addEventListener) mql.addEventListener("change", cb)
  else mql.addListener(cb)
}

export function unlisten(mql: MediaQueryList, cb: () => void): void {
  if (mql.removeEventListener) mql.removeEventListener("change", cb)
  else mql.removeListener(cb)
}
