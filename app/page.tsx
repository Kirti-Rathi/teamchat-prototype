// import Link from "next/link";

// export default function Home() {
//   return (
//     <div>
//       Landing Page
//       <Link href="/dashboard">Go to dashboard</Link>
//     </div>
//   );
// }


// app/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-3xl font-bold mb-4">Landing Page</h1>
      <p className="mb-2">Welcome to Group GPT. Please sign in to continue.</p>
      <Link href="/sign-in" className="text-blue-500 underline">
        Sign In
      </Link>
    </div>
  );
}
