import { supabase } from "./supabase"

// export async function getEntry(date: Date) {
//   const dateStr = date.toISOString().split("T")[0]

//   const { data, error } = await supabase
//     .from("entries")
//     .select("*")
//     .eq("date", dateStr)
//     .single()

//   if (error) return null
//   return data
// }

// export async function saveEntry(date: Date, content: object) {
//   const dateStr = date.toISOString().split("T")[0]

//   const { data, error } = await supabase
//     .from("entries")
//     .upsert({ date: dateStr, content, updated_at: new Date().toISOString() })
//     .select()
//     .single()

//   if (error) throw error
//   return data
// }

export async function getEntry(date: Date) {
    const dateStr = date.toISOString().split("T")[0]
  
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .eq("date", dateStr)
      .eq("user_id", "00000000-0000-0000-0000-000000000000")
      .single()
  
    if (error) return null
    return data
  }
  
export async function saveEntry(date: Date, content: object) {
    const dateStr = date.toISOString().split("T")[0]
  
    const { data, error } = await supabase
      .from("entries")
      .upsert(
        { date: dateStr, content, updated_at: new Date().toISOString(), user_id: "00000000-0000-0000-0000-000000000000" },
        { onConflict: "user_id,date" }
      )
      .select()
      .single()
  
    if (error) throw error
    return data
  }