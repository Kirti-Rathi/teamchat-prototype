import Link from "next/link";

export default function Home() {
  return (
    <div>
      Landing Page
      <Link href="/dashboard">Go to dashboard</Link>
    </div>
  );
}
