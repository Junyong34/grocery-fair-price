import { Search, Settings, Share2 } from "lucide-react"

import { LinkTabs } from "@workspace/ui/components/link-tabs"
import { cn } from "@workspace/ui/lib/utils"

import { BrandLogo } from "@/shared/brand-logo"

export const metadata = { title: "헤더·탭 구분 비교" }

type Variant = "now" | "underline" | "band" | "tray"

const VARIANTS: readonly { id: Variant; name: string; note: string }[] = [
  { id: "now", name: "지금", note: "헤더·탭·본문이 같은 바탕에 경계 없이 붙어 있다." },
  {
    id: "underline",
    name: "A. 밑줄 탭 + 가는 선",
    note: "cojeev 탭 underline. 선택 탭 아래 gold 표시, 탭 줄 아래 화면 폭 가는 선. 선 아래부터 본문.",
  },
  {
    id: "band",
    name: "B. 메뉴 영역 띠",
    note: "헤더와 탭이 있는 윗부분만 옅은 다른 바탕(hairline 반투명). 스크롤하면 떠 있는 헤더로 이어진다.",
  },
  {
    id: "tray",
    name: "C. 트레이에 담은 알약 탭 + 여백",
    note: "탭을 베이지 트레이에 담아 한 덩어리로(2·4·6열 전환과 같은 모양). 선 대신 아래 여백으로 나눈다.",
  },
]

// 2a 맨 위(스크롤 0) 헤더·2차 탭·본문 구분 후보. 모바일 폭(375)과 데스크톱 폭으로 나란히 본다.
export default function Page() {
  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-10 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl">헤더·탭 구분 비교</h1>
        <p className="text-sm text-stone">맨 위(스크롤 0)에서 헤더, 2차 탭, 본문 시작이 어떻게 나뉘어 보이는지 비교한다.</p>
      </div>
      <div className="grid gap-10 xl:grid-cols-2">
        {VARIANTS.map((variant) => (
          <section key={variant.id} className="flex flex-col gap-3">
            <div>
              <h2 className="font-semibold">{variant.name}</h2>
              <p className="text-sm text-stone">{variant.note}</p>
            </div>
            <div className="flex flex-wrap items-start gap-6">
              <Frame width={375}>
                <Top variant={variant.id} />
              </Frame>
            </div>
          </section>
        ))}
      </div>
      <section className="flex flex-col gap-6 border-t border-hairline pt-8">
        <h2 className="font-semibold">데스크톱 폭(1080)</h2>
        {VARIANTS.map((variant) => (
          <div key={variant.id} className="flex flex-col gap-2">
            <p className="text-sm text-stone">{variant.name}</p>
            <Frame width={1080}>
              <Top variant={variant.id} desktop />
            </Frame>
          </div>
        ))}
      </section>
    </main>
  )
}

function Frame({ width, children }: { width: number; children: React.ReactNode }) {
  return (
    <div
      className="h-[340px] max-w-full shrink-0 overflow-hidden rounded-xl border border-silver bg-canvas shadow-sm"
      style={{ width }}
    >
      {children}
    </div>
  )
}

function Top({ variant, desktop = false }: { variant: Variant; desktop?: boolean }) {
  const pad = desktop ? "px-6" : "px-[18px]"
  return (
    <div className="flex flex-col">
      <div className={cn(variant === "band" && "border-b border-hairline bg-hairline/45")}>
        <div className={cn("flex h-14 items-center gap-2", pad)}>
          <BrandLogo />
          {desktop && (
            <nav className="ml-6 flex gap-6 text-[15px] text-stone">
              <span className="font-semibold text-ink">이달</span>
              <span>계절</span>
              <span>나의 식탁</span>
            </nav>
          )}
          <div className="ml-auto flex items-center gap-1 text-ink">
            {[Search, Share2, Settings].map((Icon, i) => (
              <span key={i} className="grid size-10 place-items-center">
                <Icon aria-hidden size={20} strokeWidth={1.6} />
              </span>
            ))}
          </div>
        </div>
        <Tabs variant={variant} pad={pad} />
      </div>
      <div className={cn("pt-8", pad, variant === "tray" && "pt-10")}>
        <p className="font-heading text-[46px] leading-tight">지금은 10월</p>
        <p className="mt-1 font-heading text-lg text-stone">밤·고구마·사과, 거두어들이는 달</p>
        <div className="mt-6 flex gap-3">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="size-14 rounded-full border border-dashed border-silver bg-surface/60" />
          ))}
        </div>
      </div>
    </div>
  )
}

function Tabs({ variant, pad }: { variant: Variant; pad: string }) {
  const tabs = ["이달", "월별 보기"]
  if (variant === "tray")
    return (
      <div className={cn("pt-1 pb-2", pad)}>
        <div className="inline-flex rounded-full border border-silver/50 bg-hairline/60 p-0.5">
          {tabs.map((label, i) => (
            <span
              key={label}
              className={cn(
                "grid h-9 place-items-center rounded-full px-4 text-sm",
                i === 0 ? "bg-canvas font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-silver)]" : "text-stone"
              )}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    )
  return (
    <LinkTabs
      aria-label="보기 방식"
      variant={variant === "underline" ? "underline" : "lenses"}
      className={cn(
        variant === "underline" ? "border-b border-hairline" : "pt-1 pb-2",
        variant === "band" && "pb-2.5"
      )}
      listClassName={cn(pad, variant === "underline" && "shadow-none! gap-5! [&>a]:text-[15px]!")}
    >
      {tabs.map((label, i) => (
        // linkTabProps는 "use client" 모듈의 값이라 서버 컴포넌트에서 읽을 수 없어 같은 속성을 직접 쓴다.
        <a
          key={label}
          href="#"
          aria-current={i === 0 ? "page" : undefined}
          data-slot="tabs-trigger"
          className="v-tab shrink-0 no-underline"
        >
          {label}
        </a>
      ))}
    </LinkTabs>
  )
}
