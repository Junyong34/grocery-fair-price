import { readFileSync } from "node:fs"
import { join } from "node:path"
import { ImageResponse } from "next/og"

import { SEASON_COPY } from "@workspace/seasonal/data/copy"
import { isSeason, SEASONS, type Season } from "@workspace/seasonal/data/seasons"

import { SITE_CONFIG } from "@/shared/meta"

// 공유 미리보기 이미지(1200×630). 글자는 쿼리로 받는다: title, subtitle, badge, season(spring|summer|autumn|winter).
// 앱 화면과 같은 모양을 쓴다: canvas 바탕에 계절색 번짐(3a 계절 카드 sunwash), 크림 트레이 배지(2차 탭), 로고 심볼.

/**
 * Oura 팔레트(packages/ui/src/styles/globals.css)의 hex 값. 이미지 렌더러는 CSS 변수를 읽지 못해 값을 옮겨 둔다.
 * 팔레트를 바꾸면 여기도 고친다. goldWash는 globals.css의 color-mix를 근사한 값이다.
 */
const OG_COLORS = {
  canvas: "#f7f1e8",
  hairline: "#e1dcd3",
  ink: "#1c1b1a",
  stone: "#4a4741",
  ash: "#838280",
  espresso: "#39221e",
  goldSoft: "#ddaa61",
  goldPale: "#ddbe78",
  goldWash: "#efe2c6",
  season: { spring: "#849671", summer: "#224228", autumn: "#af751b", winter: "#4a4741" } satisfies Record<Season, string>,
} as const

/** 쿼리 글자 길이 상한. 넘으면 말줄임한다(아무 글이나 길게 넣어 브랜드 이미지를 만들지 못하게). */
const OG_LIMITS = { title: 24, subtitle: 60, badge: 12 } as const

const clip = (value: string | null, max: number) => {
  const text = value?.trim()
  if (!text) return null
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

// 빌드가 이 파일들만 배포 묶음에 넣도록 경로를 고정 문자열로 쓴다(변수로 만들면 프로젝트 전체가 묶인다). 쓰는 굵기 두 가지만.
const fonts = [
  {
    name: "Pretendard",
    data: readFileSync(join(process.cwd(), "node_modules/pretendard/dist/web/static/woff-subset/Pretendard-Regular.subset.woff")),
    weight: 400 as const,
  },
  {
    name: "Pretendard",
    data: readFileSync(join(process.cwd(), "node_modules/pretendard/dist/web/static/woff-subset/Pretendard-Bold.subset.woff")),
    weight: 700 as const,
  },
]
// 로고는 public의 원본 SVG를 그대로 쓴다. 로고를 바꾸면 OG도 따라 바뀐다.
const LOGO = `data:image/svg+xml;base64,${readFileSync(join(process.cwd(), "public/images/brand/logo-symbol.svg")).toString("base64")}`

/** 계절색이 옅게 번지는 바탕(sunwash). 계절이 없으면 네 계절 색을 네 귀퉁이에 둔다. */
function wash(season: Season | null): string {
  const tint = (color: string, alpha: number) => `${color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`
  if (season) {
    const color = OG_COLORS.season[season]
    return [
      `radial-gradient(circle at 82% 78%, ${tint(color, 0.32)} 0%, ${tint(color, 0)} 55%)`,
      `radial-gradient(circle at 12% 8%, ${tint(OG_COLORS.goldPale, 0.28)} 0%, ${tint(OG_COLORS.goldPale, 0)} 45%)`,
    ].join(", ")
  }
  const corners = ["10% 12%", "90% 14%", "88% 88%", "12% 86%"]
  return SEASONS.map(
    (name, i) => `radial-gradient(circle at ${corners[i]}, ${tint(OG_COLORS.season[name], 0.2)} 0%, ${tint(OG_COLORS.season[name], 0)} 40%)`
  ).join(", ")
}

export function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const title = clip(params.get("title"), OG_LIMITS.title) ?? SITE_CONFIG.name
  const subtitle = clip(params.get("subtitle"), OG_LIMITS.subtitle) ?? SITE_CONFIG.description
  const badge = clip(params.get("badge"), OG_LIMITS.badge)
  const seasonParam = params.get("season")
  const season = seasonParam && isSeason(seasonParam) ? seasonParam : null

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          width: "100%",
          height: "100%",
          padding: "56px 72px",
          backgroundColor: OG_COLORS.canvas,
          backgroundImage: wash(season),
          fontFamily: "Pretendard",
          color: OG_COLORS.ink,
        }}
      >
        {/* 계절색 띠(계절 카드 위쪽 3px 띠와 같은 표시) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            display: "flex",
            backgroundColor: season ? OG_COLORS.season[season] : OG_COLORS.goldSoft,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse 안에서는 img만 쓸 수 있다 */}
          <img src={LOGO} width={56} height={56} alt="" />
          <span style={{ fontSize: 32, fontWeight: 700 }}>{SITE_CONFIG.name}</span>
          <span style={{ marginLeft: "auto", fontSize: 22, color: OG_COLORS.ash }}>언제 뭐가 맛있을까</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {badge && (
            // 2차 탭의 크림 트레이 + gold 선택 칸 모양
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                padding: 6,
                borderRadius: 999,
                backgroundColor: OG_COLORS.goldWash,
                border: `1.5px solid ${OG_COLORS.goldPale}`,
              }}
            >
              <span
                style={{
                  padding: "8px 24px",
                  borderRadius: 999,
                  backgroundColor: OG_COLORS.goldSoft,
                  color: OG_COLORS.espresso,
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                {badge}
              </span>
            </div>
          )}
          <div style={{ fontSize: title.length > 12 ? 64 : 84, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            {title}
          </div>
          <div
            style={{
              display: "block",
              maxWidth: 960,
              fontSize: 30,
              lineHeight: 1.4,
              color: OG_COLORS.stone,
              lineClamp: 2,
              overflow: "hidden",
            }}
          >
            {subtitle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            paddingTop: 22,
            borderTop: `1.5px solid ${OG_COLORS.hairline}`,
            fontSize: 20,
            color: OG_COLORS.stone,
          }}
        >
          {SEASONS.map((name) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, opacity: !season || season === name ? 1 : 0.45 }}>
              <div style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: OG_COLORS.season[name] }} />
              <span>{SEASON_COPY[name].name}</span>
            </div>
          ))}
          <span style={{ marginLeft: "auto", color: OG_COLORS.ash }}>우리 땅에서 가장 맛있는 순간을 담은 달력</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts }
  )
}
