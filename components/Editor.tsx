"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useEffect, useCallback, useState } from "react"

interface EditorProps {
  content: object | null
  onSave: (content: object) => Promise<void>
}

export default function Editor({ content, onSave }: EditorProps) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")

  const debouncedSave = useCallback(
    debounce(async (content: object) => {
      setSaveStatus("saving")
      await onSave(content)
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    }, 2000),
    [onSave]
  )

  const editor = useEditor({
    extensions: [StarterKit],
    content: content ?? "<p>Start writing...</p>",
    editorProps: {
      attributes: {
        class: "outline-none min-h-[500px] prose prose-zinc max-w-none",
      },
    },
    onUpdate: ({ editor }) => {
      debouncedSave(editor.getJSON())
    },
  })

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  return (
    <div>
      <div className="flex justify-end mb-4 h-4">
        {saveStatus === "saving" && (
          <p className="text-xs text-zinc-400">Saving...</p>
        )}
        {saveStatus === "saved" && (
          <p className="text-xs text-zinc-400">Saved ✓</p>
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}