"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Calendar } from "@/components/ui/calendar"
import Editor from "@/components/Editor"
import { getEntry, saveEntry } from "@/lib/entries"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [title, setTitle] = useState("")
  const [content, setContent] = useState<object | null>(null)
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")

  const router = useRouter()

  // Debounced save reads the latest title/content off these refs rather than
  // closing over the state values, so a keystroke in either field always
  // saves both together instead of racing two separate debounces.
  const titleRef = useRef(title)
  const contentRef = useRef(content)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    titleRef.current = title
  }, [title])

  useEffect(() => {
    contentRef.current = content
  }, [content])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) router.push("/login")
    })
    return () => subscription.unsubscribe()
  }, [router])

  useEffect(() => {
    async function loadEntry() {
      setLoading(true)
      const entry = await getEntry(selectedDate)
      setTitle(entry?.title ?? "")
      setContent(entry?.content ?? null)
      setLoading(false)
    }
    loadEntry()
  }, [selectedDate])

  const debouncedSave = useCallback((date: Date) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaveStatus("saving")
      await saveEntry(date, { title: titleRef.current, content: contentRef.current ?? {} })
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    }, 800)
  }, [])

  return (
    <div className="flex h-screen">
      <aside className="w-72 border-r border-zinc-200 dark:border-zinc-800 p-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
        />
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-1">
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              debouncedSave(selectedDate)
            }}
            placeholder="Untitled entry"
            className="text-2xl font-semibold outline-none bg-transparent w-full placeholder:text-zinc-400"
          />
          <p className="text-xs text-zinc-400 whitespace-nowrap pt-2">
            {saveStatus === "saving" && "Saving..."}
            {saveStatus === "saved" && "Saved ✓"}
          </p>
        </div>
        <p className="text-sm text-zinc-500 mb-6">
          {selectedDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        {loading ? (
          <p className="text-sm text-zinc-400">Loading...</p>
        ) : (
          <Editor
            content={content}
            onChange={(content) => {
              setContent(content)
              debouncedSave(selectedDate)
            }}
          />
        )}
      </main>
    </div>
  )
}