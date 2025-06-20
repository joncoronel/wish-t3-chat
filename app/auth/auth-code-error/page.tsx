import Link from "next/link";

export default function AuthCodeError() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center py-2">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-destructive mb-4 text-2xl font-bold">
          Authentication Error
        </h1>
        <p className="text-muted-foreground mb-6">
          Sorry, we couldn&apos;t complete your authentication. This could be
          due to:
        </p>
        <ul className="text-muted-foreground mb-6 space-y-2 text-left">
          <li>• The authentication code has expired</li>
          <li>• The authentication was cancelled</li>
          <li>• There was a network error</li>
        </ul>
        <div className="space-y-4">
          <Link
            href="/login"
            className="bg-primary text-primary-foreground hover:bg-primary/90 block w-full rounded-md px-4 py-2 transition-colors"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="border-border bg-card text-foreground hover:bg-secondary hover:text-secondary-foreground block w-full rounded-md border px-4 py-2 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
