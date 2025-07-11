import { Liveblocks } from "@liveblocks/node";
import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Authenticating your Liveblocks application
 * https://liveblocks.io/docs/authentication
 */

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    // Get the current user's unique id and info from your database
    const user = await currentUser();

    const { messageId } = await request.json();

    // Create a session for the current user
    // userInfo is made available in Liveblocks presence hooks, e.g. useOthers
    const session = liveblocks.prepareSession(`${user?.id}`, {
      userInfo: {
        name: user?.fullName || "Anonymous",
        avatar: user?.imageUrl || "/default-avatar.png",
        color: "#FF5733", // Example colors
      },
    });

    // Use a naming pattern to allow access to rooms with a wildcard
    session.allow(`${messageId}`, session.FULL_ACCESS);

    // Authorize the user and return the result
    const { body, status } = await session.authorize();
    return new Response(body, { status });
  } catch (error) {
    console.error("Error in Liveblocks auth:", error);
    return new Response("Unauthorized", { status: 401 });
  }
}
