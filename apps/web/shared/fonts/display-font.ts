import localFont from "next/font/local"

/**
 * 큰 숫자·영문 제목 서체 Bricolage Grotesque(가변: 굵기 200~800, 광학 크기). 원래 cojeev-fonts.css에 base64로 들어 있던 파일이다.
 * 쓰는 글자(라틴 · 문장부호)만 남기고 폭을 100%로 고정한 서브셋이다(212KB → 87KB, 모바일 LCP 글자가 이 서체를 기다린다).
 * 원본은 BricolageGrotesque-full.woff2, 다시 만들기는 scripts/subset-display-font.sh.
 * 따로 받아 해시를 붙여 오래 캐시하고, 미리 받는다(preload). 연결은 packages/ui cojeev.css의 --font-display.
 * 라이선스: 같은 폴더의 BricolageGrotesque-OFL.txt.
 */
export const displayFont = localFont({
  src: "./BricolageGrotesque.woff2",
  weight: "200 800",
  style: "normal",
  display: "swap",
  variable: "--font-display-file",
})
