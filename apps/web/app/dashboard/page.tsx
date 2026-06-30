"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { getMe } from "@/api/auth";
import { removeToken } from "@/lib/auth";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null,
  );

  useEffect(() => {
    getMe().then((u) => {
      if (!u) {
        router.replace("/");
      } else {
        setUser(u);
      }
    });
  }, [router]);

  const handleLogout = () => {
    removeToken();
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <main className="flex flex-col items-center justify-center gap-4 p-6 pt-24">
        <h1 className="text-3xl font-bold text-zinc-900">dashboard</h1>
        {user && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-zinc-600">Welcome, {user.name}</p>
            <p className="text-sm text-zinc-400">{user.email}</p>
            <button
              onClick={handleLogout}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-700"
            >
              Sign out
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
