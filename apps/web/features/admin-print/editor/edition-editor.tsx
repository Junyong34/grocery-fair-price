"use client"

import { Card, CardContent } from "@workspace/ui/components/card"

import type { BuildRecord, Edition } from "@workspace/seasonal/print/edition"

import { formatBuildTime } from "../lib/format"
import { EditionSteps } from "./edition-steps"
import { EditorHeader } from "./editor-header"
import { GeneratedFiles } from "./generated-files"
import { ListingPanel } from "./listing-panel"
import { OptionsPanel } from "./options-panel"
import { PreviewPanel } from "./preview-panel"
import { useEditionEditor } from "./use-edition-editor"

export function EditionEditor({ saved, build, storageReady }: { saved: Edition; build: BuildRecord | undefined; storageReady: boolean }) {
  const editor = useEditionEditor(saved, build, storageReady)
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <EditorHeader draft={editor.draft} savedTitle={editor.saved.title} onTitleChange={editor.setTitle} />
        <EditionSteps
          flow={editor.flow}
          pending={editor.pending}
          running={editor.running}
          generatedLabel={editor.build && editor.buildState === "current" ? formatBuildTime(editor.build.generatedAt) : undefined}
          onSave={editor.save}
          onGenerate={editor.generate}
        />
        <p role="alert" className="text-sm text-error empty:hidden">
          {editor.error}
        </p>
        {editor.build && <GeneratedFiles edition={editor.saved} build={editor.build} stale={editor.buildState === "stale"} />}
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[400px_minmax(0,1fr)]">
        <Card className="lg:sticky lg:top-6">
          <CardContent className="flex flex-col gap-8">
            <OptionsPanel spec={editor.draft.spec} error={editor.specError} onChange={editor.setOption} />
            <ListingPanel
              description={editor.draft.description}
              status={editor.draft.status}
              statusError={editor.statusError}
              onDescriptionChange={editor.setDescription}
              onStatusChange={editor.setStatus}
            />
          </CardContent>
        </Card>
        <PreviewPanel spec={editor.previewSpec} dirty={editor.dirty} />
      </div>
    </div>
  )
}
