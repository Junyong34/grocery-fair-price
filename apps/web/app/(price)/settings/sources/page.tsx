import { SOURCES_COPY } from "@/features/settings/copy"
import { SourcesView } from "@/features/settings/sources-view"
import { createMetadata } from "@/shared/meta"
import { routes } from "@/shared/routes"

export const metadata = createMetadata({
  title: SOURCES_COPY.title,
  description: SOURCES_COPY.description,
  path: routes.settings.sources,
  noIndex: true,
})

export default function Page() {
  return <SourcesView />
}
