import Link from "next/link";

export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-4 text-2xl font-bold text-red-600">
          Authentication Error
        </h1>
        <p className="mb-6 text-gray-600">
          Sorry, we couldn&apos;t complete your authentication. This could be
          due to:
        </p>
        <ul className="mb-6 space-y-2 text-left text-gray-600">
          <li>• The authentication code has expired</li>
          <li>• The authentication was cancelled</li>
          <li>• There was a network error</li>
        </ul>
        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="block w-full rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
