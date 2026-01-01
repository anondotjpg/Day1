// lib/supabase.ts

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Message = {
  id: string;
  day_id: number;
  username: string;
  content: string | null;
  media_url: string | null;
  media_type: "image" | "video" | null;
  created_at: string;
};