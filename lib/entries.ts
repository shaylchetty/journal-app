import { supabase } from "./supabase"

export async function getEntry(date: Date) {
  const dateStr = date.toISOString().split("T")[0]
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("date", dateStr)
    .eq("user_id", session.user.id)
    .single()

  if (error) return null
  return data
}

export async function saveEntry(date: Date, content: object) {
  const dateStr = date.toISOString().split("T")[0]
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error("Not logged in")

  const { data, error } = await supabase
    .from("entries")
    .upsert(
      { date: dateStr, content, updated_at: new Date().toISOString(), user_id: session.user.id },
      { onConflict: "user_id,date" }
    )
    .select()
    .single()

  if (error) throw error
  return data
}