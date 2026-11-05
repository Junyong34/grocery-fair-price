import { PriceRecordSettings } from "@/features/price/settings/price-record-settings"
import { EatenRecordSetting, SeasonalDisplaySettings } from "@/features/seasonal/settings/display-settings"
import { SETTINGS_COPY } from "@/features/settings/copy"
import { SettingsView } from "@/features/settings/settings-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"
import { getSeoulToday } from "@/shared/today"
import { TodayProvider } from "@/shared/today-context"

export const metadata = createMetadata({
  title: SETTINGS_COPY.title,
  description: SETTINGS_COPY.description,
  path: routes.settings.root,
  noIndex: true,
})

// 설정. 시세와 제철 항목을 각 feature에서 가져와 한 화면에 넣는다. 달력 모양 미리보기가 서울 오늘을 읽어 TodayProvider를 깐다.
export default function Page() {
  return (
    <TodayProvider today={getSeoulToday()}>
      <SettingsView
        display={<SeasonalDisplaySettings />}
        records={
          <>
            <PriceRecordSettings />
            <EatenRecordSetting />
          </>
        }
      />
    </TodayProvider>
  )
}
