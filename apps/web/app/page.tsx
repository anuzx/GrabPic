import { Navbar } from "@/components/navbar";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <main className="flex min-h-[calc(100vh-3.5rem)]">
        <section className="hidden flex-1 items-center justify-center md:flex">
          <h1 className="select-none text-7xl font-bold tracking-tight text-zinc-900">
            GrabPic
          </h1>
        </section>

        <section className="flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-2 text-center md:text-left">
              <h1 className="text-3xl font-bold tracking-tight md:hidden">
                GrabPic
              </h1>
              <h2 className="text-2xl font-semibold tracking-tight">
                Find your face in the crowd
              </h2>
              <p className="text-sm text-zinc-500">
                Create events, share photos, and find yourself with AI-powered face search.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/signup"
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-zinc-900 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-zinc-800"
              >
                Get Started
              </Link>
              <Link
                href="/signin"
                className="inline-flex h-10 w-full items-center justify-center rounded-md border border-zinc-200 bg-white px-8 text-sm font-medium shadow-sm transition-colors hover:bg-zinc-100"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}