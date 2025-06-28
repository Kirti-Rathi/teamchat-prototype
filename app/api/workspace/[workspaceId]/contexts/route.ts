import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// export async function GET(
//   request: Request,
//   { params }: { params: { workspaceId: string } }
// ) {
//   const { workspaceId } = params;

//   const { data, error } = await supabase
//     .from("workspace_contexts")
//     .select("*")
//     .eq("workspace_id", workspaceId)
//     .order("created_at", { ascending: false });

//   if (error) {
//     console.error("Error fetching workspace contexts:", error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }

//   return NextResponse.json(data);
// }

export async function GET(
  req: Request,
  context: { params: { workspaceId: string } }
) {
  const { workspaceId } = await context.params;

  const { data, error } = await supabase
    .from("workspace_contexts")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
