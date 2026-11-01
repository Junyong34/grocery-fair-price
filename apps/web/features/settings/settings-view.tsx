import { ChevronRight } from "lucide-react"
import Link from "next/link"

import { routes } from "@/shared/routes"
import { SettingSection } from "@/shared/settings/setting-section"

import packageJson from "../../package.json"
import { SETTINGS_COPY } from "./copy"

/**
 * 설정 화면(/settings). ⚙를 어디서 눌러도 이 화면 하나가 열린다(.scratch/shell-unify/spec.md 5장).
 * 섹션은 주제별(화면 표시 · 내 기록 · 정보)이고, 제철 · 시세 항목은 라우트가 각 feature에서 가져와 display · records로 넣는다.
 */
export function SettingsView({ display, records }: { display: React.ReactNode; records: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[680px] flex-col gap-7 px-[18px] pt-4 pb-12 lg:px-6 lg:pt-10">
      <h1 className="font-heading text-2xl font-bold text-ink">{SETTINGS_COPY.title}</h1>
      <SettingSection title={SETTINGS_COPY.sections.display}>{display}</SettingSection>
      <SettingSection title={SETTINGS_COPY.sections.records}>{records}</SettingSection>
      <SettingSection title={SETTINGS_COPY.sections.info}>
        <InfoLink href={routes.settings.sources}>{SETTINGS_COPY.sourcesLink}</InfoLink>
        <InfoLink href={routes.privacy}>{SETTINGS_COPY.privacyLink}</InfoLink>
        <div className="flex items-center justify-between py-3 text-[15px] text-ink">
          {SETTINGS_COPY.version}
          <span className="text-sm text-stone">{packageJson.version}</span>
        </div>
      </SettingSection>
      <p className="text-[13px] leading-relaxed text-stone">{SETTINGS_COPY.deviceNote}</p>
    </div>
  )
}

function InfoLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-4 py-3 text-[15px] text-ink no-underline">
      {children}
      <ChevronRight aria-hidden size={18} strokeWidth={1.6} className="text-stone" />
    </Link>
  )
}
