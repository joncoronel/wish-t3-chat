export default function AuthErrorPage() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="text-foreground mt-6 text-center text-3xl font-extrabold">
            Authentication Error
          </h2>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            Something went wrong during authentication. Please try again.
          </p>
        </div>
        <div className="mt-8">
          <a
            href="/login"
            className="group bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring/50 relative flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium transition-[color,box-shadow] focus:outline-none focus-visible:ring-[3px]"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
