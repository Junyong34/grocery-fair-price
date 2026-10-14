import { notFound } from "next/navigation"
import { Suspense } from "react"

import { FESTIVALS, isFestival } from "@workspace/seasonal/data/festivals"

import { ScreenStub } from "@/features/seasonal/components/screen-stub"

type Params = PageProps<"/seasonal/festivals/[festival]">["params"]

export function generateStaticParams() {
  return FESTIVALS.map(({ slug }) => ({ festival: slug }))
}

export default function Page(props: PageProps<"/seasonal/festivals/[festival]">) {
  return (
    <Suspense fallback={<ScreenStub id="1g" title="명절" />}>
      <Festival params={props.params} />
    </Suspense>
  )
}

async function Festival({ params }: { params: Params }) {
  const { festival } = await params
  if (!isFestival(festival)) notFound()
  return <ScreenStub id="1g" title={`명절 · ${festival}`} />
}
