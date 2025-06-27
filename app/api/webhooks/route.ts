import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  console.log("POST handler called");
  try {
    const evt = await verifyWebhook(req);

    // Do something with payload
    // For this guide, log payload to console
    // const { id } = evt.data;
    // const eventType = evt.type;
    // console.log(
    //   `Received webhook with ID ${id} and event type of ${eventType}`
    // );
    // console.log("Webhook payload:", evt.data);
    // if (evt.type === "user.created") {
    //   console.log("userId:", evt.data.id);
    // }

    // return new Response("Webhook received", { status: 200 });

    const d: any = evt.data;

    const row = {
      id: d.id, // Clerk ID
      email: d.email_addresses?.[0]?.email_address,
    };

    console.log("Webhook data:", row);

    if (["user.created", "user.updated"].includes(evt.type)) {
      // Upsert will insert if new, or update email if changed
      const { error } = await supabase
        .from("users")
        .upsert(row, { onConflict: "id" });
      if (error) console.error("Upsert error:", error);
    } else if (evt.type === "user.deleted") {
      const { error } = await supabase.from("users").delete().eq("id", d.id);
      if (error) console.error("Delete error:", error);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }
}
