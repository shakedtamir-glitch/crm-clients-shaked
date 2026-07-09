import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ clients: [], leads: [] });
  }

  const supabase = await createClient();
  const like = `%${query}%`;

  const [clientsRes, leadsRes] = await Promise.all([
    supabase
      .from("clients")
      .select("id, full_name, email, status")
      .or(`full_name.ilike.${like},email.ilike.${like},instagram.ilike.${like}`)
      .limit(5),
    supabase
      .from("leads")
      .select("id, full_name, email, stage")
      .or(`full_name.ilike.${like},email.ilike.${like},instagram.ilike.${like}`)
      .limit(5),
  ]);

  return NextResponse.json({
    clients: clientsRes.data ?? [],
    leads: leadsRes.data ?? [],
  });
}
