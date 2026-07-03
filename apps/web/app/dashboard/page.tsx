"use client";

import { Suspense } from "react";
import { DashboardContent } from "./content";

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-zinc-400">Loading...</p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}