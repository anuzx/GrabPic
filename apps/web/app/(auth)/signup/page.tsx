import { Navbar } from "@/components/navbar";
import { GoogleButton } from "@/components/google-button";
import { GithubButton } from "@/components/github-button";
import Link from "next/link";

export default function SignUp() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <main className="flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Create your account
            </h2>
            <p className="text-sm text-zinc-500">
              Get started with GrabPic today
            </p>
          </div>

          <div className="space-y-3">
            <GoogleButton />
            <GithubButton />
          </div>

          <p className="text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}