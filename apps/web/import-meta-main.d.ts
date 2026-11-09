// @workspace/price-ingest의 CLI 모듈(judgment·usual)은 Node 24의 import.meta.main으로 직접 실행됐는지 본다.
// 어드민(제안 검토, catalog-scale/07)이 그 모듈의 함수를 가져오는데 이 앱의 @types/node(20)에는 이 속성이 없다.
// 번들 안에서는 undefined라 CLI 본문이 돌지 않는다.
interface ImportMeta {
  readonly main?: boolean
}
