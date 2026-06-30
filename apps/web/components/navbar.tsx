import Link from "next/link";

export function Navbar() {
  return (
    <nav className="flex h-14 items-center border-b border-zinc-200 px-6">
      <Link href="/" className="text-xl font-bold tracking-tight">
        GrabPic
      </Link>
    </nav>
  );
}
