"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import Editor from "@/components/Editor"
import { getEntry, saveEntry } from "@/lib/entries"

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [content, setContent] = useState<object | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadEntry() {
      setLoading(true)
      const entry = await getEntry(selectedDate)
      setContent(entry?.content ?? null)
      setLoading(false)
    }
    loadEntry()
  }, [selectedDate])

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
            onSave={(content) => saveEntry(selectedDate, content)}
          />
        )}
      </main>
    </div>
  )
}