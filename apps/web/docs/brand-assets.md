# 로고와 파비콘

문구 없는 바구니·잎사귀 심볼을 사용한다. 2026-10-16에 선택한 정제안을 SVG로 옮겼다. 로고는 비대칭 잎 두 장을 유지하면서 잎맥·금색 줄기를 없애고 손잡이를 두껍게 했다. 파비콘은 초록 바탕에 크림색 바구니·잎 한 장을 쓴다.

벡터를 만드는 코드는 `prototypes/branding/seasonal-basket-assets/build.mjs`, 내보낸 원본은 그 아래 `exports/`에 있다. 앱이 제공하는 파일은 `apps/web/public/images/brand/`에 복사되어 있다. 프로토타입 폴더 없이도 앱을 빌드할 수 있다.

## 화면 로고

모바일·데스크톱 헤더는 `@/shared/brand-logo`의 `BrandLogo`를 사용한다. 심볼 SVG를 정적으로 가져오고 `next/image`에 40×40 크기를 지정한다. SVG는 `unoptimized`로 제공한다. 링크의 목적지는 기존 `routes.seasonal.root`이며 접근성 이름은 `제철달력 홈`이다.

`public/images/brand/`에는 PNG·SVG·무손실 WebP 형식의 로고 심볼과 크림·초록 파비콘이 있다. 로고는 투명 배경이고, `logo-symbol-ivory`는 어두운 배경에서 쓰는 밝은 단색 심볼이다. 파비콘은 16·32·48·64·128·180·192·256·512px 모두 잎 한 장의 같은 축약형이다. `*-compact.svg`는 해당 파비콘 SVG와 같은 내용이며 기존 파일명 호환용으로 유지한다. 기본 `favicon.svg`, `favicon.png`, `favicon.webp`, `favicon.ico`는 초록 버전이다.

선택한 시안의 브랜드색을 유지한다: 짙은 초록 `#31533d`, 잎색 `#809274`, 크림 `#f7f1e8`. SVG는 외부 스타일 없이도 열려야 하므로 이 값을 자체적으로 포함한다. 화면 컴포넌트의 Oura 토큰을 바꾸는 작업은 아니다.

## Next.js 아이콘

루트 `app/`의 파일 규칙을 사용하므로 Next.js가 모든 페이지에 아이콘 메타데이터를 자동으로 추가한다. `layout.tsx`에서 `metadata.icons`를 중복 설정하지 않는다.

| Next.js 파일         | 원본 파일               | 용도                         |
| -------------------- | ----------------------- | ---------------------------- |
| `app/favicon.ico`    | `favicon.ico`           | 초록 바탕 16·32·48px 브라우저 파비콘 |
| `app/icon.svg`       | `favicon.svg`           | 초록 바탕 축약형 SVG 아이콘 |
| `app/apple-icon.png` | `favicon-green-180.png` | 초록 바탕 180×180 Apple 홈 화면 아이콘 |

## 교체

브랜드 원본을 변경했다면 아래 명령으로 PNG·SVG·WebP·ICO를 내보낸다.

```sh
node prototypes/branding/seasonal-basket-assets/build.mjs
```

`exports/`의 이미지 파일을 `public/images/brand/`에 복사하고 위 세 메타데이터 파일도 함께 갱신한다. `manifest.json`은 내보내기 목록이므로 앱에 복사하지 않는다. `preview.png`의 실제 16·32px 샘플과 사이트의 40px 헤더 로고를 확인한다. 이전 가로·세로 워드마크는 사용하지 않는다.
