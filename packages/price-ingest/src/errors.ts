// 수집 오류의 종류. 메시지에는 출처 이름과 코드만 넣는다. 주소와 인증키는 넣지 않는다 (grocery-price/docs/30-data/pipeline.md 3-0 "키").

export type Source = "kamis" | "ekape" | "chamgagyeok"

const LABEL: Record<Source, string> = { kamis: "KAMIS", ekape: "축평원", chamgagyeok: "참가격" }

// resultCode가 성공값이 아니다 (HTTP 200이어도 올 수 있다)
export class ApiBusinessError extends Error {
  source: Source
  code: string
  constructor(source: Source, code: string) {
    super(`${LABEL[source]} 업무 오류 (resultCode ${code})`)
    this.name = "ApiBusinessError"
    this.source = source
    this.code = code
  }
}

// data.go.kr 게이트웨이 오류 (OpenAPI_ServiceResponse). 인증키 오류·없는 주소 등
export class ApiGatewayError extends Error {
  source: Source
  code: string
  constructor(source: Source, errMsg: string, code: string) {
    super(`${LABEL[source]} 인증·요청 오류 (${errMsg}, 코드 ${code})`)
    this.name = "ApiGatewayError"
    this.source = source
    this.code = code
  }
}

// 성공 응답 형식이 아닌 HTTP 상태
export class ApiHttpError extends Error {
  source: Source
  status: number
  constructor(source: Source, status: number) {
    super(`${LABEL[source]} HTTP ${status}`)
    this.name = "ApiHttpError"
    this.source = source
    this.status = status
  }
}

// 연결 실패·시간 초과. 원래 오류 메시지는 주소를 담을 수 있어 버린다
export class ApiTransportError extends Error {
  source: Source
  constructor(source: Source) {
    super(`${LABEL[source]} 네트워크 오류 또는 시간 초과`)
    this.name = "ApiTransportError"
    this.source = source
  }
}

// 응답이 계약 스키마와 다르다. issues에 필드별 사유를 담는다
export class ApiContractError extends Error {
  source: Source
  issues: string[]
  constructor(source: Source, issues: string[]) {
    super(`${LABEL[source]} 응답이 계약과 다르다\n${issues.map((issue) => `  - ${issue}`).join("\n")}`)
    this.name = "ApiContractError"
    this.source = source
    this.issues = issues
  }
}
