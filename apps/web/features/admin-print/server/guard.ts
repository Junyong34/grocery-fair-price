import "server-only"

// 어드민은 관리자가 자기 컴퓨터의 개발 서버에서만 쓴다. 파일을 쓰므로 운영에서는 화면도 액션도 막는다.

export const adminEnabled = process.env.NODE_ENV !== "production"

/** Server Action 맨 앞에서 부른다. */
export function assertAdmin() {
  if (!adminEnabled) throw new Error("어드민은 개발 서버에서만 쓴다")
}
