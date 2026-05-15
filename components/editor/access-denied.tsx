import Link from "next/link";
import { Lock } from "lucide-react";

export function AccessDenied() {
  return (
    <div className="flex h-screen items-center justify-center bg-bg-base">
      <div className="flex flex-col items-center gap-4 text-center">
        <Lock className="h-8 w-8 text-text-muted" />
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-medium text-text-primary">Access Denied</h1>
          <p className="text-sm text-text-muted">
            This project doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
        </div>
        <Link href="/editor" className="text-sm text-accent-primary hover:underline">
          ← Back to editor
        </Link>
      </div>
    </div>
  );
}