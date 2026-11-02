import localFont from "next/font/local"

/**
 * 큰 숫자·영문 제목 서체 Bricolage Grotesque(가변: 굵기 200~800, 폭 75~100%). 원래 cojeev-fonts.css에 base64로 들어 있던 파일이다.
 * 따로 받아 해시를 붙여 오래 캐시하고, 미리 받는다(preload). 연결은 packages/ui cojeev.css의 --font-display.
 * 라이선스: 같은 폴더의 BricolageGrotesque-OFL.txt.
 */
export const displayFont = localFont({
  src: "./BricolageGrotesque.woff2",
  weight: "200 800",
  style: "normal",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "75% 100%" }],
  variable: "--font-display-file",
})
