# 로고와 파비콘

문구 없는 바구니·잎사귀 심볼을 사용한다. 원본은 `prototypes/branding/seasonal-basket-assets/exports/`에 있고, 앱이 제공하는 파일은 `apps/web/public/images/brand/`에 복사되어 있다. 프로토타입 폴더 없이도 앱을 빌드할 수 있다.

## 화면 로고

모바일·데스크톱 헤더는 `@/shared/brand-logo`의 `BrandLogo`를 사용한다. 심볼 SVG를 정적으로 가져오고 `next/image`에 40×40 크기를 지정한다. SVG는 `unoptimized`로 제공한다. 링크의 목적지는 기존 `routes.seasonal.root`이며 접근성 이름은 `제철달력 홈`이다.

`public/images/brand/`에는 PNG·SVG·무손실 WebP 형식의 로고 심볼과 크림·초록 파비콘이 있다. 로고는 투명 배경이고, `logo-symbol-ivory`는 어두운 배경에서 쓰는 밝은 단색 심볼이다. 파비콘은 16·32·48·64·128·180·192·256·512px로 제공한다. 16·32px와 `*-compact.svg`는 잎을 한 장으로 줄인 축약형이다.

## Next.js 아이콘

루트 `app/`의 파일 규칙을 사용하므로 Next.js가 모든 페이지에 아이콘 메타데이터를 자동으로 추가한다. `layout.tsx`에서 `metadata.icons`를 중복 설정하지 않는다.

| Next.js 파일         | 원본 파일               | 용도                         |
| -------------------- | ----------------------- | ---------------------------- |
| `app/favicon.ico`    | `favicon.ico`           | 16·32·48px 브라우저 파비콘   |
| `app/icon.svg`       | `favicon.svg`           | 크림색 축약형 SVG 아이콘     |
| `app/apple-icon.png` | `favicon-cream-180.png` | 180×180 Apple 홈 화면 아이콘 |

## 교체

브랜드 원본을 변경했다면 PNG·SVG·WebP를 내보낸 뒤 `public/images/brand/`의 해당 파일과 위 세 메타데이터 파일을 함께 갱신한다. 이전 가로·세로 워드마크는 사용하지 않는다.
