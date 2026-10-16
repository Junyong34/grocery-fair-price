import "server-only"

export const adminEnabled = process.env.NODE_ENV !== "production"

export function assertAdmin() {
  if (!adminEnabled) throw new Error("어드민은 개발 서버에서만 쓴다")
}
