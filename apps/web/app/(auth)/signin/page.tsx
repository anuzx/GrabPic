import Link from "next/link";
import { GoogleButton } from "@/components/google-button";
import { GithubButton } from "@/components/github-button";

export default function SignIn() {
  return (
    <main className="flex min-h-screen">
      <section className="hidden flex-1 items-center justify-center bg-zinc-50 md:flex">
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
              Welcome back
            </h2>
            <p className="text-sm text-zinc-500">Sign in to your account</p>
          </div>

          <div className="space-y-3">
            <GoogleButton />
            <GithubButton />
          </div>

          <p className="text-center text-sm text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600"
            >
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
