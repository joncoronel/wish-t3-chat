import { Suspense } from "react";
// import Link from "next/link";

import SettingsServer from "@/components/settings/settings-server";
// import { SettingsLoadingSkeleton } from "@/components/settings/settings-loading-skeleton";

export default function SettingsPage() {
  return (
    <div className="bg-background min-h-screen">
      <Suspense fallback={<div>Loading...</div>}>
        <SettingsServer />
      </Suspense>
    </div>
  );
}
