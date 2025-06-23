import Link from "next/link";

export default async function HomePage() {
  return (
    <div>
      <Link href="/settings">Settings</Link>
    </div>
  );
}
